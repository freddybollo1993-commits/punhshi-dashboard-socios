import { MovimientoCajaChica, FacturaProveedor, VentaDiaria, ProveedorMaestro, AsignacionFondoCaja, BalanceCajaChica } from '@/types';
import { 
  CAJA_CHICA_INICIAL, 
  FACTURAS_PROVEEDORES_INICIALES, 
  VENTAS_DIARIAS_INICIALES, 
  FONDOS_CAJA_CHICA_INICIAL,
  PROVEEDORES_MAESTROS_DEFAULT,
  CATEGORIAS_GASTOS_DEFAULT 
} from './initialData';

const KEYS = {
  CAJA_CHICA: 'punhshi_caja_chica_v1',
  PROVEEDORES: 'punhshi_facturas_proveedores_v1',
  VENTAS: 'punhshi_ventas_diarias_v1',
  FONDOS_CAJA: 'punhshi_fondos_caja_chica_v1',
  MAESTRO_PROVEEDORES: 'punhshi_maestro_proveedores_v1',
  CATEGORIAS: 'punhshi_categorias_v1'
};

const isBrowser = typeof window !== 'undefined';

export function getCajaChica(): MovimientoCajaChica[] {
  if (!isBrowser) return CAJA_CHICA_INICIAL;
  try {
    const raw = localStorage.getItem(KEYS.CAJA_CHICA);
    if (!raw) {
      localStorage.setItem(KEYS.CAJA_CHICA, JSON.stringify(CAJA_CHICA_INICIAL));
      return CAJA_CHICA_INICIAL;
    }
    return JSON.parse(raw);
  } catch {
    return CAJA_CHICA_INICIAL;
  }
}

export function saveCajaChica(data: MovimientoCajaChica[]): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.CAJA_CHICA, JSON.stringify(data));
}

export function addMovimientoCajaChica(item: Omit<MovimientoCajaChica, 'id' | 'numero'>): MovimientoCajaChica {
  const current = getCajaChica();
  const nextNum = current.length > 0 ? Math.max(...current.map(c => c.numero)) + 1 : 1;
  const newItem: MovimientoCajaChica = {
    ...item,
    id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    numero: nextNum
  };
  const updated = [newItem, ...current];
  saveCajaChica(updated);
  return newItem;
}

export function getFacturasProveedores(): FacturaProveedor[] {
  if (!isBrowser) return FACTURAS_PROVEEDORES_INICIALES;
  try {
    const raw = localStorage.getItem(KEYS.PROVEEDORES);
    if (!raw) {
      localStorage.setItem(KEYS.PROVEEDORES, JSON.stringify(FACTURAS_PROVEEDORES_INICIALES));
      return FACTURAS_PROVEEDORES_INICIALES;
    }
    return JSON.parse(raw);
  } catch {
    return FACTURAS_PROVEEDORES_INICIALES;
  }
}

export function saveFacturasProveedores(data: FacturaProveedor[]): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.PROVEEDORES, JSON.stringify(data));
}

