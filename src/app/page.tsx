'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  FileSpreadsheet, 
  Camera, 
  Clock, 
  Calendar, 
  Download, 
  ShieldCheck, 
  ArrowUpRight, 
  PieChart as PieIcon,
  RotateCcw,
  Plus,
  Wallet
} from 'lucide-react';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { 
  EMPRESA_PUNHSHI, 
  MovimientoCajaChica, 
  FacturaProveedor, 
  VentaDiaria,
  AsignacionFondoCaja
} from '@/types';

import { 
  getCajaChica, 
  saveCajaChica, 
  addMovimientoCajaChica, 
  getFacturasProveedores, 
  saveFacturasProveedores, 
  addFacturaProveedor, 
  getVentasDiarias, 
  addOrUpdateVentaDiaria, 
  getAsignacionesFondo,
  addAsignacionFondo,
  calculateBalanceCajaChica,
  resetToSeedData 
} from '@/lib/storage';

import { calculateFiscalSummary } from '@/lib/taxEngine';
import { calculateSalesProjection } from '@/lib/projectionsEngine';
import { exportarReporteCompletoExcel } from '@/lib/excelExport';

import OCRScannerModal from '@/components/OCRScannerModal';
import VentaDiariaModal from '@/components/VentaDiariaModal';
import AsignacionFondoModal from '@/components/AsignacionFondoModal';

const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'];

type TabType = 'DASHBOARD' | 'CAJA_CHICA' | 'PROVEEDORES' | 'VENTAS' | 'REPORTES';

