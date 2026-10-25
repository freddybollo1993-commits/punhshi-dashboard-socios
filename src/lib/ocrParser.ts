export interface OCRParsedResult {
  tipoComprobante: 'FACTURA' | 'BOLETA' | 'GUIA' | 'NOTA DE VENTA' | 'RECIBO' | 'OTRO';
  numeroComprobante: string;
  rucEmisor: string;
  razonSocialEmisor: string;
  fechaEmision: string; // YYYY-MM-DD
  importeTotal: number;
  baseImponible: number;
  montoIGV: number;
  esDeducibleIGV: boolean;
  confianza: number; // 0 - 100
  detalleSugerido: string;
  tipoGastoSugerido: string;
  advertencias: string[];
}

export function parseReceiptText(rawText: string): OCRParsedResult {
  const text = rawText.toUpperCase();
  const advertencias: string[] = [];

  // 1. Detectar RUC (11 dígitos, comienza con 10 o 20)
  const rucMatch = text.match(/\b(10\d{9}|20\d{9})\b/);
  const rucEmisor = rucMatch ? rucMatch[1] : '';

  // 2. Tipo de Comprobante
  let tipoComprobante: OCRParsedResult['tipoComprobante'] = 'FACTURA';
  let esDeducibleIGV = true;

  if (text.includes('FACTURA') || text.includes('FACTURA ELECTR')) {
    tipoComprobante = 'FACTURA';
    esDeducibleIGV = true;
  } else if (text.includes('BOLETA') || text.includes('BOLETA DE VENTA')) {
    tipoComprobante = 'BOLETA';
    esDeducibleIGV = false; // Sin RUC receptor no da crédito fiscal
  } else if (text.includes('GUIA') || text.includes('GUÍA') || text.includes('REMISIÓN')) {
    tipoComprobante = 'GUIA';
    esDeducibleIGV = false;
  } else if (text.includes('NOTA DE VENTA') || text.includes('TICKET NO FISCAL')) {
    tipoComprobante = 'NOTA DE VENTA';
    esDeducibleIGV = false;
  } else if (text.includes('RECIBO')) {
    tipoComprobante = 'RECIBO';
    esDeducibleIGV = false;
  } else {
    // Si tiene serie tipo F001 o FW01 es factura
    if (/[F][A-Z0-9]{3}[-\s]\d+/.test(text)) {
      tipoComprobante = 'FACTURA';
      esDeducibleIGV = true;
    } else {
      tipoComprobante = 'OTRO';
      esDeducibleIGV = false;
    }
  }

  // 3. Número de Comprobante (Serie - Correlativo e.g. FW01-00000579 o F001-12345)
  let numeroComprobante = 'S/N';
  const serieMatch = text.match(/([A-Z0-9]{4}[-\s]\d{4,8})/);
  if (serieMatch) {
    numeroComprobante = serieMatch[1].replace(' ', '-');
  } else {
    const numMatch = text.match(/N[°º\.]?\s*(\d+)/);
    if (numMatch) {
      numeroComprobante = `N°${numMatch[1]}`;
    }
  }

  // 4. Fecha de Emisión (DD/MM/YYYY o YYYY-MM-DD o DD-MM-YYYY)
  let fechaEmision = new Date().toISOString().slice(0, 10);
  const dateMatch = text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/) || text.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      // YYYY-MM-DD
      fechaEmision = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      // DD/MM/YYYY -> YYYY-MM-DD
      fechaEmision = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  // 5. Montos (Total, Base, IGV)
  // Busca patrones como TOTAL 120.50, IMPORTE TOTAL: S/ 45.00, etc.
  const amounts = text.match(/(?:S\/|S\/\.|\$)?\s*([0-9]+[,\.][0-9]{2})/g) || [];
  const parsedNumbers = amounts
    .map(a => parseFloat(a.replace(/[^0-9\.]/g, '').replace(',', '.')))
    .filter(n => !isNaN(n) && n > 0 && n < 100000);

  let importeTotal = 0;
  if (parsedNumbers.length > 0) {
    // Frecuentemente el total es el número más alto en el comprobante
    importeTotal = Math.max(...parsedNumbers);
  }

  let baseImponible = 0;
  let montoIGV = 0;

  if (esDeducibleIGV && importeTotal > 0) {
    baseImponible = parseFloat((importeTotal / 1.18).toFixed(2));
    montoIGV = parseFloat((importeTotal - baseImponible).toFixed(2));
  } else {
    baseImponible = importeTotal;
    montoIGV = 0;
  }

  // 6. Detección de Proveedor conocido
  let razonSocialEmisor = '';
  let detalleSugerido = 'Compras operativas';
  let tipoGastoSugerido = 'Insumos de cocina (verduras, condimentos palta)';

  if (text.includes('RIVERA')) {
    razonSocialEmisor = 'BODEGA RIVERA';
    tipoGastoSugerido = 'Insumos de cocina (verduras, condimentos palta)';
    detalleSugerido = 'Insumos de cocina frescos';
  } else if (text.includes('BAMBU') || text.includes('BAMBÚ')) {
    razonSocialEmisor = 'BAMBU';
    tipoGastoSugerido = 'Insumos de cocina (verduras, condimentos palta)';
    detalleSugerido = 'Verduras y mercado';
  } else if (text.includes('INDRIVE') || text.includes('INDRIVER')) {
    razonSocialEmisor = 'INDRIVE';
    tipoGastoSugerido = 'Movilidades';
    detalleSugerido = 'Movilidad y envíos de emergencia';
    tipoComprobante = 'GUIA';
    esDeducibleIGV = false;
  } else if (text.includes('MAKRO')) {
    razonSocialEmisor = 'MAKRO SUPERMAYORISTA S.A.';
    tipoGastoSugerido = 'Insumos de cocina (verduras, condimentos palta)';
    tipoComprobante = 'FACTURA';
    esDeducibleIGV = true;
  } else if (text.includes('TAI LOY')) {
    razonSocialEmisor = 'TAI LOY S.A.C.';
    tipoGastoSugerido = 'Útiles de oficina';
  } else if (text.includes('PACHAFLAMA')) {
    razonSocialEmisor = 'PACHAFLAMA';
    tipoGastoSugerido = 'Insumos de cocina (verduras, condimentos palta)';
    detalleSugerido = 'Gas Butano / Flameadores';
  }

  // Confianza estimada
  let confianza = 40;
  if (rucEmisor) confianza += 25;
  if (numeroComprobante !== 'S/N') confianza += 15;
  if (importeTotal > 0) confianza += 20;

  if (esDeducibleIGV && !rucEmisor) {
    advertencias.push('Se detectó Factura pero no se pudo leer el RUC con claridad.');
  }
  if (importeTotal === 0) {
    advertencias.push('No se detectó el importe total automáticamente. Ingrésalo manualmente.');
  }

  return {
    tipoComprobante,
    numeroComprobante,
    rucEmisor,
    razonSocialEmisor,
    fechaEmision,
    importeTotal,
    baseImponible,
    montoIGV,
    esDeducibleIGV,
    confianza: Math.min(100, confianza),
    detalleSugerido,
    tipoGastoSugerido,
    advertencias
  };
}
