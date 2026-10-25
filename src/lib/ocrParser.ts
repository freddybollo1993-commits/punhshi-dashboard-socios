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

/**
 * Convierte palabras en español a número entero (ej: "SETENTA Y UN" -> 71)
 */
function parseSpanishWordsToNumber(wordsStr: string): number {
  const units: Record<string, number> = {
    'CERO': 0, 'UN': 1, 'UNO': 1, 'UNA': 1, 'DOS': 2, 'TRES': 3, 'CUATRO': 4, 'CINCO': 5,
    'SEIS': 6, 'SIETE': 7, 'OCHO': 8, 'NUEVE': 9, 'DIEZ': 10,
    'ONCE': 11, 'DOCE': 12, 'TRECE': 13, 'CATORCE': 14, 'QUINCE': 15,
    'DIECISEIS': 16, 'DIECISEÍS': 16, 'DIECISIETE': 17, 'DIECIOCHO': 18, 'DIECINUEVE': 19,
    'VEINTE': 20, 'VEINTIUNO': 21, 'VEINTIUN': 21, 'VEINTIÚN': 21, 'VEINTIDOS': 22, 'VEINTIDÓS': 22,
    'VEINTITRES': 23, 'VEINTITRÉS': 23, 'VEINTICUATRO': 24, 'VEINTICINCO': 25,
    'VEINTISEIS': 26, 'VEINTISEÍS': 26, 'VEINTISIETE': 27, 'VEINTIOCHO': 28, 'VEINTINUEVE': 29
  };

  const tens: Record<string, number> = {
    'TREINTA': 30, 'CUARENTA': 40, 'CINCUENTA': 50, 'SESENTA': 60,
    'SETENTA': 70, 'OCHENTA': 80, 'NOVENTA': 90
  };

  const hundreds: Record<string, number> = {
    'CIEN': 100, 'CIENTO': 100, 'DOSCIENTOS': 200, 'DOSCIENTAS': 200,
    'TRESCIENTOS': 300, 'TRESCIENTAS': 300, 'CUATROCIENTOS': 400, 'CUATROCIENTAS': 400,
    'QUINIENTOS': 500, 'QUINIENTAS': 500, 'SEISCIENTOS': 600, 'SEISCIENTAS': 600,
    'SETECIENTOS': 700, 'SETECIENTAS': 700, 'OCHOCIENTOS': 800, 'OCHOCIENTAS': 800,
    'NOVECIENTOS': 900, 'NOVECIENTAS': 900
  };

  const clean = wordsStr
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);

  let total = 0;
  let current = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'Y' || t === 'DE') continue;
    if (t === 'MIL') {
      current = current === 0 ? 1000 : current * 1000;
      total += current;
      current = 0;
    } else if (hundreds[t]) {
      current += hundreds[t];
    } else if (tens[t]) {
      current += tens[t];
    } else if (units[t] !== undefined) {
      current += units[t];
    }
  }

  return total + current;
}

/**
 * Extrae el importe total expresado en letras según formato legal peruano SUNAT:
 * Ejemplo: "SON SETENTA Y UN CON 00/100 SOLES" -> 71.00
 */
function extractTotalFromPeruvianWords(text: string): number | null {
  const norm = text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const match = norm.match(/SON\s*[:\.]?\s*([A-Z\s]+?)\s+(?:CON|Y)\s+(\d{1,2})\s*\/\s*100/i);
  if (match) {
    const intPart = parseSpanishWordsToNumber(match[1]);
    const cents = parseInt(match[2], 10) / 100;
    const finalAmount = intPart + cents;
    if (finalAmount > 0 && finalAmount < 100000) {
      return parseFloat(finalAmount.toFixed(2));
    }
  }
  return null;
}

/**
 * Limpia y normaliza el texto extraído por OCR para tolerar imperfecciones de tickets térmicos
 */
function normalizeOCRText(raw: string): string {
  let text = raw.toUpperCase();

  // 1. Normalizar decimales con dos puntos (común en impresoras térmicas matriciales: 71:00 -> 71.00)
  text = text.replace(/(\d+)[:](\d{2})(?!\d)/g, '$1.$2');

  // 2. Normalizar símbolos monetarios confusos ($/, 5/, S/., $/ ) a "S/ "
  text = text.replace(/(\$|\bS|\b5)\s*[\/\|\\.]\s*/gi, 'S/ ');

  // 3. Normalizar espacios dentro de decimales (ej. 71 . 00 -> 71.00)
  text = text.replace(/(\d+)\s*[.,]\s*(\d{2})(?!\d)/g, '$1.$2');

  return text;
}

