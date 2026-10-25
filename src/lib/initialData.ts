import { 
  MovimientoCajaChica, 
  FacturaProveedor, 
  VentaDiaria, 
  ProveedorMaestro, 
  AsignacionFondoCaja,
  ConfiguracionFinanciera,
  GastoEstructural
} from '@/types';

export const CONFIGURACION_DEFAULT: ConfiguracionFinanciera = {
  tasaIGV: 10.5, // Tasa reducida de IGV Ley 31556 para Restaurantes en Ventas
  tasaIGVCompras: 18.0, // Tasa estándar de compras a proveedores comerciales
  comisionPOS: 3.5, // Niubiz / Izipay aproximado
  comisionRappi: 18.0, // Comisión Rappi
  comisionPedidosYa: 18.0, // Comisión PedidosYa
  comisionDidi: 15.0, // Comisión DiDi Food
  tasaPagoCuentaRenta: 1.0, // Régimen MYPE Tributario (1.0% mensual para ventas < 300 UIT)
  uitVigente: 5350 // UIT vigente del ejercicio
};

export const CATEGORIAS_GASTOS_DEFAULT: string[] = [
  'Alimentación de personal',
  'Apoyo / Gasto de personal',
  'Bebidas (pulpas, gaseosas, cervesas, etc.)',
  'Bonos por cumplimiento de objetivos',
  'Equipos para el local',
  'Eventos excepcionales',
  'Gastos panadería / cafetería / restaurant',
  'Insumos de cocina (verduras, condimentos palta)',
  'Insumos de salón',
  'Mantenimientos de equipos internos (aires acondicionados, cocinas, etc.)',
  'Movilidades',
  'Planillas de empleados / liquidaciones / aportes Essalud / IRenta / Seguros personal',
  'Reembolsos de caja chica',
  'Servicios administrativos',
  'Servicios públicos (luz, agua, teléfono, internet, sistema fact)',
  'Publicidad y mantenimiento',
  'Utensilios de cocina',
  'Utensilios de salón',
  'Útiles de oficina',
  'Útiles de limpieza',
  'Uniforme de personal',
  'Botiquín',
  'Otros gastos menores'
];

