'use client';

import React, { useState } from 'react';
import { CheckCircle2, X, Calendar, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { VentaDiaria } from '@/types';
import { getConfiguracion } from '@/lib/storage';

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
  const cfg = getConfiguracion();
  const [fecha, setFecha] = useState<string>(initialDate || new Date().toISOString().slice(0, 10));
  const [tarjeta, setTarjeta] = useState<number | ''>('');
  const [efectivo, setEfectivo] = useState<number | ''>('');
  const [yapePlin, setYapePlin] = useState<number | ''>('');
  const [rappi, setRappi] = useState<number | ''>('');
  const [pedidosYa, setPedidosYa] = useState<number | ''>('');
  const [didi, setDidi] = useState<number | ''>('');
  const [ventaDeclaradaFactura, setVentaDeclaradaFactura] = useState<number | ''>('');
  const [ventaDeclaradaBoleta, setVentaDeclaradaBoleta] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState<string>('');

  if (!isOpen) return null;

  const tarjetaNum = Number(tarjeta) || 0;
  const efectivoNum = Number(efectivo) || 0;
  const yapePlinNum = Number(yapePlin) || 0;
  const rappiNum = Number(rappi) || 0;
  const pedidosYaNum = Number(pedidosYa) || 0;
  const didiNum = Number(didi) || 0;

  const deliveryTotal = rappiNum + pedidosYaNum + didiNum;
  const totalVentaBruta = tarjetaNum + efectivoNum + yapePlinNum + deliveryTotal;

  // Cálculo en tiempo real de comisiones descontadas según porcentajes configurados
  const comisionPos = tarjetaNum * (cfg.comisionPOS / 100);
  const comisionRappi = rappiNum * (cfg.comisionRappi / 100);
  const comisionPedidos = pedidosYaNum * (cfg.comisionPedidosYa / 100);
  const comisionDidi = didiNum * (cfg.comisionDidi / 100);
  const totalComisiones = comisionPos + comisionRappi + comisionPedidos + comisionDidi;
  const totalVentaLiquida = totalVentaBruta - totalComisiones;

  const handleAutoFillDeclaradas = (ratioFacturas: number = 0.35) => {
    if (totalVentaBruta > 0) {
      const fact = parseFloat((totalVentaBruta * ratioFacturas).toFixed(2));
      const bol = parseFloat((totalVentaBruta - fact).toFixed(2));
      setVentaDeclaradaFactura(fact);
      setVentaDeclaradaBoleta(bol);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalVentaBruta <= 0) {
      alert('Ingresa al menos un monto de venta.');
      return;
    }

    onSaveVenta({
      fecha,
      tarjeta: tarjetaNum,
      efectivo: efectivoNum,
      yapePlin: yapePlinNum,
      rappi: rappiNum,
      pedidosYa: pedidosYaNum,
      didi: didiNum,
      deliveryApps: deliveryTotal,
      totalComisionesDescontadas: totalComisiones,
      totalVentaLiquida,
      ventaDeclaradaFactura: Number(ventaDeclaradaFactura) || (totalVentaBruta * 0.35),
      ventaDeclaradaBoleta: Number(ventaDeclaradaBoleta) || (totalVentaBruta * 0.65),
      observaciones
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registro de Ventas Diarias</h2>
              <p className="text-xs text-slate-400">PUNHSHI S.A.C. (Cálculo con Descuento de Comisiones)</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          
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

          {/* Desglose Canales en Tienda */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Canales en Salón / Tienda Físico
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" /> POS Tarjeta
                  <span className="text-[10px] text-slate-500">(-{cfg.comisionPOS}%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tarjeta}
                  onChange={(e) => setTarjeta(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Efectivo
                  <span className="text-[10px] text-emerald-500">(0%)</span>
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
                  <span className="text-[10px] text-purple-400">(0%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={yapePlin}
                  onChange={(e) => setYapePlin(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Desglose Canales Delivery */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Canales de Aplicativos Delivery (Con Comisiones Descontadas)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  🛵 Rappi
                  <span className="text-[10px] text-rose-400 ml-1">(-{cfg.comisionRappi}%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={rappi}
                  onChange={(e) => setRappi(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  🛵 PedidosYa
                  <span className="text-[10px] text-rose-400 ml-1">(-{cfg.comisionPedidosYa}%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pedidosYa}
                  onChange={(e) => setPedidosYa(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  🛵 DiDi Food
                  <span className="text-[10px] text-rose-400 ml-1">(-{cfg.comisionDidi}%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={didi}
                  onChange={(e) => setDidi(parseFloat(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Resumen Financiero en Vivo del Día */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Venta Bruta Total:</span>
              <span className="font-bold text-slate-200">S/ {totalVentaBruta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-400">
              <span>(-) Comisiones Descontadas (POS y Apps):</span>
              <span className="font-semibold">- S/ {totalComisiones.toFixed(2)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center">
              <span className="font-bold text-emerald-400">(=) Venta Neta Líquida Real:</span>
              <span className="text-base font-black text-emerald-400">S/ {totalVentaLiquida.toFixed(2)}</span>
            </div>
          </div>

          {/* Declaración Fiscal SUNAT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Ventas Declaradas (Para Balance Fiscal SUNAT - {cfg.tasaIGV}% IGV)
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
