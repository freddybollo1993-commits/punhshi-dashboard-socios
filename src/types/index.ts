// Tipos de datos para el Sistema de Gestión Financiera - PUNHSHI S.A.C.

export interface EmpresaInfo {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  regimenTributario: string;
  rubro: string;
}

export const EMPRESA_PUNHSHI: EmpresaInfo = {
  ruc: '20610207112',
  razonSocial: 'PUNHSHI S.A.C.',
  nombreComercial: 'SHIMAYA - PUNHSHI',
  regimenTributario: 'Régimen MYPE Tributario',
  rubro: 'Restaurante / Gastronomía'
};

export type TipoComprobanteCaja = 
  | 'FACTURA'
  | 'BOLETA'
  | 'GUIA'
  | 'NOTA DE VENTA'
  | 'RECIBO'
  | 'OTRO';

export type EstadoValidacion = 'VALIDADO' | 'PENDIENTE_VALIDACION' | 'REVISAR';

export interface MovimientoCajaChica {
  id: string;
  numero: number;
  fecha: string; // YYYY-MM-DD
  importePagado: number;
  tipoComprobante: TipoComprobanteCaja;
  numeroComprobante: string; // e.g. FW01-00000579 o S/N
  envioDocumento: 'PENDIENTE' | 'ENVIADO';
  proveedor: string;
  detalleGasto: string;
  tipoGasto: string;
  observaciones?: string;
  // Campos fiscales
  esDeducibleIGV: boolean; // True si es Factura con RUC
  baseImponible?: number;
  montoIGV?: number;
  fotoUrl?: string;
  estadoValidacion: EstadoValidacion;
  origenOCR?: boolean;
}

export type EstatusPago = 'PENDIENTE' | 'PAGADO' | 'PARCIAL' | 'ANULADO';

export interface FacturaProveedor {
  id: string;
  numero: number;
  fecha: string; // YYYY-MM-DD
  tipoDocumento: string; // FACTURA, NOTA DE CREDITO, etc.
  numeroDocumento: string;
  envioDocumentos: 'PENDIENTE' | 'ENVIADO';
  ruc: string;
  razonSocial: string;
  conceptoGasto: string;
  tipoGastos: string;
  moneda: 'PEN' | 'USD';
  valorVenta: number; // Base imponible
  igv: number;        // Crédito fiscal
  exonerado: number;
  otros: number;
  total: number;
  estatusPago: EstatusPago;
  operacionPago?: string;
  banco?: string;
  fechaPago?: string;
  fotoUrl?: string;
}

export interface ConfiguracionFinanciera {
  tasaIGV: number; // Por defecto 10.5% (Ley de Restaurantes y Turismo) o 18% general
  comisionPOS: number; // % comisión cobrada por Niubiz/Izipay (ej: 3.5%)
  comisionRappi: number; // % comisión Rappi (ej: 18%)
  comisionPedidosYa: number; // % comisión PedidosYa (ej: 18%)
  comisionDidi: number; // % comisión DiDi Food (ej: 15%)
  tasaPagoCuentaRenta: number; // % pago a cuenta de renta mensual (ej: 1.5%)
}

export type TipoGastoEstructural = 'FIJO' | 'VARIABLE';
export type FrecuenciaGastoEstructural = 'MENSUAL' | 'QUINCENAL' | 'ANUAL' | 'UNICO';

export interface GastoEstructural {
  id: string;
  nombre: string; // Ej: Alquiler de local, Planilla administrativa, Asesor contable
  categoria: string;
  tipo: TipoGastoEstructural;
  frecuencia: FrecuenciaGastoEstructural;
  monto: number;
  esDeducibleIGV: boolean;
  diaVencimiento?: number; // Día del mes (1 a 31)
  activo: boolean;
  observaciones?: string;
}

export interface VentaDiaria {
  id: string;
  fecha: string; // YYYY-MM-DD
  tarjeta: number;      // Niubiz / POS
  efectivo: number;     // Efectivo en caja
  yapePlin?: number;    // Billeteras digitales
  rappi?: number;       // Venta por Rappi
  pedidosYa?: number;   // Venta por PedidosYa
  didi?: number;        // Venta por DiDi Food
  deliveryApps?: number;// Total delivery (o apps varios)
  totalVenta: number;   // Total Venta Bruta
  totalComisionesDescontadas?: number; // Suma de comisiones de POS, Rappi, PedidosYa, DiDi
  totalVentaLiquida?: number; // Venta Bruta - Comisiones de pasarela/apps
  ventaDeclaradaFactura: number; // Emitida a clientes
  ventaDeclaradaBoleta: number;  // Emitida a clientes
  observaciones?: string;
}

export interface ProveedorMaestro {
  ruc: string;
  razonSocial: string;
  tipoGastoDefault: string;
  bancoDefault?: string;
}

export interface AsignacionFondoCaja {
  id: string;
  fecha: string; // YYYY-MM-DD
  tarjeta: number; // Fondos asignados por tarjeta/transferencia
  efectivo: number; // Fondos asignados en efectivo
  totalAsignado: number; // total tarjeta + efectivo
  motivo?: string; // e.g. "Apertura de fondo", "Reposición de caja chica"
  responsable?: string;
}

export interface BalanceCajaChica {
  totalFondosAsignados: number;
  totalGastosRendidos: number;
  saldoDisponibleEnCaja: number;
  porcentajeConsumido: number;
  estaCuadrado: boolean;
  diferencia: number;
}

export interface ResumenFiscalMes {
  mes: string;
  year: number;
  // Ventas Brutas vs Líquidas (Comisiones de pasarelas y delivery)
  totalVentasReales: number; // Venta Bruta
  totalComisionesDescontadas: number; // Descuento de POS, Rappi, PedidosYa, Didi
  totalVentasLiquidas: number; // Venta Líquida que ingresa al negocio
  totalVentasDeclaradas: number;
  igvDebitoFiscal: number; // Impuesto de ventas según tasa configurada
  // Compras con Factura (Crédito Fiscal)
  comprasFacturaProveedores: number;
  igvCreditoProveedores: number;
  comprasFacturaCajaChica: number;
  igvCreditoCajaChica: number;
  totalCreditoFiscalIGV: number;
  // Balance SUNAT
  igvEstimadoAPagar: number;
  saldoAFavorIGV: number;
  pagoCuentaRentaEstimado: number; // 1.5% o tasa configurada
  totalImpuestosEstimados: number;
  // Gastos no deducibles (Notas de venta, guías, etc.)
  gastosSinCreditoFiscal: number;
  // Flujo real de caja y compromisos estructurales
  totalEgresosCajaYProveedores: number;
  totalGastosEstructurales: number; // Fijos y Variables fuera de control cotidiano
  totalEgresosReales: number;
  utilidadOperativaReal: number;
  utilidadNetaFinal: number; // Ventas Líquidas - Egresos Totales
  margenOperativoReal: number; // Porcentaje
  ratioEscudoFiscal: number;   // % de compras formales vs ventas
}

export interface ProyeccionVentas {
  diasTranscurridos: number;
  diasTotalesMes: number;
  diasRestantes: number;
  ventaRealAcumulada: number;
  promedioDiarioSemana: number; // Lunes a Jueves
  promedioDiarioFinDeSemana: number; // Viernes a Domingo
  diasSemanaRestantes: number;
  diasFinDeSemanaRestantes: number;
  ventaProyectadaCierre: number;
  crecimientoVsMesAnterior?: number;
  metaMes?: number;
  cumplimientoMetaPct?: number;
}