export const PROVEEDORES_MAESTROS_DEFAULT: ProveedorMaestro[] = [
  { ruc: '20603138831', razonSocial: 'AC COMERCIAL DEL PERU S.A.C.', tipoGastoDefault: 'Abastecimiento Planta SHIMAYA / FUREBA' },
  { ruc: '10480810932', razonSocial: 'ALVARADO PORTELLA BRIGGITTE ELIZABETH', tipoGastoDefault: 'Alimentación de personal' },
  { ruc: '20516313821', razonSocial: 'AGRO ALIMENTOS ANDINOS S.A.C.', tipoGastoDefault: 'Bebidas (pulpas, gaseosas, cervesas, etc.)' },
  { ruc: '20510005792', razonSocial: 'AMERICA CAPON S.A.C.', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '10413088416', razonSocial: 'BENDEZU CRUZ VICTOR', tipoGastoDefault: 'Equipos para el local' },
  { ruc: '20609714523', razonSocial: 'CENTRO HORECA S.A.C.', tipoGastoDefault: 'Equipos para el local' },
  { ruc: '20554545743', razonSocial: 'CORPORACION PRIMAX S.A.', tipoGastoDefault: 'Servicios administrativos' },
  { ruc: '10075304531', razonSocial: 'CREACIONES KEVINTEX', tipoGastoDefault: 'Uniforme de personal' },
  { ruc: '20612147801', razonSocial: 'DISTRIBUIDORA AGRO ARROYO E.I.R.L.', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '20517092097', razonSocial: 'FUKU E.I.R.L.', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '20611257857', razonSocial: 'FUREBA SERVICIOS S.A.C.', tipoGastoDefault: 'Abastecimiento Planta SHIMAYA' },
  { ruc: '20613084593', razonSocial: 'GEMBUTSU S.A.C.', tipoGastoDefault: 'Abastecimiento Planta SHIMAYA' },
  { ruc: '20606209313', razonSocial: 'H & D SANTOS SERVICIOS GENERALES E.I.R.L', tipoGastoDefault: 'Mantenimientos de equipos internos' },
  { ruc: '20511555133', razonSocial: 'CORPORACION DE REPUESTOS S.A.', tipoGastoDefault: 'Equipos para el local' },
  { ruc: '20547513542', razonSocial: 'IMPORTACIONES GEMMA S.A.C.', tipoGastoDefault: 'Utensilios de cocina' },
  { ruc: '20611385324', razonSocial: 'INVECOOLER PROYECTOS Y SERVICIOS S.A.C.', tipoGastoDefault: 'Mantenimientos de equipos internos' },
  { ruc: '20548297878', razonSocial: 'INVERSIONES MASTER CHEF PERU S.A.C.', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '20427075207', razonSocial: 'INVERSIONES VALONSHI S.A.', tipoGastoDefault: 'Servicios administrativos' },
  { ruc: '20612440728', razonSocial: 'KITSUNE RYOURI S.A.C.', tipoGastoDefault: 'Insumos de cocina' },
  { ruc: '20601315051', razonSocial: 'MALL AVENTURA S.A.', tipoGastoDefault: 'Alquiler de local' },
  { ruc: '20601829194', razonSocial: 'MARUMAX S.A.C.', tipoGastoDefault: 'Abastecimiento Planta SHIMAYA' },
  { ruc: '20600031423', razonSocial: 'OKINAGA S.A.C.', tipoGastoDefault: 'Insumos de cocina' },
  { ruc: '20548042888', razonSocial: 'PROHYGIENE', tipoGastoDefault: 'Útiles de limpieza' },
  { ruc: '20606530545', razonSocial: 'SANICONTROL S.A.C.', tipoGastoDefault: 'Servicios administrativos' },
  { ruc: '20600603460', razonSocial: 'SHIMAYA S.A.C.', tipoGastoDefault: 'Regalías SHIMAYA / Marketing / RRHH' },
  { ruc: '20100047137', razonSocial: 'UNION YCHICAWA S.A.', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '20100108888', razonSocial: 'MAKRO SUPERMAYORISTA S.A.', tipoGastoDefault: 'Insumos de cocina' },
  { ruc: '20100070970', razonSocial: 'LUZ DEL SUR S.A.A.', tipoGastoDefault: 'Servicios públicos (luz, agua, teléfono, internet)' },
  { ruc: '20100035392', razonSocial: 'PACIFICO COMPAÑIA DE SEGUROS', tipoGastoDefault: 'Planillas de empleados / liquidaciones / aportes Essalud' },
  { ruc: '20301443251', razonSocial: 'BODEGA RIVERA', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '20500000001', razonSocial: 'BAMBU', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' },
  { ruc: '20605000002', razonSocial: 'INDRIVE', tipoGastoDefault: 'Movilidades' },
  { ruc: '20100010729', razonSocial: 'TAI LOY S.A.C.', tipoGastoDefault: 'Útiles de oficina' },
  { ruc: '20549999999', razonSocial: 'PACHAFLAMA', tipoGastoDefault: 'Insumos de cocina (verduras, condimentos palta)' }
];

// Comienza completamente limpio (sin datos de prueba previos)
export const CAJA_CHICA_INICIAL: MovimientoCajaChica[] = [];

// Facturas por pagar a proveedores (inicia completamente limpio)
export const FACTURAS_PROVEEDORES_INICIALES: FacturaProveedor[] = [];

// Fondos asignados de caja chica (inicia completamente limpio)
export const FONDOS_CAJA_CHICA_INICIAL: AsignacionFondoCaja[] = [];

// Ventas Diarias iniciales (inicia completamente limpio)
export const VENTAS_DIARIAS_INICIALES: VentaDiaria[] = [];

// Gastos Estructurales (Fijos y Variables fuera de control cotidiano)
export const GASTOS_ESTRUCTURALES_INICIALES: GastoEstructural[] = [];
