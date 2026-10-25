import * as XLSX from 'xlsx';
import { MovimientoCajaChica, FacturaProveedor, VentaDiaria, ResumenFiscalMes, ProyeccionVentas } from '@/types';
import { EMPRESA_PUNHSHI } from '@/types';

export function exportarReporteCompletoExcel(
  cajaChica: MovimientoCajaChica[],
  facturasProveedores: FacturaProveedor[],
  ventas: VentaDiaria[],
  resumenFiscal: ResumenFiscalMes,
  proyeccion: ProyeccionVentas,
  nombreArchivo: string = `Reporte_PUNHSHI_SAC_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // HOJA 1: RESUMEN EJECUTIVO Y FISCAL SUNAT
  // ==========================================
  const dataResumen = [
    ['SISTEMA DE GESTIÓN FINANCIERA Y TRIBUTARIA'],
    ['Razón Social:', EMPRESA_PUNHSHI.razonSocial],
    ['RUC:', EMPRESA_PUNHSHI.ruc],
    ['Régimen Tributario:', EMPRESA_PUNHSHI.regimenTributario],
    ['Fecha de Generación:', new Date().toLocaleDateString('es-PE')],
    [],
    ['INDICADORES CLAVE DEL SOCIO', 'VALOR (S/)'],
    ['Ventas Reales Totales (Flujo de Caja)', resumenFiscal.totalVentasReales.toFixed(2)],
    ['Gastos Totales de Operación (Proveedores + Caja Chica)', resumenFiscal.totalEgresosReales.toFixed(2)],
    ['Utilidad Operativa Real', resumenFiscal.utilidadOperativaReal.toFixed(2)],
    ['Margen Operativo Real (%)', `${resumenFiscal.margenOperativoReal.toFixed(1)}%`],
    [],
    ['PROYECCIÓN DE CIERRE DE VENTAS DEL MES', 'VALOR'],
    ['Días Transcurridos Registrados', proyeccion.diasTranscurridos],
    ['Días Restantes del Mes', proyeccion.diasRestantes],
    ['Venta Real Acumulada', `S/ ${proyeccion.ventaRealAcumulada.toFixed(2)}`],
    ['Promedio Diario (Lunes a Jueves)', `S/ ${proyeccion.promedioDiarioSemana.toFixed(2)}`],
    ['Promedio Diario (Viernes a Domingo)', `S/ ${proyeccion.promedioDiarioFinDeSemana.toFixed(2)}`],
    ['VENTA ESTIMADA AL CIERRE DE MES', `S/ ${proyeccion.ventaProyectadaCierre.toFixed(2)}`],
    [],
    ['POSICIÓN FISCAL SUNAT (ESTIMADA)', 'MONTO (S/)'],
    ['Ventas Declaradas (Facturas + Boletas)', resumenFiscal.totalVentasDeclaradas.toFixed(2)],
    ['Débito Fiscal IGV (18% Ventas)', resumenFiscal.igvDebitoFiscal.toFixed(2)],
    ['Compras con Factura - Proveedores (Base Imponible)', resumenFiscal.comprasFacturaProveedores.toFixed(2)],
    ['Crédito Fiscal IGV - Proveedores', resumenFiscal.igvCreditoProveedores.toFixed(2)],
    ['Compras con Factura - Caja Chica (Base Imponible)', resumenFiscal.comprasFacturaCajaChica.toFixed(2)],
    ['Crédito Fiscal IGV - Caja Chica', resumenFiscal.igvCreditoCajaChica.toFixed(2)],
    ['TOTAL CRÉDITO FISCAL ACUMULADO (IGV)', resumenFiscal.totalCreditoFiscalIGV.toFixed(2)],
    ['IGV ESTIMADO A PAGAR A SUNAT', resumenFiscal.igvEstimadoAPagar.toFixed(2)],
    ['Saldo a Favor IGV (si aplica)', resumenFiscal.saldoAFavorIGV.toFixed(2)],
    ['Pago a Cuenta de Impuesto a la Renta Estimado (1.5%)', resumenFiscal.pagoCuentaRentaEstimado.toFixed(2)],
    ['TOTAL IMPUESTOS ESTIMADOS SUNAT', resumenFiscal.totalImpuestosEstimados.toFixed(2)],
    ['Gastos no deducibles (Notas de venta, boletas, guías)', resumenFiscal.gastosSinCreditoFiscal.toFixed(2)],
    ['Ratio de Escudo Fiscal (Compras con Factura vs Ventas)', `${resumenFiscal.ratioEscudoFiscal.toFixed(1)}%`]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(dataResumen);
  wsResumen['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Socio & SUNAT');

  // ==========================================
  // HOJA 2: CONTROL DE GASTOS CAJA CHICA
  // ==========================================
  const headersCaja = [
    'N°', 'Fecha', 'Importe Pagado (S/)', 'Tipo de comprobante', 'N° Factura / Recibo',
    'Envío de documento', 'Proveedor / Beneficiario', 'Detalle del gasto',
    'Tipo de gastos', 'Observaciones / Comentarios', '¿Deduce IGV?'
  ];

  const rowsCaja = cajaChica.map((c, idx) => [
    idx + 1,
    c.fecha,
    c.importePagado,
    c.tipoComprobante,
    c.numeroComprobante,
    c.envioDocumento,
    c.proveedor,
    c.detalleGasto,
    c.tipoGasto,
    c.observaciones || '',
    c.esDeducibleIGV ? 'SÍ (Factura)' : 'NO'
  ]);

  const totalCaja = cajaChica.reduce((sum, c) => sum + Number(c.importePagado || 0), 0);
  const totalFacturasCaja = cajaChica
    .filter(c => c.esDeducibleIGV)
    .reduce((sum, c) => sum + Number(c.importePagado || 0), 0);

  const dataCaja = [
    ['CUADRO DE CONTROL DE GASTOS CAJA CHICA - PUNHSHI S.A.C.'],
    ['Razón Social:', EMPRESA_PUNHSHI.razonSocial, '', 'RUC:', EMPRESA_PUNHSHI.ruc],
    [],
    headersCaja,
    ...rowsCaja,
    [],
    ['', 'TOTAL GASTOS CAJA CHICA:', totalCaja, '', '', '', '', '', '', '', ''],
    ['', 'Total con Factura (Crédito Fiscal):', totalFacturasCaja, '', '', '', '', '', '', '', ''],
    ['', 'Total sin Factura (No Deducibles):', (totalCaja - totalFacturasCaja), '', '', '', '', '', '', '', '']
  ];

  const wsCaja = XLSX.utils.aoa_to_sheet(dataCaja);
  wsCaja['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
    { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 32 }, { wch: 30 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCaja, 'Caja Chica');

  // ==========================================
  // HOJA 3: FACTURAS POR PAGAR A PROVEEDORES
  // ==========================================
  const headersProv = [
    'N°', 'Fecha', 'Tipo de Documento', 'Número de Documento', 'Envío de Documentos',
    'RUC', 'Razón Social', 'Concepto o descripción del gasto', 'TIPO DE GASTOS',
    'Moneda', 'Valor de Venta', 'IGV (18%)', 'Exonerado', 'Otros', 'TOTAL (S/)',
    'Estatus de pago', 'Operación del pago', 'Banco'
  ];

  const rowsProv = facturasProveedores.map((p, idx) => [
    idx + 1,
    p.fecha,
    p.tipoDocumento,
    p.numeroDocumento,
    p.envioDocumentos,
    p.ruc,
    p.razonSocial,
    p.conceptoGasto,
    p.tipoGastos,
    p.moneda,
    p.valorVenta,
    p.igv,
    p.exonerado,
    p.otros,
    p.total,
    p.estatusPago,
    p.operacionPago || '',
    p.banco || ''
  ]);

  const totalProveedores = facturasProveedores.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalBaseProv = facturasProveedores.reduce((sum, p) => sum + Number(p.valorVenta || 0), 0);
  const totalIgvProv = facturasProveedores.reduce((sum, p) => sum + Number(p.igv || 0), 0);

  const dataProv = [
    ['REPORTE DE FACTURAS POR PAGAR A PROVEEDORES - PUNHSHI S.A.C.'],
    ['Razón Social:', EMPRESA_PUNHSHI.razonSocial, '', 'RUC:', EMPRESA_PUNHSHI.ruc],
    [],
    headersProv,
    ...rowsProv,
    [],
    ['', '', '', '', '', '', '', '', 'TOTALES:', '', totalBaseProv, totalIgvProv, 0, 0, totalProveedores, '', '', '']
  ];

  const wsProv = XLSX.utils.aoa_to_sheet(dataProv);
  wsProv['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 32 }, { wch: 30 }, { wch: 30 }, { wch: 8 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 16 }, { wch: 18 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProv, 'Proveedores CxP');

  // ==========================================
  // HOJA 4: REGISTRO DE VENTAS DIARIAS
  // ==========================================
  const headersVentas = [
    'Fecha', 'Venta Tarjeta (Niubiz/POS)', 'Venta Efectivo', 'Yape / Plin',
    'Delivery / Apps', 'TOTAL VENTA (S/)', 'Venta Declarada Factura', 'Venta Declarada Boleta', 'Observaciones'
  ];

  const rowsVentas = ventas.map(v => [
    v.fecha,
    v.tarjeta,
    v.efectivo,
    v.yapePlin || 0,
    v.deliveryApps || 0,
    v.totalVenta,
    v.ventaDeclaradaFactura || 0,
    v.ventaDeclaradaBoleta || 0,
    v.observaciones || ''
  ]);

  const totalVentasSum = ventas.reduce((sum, v) => sum + Number(v.totalVenta || 0), 0);
  const totalTarjetaSum = ventas.reduce((sum, v) => sum + Number(v.tarjeta || 0), 0);
  const totalEfectivoSum = ventas.reduce((sum, v) => sum + Number(v.efectivo || 0), 0);

  const dataVentas = [
    ['REGISTRO DE VENTAS DIARIAS - PUNHSHI S.A.C.'],
    ['Razón Social:', EMPRESA_PUNHSHI.razonSocial, '', 'RUC:', EMPRESA_PUNHSHI.ruc],
    [],
    headersVentas,
    ...rowsVentas,
    [],
    ['TOTALES:', totalTarjetaSum, totalEfectivoSum, '', '', totalVentasSum, '', '', '']
  ];

  const wsVentas = XLSX.utils.aoa_to_sheet(dataVentas);
  wsVentas['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
    { wch: 18 }, { wch: 24 }, { wch: 24 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas Diarias');

  // Descargar archivo en el navegador
  XLSX.writeFile(wb, nombreArchivo);
}