export default function DashboardSociosPage() {
  const [mounted, setMounted] = useState(false);
  const [cajaChica, setCajaChica] = useState<MovimientoCajaChica[]>([]);
  const [proveedores, setProveedores] = useState<FacturaProveedor[]>([]);
  const [ventas, setVentas] = useState<VentaDiaria[]>([]);
  const [fondosCaja, setFondosCaja] = useState<AsignacionFondoCaja[]>([]);
  
  // Tab activo
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  
  // Modales
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
  const [isFondoModalOpen, setIsFondoModalOpen] = useState(false);
  
  // Filtros
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2025-05');
  const [fechaInicioReporte, setFechaInicioReporte] = useState('2025-05-01');
  const [fechaFinReporte, setFechaFinReporte] = useState('2025-05-31');
  const [filtroCategoriaCaja, setFiltroCategoriaCaja] = useState('TODAS');
  const [filtroTipoDocCaja, setFiltroTipoDocCaja] = useState('TODOS');
  const [busquedaCaja, setBusquedaCaja] = useState('');

  // Carga inicial
  useEffect(() => {
    setMounted(true);
    setCajaChica(getCajaChica());
    setProveedores(getFacturasProveedores());
    setVentas(getVentasDiarias());
    setFondosCaja(getAsignacionesFondo());
  }, []);

  if (!mounted) return null;

  // Cálculos dinámicos
  const resumenFiscal = calculateFiscalSummary(cajaChica, proveedores, ventas, periodoSeleccionado);
  const proyeccion = calculateSalesProjection(ventas, periodoSeleccionado, 45000);
  const balanceCaja = calculateBalanceCajaChica(cajaChica, fondosCaja, periodoSeleccionado);

  // Handlers para guardar nuevos registros
  const handleSaveCajaChica = (item: Omit<MovimientoCajaChica, 'id' | 'numero'>) => {
    addMovimientoCajaChica(item);
    setCajaChica(getCajaChica());
  };

  const handleSaveProveedor = (item: Omit<FacturaProveedor, 'id' | 'numero'>) => {
    addFacturaProveedor(item);
    setProveedores(getFacturasProveedores());
  };

  const handleSaveVenta = (item: Omit<VentaDiaria, 'id' | 'totalVenta'>) => {
    addOrUpdateVentaDiaria(item);
    setVentas(getVentasDiarias());
  };

  const handleSaveFondo = (item: Omit<AsignacionFondoCaja, 'id' | 'totalAsignado'>) => {
    addAsignacionFondo(item);
    setFondosCaja(getAsignacionesFondo());
  };

  // Toggle estado envío en caja chica
  const handleToggleEnvioDoc = (id: string) => {
    const updated = cajaChica.map(c => {
      if (c.id === id) {
        return {
          ...c,
          envioDocumento: (c.envioDocumento === 'PENDIENTE' ? 'ENVIADO' : 'PENDIENTE') as 'PENDIENTE' | 'ENVIADO'
        };
      }
      return c;
    });
    saveCajaChica(updated);
    setCajaChica(updated);
  };

  // Toggle estado pago proveedor
  const handleTogglePagoProveedor = (id: string) => {
    const updated = proveedores.map(p => {
      if (p.id === id) {
        const nuevoEstado = p.estatusPago === 'PENDIENTE' ? 'PAGADO' : 'PENDIENTE';
        return {
          ...p,
          estatusPago: nuevoEstado as 'PENDIENTE' | 'PAGADO',
          fechaPago: nuevoEstado === 'PAGADO' ? new Date().toISOString().slice(0, 10) : undefined
        };
      }
      return p;
    });
    saveFacturasProveedores(updated);
    setProveedores(updated);
  };

  // Reset demo data
  const handleResetDemo = () => {
    if (confirm('¿Restablecer datos originales del Excel de PUNHSHI S.A.C.?')) {
      resetToSeedData();
      setCajaChica(getCajaChica());
      setProveedores(getFacturasProveedores());
      setVentas(getVentasDiarias());
    }
  };

  // Datos para gráficos de ventas y proyección
  const chartVentasData = ventas
    .filter(v => v.fecha.startsWith(periodoSeleccionado))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(v => ({
      dia: v.fecha.slice(8, 10),
      fecha: v.fecha,
      totalVenta: v.totalVenta,
      tarjeta: v.tarjeta,
      efectivo: v.efectivo,
      declarada: (v.ventaDeclaradaFactura || 0) + (v.ventaDeclaradaBoleta || 0)
    }));

  // Agrupar gastos por categoría
  const gastosPorCategoriaMap: Record<string, number> = {};
  cajaChica
    .filter(c => c.fecha.startsWith(periodoSeleccionado))
    .forEach(c => {
      const cat = c.tipoGasto || 'Otros';
      gastosPorCategoriaMap[cat] = (gastosPorCategoriaMap[cat] || 0) + Number(c.importePagado || 0);
    });

  const chartCategoriasData = Object.entries(gastosPorCategoriaMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Filtrado de caja chica para tabla
  const cajaChicaFiltrada = cajaChica.filter(c => {
    const matchPeriodo = c.fecha.startsWith(periodoSeleccionado);
    const matchCat = filtroCategoriaCaja === 'TODAS' || c.tipoGasto === filtroCategoriaCaja;
    const matchTipo = filtroTipoDocCaja === 'TODOS' || c.tipoComprobante === filtroTipoDocCaja;
    const matchText = !busquedaCaja || 
      c.proveedor.toLowerCase().includes(busquedaCaja.toLowerCase()) || 
      c.detalleGasto.toLowerCase().includes(busquedaCaja.toLowerCase()) ||
      c.numeroComprobante.toLowerCase().includes(busquedaCaja.toLowerCase());
    return matchPeriodo && matchCat && matchTipo && matchText;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* TOP EXECUTIVE BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Company info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  {EMPRESA_PUNHSHI.razonSocial}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  RUC {EMPRESA_PUNHSHI.ruc}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dashboard Ejecutivo del Socio • SHIMAYA
              </p>
            </div>
          </div>

          {/* Quick Period Selector & Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={periodoSeleccionado}
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="2025-05" className="bg-slate-900">Mayo 2025</option>
                <option value="2025-04" className="bg-slate-900">Abril 2025</option>
                <option value="2025-06" className="bg-slate-900">Junio 2025</option>
              </select>
            </div>

            <button
              onClick={() => setIsFondoModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>Asignar Fondo Caja</span>
            </button>

            <button
              onClick={() => setIsOCRModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Foto Factura OCR / Manual</span>
            </button>

            <button
              onClick={() => setIsVentaModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Venta Diaria</span>
            </button>

            <button
              onClick={() => exportarReporteCompletoExcel(cajaChica, proveedores, ventas, resumenFiscal, proyeccion)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition"
              title="Descargar Reporte Excel Completo (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-800/60 pt-1 pb-1 scrollbar-none">
          {[
            { id: 'DASHBOARD', label: '📱 Dashboard del Socio', icon: TrendingUp },
            { id: 'CAJA_CHICA', label: '💵 Control Caja Chica', icon: Receipt },
            { id: 'PROVEEDORES', label: '🏢 Proveedores (CxP)', icon: Building2 },
            { id: 'VENTAS', label: '📈 Ventas & Proyección', icon: DollarSign },
            { id: 'REPORTES', label: '📑 Exportación Excel', icon: FileSpreadsheet }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                  active
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        {/* ======================================================== */}
        {/* TAB 1: EXECUTIVE SOCIO DASHBOARD                         */}
        {/* ======================================================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            
            {/* Top 4 Primary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Ventas del Mes */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ventas Reales Acumuladas
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  S/ {resumenFiscal.totalVentasReales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-xs flex items-center gap-1.5 text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{proyeccion.diasTranscurridos} días registrados</span>
                  <span className="text-slate-400 ml-auto">Meta: S/ {proyeccion.metaMes?.toLocaleString()}</span>
                </div>
              </div>

              {/* Card 2: Proyección Cierre de Mes */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Proyección Cierre de Mes
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400 tracking-tight">
                  S/ {proyeccion.ventaProyectadaCierre.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                  <span>Ponderado Fin de Semana</span>
                  <span className="font-bold text-slate-200">
                    {(proyeccion.cumplimientoMetaPct ?? 0).toFixed(0)}% de Meta
                  </span>
                </div>
              </div>

              {/* Card 3: Utilidad Operativa Real */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Utilidad Operativa Real
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-black tracking-tight ${
                  resumenFiscal.utilidadOperativaReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  S/ {resumenFiscal.utilidadOperativaReal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                  <span>Margen Operativo:</span>
                  <span className="font-bold text-slate-200">
                    {resumenFiscal.margenOperativoReal.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Card 4: Semáforo Fiscal SUNAT */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Impuestos SUNAT Estimados
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-300 tracking-tight">
                  S/ {resumenFiscal.totalImpuestosEstimados.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                  <span>IGV por pagar:</span>
                  <span className="font-semibold text-slate-200">
                    S/ {resumenFiscal.igvEstimadoAPagar.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Conciliación & Doble Validación de Caja Chica */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Doble Validación y Conciliación de Caja Chica (Gastos Menores)
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        balanceCaja.estaCuadrado 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {balanceCaja.estaCuadrado ? '✓ Caja Cuadrada' : '⚠️ Exceso de Gastos'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comparativa entre dinero destinado a gastos menores vs comprobantes rendidos de PUNHSHI S.A.C.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFondoModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Nueva Asignación
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Fondos Destinados:</span>
                  <span className="text-lg font-black text-amber-300">
                    S/ {balanceCaja.totalFondosAsignados.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Asignado para reposición</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Total Gastos Rendidos (Comprobantes):</span>
                  <span className="text-lg font-black text-rose-400">
                    S/ {balanceCaja.totalGastosRendidos.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{cajaChica.filter(c => c.fecha.startsWith(periodoSeleccionado)).length} comprobantes registrados</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Saldo Restante en Caja (Efectivo disponible):</span>
                  <span className={`text-lg font-black ${balanceCaja.estaCuadrado ? 'text-emerald-400' : 'text-rose-400'}`}>
                    S/ {balanceCaja.saldoDisponibleEnCaja.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {balanceCaja.estaCuadrado ? 'Dinero físico que debe estar en caja' : 'Diferencia por justificar'}
                  </span>
                </div>
              </div>

              {/* Progress bar of Petty Cash Consumption */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Consumo del fondo de caja chica:</span>
                  <span className="font-bold text-slate-200">{balanceCaja.porcentajeConsumido.toFixed(1)}% rendido</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      balanceCaja.porcentajeConsumido > 95 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, balanceCaja.porcentajeConsumido)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Middle Section: Chart & Fiscal Balance Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sales Chart (8 Cols) */}
              <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      Evolución Diaria de Ventas y Medios de Pago
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comparativa entre Tarjetas POS (Niubiz) y Efectivo en caja
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Tarjeta
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Efectivo
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartVentasData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="dia" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                        formatter={(val) => [`S/ ${Number(val || 0).toFixed(2)}`, '']}
                      />
                      <Bar dataKey="tarjeta" stackId="a" fill="#f59e0b" name="Tarjeta Niubiz" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="efectivo" stackId="a" fill="#10b981" name="Efectivo" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fiscal SUNAT Thermometer (4 Cols) */}
              <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Semáforo de Salud Fiscal SUNAT
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Balance entre Ventas Declaradas vs Compras con Factura
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Débito Fiscal (IGV Ventas):</span>
                      <span className="font-bold text-rose-400">
                        S/ {resumenFiscal.igvDebitoFiscal.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Crédito Fiscal (IGV Compras):</span>
                      <span className="font-bold text-emerald-400">
                        S/ {resumenFiscal.totalCreditoFiscalIGV.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Pago a Cuenta Renta (1.5%):</span>
                      <span className="font-bold text-purple-300">
                        S/ {resumenFiscal.pagoCuentaRentaEstimado.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Escudo Fiscal (Compras/Ventas):</span>
                      <span className={`font-bold ${
                        resumenFiscal.ratioEscudoFiscal >= 70 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {resumenFiscal.ratioEscudoFiscal.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/30 p-2.5 rounded-lg">
                  💡 <strong>Tip para el Socio:</strong> Gastos de caja chica en boletas y guías suman <strong>S/ {resumenFiscal.gastosSinCreditoFiscal.toFixed(2)}</strong>. Solicitar factura en esos consumos aumentaría el crédito fiscal de IGV.
                </div>
              </div>

            </div>

            {/* Bottom Row: Expense Breakdown & Pending Supplier Debts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Expense by Category (6 cols) */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-amber-400" />
                  Distribución de Gastos Operativos
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Principales rubros de gasto registrados en PUNHSHI S.A.C.
                </p>

                <div className="space-y-2.5">
                  {chartCategoriasData.map((item, idx) => {
                    const totalGastos = Object.values(gastosPorCategoriaMap).reduce((a, b) => a + b, 0);
                    const pct = totalGastos > 0 ? (item.value / totalGastos) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 font-medium truncate max-w-[240px]">{item.name}</span>
                          <span className="text-slate-200 font-bold">
                            S/ {item.value.toFixed(2)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pending Accounts Payable (6 cols) */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-400" />
                      Cuentas por Pagar a Proveedores
                    </h3>
                    <button
                      onClick={() => setActiveTab('PROVEEDORES')}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Ver todas →
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Facturas comerciales pendientes de cancelación
                  </p>

                  <div className="space-y-2.5 overflow-y-auto max-h-56">
                    {proveedores
                      .filter(p => p.estatusPago === 'PENDIENTE')
                      .slice(0, 4)
                      .map((p) => (
                        <div key={p.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200">{p.razonSocial}</div>
                            <div className="text-[11px] text-slate-400">{p.numeroDocumento} • {p.tipoGastos}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-rose-400">S/ {p.total.toFixed(2)}</div>
                            <button
                              onClick={() => handleTogglePagoProveedor(p.id)}
                              className="text-[10px] text-emerald-400 hover:underline mt-0.5"
                            >
                              Marcar Pagado
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs mt-3">
                  <span className="text-slate-400 font-semibold">Total Pendiente Proveedores:</span>
                  <span className="font-extrabold text-rose-400 text-sm">
                    S/ {proveedores
                      .filter(p => p.estatusPago === 'PENDIENTE')
                      .reduce((sum, p) => sum + Number(p.total || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CAJA CHICA TABLE (EXACT MANUAL FORMAT)            */}
        {/* ======================================================== */}
        {activeTab === 'CAJA_CHICA' && (
          <div className="space-y-4">
            
            {/* Header & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  Cuadro de Control de Gastos Caja Chica
                </h2>
                <p className="text-xs text-slate-400">
                  {EMPRESA_PUNHSHI.razonSocial} • RUC: {EMPRESA_PUNHSHI.ruc}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <input
                  type="text"
                  placeholder="Buscar proveedor o detalle..."
                  value={busquedaCaja}
                  onChange={(e) => setBusquedaCaja(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <select
                  value={filtroTipoDocCaja}
                  onChange={(e) => setFiltroTipoDocCaja(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="TODOS">Todos los Comprobantes</option>
                  <option value="FACTURA">Solo Facturas (Deducibles)</option>
                  <option value="BOLETA">Boletas</option>
                  <option value="GUIA">Guías / Movilidades</option>
                  <option value="NOTA DE VENTA">Notas de Venta</option>
                </select>

                <select
                  value={filtroCategoriaCaja}
                  onChange={(e) => setFiltroCategoriaCaja(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none max-w-[180px]"
                >
                  <option value="TODAS">Todas las Categorías</option>
                  {Array.from(new Set(cajaChica.map(c => c.tipoGasto))).map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={() => setIsOCRModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Gasto
                </button>
              </div>
            </div>

            {/* Cuadre y Conciliación de Caja Chica */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-slate-400">Fondos Destinados (Asignados):</span>
                  <span className="font-bold text-amber-300 ml-1.5">S/ {balanceCaja.totalFondosAsignados.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Gastos Rendidos:</span>
                  <span className="font-bold text-rose-400 ml-1.5">S/ {balanceCaja.totalGastosRendidos.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Saldo Restante en Caja:</span>
                  <span className={`font-extrabold ml-1.5 ${balanceCaja.estaCuadrado ? 'text-emerald-400' : 'text-rose-400'}`}>
                    S/ {balanceCaja.saldoDisponibleEnCaja.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    balanceCaja.estaCuadrado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {balanceCaja.estaCuadrado ? '✓ Caja Cuadrada' : '⚠️ Descuadre'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsFondoModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Asignar / Reponer Fondo
              </button>
            </div>

            {/* Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">N°</th>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3 text-right">Importe Pagado</th>
                      <th className="py-3 px-3">Tipo Doc</th>
                      <th className="py-3 px-3">N° Factura/Recibo</th>
                      <th className="py-3 px-3 text-center">Envío Documento</th>
                      <th className="py-3 px-3">Proveedor / Beneficiario</th>
                      <th className="py-3 px-3">Detalle del Gasto</th>
                      <th className="py-3 px-3">Tipo de Gastos</th>
                      <th className="py-3 px-3">Observaciones</th>
                      <th className="py-3 px-3 text-center">¿IGV?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cajaChicaFiltrada.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.numero}</td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{item.fecha}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                          S/ {Number(item.importePagado).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.tipoComprobante === 'FACTURA' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.tipoComprobante}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{item.numeroComprobante}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleEnvioDoc(item.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              item.envioDocumento === 'ENVIADO'
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            }`}
                          >
                            {item.envioDocumento}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{item.proveedor}</td>
                        <td className="py-2.5 px-3 text-slate-300">{item.detalleGasto}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.tipoGasto}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.observaciones || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          {item.esDeducibleIGV ? (
                            <span className="text-emerald-400 font-bold" title="Otorga Crédito Fiscal de 18% IGV">✓</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-4">
                <span className="text-slate-400">
                  Mostrando {cajaChicaFiltrada.length} movimientos de caja chica en este período.
                </span>
                <div className="flex items-center gap-5">
                  <div className="text-slate-400">
                    Con Factura (Crédito IGV):{' '}
                    <span className="text-emerald-400 font-bold">
                      S/ {cajaChicaFiltrada
                        .filter(c => c.esDeducibleIGV)
                        .reduce((a, b) => a + Number(b.importePagado || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="text-slate-200 font-bold text-sm">
                    Total Gastado:{' '}
                    <span className="text-amber-400 font-extrabold">
                      S/ {cajaChicaFiltrada
                        .reduce((a, b) => a + Number(b.importePagado || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PROVEEDORES (CUENTAS POR PAGAR)                   */}
        {/* ======================================================== */}
        {activeTab === 'PROVEEDORES' && (
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  Reporte de Facturas por Pagar a Proveedores
                </h2>
                <p className="text-xs text-slate-400">
                  Cuentas por Pagar Comerciales de PUNHSHI S.A.C.
                </p>
              </div>

              <button
                onClick={() => setIsOCRModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Factura de Proveedor
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">N°</th>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">Documento</th>
                      <th className="py-3 px-3">RUC</th>
                      <th className="py-3 px-3">Razón Social</th>
                      <th className="py-3 px-3">Concepto</th>
                      <th className="py-3 px-3 text-right">Valor Venta</th>
                      <th className="py-3 px-3 text-right">IGV (18%)</th>
                      <th className="py-3 px-3 text-right">TOTAL</th>
                      <th className="py-3 px-3 text-center">Estatus Pago</th>
                      <th className="py-3 px-3">Banco / Operación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {proveedores.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{p.numero}</td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{p.fecha}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">{p.numeroDocumento}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{p.ruc}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{p.razonSocial}</td>
                        <td className="py-2.5 px-3 text-slate-300">{p.conceptoGasto}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          S/ {Number(p.valorVenta).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                          S/ {Number(p.igv).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-amber-300">
                          S/ {Number(p.total).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleTogglePagoProveedor(p.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              p.estatusPago === 'PAGADO'
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                            }`}
                          >
                            {p.estatusPago}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {p.banco} {p.operacionPago ? `• ${p.operacionPago}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: VENTAS DIARIAS & PROYECCIÓN                       */}
        {/* ======================================================== */}
        {activeTab === 'VENTAS' && (
          <div className="space-y-6">
            
            {/* Projection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-semibold text-slate-400">Promedio Diario Lunes a Jueves</span>
                <div className="text-xl font-bold text-white mt-1">
                  S/ {proyeccion.promedioDiarioSemana.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">Días restantes de semana: {proyeccion.diasSemanaRestantes}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-semibold text-slate-400">Promedio Viernes a Domingo</span>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  S/ {proyeccion.promedioDiarioFinDeSemana.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">Días restantes de fin de semana: {proyeccion.diasFinDeSemanaRestantes}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs font-semibold text-slate-400">Proyección Estimada Cierre</span>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  S/ {proyeccion.ventaProyectadaCierre.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">{(proyeccion.cumplimientoMetaPct ?? 0).toFixed(1)}% cumplimiento</span>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Registro Diario de Ventas en Caja</h3>
                  <p className="text-xs text-slate-400">PUNHSHI S.A.C. - Período {periodoSeleccionado}</p>
                </div>
                <button
                  onClick={() => setIsVentaModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Día
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3 text-right">Tarjeta POS</th>
                      <th className="py-3 px-3 text-right">Efectivo</th>
                      <th className="py-3 px-3 text-right">Yape / Plin</th>
                      <th className="py-3 px-3 text-right">Delivery Apps</th>
                      <th className="py-3 px-3 text-right">TOTAL VENTA</th>
                      <th className="py-3 px-3 text-right">Declarado Factura</th>
                      <th className="py-3 px-3 text-right">Declarado Boleta</th>
                      <th className="py-3 px-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ventas.filter(v => v.fecha.startsWith(periodoSeleccionado)).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <DollarSign className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <p className="font-bold text-slate-300 text-sm">No hay registros de ventas para este período ({periodoSeleccionado})</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Haz clic en el botón &quot;Registrar Día&quot; para ingresar tu primer cierre de caja y calcular las proyecciones mensuales automáticas.
                          </p>
                          <button
                            onClick={() => setIsVentaModalOpen(true)}
                            className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition"
                          >
                            <Plus className="w-4 h-4" /> Registrar Primera Venta
                          </button>
                        </td>
                      </tr>
                    ) : (
                      ventas
                        .filter(v => v.fecha.startsWith(periodoSeleccionado))
                        .sort((a, b) => a.fecha.localeCompare(b.fecha))
                        .map((v) => (
                          <tr key={v.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{v.fecha}</td>
                            <td className="py-2.5 px-3 text-right text-amber-300 font-medium">S/ {Number(v.tarjeta).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-300 font-medium">S/ {Number(v.efectivo).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-purple-300 font-medium">S/ {Number(v.yapePlin || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-blue-300 font-medium">S/ {Number(v.deliveryApps || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-black text-white text-sm">S/ {Number(v.totalVenta).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400">S/ {Number(v.ventaDeclaradaFactura || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400">S/ {Number(v.ventaDeclaradaBoleta || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">{v.observaciones || '-'}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: REPORTES & EXPORTACIÓN EXCEL                      */}
        {/* ======================================================== */}
        {activeTab === 'REPORTES' && (
          <div className="max-w-3xl mx-auto space-y-6">
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">Generar Reporte Excel (.xlsx)</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Exporta un libro de Excel completo con el formato idéntico al control manual: Caja Chica, Facturas por pagar a proveedores, Registro de ventas y Resumen fiscal para el socio.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs flex flex-wrap justify-center gap-4 text-left">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fecha Desde:</label>
                  <input
                    type="date"
                    value={fechaInicioReporte}
                    onChange={(e) => setFechaInicioReporte(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fecha Hasta:</label>
                  <input
                    type="date"
                    value={fechaFinReporte}
                    onChange={(e) => setFechaFinReporte(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => exportarReporteCompletoExcel(
                    cajaChica.filter(c => c.fecha >= fechaInicioReporte && c.fecha <= fechaFinReporte),
                    proveedores.filter(p => p.fecha >= fechaInicioReporte && p.fecha <= fechaFinReporte),
                    ventas.filter(v => v.fecha >= fechaInicioReporte && v.fecha <= fechaFinReporte),
                    resumenFiscal,
                    proyeccion,
                    `Reporte_PUNHSHI_SAC_${fechaInicioReporte}_al_${fechaFinReporte}.xlsx`
                  )}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte Excel Completo (.xlsx)
                </button>
              </div>
            </div>

            {/* Quick Demo Data Reset Option */}
            <div className="text-center">
              <button
                onClick={handleResetDemo}
                className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1.5 mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer datos originales del Excel de PUNHSHI S.A.C.
              </button>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs py-4 text-center">
        <p>Sistema Financiero, Fiscal y Caja Chica • Exclusivo para <strong>PUNHSHI S.A.C.</strong> (RUC 20610207112)</p>
      </footer>

      {/* MODALS */}
      <OCRScannerModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
        onSaveCajaChica={handleSaveCajaChica}
        onSaveProveedor={handleSaveProveedor}
      />

      <VentaDiariaModal
        isOpen={isVentaModalOpen}
        onClose={() => setIsVentaModalOpen(false)}
        onSaveVenta={handleSaveVenta}
      />

      <AsignacionFondoModal
        isOpen={isFondoModalOpen}
        onClose={() => setIsFondoModalOpen(false)}
        onSaveFondo={handleSaveFondo}
      />

    </div>
  );
}
