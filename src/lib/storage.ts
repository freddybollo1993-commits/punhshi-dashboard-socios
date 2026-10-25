import { 
  MovimientoCajaChica, 
  FacturaProveedor, 
  VentaDiaria, 
  ProveedorMaestro, 
  AsignacionFondoCaja, 
  BalanceCajaChica,
  ConfiguracionFinanciera,
  GastoEstructural
} from '@/types';

import { 
  CAJA_CHICA_INICIAL, 
  FACTURAS_PROVEEDORES_INICIALES, 
  VENTAS_DIARIAS_INICIALES, 
  FONDOS_CAJA_CHICA_INICIAL,
  PROVEEDORES_MAESTROS_DEFAULT,
  CATEGORIAS_GASTOS_DEFAULT,
  CONFIGURACION_DEFAULT,
  GASTOS_ESTRUCTURALES_INICIALES
} from './initialData';

const KEYS = {
  CAJA_CHICA: 'punhshi_caja_chica_clean_v2',
  PROVEEDORES: 'punhshi_facturas_proveedores_clean_v2',
  VENTAS: 'punhshi_ventas_diarias_clean_v2',
  FONDOS_CAJA: 'punhshi_fondos_caja_chica_clean_v2',
  CONFIG: 'punhshi_config_v2',
  GASTOS_ESTRUCTURALES: 'punhshi_gastos_estructurales_v2',
  MAESTRO_PROVEEDORES: 'punhshi_maestro_proveedores_v2',
  CATEGORIAS: 'punhshi_categorias_v2'
};

const isBrowser = typeof window !== 'undefined';

// ==========================================
// CONFIGURACIÓN FINANCIERA (IGV, COMISIONES)
// ==========================================
export function getConfiguracion(): ConfiguracionFinanciera {
  if (!isBrowser) return CONFIGURACION_DEFAULT;
  try {
    const raw = localStorage.getItem(KEYS.CONFIG);
    if (!raw) {
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(CONFIGURACION_DEFAULT));
      return CONFIGURACION_DEFAULT;
    }
    return { ...CONFIGURACION_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return CONFIGURACION_DEFAULT;
  }
}

export function saveConfiguracion(cfg: ConfiguracionFinanciera): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(cfg));
}

// ==========================================
// GASTOS ESTRUCTURALES (FIJOS Y VARIABLES)
// ==========================================
export function getGastosEstructurales(): GastoEstructural[] {
  if (!isBrowser) return GASTOS_ESTRUCTURALES_INICIALES;
  try {
    const raw = localStorage.getItem(KEYS.GASTOS_ESTRUCTURALES);
    if (!raw) {
      localStorage.setItem(KEYS.GASTOS_ESTRUCTURALES, JSON.stringify(GASTOS_ESTRUCTURALES_INICIALES));
      return GASTOS_ESTRUCTURALES_INICIALES;
    }
    return JSON.parse(raw);
  } catch {
    return GASTOS_ESTRUCTURALES_INICIALES;
  }
}

export function saveGastosEstructurales(data: GastoEstructural[]): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.GASTOS_ESTRUCTURALES, JSON.stringify(data));
}

export function addGastoEstructural(item: Omit<GastoEstructural, 'id'>): GastoEstructural {
  const current = getGastosEstructurales();
  const newItem: GastoEstructural = {
    ...item,
    id: `ge-${Date.now()}`
  };
  const updated = [newItem, ...current];
  saveGastosEstructurales(updated);
  return newItem;
}

export function deleteGastoEstructural(id: string): void {
  const current = getGastosEstructurales();
  const updated = current.filter(g => g.id !== id);
  saveGastosEstructurales(updated);
}

export function toggleGastoEstructural(id: string): void {
  const current = getGastosEstructurales();
  const updated = current.map(g => g.id === id ? { ...g, activo: !g.activo } : g);
  saveGastosEstructurales(updated);
}

// ==========================================
// CAJA CHICA (MOVIMIENTOS)
// ==========================================
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

export function deleteMovimientoCajaChica(id: string): void {
  const current = getCajaChica();
  const updated = current.filter(c => c.id !== id);
  saveCajaChica(updated);
}

