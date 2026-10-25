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

  // Tasa de IGV configurada (ej. 10.5% o 18%)
  const tasaIGV = Number(config.tasaIGV) || 10.5;
  const factorIGV = 1 + (tasaIGV / 100);

  // 1. VENTAS Y DEDUCCIÓN DE COMISIONES (POS, RAPPI, PEDIDOSYA, DIDI)
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
    const comisionPos = tarjeta * (config.comisionPOS / 100);
    const comisionRappi = rappi * (config.comisionRappi / 100);
    const comisionPedidos = pedidosYa * (config.comisionPedidosYa / 100);
    const comisionDidi = didi * (config.comisionDidi / 100);
    totalComisionesDescontadas += (comisionPos + comisionRappi + comisionPedidos + comisionDidi);

    // Ventas declaradas (Factura / Boleta)
    const declaradas = Number(v.ventaDeclaradaFactura || 0) + Number(v.ventaDeclaradaBoleta || 0);
    totalVentasDeclaradas += declaradas > 0 ? declaradas : totalBrutoDia * 0.85;
  });

  const totalVentasLiquidas = totalVentasReales - totalComisionesDescontadas;

  // Débito Fiscal IGV según tasa configurada
  // Base Imponible = Total / (1 + tasaIGV/100)
  const baseVentasDeclaradas = totalVentasDeclaradas / factorIGV;
  const igvDebitoFiscal = totalVentasDeclaradas - baseVentasDeclaradas;

  // 2. COMPRAS CON CRÉDITO FISCAL (PROVEEDORES)
  let comprasFacturaProveedores = 0;
  let igvCreditoProveedores = 0;

  provFiltrados.forEach(p => {
    if (p.tipoDocumento === 'FACTURA') {
      const base = Number(p.valorVenta || (p.total / factorIGV));
      const igv = Number(p.igv || (p.total - base));
      comprasFacturaProveedores += base;
      igvCreditoProveedores += igv;
    }
  });

  // 3. COMPRAS CON CRÉDITO FISCAL EN CAJA CHICA (FACTURAS)
  let comprasFacturaCajaChica = 0;
  let igvCreditoCajaChica = 0;
  let gastosSinCreditoFiscal = 0;

  cajaFiltrada.forEach(c => {
    if (c.tipoComprobante === 'FACTURA' && c.esDeducibleIGV) {
      const base = c.baseImponible || (c.importePagado / factorIGV);
      const igv = c.montoIGV || (c.importePagado - base);
      comprasFacturaCajaChica += base;
      igvCreditoCajaChica += igv;
    } else {
      gastosSinCreditoFiscal += Number(c.importePagado || 0);
    }
  });

  const totalCreditoFiscalIGV = igvCreditoProveedores + igvCreditoCajaChica;

  // 4. BALANZA SUNAT
  const igvEstimadoAPagar = Math.max(0, igvDebitoFiscal - totalCreditoFiscalIGV);
  const saldoAFavorIGV = Math.max(0, totalCreditoFiscalIGV - igvDebitoFiscal);

  // Pago a cuenta de Renta mensual (tasa configurada ej. 1.5%)
  const tasaRenta = (config.tasaPagoCuentaRenta || 1.5) / 100;
  const pagoCuentaRentaEstimado = baseVentasDeclaradas * tasaRenta;
  const totalImpuestosEstimados = igvEstimadoAPagar + pagoCuentaRentaEstimado;

  // 5. GASTOS ESTRUCTURALES (FIJOS Y VARIABLES FUERA DE CONTROL COTIDIANO)
  let totalGastosEstructurales = 0;
  gastosEstructurales
    .filter(g => g.activo)
    .forEach(g => {
      let montoMes = Number(g.monto || 0);
      if (g.frecuencia === 'QUINCENAL') montoMes *= 2;
      else if (g.frecuencia === 'ANUAL') montoMes /= 12;
      totalGastosEstructurales += montoMes;
    });

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
  const totalComprasConFactura = comprasFacturaProveedores + comprasFacturaCajaChica;
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
    igvDebitoFiscal,
    comprasFacturaProveedores,
    igvCreditoProveedores,
    comprasFacturaCajaChica,
    igvCreditoCajaChica,
    totalCreditoFiscalIGV,
    igvEstimadoAPagar,
    saldoAFavorIGV,
    pagoCuentaRentaEstimado,
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
