import * as XLSX from 'xlsx';
import { 
  MovimientoCajaChica, 
  FacturaProveedor, 
  VentaDiaria, 
  ResumenFiscalMes, 
  ProyeccionVentas,
  GastoEstructural,
  ConfiguracionFinanciera
} from '@/types';
import { EMPRESA_PUNHSHI } from '@/types';
import { CONFIGURACION_DEFAULT } from './initialData';

export function exportarReporteCompletoExcel(
  cajaChica: MovimientoCajaChica[],
  facturasProveedores: FacturaProveedor[],
  ventas: VentaDiaria[],
  resumenFiscal: ResumenFiscalMes,
  proyeccion: ProyeccionVentas,
  config: ConfiguracionFinanciera = CONFIGURACION_DEFAULT,
  gastosEstructurales: GastoEstructural[] = [],
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
    ['Tasa IGV Aplicada:', `${config.tasaIGV}%`],
    ['Fecha de Generación:', new Date().toLocaleDateString('es-PE')],
    [],
    ['INDICADORES CLAVE DEL SOCIO', 'VALOR (S/)'],
    ['Ventas Brutas Totales', resumenFiscal.totalVentasReales.toFixed(2)],
    ['(-) Comisiones Descontadas (POS, Rappi, PedidosYa, DiDi)', `-${resumenFiscal.totalComisionesDescontadas.toFixed(2)}`],
    ['(=) Ventas Líquidas Netas Reales', resumenFiscal.totalVentasLiquidas.toFixed(2)],
    [],
    ['EGRESOS TOTALES DEL NEGOCIO', 'VALOR (S/)'],
    ['Gastos de Caja Chica (Gastos Menores)', cajaChica.reduce((a, b) => a + Number(b.importePagado || 0), 0).toFixed(2)],
    ['Facturas a Proveedores (Cuentas por Pagar)', facturasProveedores.reduce((a, b) => a + Number(b.total || 0), 0).toFixed(2)],
    ['Gastos Estructurales (Fijos y Variables)', resumenFiscal.totalGastosEstructurales.toFixed(2)],
    ['TOTAL EGRESOS CONSOLIDADOS', resumenFiscal.totalEgresosReales.toFixed(2)],
    ['UTILIDAD NETA REAL DEL SOCIO', resumenFiscal.utilidadNetaFinal.toFixed(2)],
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
    ['LIQUIDACIÓN TRIBUTARIA SUNAT - DOBLE ESCUDO FISCAL', 'MONTO (S/)'],
    ['1. MOTOR MENSUAL DE IGV (PDT 621)', ''],
    ['Ventas Declaradas (Facturas + Boletas)', resumenFiscal.totalVentasDeclaradas.toFixed(2)],
    ['Base Imponible Ventas Declaradas', resumenFiscal.baseVentasDeclaradas.toFixed(2)],
    [`Débito Fiscal IGV (${resumenFiscal.tasaIGVVentasAplicada}% Ley 31556)`, resumenFiscal.igvDebitoFiscal.toFixed(2)],
    ['Compras Factura Proveedores (Base Imponible)', resumenFiscal.comprasFacturaProveedores.toFixed(2)],
    ['Crédito Fiscal IGV Proveedores', resumenFiscal.igvCreditoProveedores.toFixed(2)],
    ['Compras Factura Caja Chica (Base Imponible)', resumenFiscal.comprasFacturaCajaChica.toFixed(2)],
    ['Crédito Fiscal IGV Caja Chica', resumenFiscal.igvCreditoCajaChica.toFixed(2)],
    ['TOTAL CRÉDITO FISCAL ACUMULADO (IGV)', resumenFiscal.totalCreditoFiscalIGV.toFixed(2)],
    ['IGV ESTIMADO A PAGAR (PDT 621)', resumenFiscal.igvEstimadoAPagar.toFixed(2)],
    ['Saldo a Favor de IGV Acumulado', resumenFiscal.saldoAFavorIGV.toFixed(2)],
    [],
    ['2. MOTOR ANUAL DE IMPUESTO A LA RENTA (RÉGIMEN MYPE TRIBUTARIO)', ''],
    [`Pago a Cuenta Mensual de Renta (${config.tasaPagoCuentaRenta || 1.0}% RMT)`, resumenFiscal.pagoCuentaRentaEstimado.toFixed(2)],
    ['Compras en Boletas de Venta (Total registrado)', resumenFiscal.comprasBoletasRUS.toFixed(2)],
    ['Límite Legal Deducible Boletas RUS (6% compras factura)', resumenFiscal.topeDeduccionBoletasRUS.toFixed(2)],
    ['Boletas RUS Deducibles para Renta Anual', resumenFiscal.boletasRUSDeduciblesRenta.toFixed(2)],
    ['Exceso Boletas RUS No Deducible (Reparo)', resumenFiscal.boletasRUSExcesoNoDeducible.toFixed(2)],
    ['Recibos por Honorarios (RHE 4ta Cat - Deducibles)', resumenFiscal.honorariosRHE.toFixed(2)],
    ['Gastos Estructurales Deducibles de Renta', resumenFiscal.gastosEstructuralesDeduciblesRenta.toFixed(2)],
    ['TOTAL GASTOS DEDUCIBLES RENTA ANUAL', resumenFiscal.totalGastosDeduciblesRenta.toFixed(2)],
    ['Gastos No Deducibles Totales (Reparos Tributarios)', resumenFiscal.gastosNoDeduciblesReparos.toFixed(2)],
    ['COSTO OCULTO DE LA INFORMALIDAD (29.5% de Renta)', resumenFiscal.costoOcultoInformalidad.toFixed(2)],
    ['Alertas de Compras No Bancarizadas (>= S/ 2,000 efectivo)', resumenFiscal.comprasNoBancarizadasAlerta.toFixed(2)],
    ['Utilidad Tributaria Proyectada Anual', resumenFiscal.utilidadTributariaProyectada.toFixed(2)],
    ['Impuesto a la Renta Anual Proyectado (10% y 29.5%)', resumenFiscal.impuestoRentaAnualProyectado.toFixed(2)],
    ['Provisión Mensual Renta Anual Sugerida', resumenFiscal.provisionMensualRentaAnual.toFixed(2)],
    ['TOTAL LIQUIDACIÓN MENSUAL ESTIMADA (IGV + Renta)', resumenFiscal.totalImpuestosEstimados.toFixed(2)],
    ['Ratio de Escudo Fiscal (Facturas vs Ventas)', `${resumenFiscal.ratioEscudoFiscal.toFixed(1)}%`]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(dataResumen);
  wsResumen['!cols'] = [{ wch: 48 }, { wch: 25 }];
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
    'Moneda', 'Valor de Venta', 'IGV', 'Exonerado', 'Otros', 'TOTAL (S/)',
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
    'Fecha', 'Venta Tarjeta', 'Venta Efectivo', 'Yape / Plin',
    'Rappi', 'PedidosYa', 'DiDi Food', 'TOTAL VENTA BRUTA (S/)',
    '(-) Comisiones Descontadas', '(=) VENTA NETA LÍQUIDA',
    'Venta Factura', 'Venta Boleta', 'Observaciones'
  ];

  const rowsVentas = ventas.map(v => [
    v.fecha,
    v.tarjeta,
    v.efectivo,
    v.yapePlin || 0,
    v.rappi || 0,
    v.pedidosYa || 0,
    v.didi || 0,
    v.totalVenta,
    v.totalComisionesDescontadas || 0,
    v.totalVentaLiquida || v.totalVenta,
    v.ventaDeclaradaFactura || 0,
    v.ventaDeclaradaBoleta || 0,
    v.observaciones || ''
  ]);

  const totalVentasSum = ventas.reduce((sum, v) => sum + Number(v.totalVenta || 0), 0);
  const totalComisionesSum = ventas.reduce((sum, v) => sum + Number(v.totalComisionesDescontadas || 0), 0);
  const totalLiquidasSum = ventas.reduce((sum, v) => sum + Number(v.totalVentaLiquida || v.totalVenta || 0), 0);

  const dataVentas = [
    ['REGISTRO DE VENTAS DIARIAS - PUNHSHI S.A.C.'],
    ['Razón Social:', EMPRESA_PUNHSHI.razonSocial, '', 'RUC:', EMPRESA_PUNHSHI.ruc],
    [],
    headersVentas,
    ...rowsVentas,
    [],
    ['TOTALES:', '', '', '', '', '', '', totalVentasSum, totalComisionesSum, totalLiquidasSum, '', '', '']
  ];

  const wsVentas = XLSX.utils.aoa_to_sheet(dataVentas);
  wsVentas['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
    { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas Diarias');

  // ==========================================
  // HOJA 5: GASTOS ESTRUCTURALES (FIJOS/VARIABLES)
  // ==========================================
  if (gastosEstructurales.length > 0) {
    const headersGastosEst = ['Concepto', 'Categoría', 'Tipo', 'Frecuencia', 'Día Vence', 'Monto (S/)', 'Deduce IGV', 'Estado'];
    const rowsGastosEst = gastosEstructurales.map(g => [
      g.nombre,
      g.categoria,
      g.tipo,
      g.frecuencia,
      g.diaVencimiento || 1,
      g.monto,
      g.esDeducibleIGV ? 'SÍ' : 'NO',
      g.activo ? 'ACTIVO' : 'PAUSADO'
    ]);

    const dataGastosEst = [
      ['GASTOS ESTRUCTURALES Y COMPROMISOS PERIÓDICOS - PUNHSHI S.A.C.'],
      [],
      headersGastosEst,
      ...rowsGastosEst
    ];

    const wsGastosEst = XLSX.utils.aoa_to_sheet(dataGastosEst);
    wsGastosEst['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsGastosEst, 'Gastos Estructurales');
  }

  // Descargar archivo en el navegador
  XLSX.writeFile(wb, nombreArchivo);
}