export function addFacturaProveedor(item: Omit<FacturaProveedor, 'id' | 'numero'>): FacturaProveedor {
  const current = getFacturasProveedores();
  const nextNum = current.length > 0 ? Math.max(...current.map(c => c.numero)) + 1 : 1;
  const newItem: FacturaProveedor = {
    ...item,
    id: `fp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    numero: nextNum
  };
  const updated = [newItem, ...current];
  saveFacturasProveedores(updated);
  return newItem;
}

export function getVentasDiarias(): VentaDiaria[] {
  if (!isBrowser) return VENTAS_DIARIAS_INICIALES;
  try {
    const raw = localStorage.getItem(KEYS.VENTAS);
    if (!raw) {
      localStorage.setItem(KEYS.VENTAS, JSON.stringify(VENTAS_DIARIAS_INICIALES));
      return VENTAS_DIARIAS_INICIALES;
    }
    return JSON.parse(raw);
  } catch {
    return VENTAS_DIARIAS_INICIALES;
  }
}

export function saveVentasDiarias(data: VentaDiaria[]): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.VENTAS, JSON.stringify(data));
}

export function addOrUpdateVentaDiaria(venta: Omit<VentaDiaria, 'id' | 'totalVenta'> & { id?: string }): VentaDiaria {
  const current = getVentasDiarias();
  const total = Number(venta.tarjeta || 0) + Number(venta.efectivo || 0) + Number(venta.yapePlin || 0) + Number(venta.deliveryApps || 0);
  
  const existingIndex = current.findIndex(v => v.fecha === venta.fecha);
  if (existingIndex >= 0) {
    const updatedItem: VentaDiaria = {
      ...current[existingIndex],
      ...venta,
      totalVenta: total
    };
    current[existingIndex] = updatedItem;
    saveVentasDiarias([...current]);
    return updatedItem;
  } else {
    const newItem: VentaDiaria = {
      ...venta,
      id: `v-${Date.now()}`,
      totalVenta: total
    };
    const updated = [...current, newItem].sort((a, b) => a.fecha.localeCompare(b.fecha));
    saveVentasDiarias(updated);
    return newItem;
  }
}

export function getMaestroProveedores(): ProveedorMaestro[] {
  if (!isBrowser) return PROVEEDORES_MAESTROS_DEFAULT;
  try {
    const raw = localStorage.getItem(KEYS.MAESTRO_PROVEEDORES);
    if (!raw) {
      localStorage.setItem(KEYS.MAESTRO_PROVEEDORES, JSON.stringify(PROVEEDORES_MAESTROS_DEFAULT));
      return PROVEEDORES_MAESTROS_DEFAULT;
    }
    return JSON.parse(raw);
  } catch {
    return PROVEEDORES_MAESTROS_DEFAULT;
  }
}

export function getCategoriasGastos(): string[] {
  if (!isBrowser) return CATEGORIAS_GASTOS_DEFAULT;
  try {
    const raw = localStorage.getItem(KEYS.CATEGORIAS);
    if (!raw) {
      localStorage.setItem(KEYS.CATEGORIAS, JSON.stringify(CATEGORIAS_GASTOS_DEFAULT));
      return CATEGORIAS_GASTOS_DEFAULT;
    }
    return JSON.parse(raw);
  } catch {
    return CATEGORIAS_GASTOS_DEFAULT;
  }
}

export function getAsignacionesFondo(): AsignacionFondoCaja[] {
  if (!isBrowser) return FONDOS_CAJA_CHICA_INICIAL;
  try {
    const raw = localStorage.getItem(KEYS.FONDOS_CAJA);
    if (!raw) {
      localStorage.setItem(KEYS.FONDOS_CAJA, JSON.stringify(FONDOS_CAJA_CHICA_INICIAL));
      return FONDOS_CAJA_CHICA_INICIAL;
    }
    return JSON.parse(raw);
  } catch {
    return FONDOS_CAJA_CHICA_INICIAL;
  }
}

export function saveAsignacionesFondo(data: AsignacionFondoCaja[]): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.FONDOS_CAJA, JSON.stringify(data));
}

export function addAsignacionFondo(item: Omit<AsignacionFondoCaja, 'id' | 'totalAsignado'>): AsignacionFondoCaja {
  const current = getAsignacionesFondo();
  const total = Number(item.tarjeta || 0) + Number(item.efectivo || 0);
  const newItem: AsignacionFondoCaja = {
    ...item,
    id: `fondo-${Date.now()}`,
    totalAsignado: total
  };
  const updated = [newItem, ...current];
  saveAsignacionesFondo(updated);
  return newItem;
}

export function calculateBalanceCajaChica(
  cajaChica: MovimientoCajaChica[],
  fondos: AsignacionFondoCaja[],
  periodoStr?: string
): BalanceCajaChica {
  const filterDate = (fechaStr: string) => {
    if (!periodoStr) return true;
    return fechaStr.startsWith(periodoStr);
  };

  const fondosPeriodo = fondos.filter(f => filterDate(f.fecha));
  const gastosPeriodo = cajaChica.filter(c => filterDate(c.fecha));

  const totalFondosAsignados = fondosPeriodo.reduce((sum, f) => sum + Number(f.totalAsignado || 0), 0);
  const totalGastosRendidos = gastosPeriodo.reduce((sum, c) => sum + Number(c.importePagado || 0), 0);

  const saldoDisponibleEnCaja = totalFondosAsignados - totalGastosRendidos;
  const porcentajeConsumido = totalFondosAsignados > 0 
    ? Math.min(100, (totalGastosRendidos / totalFondosAsignados) * 100) 
    : 0;

  const estaCuadrado = saldoDisponibleEnCaja >= 0;
  const diferencia = Math.abs(saldoDisponibleEnCaja);

  return {
    totalFondosAsignados,
    totalGastosRendidos,
    saldoDisponibleEnCaja,
    porcentajeConsumido,
    estaCuadrado,
    diferencia
  };
}

export function resetToSeedData(): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.CAJA_CHICA, JSON.stringify(CAJA_CHICA_INICIAL));
  localStorage.setItem(KEYS.PROVEEDORES, JSON.stringify(FACTURAS_PROVEEDORES_INICIALES));
  localStorage.setItem(KEYS.VENTAS, JSON.stringify(VENTAS_DIARIAS_INICIALES));
  localStorage.setItem(KEYS.FONDOS_CAJA, JSON.stringify(FONDOS_CAJA_CHICA_INICIAL));
  localStorage.setItem(KEYS.MAESTRO_PROVEEDORES, JSON.stringify(PROVEEDORES_MAESTROS_DEFAULT));
  localStorage.setItem(KEYS.CATEGORIAS, JSON.stringify(CATEGORIAS_GASTOS_DEFAULT));
}
