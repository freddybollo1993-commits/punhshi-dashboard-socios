import { MovimientoCajaChica, FacturaProveedor, VentaDiaria, ResumenFiscalMes } from '@/types';

export function calculateFiscalSummary(
  cajaChica: MovimientoCajaChica[],
  facturasProveedores: FacturaProveedor[],
  ventasDiarias: VentaDiaria[],
  periodoFiltro?: string // 'YYYY-MM' e.g. '2025-05' o undefined para todo
): ResumenFiscalMes {
  // Filtrar por período si se especifica
  const filterByDate = (fechaStr: string) => {
    if (!periodoFiltro) return true;
    return fechaStr.startsWith(periodoFiltro);
  };

  const cajaFiltrada = cajaChica.filter(c => filterByDate(c.fecha));
  const provFiltrados = facturasProveedores.filter(p => filterByDate(p.fecha));
  const ventasFiltradas = ventasDiarias.filter(v => filterByDate(v.fecha));

  // 1. VENTAS
  let totalVentasReales = 0;
  let totalVentasDeclaradas = 0;

  ventasFiltradas.forEach(v => {
    totalVentasReales += Number(v.totalVenta || 0);
    // Si tiene desglose declarado
    const declaradas = Number(v.ventaDeclaradaFactura || 0) + Number(v.ventaDeclaradaBoleta || 0);
    totalVentasDeclaradas += declaradas > 0 ? declaradas : Number(v.totalVenta || 0) * 0.85; // Estimación base 85% formal si no se especificó
  });

  // Débito Fiscal IGV: 18% incluido en la venta declarada
  // Base = Venta / 1.18, IGV = Venta - Base
  const baseVentasDeclaradas = totalVentasDeclaradas / 1.18;
  const igvDebitoFiscal = totalVentasDeclaradas - baseVentasDeclaradas;

  // 2. COMPRAS CON CRÉDITO FISCAL (PROVEEDORES)
  let comprasFacturaProveedores = 0;
  let igvCreditoProveedores = 0;

  provFiltrados.forEach(p => {
    if (p.tipoDocumento === 'FACTURA') {
      comprasFacturaProveedores += Number(p.valorVenta || (p.total / 1.18));
      igvCreditoProveedores += Number(p.igv || (p.total - p.valorVenta));
    }
  });

  // 3. COMPRAS CON CRÉDITO FISCAL EN CAJA CHICA (FACTURAS)
  let comprasFacturaCajaChica = 0;
  let igvCreditoCajaChica = 0;
  let gastosSinCreditoFiscal = 0;

  cajaFiltrada.forEach(c => {
    if (c.tipoComprobante === 'FACTURA' && c.esDeducibleIGV) {
      const base = c.baseImponible || (c.importePagado / 1.18);
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

  // Pago a cuenta de Renta (1.5% del valor venta neto declarado)
  const pagoCuentaRentaEstimado = baseVentasDeclaradas * 0.015;
  const totalImpuestosEstimados = igvEstimadoAPagar + pagoCuentaRentaEstimado;

  // 5. FLUJO REAL DEL NEGOCIO (INGRESOS vs EGRESOS TOTALES)
  const totalEgresosProveedores = provFiltrados.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const totalEgresosCajaChica = cajaFiltrada.reduce((acc, c) => acc + Number(c.importePagado || 0), 0);
  const totalEgresosReales = totalEgresosProveedores + totalEgresosCajaChica;

  const utilidadOperativaReal = totalVentasReales - totalEgresosReales;
  const margenOperativoReal = totalVentasReales > 0 ? (utilidadOperativaReal / totalVentasReales) * 100 : 0;

  // Ratio de Escudo Fiscal = Compras Formales con IGV / Ventas Declaradas
  const totalComprasConFactura = comprasFacturaProveedores + comprasFacturaCajaChica;
  const ratioEscudoFiscal = baseVentasDeclaradas > 0 ? (totalComprasConFactura / baseVentasDeclaradas) * 100 : 0;

  const currentYear = new Date().getFullYear();
  const currentMonth = periodoFiltro || `${currentYear}-05`;

  return {
    mes: currentMonth,
    year: currentYear,
    totalVentasReales,
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
    totalEgresosReales,
    utilidadOperativaReal,
    margenOperativoReal,
    ratioEscudoFiscal
  };
}
