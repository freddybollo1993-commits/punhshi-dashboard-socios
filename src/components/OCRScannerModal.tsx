/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { parseReceiptText, OCRParsedResult } from '@/lib/ocrParser';
import { MovimientoCajaChica, FacturaProveedor, TipoComprobanteCaja, MedioPagoGasto } from '@/types';
import { getCategoriasGastos, getMaestroProveedores } from '@/lib/storage';

interface OCRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCajaChica: (item: Omit<MovimientoCajaChica, 'id' | 'numero'>) => void;
  onSaveProveedor: (item: Omit<FacturaProveedor, 'id' | 'numero'>) => void;
}

export default function OCRScannerModal({
  isOpen,
  onClose,
  onSaveCajaChica,
  onSaveProveedor
}: OCRScannerModalProps) {
  const [destino, setDestino] = useState<'CAJA_CHICA' | 'PROVEEDOR'>('CAJA_CHICA');
  const [modoManual, setModoManual] = useState<boolean>(false);
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [procesandoOCR, setProcesandoOCR] = useState<boolean>(false);
  const [progresoOCR, setProgresoOCR] = useState<string>('');
  
  // Form fields
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobanteCaja>('FACTURA');
  const [numeroComprobante, setNumeroComprobante] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [proveedor, setProveedor] = useState<string>('');
  const [ruc, setRuc] = useState<string>('');
  const [importeTotal, setImporteTotal] = useState<number | ''>('');
  const [baseImponible, setBaseImponible] = useState<number | ''>('');
  const [montoIGV, setMontoIGV] = useState<number | ''>('');
  const [tasaIGV, setTasaIGV] = useState<number>(18); // 18%, 10.5% o 0%
  const [esDeducibleIGV, setEsDeducibleIGV] = useState<boolean>(true);
  const [medioPago, setMedioPago] = useState<MedioPagoGasto>('TRANSFERENCIA');
  const [sujetoADetraccion, setSujetoADetraccion] = useState<boolean>(false);
  const [montoDetraccion, setMontoDetraccion] = useState<number | ''>('');
  const [detalleGasto, setDetalleGasto] = useState<string>('');
  const [tipoGasto, setTipoGasto] = useState<string>('Insumos de cocina (verduras, condimentos palta)');
  const [observaciones, setObservaciones] = useState<string>('');
  const [confianza, setConfianza] = useState<number>(0);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  
  // Proveedor extra fields
  const [banco, setBanco] = useState<string>('BCP');
  const [estatusPago, setEstatusPago] = useState<'PENDIENTE' | 'PAGADO'>('PENDIENTE');
  const [operacionPago, setOperacionPago] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categorias = getCategoriasGastos();
  const proveedoresMaestros = getMaestroProveedores();

  if (!isOpen) return null;

  // Función para recalcular Base Imponible e IGV según tasa
  const recalcularBaseYIGV = (total: number, tasa: number) => {
    if (total <= 0) {
      setBaseImponible('');
      setMontoIGV('');
      return;
    }
    if (tasa <= 0) {
      setBaseImponible(total);
      setMontoIGV(0);
      return;
    }
    const factor = 1 + tasa / 100;
    const base = parseFloat((total / factor).toFixed(2));
    const igv = parseFloat((total - base).toFixed(2));
    setBaseImponible(base);
    setMontoIGV(igv);
  };

  // Actualizar cálculos cuando el usuario modifica el Importe Total
  const handleTotalChange = (val: number) => {
    setImporteTotal(val);
    recalcularBaseYIGV(val, tasaIGV);
  };

  // Cambio de tasa de IGV (18%, 10.5% o 0%)
  const handleTasaChange = (nuevaTasa: number) => {
    setTasaIGV(nuevaTasa);
    const totalNum = typeof importeTotal === 'number' ? importeTotal : parseFloat(String(importeTotal)) || 0;
    recalcularBaseYIGV(totalNum, nuevaTasa);
  };

  // Edición manual de Base Imponible (auto-calcula IGV = Total - Base)
  const handleBaseChange = (baseVal: number) => {
    setBaseImponible(baseVal);
    const totalNum = typeof importeTotal === 'number' ? importeTotal : parseFloat(String(importeTotal)) || 0;
    if (totalNum > 0) {
      const nuevoIGV = parseFloat(Math.max(0, totalNum - baseVal).toFixed(2));
      setMontoIGV(nuevoIGV);
    }
  };

  // Edición manual de IGV (auto-calcula Base = Total - IGV)
  const handleIGVChange = (igvVal: number) => {
    setMontoIGV(igvVal);
    const totalNum = typeof importeTotal === 'number' ? importeTotal : parseFloat(String(importeTotal)) || 0;
    if (totalNum > 0) {
      const nuevaBase = parseFloat(Math.max(0, totalNum - igvVal).toFixed(2));
      setBaseImponible(nuevaBase);
    }
  };

  // Cambio de tipo de comprobante
  const handleTipoComprobanteChange = (tipo: TipoComprobanteCaja) => {
    setTipoComprobante(tipo);
    const deducible = tipo === 'FACTURA';
    setEsDeducibleIGV(deducible);
    const totalNum = typeof importeTotal === 'number' ? importeTotal : parseFloat(String(importeTotal)) || 0;
    if (totalNum > 0 && tasaIGV > 0) {
      recalcularBaseYIGV(totalNum, tasaIGV);
    }
  };

  // Cambio de destino (Caja Chica vs Proveedor)
  const handleDestinoChange = (nuevoDestino: 'CAJA_CHICA' | 'PROVEEDOR') => {
    setDestino(nuevoDestino);
    if (nuevoDestino === 'PROVEEDOR') {
      setTipoComprobante('FACTURA');
      setEsDeducibleIGV(true);
      const totalNum = typeof importeTotal === 'number' ? importeTotal : parseFloat(String(importeTotal)) || 0;
      if (totalNum > 0) {
        recalcularBaseYIGV(totalNum, tasaIGV > 0 ? tasaIGV : 18);
      }
    }
  };

  // Pre-procesamiento de imagen en Canvas (Escala, escala de grises y realce de contraste)
  const preprocessImage = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      try {
        const img = new window.Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const d = imgData.data;

          // Calcular brillo promedio
          let totalBrightness = 0;
          for (let i = 0; i < d.length; i += 4) {
            totalBrightness += (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
          }
          const avg = totalBrightness / (d.length / 4);

          // Realzar contraste para impresoras térmicas
          const contrast = 1.30;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

          for (let i = 0; i < d.length; i += 4) {
            let g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            g = factor * (g - 128) + 128;
            if (g < avg * 0.88) {
              g = Math.max(0, g - 35); // Oscurecer texto impreso
            } else if (g > avg * 1.05) {
              g = Math.min(255, g + 30); // Blanquear fondo del papel térmico
            }
            d[i] = g;
            d[i + 1] = g;
            d[i + 2] = g;
          }

          ctx.putImageData(imgData, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.92);
        };

        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          resolve(file);
        };
        img.src = objUrl;
      } catch {
        resolve(file);
      }
    });
  };

  // Procesar imagen con Tesseract.js
  const handleImageSelected = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImagenUrl(url);
    setProcesandoOCR(true);
    setProgresoOCR('Optimizando nitidez y contraste del comprobante...');

    try {
      // 1. Preprocesar en canvas para optimizar detección en papel térmico
      const processedBlob = await preprocessImage(file);

      setProgresoOCR('Cargando motor de reconocimiento OCR...');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa', 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status === 'loading tesseract core') {
            setProgresoOCR('Iniciando motor de visión...');
          } else if (m.status === 'loading language traineddata') {
            const pct = Math.round((m.progress || 0) * 100);
            setProgresoOCR(`Cargando modelo de reconocimiento (${pct}%)...`);
          } else if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setProgresoOCR(`Analizando datos del comprobante (${pct}%)...`);
          }
        }
      });
      setProgresoOCR('Extrayendo serie, correlativo e importes...');
      const ret = await worker.recognize(processedBlob);
      await worker.terminate();

      const parsed: OCRParsedResult = parseReceiptText(ret.data.text);

      const esProveedor = destino === 'PROVEEDOR';
      const tipoDocFinal = esProveedor ? 'FACTURA' : parsed.tipoComprobante;
      const esDeducibleFinal = esProveedor ? true : parsed.esDeducibleIGV;

      setTipoComprobante(tipoDocFinal);
      setNumeroComprobante(parsed.numeroComprobante);
      setFecha(parsed.fechaEmision);
      setRuc(parsed.rucEmisor);
      setProveedor(parsed.razonSocialEmisor);
      setDetalleGasto(parsed.detalleSugerido);
      setTipoGasto(parsed.tipoGastoSugerido);
      setEsDeducibleIGV(esDeducibleFinal);
      setConfianza(parsed.confianza);
      setAdvertencias(parsed.advertencias);

      if (parsed.importeTotal > 0) {
        setImporteTotal(parsed.importeTotal);
        setBaseImponible(parsed.baseImponible);
        setMontoIGV(parsed.montoIGV);
        setTasaIGV(18);
      }
    } catch (err) {
      console.error('Error OCR:', err);
      setAdvertencias(['No se pudo completar el OCR automático. Puedes ingresar los datos manualmente.']);
      setModoManual(true);
    } finally {
      setProcesandoOCR(false);
      setProgresoOCR('');
    }
  };

  // Guardar según destino
  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const totalNum = Number(importeTotal) || 0;
    if (totalNum <= 0) {
      alert('Por favor ingresa un importe total válido.');
      return;
    }

    const esBancarizado = medioPago !== 'EFECTIVO';
    const alertaBancarizacion = totalNum >= 2000 && !esBancarizado;

    if (destino === 'CAJA_CHICA') {
      onSaveCajaChica({
        fecha,
        importePagado: totalNum,
        tipoComprobante,
        numeroComprobante: numeroComprobante || 'S/N',
        envioDocumento: 'PENDIENTE',
        proveedor: proveedor || 'PROVEEDOR VARIOS',
        detalleGasto: detalleGasto || 'Gasto operativo de tienda',
        tipoGasto,
        observaciones: observaciones || (confianza > 0 ? `Validado vía OCR (${confianza}%)` : 'Registro Manual'),
        esDeducibleIGV: alertaBancarizacion ? false : esDeducibleIGV,
        esDeducibleRenta: !alertaBancarizacion && (tipoComprobante === 'FACTURA' || tipoComprobante === 'BOLETA' || tipoComprobante === 'RECIBO POR HONORARIOS' || tipoComprobante === 'SERVICIOS PUBLICOS'),
        baseImponible: Number(baseImponible) || (esDeducibleIGV ? totalNum / 1.18 : totalNum),
        montoIGV: Number(montoIGV) || (esDeducibleIGV ? totalNum - (totalNum / 1.18) : 0),
        tasaIGVAplicada: tasaIGV,
        medioPago,
        alertaBancarizacion,
        fotoUrl: imagenUrl || undefined,
        estadoValidacion: 'VALIDADO',
        origenOCR: Boolean(imagenUrl && !modoManual)
      });
    } else {
      onSaveProveedor({
        fecha,
        tipoDocumento: tipoComprobante,
        numeroDocumento: numeroComprobante || 'F001-0000000',
        envioDocumentos: 'PENDIENTE',
        ruc: ruc || '20000000000',
        razonSocial: proveedor || 'PROVEEDOR DIVERSO',
        conceptoGasto: detalleGasto || 'Compra de mercadería / insumos',
        tipoGastos: tipoGasto,
        moneda: 'PEN',
        valorVenta: Number(baseImponible) || (totalNum / 1.18),
        igv: Number(montoIGV) || (totalNum - (totalNum / 1.18)),
        tasaIGVAplicada: tasaIGV,
        exonerado: 0,
        otros: 0,
        total: totalNum,
        estatusPago,
        banco,
        medioPago,
        operacionPago: operacionPago || undefined,
        alertaBancarizacion,
        sujetoADetraccion,
        montoDetraccion: Number(montoDetraccion) || 0,
        fotoUrl: imagenUrl || undefined
      });
    }

    onClose();
  };

  const isMathValid = esDeducibleIGV && importeTotal && baseImponible && montoIGV 
    ? Math.abs(Number(baseImponible) + Number(montoIGV) - Number(importeTotal)) < 0.05
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Registro de Comprobante con Validación OCR
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PUNHSHI S.A.C.
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sube la foto de la factura/ticket o digítalo manualmente. El sistema verifica el IGV y crédito fiscal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Destino Selector & Modos */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destino:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => handleDestinoChange('CAJA_CHICA')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  destino === 'CAJA_CHICA' 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Caja Chica (Gastos Diarios)
              </button>
              <button
                type="button"
                onClick={() => handleDestinoChange('PROVEEDOR')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  destino === 'PROVEEDOR' 
                    ? 'bg-emerald-500 text-slate-950 shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Factura Proveedor (Cuentas por Pagar)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setModoManual(!modoManual);
              if (!modoManual) setImagenUrl(null);
            }}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
          >
            {modoManual ? '← Volver a Reconocimiento por Foto' : '✍️ Ingresar Directamente en Modo Manual (Sin Foto)'}
          </button>
        </div>

        {/* Content Body: Two Columns (Photo Preview + Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-y-auto flex-1">
          
          {/* Left Column: Image / OCR Upload */}
          {!modoManual ? (
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[260px] bg-slate-950/40 relative overflow-hidden group">
                {imagenUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img 
                      src={imagenUrl} 
                      alt="Comprobante Capturado" 
                      className="max-h-72 object-contain rounded-lg shadow-md"
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 bg-slate-900/90 text-slate-300 hover:text-white rounded-md text-xs flex items-center gap-1 shadow border border-slate-700"
                        title="Cambiar foto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 group-hover:scale-105 transition">
                      <Camera className="w-7 h-7 text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mb-1">
                      Captura o Sube la Factura / Recibo
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mb-4">
                      Toma una foto clara del comprobante físico o sube la imagen desde tu galería/archivos.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-2 shadow"
                      >
                        <Camera className="w-4 h-4" /> Tomar Foto con Cámara
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-2 border border-slate-700 shadow"
                      >
                        <Upload className="w-4 h-4" /> Subir Archivo
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden Inputs */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelected(file);
                  }}
                />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelected(file);
                  }}
                />
              </div>

              {/* Progress or Status */}
              {procesandoOCR && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-300 text-xs animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{progresoOCR}</span>
                </div>
              )}

              {confianza > 0 && !procesandoOCR && (
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Confianza del Reconocimiento:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    confianza >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {confianza}%
                  </span>
                </div>
              )}

              {advertencias.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300 space-y-1">
                  {advertencias.map((adv, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Right Column: Interactive Form & Validation Check */}
          <form 
            onSubmit={handleGuardar} 
            className={`${modoManual ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col gap-4`}
          >
            {/* Alerta de Bancarización en tiempo real */}
            {Number(importeTotal || 0) >= 2000 && medioPago === 'EFECTIVO' && (
              <div className="p-3 rounded-xl border border-rose-600/80 bg-rose-950/70 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block font-bold text-rose-300">⚠️ Riesgo de Reparo SUNAT: Candado de Bancarización (Ley 28194)</strong>
                  <span className="text-[11px] text-rose-300/90">
                    Compras iguales o mayores a S/ 2,000 pagadas en efectivo pierden el Crédito Fiscal de IGV y SUNAT las considera No Deducibles de Renta. Selecciona Transferencia o Tarjeta para proteger el gasto.
                  </span>
                </div>
              </div>
            )}

            {/* Live Arithmetic & Fiscal Check Banner */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
              isMathValid && esDeducibleIGV
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : !esDeducibleIGV
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}>
              {isMathValid && esDeducibleIGV ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="font-semibold block">✓ Validación Fiscal Aprobada: Factura con Crédito de IGV</strong>
                    <span className="text-[11px] text-emerald-400/80">
                      Base (S/ {Number(baseImponible || 0).toFixed(2)}) + IGV (S/ {Number(montoIGV || 0).toFixed(2)}) = Total (S/ {Number(importeTotal || 0).toFixed(2)})
                    </span>
                  </div>
                </>
              ) : !esDeducibleIGV ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <strong className="font-semibold block">Documento de Caja Chica / Control Interno</strong>
                    <span className="text-[11px] text-blue-300/80">
                      {tipoComprobante} sin crédito fiscal. Registra salida real de caja sin deducir IGV en SUNAT.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="font-semibold block">⚠️ Alerta Matemática de IGV</strong>
                    <span className="text-[11px] text-rose-300/80">
                      La suma de Base + IGV no coincide con el total. Verifica los campos.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Tipo de Comprobante */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Comprobante</label>
                <select
                  value={tipoComprobante}
                  onChange={(e) => handleTipoComprobanteChange(e.target.value as TipoComprobanteCaja)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none text-xs"
                >
                  <option value="FACTURA">FACTURA (Crédito IGV + Deducible Renta)</option>
                  <option value="SERVICIOS PUBLICOS">RECIBO SERV. PÚBLICOS (Luz/Agua con IGV)</option>
                  <option value="BOLETA">BOLETA (Nuevo RUS - Deducible Renta tope 6%)</option>
                  <option value="RECIBO POR HONORARIOS">RECIBO POR HONORARIOS (RHE 4ta Cat - Deducible Renta)</option>
                  <option value="LIQUIDACION DE COMPRA">LIQUIDACIÓN DE COMPRA (Acopiador - Deducible Renta)</option>
                  <option value="FORMULARIO 1683">FORMULARIO 1683 (Alquiler Natural - Deducible Renta)</option>
                  <option value="NOTA DE VENTA">NOTA DE VENTA (No Deducible / Control Interno)</option>
                  <option value="GUIA">GUÍA / S/N (Movilidad/Mercado No Deducible)</option>
                  <option value="RECIBO">RECIBO SIMPLE (Gasto No Deducible)</option>
                </select>
              </div>

              {/* Medio de Pago & Bancarización */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medio de Pago</label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value as MedioPagoGasto)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none text-xs"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria (Bancarizado OK)</option>
                  <option value="TARJETA">Tarjeta Corporativa (Bancarizado OK)</option>
                  <option value="YAPE_PLIN">Yape / Plin Empresarial (Bancarizado OK)</option>
                  <option value="CHEQUE">Cheque de Gerencia (Bancarizado OK)</option>
                  <option value="EFECTIVO">Efectivo en Caja</option>
                </select>
              </div>

              {/* N° Comprobante */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">N° Comprobante / Serie</label>
                <input
                  type="text"
                  placeholder="Ej: FW01-00000579 o N°003105"
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha de Emisión</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Proveedor / Beneficiario */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Proveedor / Beneficiario</label>
                <input
                  type="text"
                  list="proveedores-list"
                  placeholder="Ej: BODEGA RIVERA, BAMBU, INDRIVE"
                  value={proveedor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProveedor(val);
                    // Autocompletar categoría si coincide con el catálogo
                    const match = proveedoresMaestros.find(p => p.razonSocial.toLowerCase() === val.toLowerCase());
                    if (match) {
                      setTipoGasto(match.tipoGastoDefault);
                      if (match.ruc) setRuc(match.ruc);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <datalist id="proveedores-list">
                  {proveedoresMaestros.map((p, idx) => (
                    <option key={idx} value={p.razonSocial}>
                      {p.ruc ? `RUC: ${p.ruc}` : ''}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* RUC (Si es Factura o Proveedor) */}
              {(esDeducibleIGV || destino === 'PROVEEDOR') && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">RUC del Proveedor</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="20603138831"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                  />
                </div>
              )}

              {/* Categoría / Tipo de Gasto */}
              <div className={(esDeducibleIGV || destino === 'PROVEEDOR') ? '' : 'sm:col-span-2'}>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Gasto (Categoría)</label>
                <select
                  value={tipoGasto}
                  onChange={(e) => setTipoGasto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  {categorias.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Importes: Total, Base, IGV con Selector de Tasa y Desglose Activo */}
              <div className="sm:col-span-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
                
                {/* Selector rápido de Tasa de IGV */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tasa de IGV aplicada:
                  </span>
                  <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700/80 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTasaChange(18)}
                      className={`px-2.5 py-1 rounded-md transition font-semibold ${
                        tasaIGV === 18
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      18% General
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTasaChange(10.5)}
                      className={`px-2.5 py-1 rounded-md transition font-semibold ${
                        tasaIGV === 10.5
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      10.5% Turismo/Rest.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTasaChange(0)}
                      className={`px-2.5 py-1 rounded-md transition font-semibold ${
                        tasaIGV === 0
                          ? 'bg-slate-700 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      0% Exonerado
                    </button>
                  </div>
                </div>

                {/* Grid de 3 campos: Total, Base, IGV (100% editables) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                      Importe Total (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={importeTotal}
                      onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-2 text-amber-300 font-bold text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                      Valor Venta / Base (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={baseImponible}
                      onChange={(e) => handleBaseChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                      Crédito IGV ({tasaIGV}%) (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={montoIGV}
                      onChange={(e) => handleIGVChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-emerald-500/40 rounded-lg p-2 text-emerald-400 font-bold text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Checkbox deducible de IGV */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-800/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={esDeducibleIGV}
                      onChange={(e) => setEsDeducibleIGV(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${esDeducibleIGV ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {esDeducibleIGV
                        ? '✓ Comprobante con Crédito Fiscal (Deduce pago de IGV ante SUNAT)'
                        : 'Control Interno / Gasto Real (Sin Crédito Fiscal SUNAT)'}
                    </span>
                  </label>
                </div>

              </div>

              {/* Detalle del Gasto */}
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Detalle o Concepto del Gasto</label>
                <input
                  type="text"
                  placeholder="Ej: PALTA, FIDEO CON CHORIZO Y QUESO, MOVILIDAD EXTRA"
                  value={detalleGasto}
                  onChange={(e) => setDetalleGasto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              {/* Campos específicos si es Proveedor CxP */}
              {destino === 'PROVEEDOR' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Estatus de Pago</label>
                    <select
                      value={estatusPago}
                      onChange={(e) => setEstatusPago(e.target.value as 'PENDIENTE' | 'PAGADO')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      <option value="PENDIENTE">PENDIENTE DE PAGO</option>
                      <option value="PAGADO">PAGADO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Banco</label>
                    <select
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      <option value="BCP">BCP (Banco de Crédito)</option>
                      <option value="BBVA">BBVA</option>
                      <option value="INTERBANK">INTERBANK</option>
                      <option value="SCOTIABANK">SCOTIABANK</option>
                      <option value="EFECTIVO">EFECTIVO</option>
                    </select>
                  </div>
                  {estatusPago === 'PAGADO' && (
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">N° Operación Bancaria</label>
                      <input
                        type="text"
                        placeholder="Ej: OP-9481230"
                        value={operacionPago}
                        onChange={(e) => setOperacionPago(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Detracción SPOT (Servicios >= S/ 700) */}
                  <div className="sm:col-span-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sujetoADetraccion}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSujetoADetraccion(checked);
                          if (checked && !montoDetraccion && importeTotal) {
                            setMontoDetraccion(Number((Number(importeTotal) * 0.10).toFixed(2)));
                          }
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-300">
                        Sujeto a Detracción SPOT Banco de la Nación (Servicios $\ge$ S/ 700)
                      </span>
                    </label>
                    {sujetoADetraccion && (
                      <div className="flex items-center gap-2 mt-1">
                        <label className="text-[11px] text-slate-400 font-semibold">Monto Detracción (S/):</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={montoDetraccion}
                          onChange={(e) => setMontoDetraccion(parseFloat(e.target.value) || '')}
                          className="w-32 bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        <span className="text-[11px] text-slate-500">(Normalmente 10% o 12% a depositar en cuenta BN)</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Observaciones */}
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Observaciones / Comentarios</label>
                <input
                  type="text"
                  placeholder="Comentarios adicionales"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Validar y Guardar Registro
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
