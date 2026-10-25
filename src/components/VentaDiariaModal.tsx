'use client';

import React, { useState } from 'react';
import { CheckCircle2, X, Calendar, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { VentaDiaria } from '@/types';

interface VentaDiariaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVenta: (venta: Omit<VentaDiaria, 'id' | 'totalVenta'>) => void;
  initialDate?: string;
}

export default function VentaDiariaModal({
  isOpen,
  onClose,
  onSaveVenta,
  initialDate
}: VentaDiariaModalProps) {
  const [fecha, setFecha] = useState<string>(initialDate || new Date().toISOString().slice(0, 10));
  const [tarjeta, setTarjeta] = useState<number | ''>('');
  const [efectivo, setEfectivo] = useState<number | ''>('');
  const [yapePlin, setYapePlin] = useState<number | ''>('');
  const [deliveryApps, setDeliveryApps] = useState<number | ''>('');
  const [ventaDeclaradaFactura, setVentaDeclaradaFactura] = useState<number | ''>('');
  const [ventaDeclaradaBoleta, setVentaDeclaradaBoleta] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState<string>('');

  if (!isOpen) return null;

  const totalVenta = (Number(tarjeta) || 0) + (Number(efectivo) || 0) + (Number(yapePlin) || 0) + (Number(deliveryApps) || 0);

  const handleAutoFillDeclaradas = (ratioFacturas: number = 0.35) => {
    if (totalVenta > 0) {
      const fact = parseFloat((totalVenta * ratioFacturas).toFixed(2));
      const bol = parseFloat((totalVenta - fact).toFixed(2));
      setVentaDeclaradaFactura(fact);
      setVentaDeclaradaBoleta(bol);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalVenta <= 0) {
      alert('Ingresa al menos un monto de venta.');
      return;
    }

    onSaveVenta({
      fecha,
      tarjeta: Number(tarjeta) || 0,
      efectivo: Number(efectivo) || 0,
      yapePlin: Number(yapePlin) || 0,
      deliveryApps: Number(deliveryApps) || 0,
      ventaDeclaradaFactura: Number(ventaDeclaradaFactura) || (totalVenta * 0.35),
      ventaDeclaradaBoleta: Number(ventaDeclaradaBoleta) || (totalVenta * 0.65),
      observaciones
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registro de Ventas Diarias</h2>
              <p className="text-xs text-slate-400">PUNHSHI S.A.C. (Cierre de Caja)</p>
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
          
          {/* Fecha */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" /> Fecha de Ventas
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          {/* Desglose Medios de Pago */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Desglose por Medios de Pago (Flujo Real)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Tarjeta (Niubiz / POS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tarjeta}
                  onChange={(e) => setTarjeta(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Efectivo en Caja
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={efectivo}
                  onChange={(e) => setEfectivo(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" /> Yape / Plin
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={yapePlin}
                  onChange={(e) => setYapePlin(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  🛵 Delivery (Rappi/PedidosYa)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={deliveryApps}
                  onChange={(e) => setDeliveryApps(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Total Indicator */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300">Total Venta Diaria:</span>
              <span className="text-base font-extrabold text-emerald-400">
                S/ {totalVenta.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Declaración Fiscal SUNAT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Ventas Declaradas (Para Balance Fiscal SUNAT)
              </label>
              <button
                type="button"
                onClick={() => handleAutoFillDeclaradas(0.35)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                ⚡ Distribuir Automático (35% Fact / 65% Bol)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Emitido con FACTURA</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={ventaDeclaradaFactura}
                  onChange={(e) => setVentaDeclaradaFactura(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Emitido con BOLETA</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={ventaDeclaradaBoleta}
                  onChange={(e) => setVentaDeclaradaBoleta(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Observaciones</label>
            <input
              type="text"
              placeholder="Ej: Feriado, Lluvia, Promoción Sushi Maki, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
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
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Guardar Venta
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
