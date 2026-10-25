'use client';

import React, { useState } from 'react';
import { Wallet, CheckCircle2, X, Calendar, CreditCard, Banknote } from 'lucide-react';
import { AsignacionFondoCaja } from '@/types';

interface AsignacionFondoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFondo: (item: Omit<AsignacionFondoCaja, 'id' | 'totalAsignado'>) => void;
}

export default function AsignacionFondoModal({
  isOpen,
  onClose,
  onSaveFondo
}: AsignacionFondoModalProps) {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [tarjeta, setTarjeta] = useState<number | ''>('');
  const [efectivo, setEfectivo] = useState<number | ''>(1000);
  const [motivo, setMotivo] = useState<string>('Reposición de Fondo de Caja Chica');
  const [responsable, setResponsable] = useState<string>('Administrador de Tienda PUNHSHI');

  if (!isOpen) return null;

  const totalAsignado = (Number(tarjeta) || 0) + (Number(efectivo) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAsignado <= 0) {
      alert('Por favor ingresa un monto asignado válido.');
      return;
    }

    onSaveFondo({
      fecha,
      tarjeta: Number(tarjeta) || 0,
      efectivo: Number(efectivo) || 0,
      motivo,
      responsable
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Asignar Fondo a Caja Chica</h2>
              <p className="text-xs text-slate-400">PUNHSHI S.A.C. (Doble Validación / Cuadre)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" /> Fecha de Entrega / Asignación
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Monto Asignado para Gastos Menores
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Efectivo (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={efectivo}
                  onChange={(e) => setEfectivo(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Tarjeta / Transf (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tarjeta}
                  onChange={(e) => setTarjeta(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300">Total Fondo Entregado:</span>
              <span className="text-base font-extrabold text-amber-400">
                S/ {totalAsignado.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Motivo / Concepto</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Reposición semanal de caja chica"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Responsable Receptor</label>
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Ej: Administrador Freddy"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Registrar Asignación
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