// ==========================================
// FACTURAS PROVEEDORES (CUENTAS POR PAGAR)
// ==========================================
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

export function deleteFacturaProveedor(id: string): void {
  const current = getFacturasProveedores();
  const updated = current.filter(p => p.id !== id);
  saveFacturasProveedores(updated);
}

// ==========================================
// VENTAS DIARIAS (CON DEDUCCIÓN DE COMISIONES)
// ==========================================
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
  const cfg = getConfiguracion();
  
  const tarjetaMonto = Number(venta.tarjeta || 0);
  const efectivoMonto = Number(venta.efectivo || 0);
  const yapePlinMonto = Number(venta.yapePlin || 0);
  const rappiMonto = Number(venta.rappi || 0);
  const pedidosYaMonto = Number(venta.pedidosYa || 0);
  const didiMonto = Number(venta.didi || 0);
  const deliveryOtrosMonto = Number(venta.deliveryApps || 0);

  const deliveryTotal = (rappiMonto + pedidosYaMonto + didiMonto) > 0 
    ? (rappiMonto + pedidosYaMonto + didiMonto) 
    : deliveryOtrosMonto;

  const totalBruto = tarjetaMonto + efectivoMonto + yapePlinMonto + deliveryTotal;

  // Deducción de comisiones
  const comisionPos = tarjetaMonto * (cfg.comisionPOS / 100);
  const comisionRappi = rappiMonto * (cfg.comisionRappi / 100);
  const comisionPedidos = pedidosYaMonto * (cfg.comisionPedidosYa / 100);
  const comisionDidi = didiMonto * (cfg.comisionDidi / 100);
  const totalComisiones = comisionPos + comisionRappi + comisionPedidos + comisionDidi;
  const totalLiquido = totalBruto - totalComisiones;

  const existingIndex = current.findIndex(v => v.fecha === venta.fecha);
  if (existingIndex >= 0) {
    const updatedItem: VentaDiaria = {
      ...current[existingIndex],
      ...venta,
      deliveryApps: deliveryTotal,
      totalVenta: totalBruto,
      totalComisionesDescontadas: totalComisiones,
      totalVentaLiquida: totalLiquido
    };
    current[existingIndex] = updatedItem;
    saveVentasDiarias([...current]);
    return updatedItem;
  } else {
    const newItem: VentaDiaria = {
      ...venta,
      id: `v-${Date.now()}`,
      deliveryApps: deliveryTotal,
      totalVenta: totalBruto,
      totalComisionesDescontadas: totalComisiones,
      totalVentaLiquida: totalLiquido
    };
    const updated = [...current, newItem].sort((a, b) => a.fecha.localeCompare(b.fecha));
    saveVentasDiarias(updated);
    return newItem;
  }
}

export function deleteVentaDiaria(id: string): void {
  const current = getVentasDiarias();
  const updated = current.filter(v => v.id !== id);
  saveVentasDiarias(updated);
}

// ==========================================
// ASIGNACIÓN DE FONDOS CAJA CHICA (REPOSICIONES)
// ==========================================
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

// ==========================================
// MAESTROS Y CATEGORÍAS
// ==========================================
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

export function resetToSeedData(): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.CAJA_CHICA, JSON.stringify(CAJA_CHICA_INICIAL));
  localStorage.setItem(KEYS.PROVEEDORES, JSON.stringify(FACTURAS_PROVEEDORES_INICIALES));
  localStorage.setItem(KEYS.VENTAS, JSON.stringify(VENTAS_DIARIAS_INICIALES));
  localStorage.setItem(KEYS.FONDOS_CAJA, JSON.stringify(FONDOS_CAJA_CHICA_INICIAL));
  localStorage.setItem(KEYS.GASTOS_ESTRUCTURALES, JSON.stringify(GASTOS_ESTRUCTURALES_INICIALES));
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(CONFIGURACION_DEFAULT));
  localStorage.setItem(KEYS.MAESTRO_PROVEEDORES, JSON.stringify(PROVEEDORES_MAESTROS_DEFAULT));
  localStorage.setItem(KEYS.CATEGORIAS, JSON.stringify(CATEGORIAS_GASTOS_DEFAULT));
}
