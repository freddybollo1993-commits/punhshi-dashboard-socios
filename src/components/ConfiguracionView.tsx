'use client';

import React, { useState } from 'react';
import { 
  Percent, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Building, 
  AlertCircle
} from 'lucide-react';

import { 
  ConfiguracionFinanciera, 
  GastoEstructural, 
  TipoGastoEstructural, 
  FrecuenciaGastoEstructural 
} from '@/types';

import { 
  saveConfiguracion, 
  addGastoEstructural, 
  deleteGastoEstructural, 
  toggleGastoEstructural
} from '@/lib/storage';

interface ConfiguracionViewProps {
  config: ConfiguracionFinanciera;
  gastosEstructurales: GastoEstructural[];
  onConfigUpdated: (newConfig: ConfiguracionFinanciera) => void;
  onGastosUpdated: (gastos: GastoEstructural[]) => void;
  onLimpiarDatos: () => void;
}

export default function ConfiguracionView({
  config,
  gastosEstructurales,
  onConfigUpdated,
  onGastosUpdated,
  onLimpiarDatos
}: ConfiguracionViewProps) {
  // Config form state
  const [tasaIGV, setTasaIGV] = useState(config.tasaIGV || 10.5);
  const [tasaIGVCompras, setTasaIGVCompras] = useState(config.tasaIGVCompras || 18.0);
  const [comisionPOS, setComisionPOS] = useState(config.comisionPOS);
  const [comisionRappi, setComisionRappi] = useState(config.comisionRappi);
  const [comisionPedidosYa, setComisionPedidosYa] = useState(config.comisionPedidosYa);
  const [comisionDidi, setComisionDidi] = useState(config.comisionDidi);
  const [tasaPagoCuentaRenta, setTasaPagoCuentaRenta] = useState(config.tasaPagoCuentaRenta || 1.0);
  const [uitVigente, setUitVigente] = useState(config.uitVigente || 5350);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // New Gasto Estructural form state
  const [nombreGasto, setNombreGasto] = useState('');
  const [categoriaGasto, setCategoriaGasto] = useState('Alquiler de local');
  const [tipoGasto, setTipoGasto] = useState<TipoGastoEstructural>('FIJO');
  const [frecuenciaGasto, setFrecuenciaGasto] = useState<FrecuenciaGastoEstructural>('MENSUAL');
  const [montoGasto, setMontoGasto] = useState<number | ''>('');
  const [diaVencimiento, setDiaVencimiento] = useState<number | ''>(5);
  const [esDeducibleIGV, setEsDeducibleIGV] = useState(true);
  const [observacionesGasto, setObservacionesGasto] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConfiguracionFinanciera = {
      tasaIGV: Number(tasaIGV) || 10.5,
      tasaIGVCompras: Number(tasaIGVCompras) || 18.0,
      comisionPOS: Number(comisionPOS) || 0,
      comisionRappi: Number(comisionRappi) || 0,
      comisionPedidosYa: Number(comisionPedidosYa) || 0,
      comisionDidi: Number(comisionDidi) || 0,
      tasaPagoCuentaRenta: Number(tasaPagoCuentaRenta) || 1.0,
      uitVigente: Number(uitVigente) || 5350
    };
    saveConfiguracion(updated);
    onConfigUpdated(updated);
    setMensajeGuardado(true);
    setTimeout(() => setMensajeGuardado(false), 3000);
  };

  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreGasto.trim() || !montoGasto || Number(montoGasto) <= 0) {
      alert('Ingresa un nombre y monto válido para el gasto.');
      return;
    }

    addGastoEstructural({
      nombre: nombreGasto.trim(),
      categoria: categoriaGasto,
      tipo: tipoGasto,
      frecuencia: frecuenciaGasto,
      monto: Number(montoGasto),
      diaVencimiento: Number(diaVencimiento) || 1,
      esDeducibleIGV,
      activo: true,
      observaciones: observacionesGasto.trim() || undefined
    });

    // Reset form
    setNombreGasto('');
    setMontoGasto('');
    setObservacionesGasto('');
    onGastosUpdated(JSON.parse(localStorage.getItem('punhshi_gastos_estructurales_v2') || '[]'));
  };

  const handleDeleteGasto = (id: string) => {
    deleteGastoEstructural(id);
    onGastosUpdated(JSON.parse(localStorage.getItem('punhshi_gastos_estructurales_v2') || '[]'));
  };

  const handleToggleActivo = (id: string) => {
    toggleGastoEstructural(id);
    onGastosUpdated(JSON.parse(localStorage.getItem('punhshi_gastos_estructurales_v2') || '[]'));
  };

  // Calcular impacto mensual de gastos estructurales activos
  const totalMensualEstructural = gastosEstructurales
    .filter(g => g.activo)
    .reduce((sum, g) => {
      let m = Number(g.monto || 0);
      if (g.frecuencia === 'QUINCENAL') m *= 2;
      else if (g.frecuencia === 'ANUAL') m /= 12;
      return sum + m;
    }, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* ======================================================== */}
      {/* SECCIÓN 1: TASAS DE IGV Y COMISIONES OPERATIVAS          */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Tasas de Impuestos y Comisiones de Venta
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Valores que se restan de las ventas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Define el porcentaje de IGV para restaurantes (Ley de Turismo) y comisiones de pasarelas/delivery apps.
              </p>
            </div>
          </div>

          {mensajeGuardado && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4" /> ¡Configuración guardada exitosamente!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Tasa IGV Ventas (Restaurante) */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  % IGV Ventas
                </label>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                  Ley 31556: 10.5%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Tasa especial reducida en ventas de alimentos y salón.
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={tasaIGV}
                  onChange={(e) => setTasaIGV(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Tasa IGV Compras Estándar */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-200 font-bold block">
                  % IGV Compras
                </label>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                  General: 18.0%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Tasa estándar que facturan proveedores (bebidas, luz, insumos).
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={tasaIGVCompras}
                  onChange={(e) => setTasaIGVCompras(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Pago a Cuenta Renta */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-200 font-bold block">
                  % Pago a Cuenta Renta
                </label>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                  RMT: 1.0%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Cuota mensual RMT (1.0% ventas &lt; 300 UIT).
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={tasaPagoCuentaRenta}
                  onChange={(e) => setTasaPagoCuentaRenta(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* UIT Vigente */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-200 font-bold block">
                  Valor UIT Vigente
                </label>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                  SUNAT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Para topes de boletas RUS (200 UIT) y tramos RMT (15 UIT).
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  min="1000"
                  max="10000"
                  value={uitVigente}
                  onChange={(e) => setUitVigente(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-10"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">S/</span>
              </div>
            </div>

            {/* Comisión POS */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-slate-200 font-bold block mb-1">
                % Comisión POS (Niubiz / Izipay)
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Descuento automático sobre cobros con tarjeta en tienda.
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={comisionPOS}
                  onChange={(e) => setComisionPOS(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Comisión Rappi */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-slate-200 font-bold block mb-1">
                % Comisión Rappi
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Comisión cobrada por Rappi sobre sus ventas brutas.
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="40"
                  value={comisionRappi}
                  onChange={(e) => setComisionRappi(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Comisión PedidosYa */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-slate-200 font-bold block mb-1">
                % Comisión PedidosYa
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Comisión cobrada por PedidosYa sobre sus pedidos.
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="40"
                  value={comisionPedidosYa}
                  onChange={(e) => setComisionPedidosYa(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Comisión DiDi */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-slate-200 font-bold block mb-1">
                % Comisión DiDi Food
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Comisión cobrada por DiDi Food sobre los despachos.
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="40"
                  value={comisionDidi}
                  onChange={(e) => setComisionDidi(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-extrabold text-sm focus:border-amber-500 outline-none pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar Parámetros Financieros
            </button>
          </div>

        </form>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 2: GASTOS FIJOS Y VARIABLES ESTRUCTURALES       */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Gastos Fijos y Variables (Fuera de Caja Chica Cotidiana)
              </h2>
              <p className="text-xs text-slate-400">
                Compromisos estructurales periódicos: alquiler de local, sueldos administrativos, honorarios contables, cuotas de préstamos, etc.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-purple-950/40 border border-purple-800/40 rounded-xl text-right">
            <span className="text-[11px] text-purple-300 block">Total Compromisos Mensuales:</span>
            <span className="text-base font-black text-purple-200">
              S/ {totalMensualEstructural.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Formulario para agregar nuevo compromiso */}
        <form onSubmit={handleAddGasto} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4 text-xs">
          <span className="font-bold text-slate-300 block uppercase tracking-wider text-[11px]">
            + Registrar Nuevo Gasto Fijo / Variable
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Nombre */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nombre / Concepto</label>
              <input
                type="text"
                placeholder="Ej: Alquiler Local PUNHSHI"
                value={nombreGasto}
                onChange={(e) => setNombreGasto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Categoría</label>
              <select
                value={categoriaGasto}
                onChange={(e) => setCategoriaGasto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-purple-500"
              >
                <option value="Alquiler de local">Alquiler de local</option>
                <option value="Planillas y RRHH">Planillas fijas y RRHH</option>
                <option value="Servicios administrativos">Servicios administrativos / Contabilidad</option>
                <option value="Préstamos bancarios">Préstamos bancarios / Cuotas</option>
                <option value="Servicios públicos mayores">Servicios públicos (Luz / Agua)</option>
                <option value="Marketing y Regalías">Marketing y Regalías</option>
                <option value="Mantenimiento estructural">Mantenimiento estructural</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Naturaleza</label>
              <select
                value={tipoGasto}
                onChange={(e) => setTipoGasto(e.target.value as TipoGastoEstructural)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-purple-500"
              >
                <option value="FIJO">GASTO FIJO (Invariable)</option>
                <option value="VARIABLE">GASTO VARIABLE (Fluctúa)</option>
              </select>
            </div>

            {/* Frecuencia */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Frecuencia</label>
              <select
                value={frecuenciaGasto}
                onChange={(e) => setFrecuenciaGasto(e.target.value as FrecuenciaGastoEstructural)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-purple-500"
              >
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="ANUAL">Anual</option>
                <option value="UNICO">Único / Eventual</option>
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Monto (S/)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoGasto}
                onChange={(e) => setMontoGasto(parseFloat(e.target.value) || '')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-amber-300 font-bold outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Día de Pago */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Día de Pago en el Mes</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Ej: 5"
                value={diaVencimiento}
                onChange={(e) => setDiaVencimiento(parseInt(e.target.value, 10) || '')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-purple-500"
              />
            </div>

            {/* ¿Tiene Factura? */}
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="check-deducible"
                checked={esDeducibleIGV}
                onChange={(e) => setEsDeducibleIGV(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="check-deducible" className="text-slate-300 cursor-pointer font-medium">
                ¿Tiene Factura? (Deduce IGV)
              </label>
            </div>

            {/* Botón Guardar */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Agregar Compromiso
              </button>
            </div>

          </div>
        </form>

        {/* Listado de Gastos Estructurales */}
        <div className="overflow-x-auto">
          {gastosEstructurales.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800">
              <Building className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No hay gastos estructurales registrados</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Registra aquí los compromisos fijos del local (ej. Alquiler, Contabilidad, Planilla fija) para que el socio vea la ganancia neta libre de todo costo.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Concepto</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Naturaleza</th>
                  <th className="py-3 px-3">Frecuencia</th>
                  <th className="py-3 px-3">Día Vence</th>
                  <th className="py-3 px-3 text-right">Monto (S/)</th>
                  <th className="py-3 px-3 text-center">Crédito IGV</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {gastosEstructurales.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{g.nombre}</td>
                    <td className="py-2.5 px-3 text-slate-400">{g.categoria}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        g.tipo === 'FIJO' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {g.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{g.frecuencia}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">Día {g.diaVencimiento || 1}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                      S/ {Number(g.monto).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {g.esDeducibleIGV ? (
                        <span className="text-emerald-400 font-bold">✓ Factura</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleActivo(g.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                          g.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {g.activo ? 'ACTIVO' : 'PAUSADO'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteGasto(g.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Eliminar compromiso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 3: LIMPIEZA DE DATOS Y REINICIO                   */}
      {/* ======================================================== */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <h3 className="font-bold text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Zona de Limpieza y Restablecimiento
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Si deseas reiniciar o dejar todas las tablas completamente en blanco (caja chica, facturas y ventas).
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Estás seguro de que deseas limpiar todas las tablas para iniciar completamente en blanco?')) {
              onLimpiarDatos();
            }
          }}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> Limpiar Todo y Dejar en Blanco
        </button>
      </div>

    </div>
  );
}