export function parseReceiptText(rawText: string): OCRParsedResult {
  const text = normalizeOCRText(rawText);
  const advertencias: string[] = [];

  // 1. Detectar RUC (11 dígitos, comienza con 10 o 20) o DNI (8 dígitos)
  const rucMatch = text.match(/\b(10\d{9}|20\d{9})\b/);
  const rucEmisor = rucMatch ? rucMatch[1] : '';

  // 2. Tipo de Comprobante
  let tipoComprobante: OCRParsedResult['tipoComprobante'] = 'BOLETA';
  let esDeducibleIGV = false;

  if (text.includes('FACTURA') || text.includes('FACTURA ELECTR') || /\b[F][A-Z0-9]{3}[-\s:]\d+/.test(text)) {
    tipoComprobante = 'FACTURA';
    esDeducibleIGV = true;
  } else if (text.includes('BOLETA') || text.includes('BOLETA DE VENTA') || /\b[B][A-Z0-9]{3}[-\s:]\d+/.test(text)) {
    tipoComprobante = 'BOLETA';
    esDeducibleIGV = false;
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
    tipoComprobante = 'BOLETA';
    esDeducibleIGV = false;
  }

  // 3. Número de Comprobante (Serie - Correlativo completo, soportando hasta 12 dígitos)
  // Ejemplo: B002-0000021835, F001-00004512, EB01-0001234
  let numeroComprobante = 'S/N';
  const sunatSerieMatch = text.match(/\b([BFE][A-Z0-9]{3})\s*[-\s:]\s*(\d{1,12})\b/i);
  if (sunatSerieMatch) {
    numeroComprobante = `${sunatSerieMatch[1].toUpperCase()}-${sunatSerieMatch[2]}`;
  } else {
    const anySerieMatch = text.match(/\b([A-Z0-9]{3,4})\s*[-\s:]\s*(\d{1,12})\b/);
    if (anySerieMatch) {
      numeroComprobante = `${anySerieMatch[1].toUpperCase()}-${anySerieMatch[2]}`;
    } else {
      const numMatch = text.match(/N[°º\.]?\s*(\d{1,12})/i) || text.match(/NRO\s*[:\.]?\s*(\d{1,12})/i);
      if (numMatch) {
        numeroComprobante = `N°${numMatch[1]}`;
      }
    }
  }

  // 4. Fecha de Emisión (DD/MM/YYYY o YYYY-MM-DD o DD-MM-YYYY)
  let fechaEmision = new Date().toISOString().slice(0, 10);
  const dateMatch = text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/) || text.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      fechaEmision = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      fechaEmision = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  // 5. Montos: Estrategia multicapa (Palabras legales SUNAT + Línea explícita TOTAL + Máximo monetario)
  let importeTotal = 0;

  // A. Extraer total escrito en letras según SUNAT ("SON SETENTA Y UN CON 00/100 SOLES")
  const totalFromWords = extractTotalFromPeruvianWords(rawText);

  // B. Buscar la línea explícita de TOTAL en el texto normalizado
  const totalLineMatch = text.match(/(?:TOTAL|IMPORTE\s*TOTAL|TOTAL\s*A\s*PAGAR|TOTAL\s*VENTA|IMPORTE|NETO\s*A\s*PAGAR)\s*[:=\s]*(?:S\/\s*|\$\/\s*|PEN\s*|SOLES\s*)?([0-9]+(?:[\.,][0-9]{2})?)/i);
  let totalFromLine = 0;
  if (totalLineMatch) {
    totalFromLine = parseFloat(totalLineMatch[1].replace(',', '.'));
  }

  // C. Conciliar o seleccionar el total más fidedigno
  if (totalFromWords && totalFromWords > 0) {
    if (totalFromLine > 0 && Math.abs(totalFromLine - totalFromWords) < 0.05) {
      // Coincidencia exacta entre letras y números (máxima certeza)
      importeTotal = totalFromWords;
    } else if (totalFromLine > 0 && totalFromLine > 500 && totalFromWords < 200) {
      // Impresora térmica omitió el punto decimal en dígitos (ej. 7100 vs 71.00)
      importeTotal = totalFromWords;
    } else {
      // Si la línea de números era confusa o falló, las letras son la verdad jurídica SUNAT
      importeTotal = totalFromWords;
    }
  } else if (totalFromLine > 0) {
    importeTotal = totalFromLine;
  } else {
    // D. Si no hay línea explícita ni letras, buscar importes con decimales válidos
    const amounts = text.match(/(?:S\/\s*)?([0-9]+[\.][0-9]{2})/g) || [];
    const parsedNumbers = amounts
      .map(a => parseFloat(a.replace(/[^0-9\.]/g, '')))
      .filter(n => !isNaN(n) && n > 0 && n < 100000);

    if (parsedNumbers.length > 0) {
      importeTotal = Math.max(...parsedNumbers);
    }
  }

  let baseImponible = 0;
  let montoIGV = 0;

  if (esDeducibleIGV && importeTotal > 0) {
    baseImponible = parseFloat((importeTotal / 1.105).toFixed(2));
    montoIGV = parseFloat((importeTotal - baseImponible).toFixed(2));
  } else {
    baseImponible = importeTotal;
    montoIGV = 0;
  }

  // 6. Detección Inteligente del Proveedor y Categoría
  let razonSocialEmisor = '';
  let detalleSugerido = 'Consumo de restaurante / compras varias';
  let tipoGastoSugerido = 'Insumos de cocina (verduras, condimentos palta)';

  if (text.includes('CHICLASHI') || text.includes('SHIMAYA')) {
    razonSocialEmisor = 'CHICLASHI S.A.C. (SHIMAYA CHICLAYO)';
    tipoGastoSugerido = 'Alimentación de personal';
    detalleSugerido = 'Alimentos / Consumo (Gyozas, alitas, maki, maracuyá)';
  } else if (text.includes('RIVERA')) {
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
    detalleSugerido = 'Movilidad y envíos';
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
  } else {
    // Si no está registrado, buscar en las primeras líneas del ticket el nombre comercial
    const lines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length >= 4 && l.length <= 60);

    const ignoreWords = [
      'BOLETA', 'FACTURA', 'ELECTR', 'R.U.C', 'RUC', 'TICKET', 'FECHA', 'HORA',
      'DIRECCION', 'DIRECCIÓN', 'CLIENTE', 'DNI', 'CANT', 'PRECIO', 'ORIGINAL',
      'COPIA', 'HASH', 'AUTORIZADO', 'RESOLUCION', 'SUBTOTAL', 'TOTAL', 'VENDEDOR',
      'IMPORTES', 'DESCRIPCION'
    ];

    // Prioridad 1: Buscar líneas con sufijos empresariales peruanos (SAC, EIRL, SRL, SOCIEDAD ANONIMA)
    const corpCandidate = lines.find(line => {
      const u = line.toUpperCase();
      const hasCorp = u.includes('S.A.C') || u.includes('SAC') || u.includes('E.I.R.L') || 
                      u.includes('EIRL') || u.includes('S.R.L') || u.includes('SRL') || 
                      u.includes('SOCIEDAD') || u.includes('S.A.') || u.includes('EMPRESA');
      return hasCorp && !ignoreWords.some(w => u.includes(w));
    });

    if (corpCandidate) {
      razonSocialEmisor = corpCandidate.toUpperCase();
    } else {
      // Prioridad 2: Buscar líneas con al menos 2 palabras de 3+ letras (para evitar ruido tipo 'LE x o ERN N')
      const cleanCandidate = lines.find(line => {
        const u = line.toUpperCase();
        if (ignoreWords.some(w => u.includes(w)) || /^\d+$/.test(line)) return false;
        const validWords = u.split(/\s+/).filter(w => w.length >= 3 && /^[A-ZÁÉÍÓÚÑ]+$/.test(w));
        return validWords.length >= 2;
      });

      if (cleanCandidate) {
        razonSocialEmisor = cleanCandidate.toUpperCase();
      } else {
        razonSocialEmisor = 'PROVEEDOR VARIOS';
      }
    }

    if (tipoComprobante === 'BOLETA') {
      tipoGastoSugerido = 'Alimentación de personal';
      detalleSugerido = 'Consumo / compra menor con boleta';
    }
  }

  // Si en el texto hay referencias gastronómicas específicas, refinar el detalle sugerido
  if (text.includes('GYOZA') || text.includes('ALITAS') || text.includes('MAKI') || text.includes('MARACUYA')) {
    detalleSugerido = 'Alimentos / Consumo (Gyozas, alitas, maki, maracuyá)';
    tipoGastoSugerido = 'Alimentación de personal';
  }

  // 7. Confianza estimada
  let confianza = 35;
  if (rucEmisor) confianza += 20;
  if (numeroComprobante !== 'S/N') confianza += 25;
  if (importeTotal > 0) confianza += 20;

  // Bonificación de confianza si hubo conciliación con texto en letras
  if (totalFromWords && importeTotal === totalFromWords) {
    confianza += 10;
  }

  if (tipoComprobante === 'BOLETA') {
    advertencias.push('Comprobante tipo Boleta de Venta: Registra salida real de dinero de caja chica sin crédito fiscal de IGV.');
  }

  if (importeTotal === 0) {
    advertencias.push('No se pudo identificar con certeza el monto total. Por favor verifica o digita el importe.');
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
