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

export interface VentaDiaria {
  id: string;
  fecha: string; // YYYY-MM-DD
  tarjeta: number;      // Niubiz / POS
  efectivo: number;     // Efectivo en caja
  yapePlin?: number;    // Billeteras digitales
  deliveryApps?: number;// Rappi / PedidosYa
  totalVenta: number;   // Calculado
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
  // Ventas
  totalVentasReales: number;
  totalVentasDeclaradas: number;
  igvDebitoFiscal: number; // Impuesto de ventas
  // Compras con Factura (Crédito Fiscal)
  comprasFacturaProveedores: number;
  igvCreditoProveedores: number;
  comprasFacturaCajaChica: number;
  igvCreditoCajaChica: number;
  totalCreditoFiscalIGV: number;
  // Balance SUNAT
  igvEstimadoAPagar: number;
  saldoAFavorIGV: number;
  pagoCuentaRentaEstimado: number; // 1.5% o 1%
  totalImpuestosEstimados: number;
  // Gastos no deducibles (Notas de venta, guías, etc.)
  gastosSinCreditoFiscal: number;
  // Flujo real de caja
  totalEgresosReales: number;
  utilidadOperativaReal: number;
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
