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

  // 1. Detectar RUC (11 dígitos, comienza con 10 o 20) o DNI (8 dígitos)
  const rucMatch = text.match(/\b(10\d{9}|20\d{9})\b/);
  const rucEmisor = rucMatch ? rucMatch[1] : '';

  // 2. Tipo de Comprobante
  let tipoComprobante: OCRParsedResult['tipoComprobante'] = 'BOLETA';
  let esDeducibleIGV = false;

  if (text.includes('FACTURA') || text.includes('FACTURA ELECTR') || /[F][A-Z0-9]{3}[-\s]\d+/.test(text)) {
    tipoComprobante = 'FACTURA';
    esDeducibleIGV = true;
  } else if (text.includes('BOLETA') || text.includes('BOLETA DE VENTA') || /[B][A-Z0-9]{3}[-\s]\d+/.test(text)) {
    tipoComprobante = 'BOLETA';
    esDeducibleIGV = false; // Sin RUC receptor no da crédito fiscal en régimen general
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

  // 3. Número de Comprobante (Serie - Correlativo e.g. B001-00012345 o F001-12345 o N°003105)
  let numeroComprobante = 'S/N';
  const serieMatch = text.match(/([BFE][A-Z0-9]{3}[-\s]\d{3,8})/i) || text.match(/([A-Z0-9]{4}[-\s]\d{3,8})/);
  if (serieMatch) {
    numeroComprobante = serieMatch[1].replace(/\s+/g, '-').toUpperCase();
  } else {
    const numMatch = text.match(/N[°º\.]?\s*(\d+)/i) || text.match(/NRO\s*[:\.]?\s*(\d+)/i);
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
  let importeTotal = 0;
  
  // Buscar específicamente la línea de TOTAL / IMPORTE TOTAL
  const totalLineMatch = text.match(/(?:TOTAL|IMPORTE\s*TOTAL|TOTAL\s*A\s*PAGAR|IMPORTE)\s*[:=\s]*S?\/?\.?\s*([0-9]+[,\.][0-9]{2})/i);
  if (totalLineMatch) {
    importeTotal = parseFloat(totalLineMatch[1].replace(',', '.'));
  }

  if (importeTotal <= 0) {
    // Si no encontró etiqueta explícita, extraer importes monetarios detectados
    const amounts = text.match(/(?:S\/|S\/\.|\$)?\s*([0-9]+[,\.][0-9]{2})/g) || [];
    const parsedNumbers = amounts
      .map(a => parseFloat(a.replace(/[^0-9\.]/g, '').replace(',', '.')))
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

  // 6. Detección de Proveedor (Si no es de la lista maestra, extraer el nombre en el encabezado del ticket)
  let razonSocialEmisor = '';
  let detalleSugerido = 'Consumo de restaurante / compras varias';
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
    // Proveedor NO registrado previamente: extraer la primera línea con nombre de tienda o negocio
    const lines = rawText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length >= 3 && l.length <= 60);

    const ignoreWords = ['BOLETA', 'FACTURA', 'ELECTR', 'R.U.C', 'RUC', 'TICKET', 'FECHA', 'HORA', 'DIRECCION', 'CLIENTE', 'DNI', 'CANT', 'PRECIO'];
    const candidate = lines.find(line => {
      const u = line.toUpperCase();
      return !ignoreWords.some(w => u.includes(w)) && !/^\d+$/.test(line);
    });

    if (candidate) {
      razonSocialEmisor = candidate.toUpperCase();
    } else {
      razonSocialEmisor = 'PROVEEDOR VARIOS';
    }

    if (tipoComprobante === 'BOLETA') {
      tipoGastoSugerido = 'Alimentación de personal';
      detalleSugerido = 'Consumo / compra menor con boleta';
    }
  }

  // 7. Confianza estimada
  let confianza = 35;
  if (rucEmisor) confianza += 25;
  if (numeroComprobante !== 'S/N') confianza += 20;
  if (importeTotal > 0) confianza += 20;

  if (tipoComprobante === 'BOLETA') {
    advertencias.push('Comprobante tipo Boleta de Venta: Registra salida real de dinero de caja sin generar crédito fiscal de IGV.');
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
