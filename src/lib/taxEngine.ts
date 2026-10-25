import { 
  MovimientoCajaChica, 
  FacturaProveedor, 
  VentaDiaria, 
  ResumenFiscalMes, 
  ConfiguracionFinanciera,
  GastoEstructural 
} from '@/types';
import { CONFIGURACION_DEFAULT } from './initialData';

export function calculateFiscalSummary(
  cajaChica: MovimientoCajaChica[],
  facturasProveedores: FacturaProveedor[],
  ventasDiarias: VentaDiaria[],
  periodoFiltro?: string, // 'YYYY-MM' e.g. '2025-05' o undefined para todo
  config: ConfiguracionFinanciera = CONFIGURACION_DEFAULT,
  gastosEstructurales: GastoEstructural[] = []
): ResumenFiscalMes {
  const filterByDate = (fechaStr: string) => {
    if (!periodoFiltro) return true;
    return fechaStr.startsWith(periodoFiltro);
  };

  const cajaFiltrada = cajaChica.filter(c => filterByDate(c.fecha));
  const provFiltrados = facturasProveedores.filter(p => filterByDate(p.fecha));
  const ventasFiltradas = ventasDiarias.filter(v => filterByDate(v.fecha));

  // 1. ASIMETRÍA DE TASAS SUNAT PARA RESTAURANTES MYPE (Ley 31556)
  // Ventas: Tasa reducida de restaurante (10.5% o 10.0%)
  const tasaIGVVentas = Number(config.tasaIGV) || 10.5;
  const factorIGVVentas = 1 + (tasaIGVVentas / 100);

  // Compras: Tasa general de proveedores comerciales (18.0% estándar en Perú)
  const tasaIGVComprasDefault = Number(config.tasaIGVCompras) || 18.0;

  // 2. VENTAS Y DEDUCCIÓN DE COMISIONES (POS, RAPPI, PEDIDOSYA, DIDI)
  let totalVentasReales = 0; // Brutas
  let totalVentasDeclaradas = 0;
  let totalComisionesDescontadas = 0;

  ventasFiltradas.forEach(v => {
    const tarjeta = Number(v.tarjeta || 0);
    const efectivo = Number(v.efectivo || 0);
    const yapePlin = Number(v.yapePlin || 0);
    const rappi = Number(v.rappi || 0);
    const pedidosYa = Number(v.pedidosYa || 0);
    const didi = Number(v.didi || 0);
    const deliveryOtros = Number(v.deliveryApps || 0);

    const deliveryTotal = (rappi + pedidosYa + didi) > 0 ? (rappi + pedidosYa + didi) : deliveryOtros;
    const totalBrutoDia = tarjeta + efectivo + yapePlin + deliveryTotal;
    totalVentasReales += totalBrutoDia;

    // Calcular comisiones del día
    const comisionPos = tarjeta * ((config.comisionPOS || 3.5) / 100);
    const comisionRappi = rappi * ((config.comisionRappi || 18) / 100);
    const comisionPedidos = pedidosYa * ((config.comisionPedidosYa || 18) / 100);
    const comisionDidi = didi * ((config.comisionDidi || 15) / 100);
    totalComisionesDescontadas += (comisionPos + comisionRappi + comisionPedidos + comisionDidi);

    // Ventas declaradas (Factura / Boleta)
    const declaradas = Number(v.ventaDeclaradaFactura || 0) + Number(v.ventaDeclaradaBoleta || 0);
    totalVentasDeclaradas += declaradas > 0 ? declaradas : totalBrutoDia * 0.85;
  });

  const totalVentasLiquidas = totalVentasReales - totalComisionesDescontadas;

  // Débito Fiscal IGV según tasa de ventas del restaurante
  const baseVentasDeclaradas = totalVentasDeclaradas / factorIGVVentas;
  const igvDebitoFiscal = totalVentasDeclaradas - baseVentasDeclaradas;

  // 3. MOTOR 1: ESCUDO FISCAL MENSUAL DE IGV (COMPRAS FORMALES CON FACTURA Y SERVICIOS)
  let comprasFacturaProveedores = 0;
  let igvCreditoProveedores = 0;
  let comprasNoBancarizadasAlerta = 0;

  provFiltrados.forEach(p => {
    const esFactura = p.tipoDocumento === 'FACTURA' || p.tipoDocumento === 'SERVICIOS PUBLICOS';
    const totalGasto = Number(p.total || 0);

    // Candado de Bancarización (Ley 28194: Compras >= S/ 2,000 en efectivo pierden crédito fiscal)
    const noBancarizado = totalGasto >= 2000 && p.medioPago === 'EFECTIVO';
    if (noBancarizado) {
      comprasNoBancarizadasAlerta += totalGasto;
    }

    if (esFactura && !noBancarizado) {
      const tasaAplicada = p.tasaIGVAplicada || tasaIGVComprasDefault;
      const factorCompra = 1 + (tasaAplicada / 100);
      const base = Number(p.valorVenta || (totalGasto / factorCompra));
      const igv = Number(p.igv || (totalGasto - base));
      comprasFacturaProveedores += base;
      igvCreditoProveedores += igv;
    }
  });

  let comprasFacturaCajaChica = 0;
  let igvCreditoCajaChica = 0;
  let comprasBoletasRUS = 0;
  let honorariosRHE = 0;
  let gastosSinCreditoFiscal = 0;

  cajaFiltrada.forEach(c => {
    const totalGasto = Number(c.importePagado || 0);
    const noBancarizado = totalGasto >= 2000 && c.medioPago === 'EFECTIVO';
    if (noBancarizado) {
      comprasNoBancarizadasAlerta += totalGasto;
    }

    const esFactura = (c.tipoComprobante === 'FACTURA' || c.tipoComprobante === 'SERVICIOS PUBLICOS') && c.esDeducibleIGV;
    const esBoleta = c.tipoComprobante === 'BOLETA';
    const esHonorario = c.tipoComprobante === 'RECIBO POR HONORARIOS' || c.tipoComprobante === 'RECIBO';

    if (esFactura && !noBancarizado) {
      const tasaAplicada = c.tasaIGVAplicada || tasaIGVComprasDefault;
      const factorCompra = 1 + (tasaAplicada / 100);
      const base = c.baseImponible || (totalGasto / factorCompra);
      const igv = c.montoIGV || (totalGasto - base);
      comprasFacturaCajaChica += base;
      igvCreditoCajaChica += igv;
    } else if (esBoleta) {
      comprasBoletasRUS += totalGasto;
      gastosSinCreditoFiscal += totalGasto;
    } else if (esHonorario) {
      honorariosRHE += totalGasto;
      gastosSinCreditoFiscal += totalGasto;
    } else {
      gastosSinCreditoFiscal += totalGasto;
    }
  });

  const totalCreditoFiscalIGV = igvCreditoProveedores + igvCreditoCajaChica;
  const igvEstimadoAPagar = Math.max(0, igvDebitoFiscal - totalCreditoFiscalIGV);
  const saldoAFavorIGV = Math.max(0, totalCreditoFiscalIGV - igvDebitoFiscal);

  // 4. MOTOR 2: ESCUDO FISCAL ANUAL DE RENTA (RMT - RÉGIMEN MYPE TRIBUTARIO)
  const totalComprasConFactura = comprasFacturaProveedores + comprasFacturaCajaChica;

  // Norma SUNAT: Art. 37° inc. z LIR - Límite de Boletas del Nuevo RUS (6% del total de compras con Factura, máx 200 UIT)
  const uit = Number(config.uitVigente) || 5350;
  const topeAbsoluto200UIT = 200 * uit;
  const topeDeduccionBoletasRUS = Math.min(totalComprasConFactura * 0.06, topeAbsoluto200UIT);
  const boletasRUSDeduciblesRenta = Math.min(comprasBoletasRUS, topeDeduccionBoletasRUS);
  const boletasRUSExcesoNoDeducible = Math.max(0, comprasBoletasRUS - topeDeduccionBoletasRUS);

  // Gastos estructurales deducibles de Renta (Planilla PLAME, Alquiler F.1683, etc.)
  let totalGastosEstructurales = 0;
  let gastosEstructuralesDeduciblesRenta = 0;

  gastosEstructurales
    .filter(g => g.activo)
    .forEach(g => {
      let montoMes = Number(g.monto || 0);
      if (g.frecuencia === 'QUINCENAL') montoMes *= 2;
      else if (g.frecuencia === 'ANUAL') montoMes /= 12;
      totalGastosEstructurales += montoMes;
      // Planilla, alquiler y honorarios son 100% deducibles de Renta
      gastosEstructuralesDeduciblesRenta += montoMes;
    });

  // Total gastos que sí forman Escudo Fiscal para Impuesto a la Renta
  const totalGastosDeduciblesRenta = 
    totalComprasConFactura + 
    boletasRUSDeduciblesRenta + 
    honorariosRHE + 
    gastosEstructuralesDeduciblesRenta;

  // Gastos que SUNAT REPARA (No deducibles: informales sin comprobante, exceso boletas RUS y compras no bancarizadas)
  const gastosInformalesSinSustento = Math.max(0, gastosSinCreditoFiscal - comprasBoletasRUS - honorariosRHE);
  const gastosNoDeduciblesReparos = 
    gastosInformalesSinSustento + 
    boletasRUSExcesoNoDeducible + 
    comprasNoBancarizadasAlerta;

  // Costo Oculto de la Informalidad (29.5% de Impuesto a la Renta que se paga sobre los gastos no deducibles)
  const costoOcultoInformalidad = parseFloat((gastosNoDeduciblesReparos * 0.295).toFixed(2));

  // 5. LIQUIDACIÓN DE IMPUESTO A LA RENTA (PAGO A CUENTA MENSUAL Y PROYECCIÓN ANUAL RMT)
  // Pago a cuenta mensual RMT (1.0% para ventas < 300 UIT)
  const tasaRenta = (config.tasaPagoCuentaRenta || 1.0) / 100;
  const pagoCuentaRentaEstimado = baseVentasDeclaradas * tasaRenta;
  const totalImpuestosEstimados = igvEstimadoAPagar + pagoCuentaRentaEstimado;

  // Proyección anual RMT: Renta Neta Imponible Anualizada
  const utilidadTributariaMes = Math.max(0, baseVentasDeclaradas - totalGastosDeduciblesRenta + gastosNoDeduciblesReparos);
  const utilidadTributariaProyectada = utilidadTributariaMes * 12;

  // Escala Progresiva RMT: Tramo 1 (hasta 15 UIT al 10%) + Tramo 2 (exceso sobre 15 UIT al 29.5%)
  const tope15UIT = 15 * uit;
  const tramo1 = Math.min(utilidadTributariaProyectada, tope15UIT) * 0.10;
  const tramo2 = Math.max(0, utilidadTributariaProyectada - tope15UIT) * 0.295;
  const impuestoRentaAnualProyectado = parseFloat((tramo1 + tramo2).toFixed(2));
  const provisionMensualRentaAnual = parseFloat((impuestoRentaAnualProyectado / 12).toFixed(2));

  // 6. FLUJO REAL Y UTILIDAD NETA DEL SOCIO
  const totalEgresosProveedores = provFiltrados.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const totalEgresosCajaChica = cajaFiltrada.reduce((acc, c) => acc + Number(c.importePagado || 0), 0);
  const totalEgresosCajaYProveedores = totalEgresosProveedores + totalEgresosCajaChica;
  const totalEgresosReales = totalEgresosCajaYProveedores + totalGastosEstructurales;

  // Utilidad Neta Líquida = Ventas Líquidas (libres de comisiones) - Egresos Totales
  const utilidadOperativaReal = totalVentasReales - totalEgresosReales;
  const utilidadNetaFinal = totalVentasLiquidas - totalEgresosReales;
  const margenOperativoReal = totalVentasLiquidas > 0 ? (utilidadNetaFinal / totalVentasLiquidas) * 100 : 0;

  // Ratio de Escudo Fiscal = Compras Formales con IGV / Ventas Declaradas
  const ratioEscudoFiscal = baseVentasDeclaradas > 0 ? (totalComprasConFactura / baseVentasDeclaradas) * 100 : 0;

  const currentYear = new Date().getFullYear();
  const currentMonth = periodoFiltro || `${currentYear}-05`;

  return {
    mes: currentMonth,
    year: currentYear,
    totalVentasReales,
    totalComisionesDescontadas,
    totalVentasLiquidas,
    totalVentasDeclaradas,
    baseVentasDeclaradas,
    tasaIGVVentasAplicada: tasaIGVVentas,
    igvDebitoFiscal,
    comprasFacturaProveedores,
    igvCreditoProveedores,
    comprasFacturaCajaChica,
    igvCreditoCajaChica,
    totalCreditoFiscalIGV,
    igvEstimadoAPagar,
    saldoAFavorIGV,
    comprasBoletasRUS,
    topeDeduccionBoletasRUS,
    boletasRUSDeduciblesRenta,
    boletasRUSExcesoNoDeducible,
    honorariosRHE,
    gastosEstructuralesDeduciblesRenta,
    totalGastosDeduciblesRenta,
    gastosNoDeduciblesReparos,
    costoOcultoInformalidad,
    comprasNoBancarizadasAlerta,
    pagoCuentaRentaEstimado,
    utilidadTributariaProyectada,
    impuestoRentaAnualProyectado,
    provisionMensualRentaAnual,
    totalImpuestosEstimados,
    gastosSinCreditoFiscal,
    totalEgresosCajaYProveedores,
    totalGastosEstructurales,
    totalEgresosReales,
    utilidadOperativaReal,
    utilidadNetaFinal,
    margenOperativoReal,
    ratioEscudoFiscal
  };
}
