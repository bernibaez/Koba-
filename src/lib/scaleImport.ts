import { digitsOnly, normalizePlu } from '@/lib/scaleBarcode';

export interface ParsedImportRow {
  id: string;
  plu: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  minStock: number;
  saleType: 'unit' | 'weight' | 'both';
  weightUnit: 'lb' | 'kg';
  isWeightProduct: boolean;
  generateScaleBarcode: boolean;
  status: 'active' | 'inactive' | 'discontinued';
  isValid: boolean;
  validationError?: string;
  matchStatus?: 'create' | 'update' | 'unchanged';
  existingId?: string;
  existingName?: string;
  existingPrice?: number;
}

export interface ScaleImportMatchProduct {
  id: string;
  plu?: string;
  barcode?: string;
  sku?: string;
  name?: string;
  salePrice?: number;
}

function stripNullBytes(str: string): string {
  if (!str) return '';
  return str.replace(/[\u0000\0]/g, '').trim();
}

export function padPlu(rawPlu: string | number): string {
  return normalizePlu(stripNullBytes(String(rawPlu || ''))) || '';
}

/** Code 0000001 / 0000000 de la balanza: no es único, no usarlo como barcode/SKU. */
export function isGenericScaleItemCode(code: string | null | undefined): boolean {
  const digits = digitsOnly(code);
  if (!digits) return true;
  if (/^0+$/.test(digits)) return true;
  if (digits.length >= 6 && /^0*1$/.test(digits)) return true;
  return false;
}

function pluFromProductIdentity(p: ScaleImportMatchProduct): string {
  return (
    padPlu(p.plu || '') ||
    padPlu(p.barcode || '') ||
    padPlu(String(p.sku || '').replace(/^PLU-/i, ''))
  );
}

export function findExistingImportProduct<T extends ScaleImportMatchProduct>(
  catalog: T[],
  item: { id?: string; plu?: string; barcode?: string; sku?: string }
): T | undefined {
  const plu = padPlu(item.plu || '') || padPlu(item.barcode || '');
  const itemSku = (item.sku || '').trim().toUpperCase();
  const itemBarcode = (item.barcode || '').trim();

  return catalog.find((p) => {
    if (item.id && p.id === item.id) return true;
    const pPlu = pluFromProductIdentity(p);
    if (plu && pPlu && pPlu === plu) return true;
    if (itemSku && p.sku && p.sku.trim().toUpperCase() === itemSku) return true;
    if (
      itemBarcode &&
      p.barcode &&
      p.barcode.trim() === itemBarcode &&
      !isGenericScaleItemCode(itemBarcode)
    ) {
      return true;
    }
    return false;
  });
}

function looksLikeScaleDump(text: string): boolean {
  return /1P\d{4,5}[A-Za-z]/.test(text);
}

function cleanScaleName(raw: string): string {
  return stripNullBytes(raw)
    .replace(/#+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildRow(
  partial: {
    plu: string;
    name: string;
    sku?: string;
    barcode?: string;
    category?: string;
    salePrice: number;
    costPrice?: number;
    currentStock?: number;
    isWeight: boolean;
  },
  index: number
): ParsedImportRow {
  const formattedPlu = padPlu(partial.plu);
  const name = cleanScaleName(partial.name);
  const salePrice = Math.round((partial.salePrice || 0) * 100) / 100;
  const costPrice =
    partial.costPrice != null && partial.costPrice > 0
      ? Math.round(partial.costPrice * 100) / 100
      : Math.round(salePrice * 0.7 * 100) / 100;
  const currentStock = partial.currentStock ?? 0;
  const rawCode = (partial.barcode || partial.sku || '').trim();
  const genericCode = isGenericScaleItemCode(rawCode);
  // Identidad estable por PLU: el Code 0000001 de la balanza se repite y choca con UNIQUE.
  const barcode = partial.isWeight && formattedPlu
    ? formattedPlu
    : (genericCode ? '' : rawCode) || formattedPlu || `20${formattedPlu || '00001'}00000`;
  const sku =
    partial.isWeight && formattedPlu
      ? `PLU-${formattedPlu}`
      : (genericCode ? '' : (partial.sku || '').trim()) ||
        (formattedPlu ? `PLU-${formattedPlu}` : `SKU-${Date.now()}-${index + 1}`);

  let validationError = '';
  if (!name) validationError = 'Nombre de producto requerido';
  else if (salePrice <= 0) validationError = 'Precio de venta debe ser mayor a 0';
  else if (partial.isWeight && !formattedPlu) validationError = 'PLU de balanza requerido';

  return {
    id: `import-${Date.now()}-${index}`,
    plu: formattedPlu,
    name: name || 'Producto sin nombre',
    sku,
    barcode,
    category: partial.category || (partial.isWeight ? 'Fresco / Balanza' : 'General'),
    salePrice,
    costPrice,
    currentStock,
    minStock: 10,
    saleType: partial.isWeight ? 'weight' : 'unit',
    weightUnit: 'lb',
    isWeightProduct: partial.isWeight,
    generateScaleBarcode: partial.isWeight,
    status: 'active',
    isValid: !validationError,
    validationError,
  };
}

/** Volcado nativo de balanza Dahua / mscale: 1P0001A0000001002500...##BICARBONATO #### */
export function parseScalePluDump(rawText: string, forceScaleMode = true): ParsedImportRow[] {
  const text = stripNullBytes(rawText);
  if (!text) return [];

  const parsed: ParsedImportRow[] = [];
  const re = /1P(\d{4,5})[A-Za-z](\d{7})(\d{6})[^#\n\r]*##([^#\n\r]*)/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = re.exec(text)) !== null) {
    const plu = padPlu(match[1]);
    const name = cleanScaleName(match[4] || '');
    const priceRaw = parseInt(match[3], 10);
    const salePrice = Number.isFinite(priceRaw) ? priceRaw / 100 : 0;

    if (!name && salePrice <= 0) continue;

    parsed.push(
      buildRow(
        {
          plu,
          name,
          salePrice,
          isWeight: true,
        },
        index
      )
    );
    index += 1;
  }

  if (parsed.length > 0) return parsed;

  if (forceScaleMode && looksLikeScaleDump(text)) {
    return [];
  }
  return [];
}

function parseDelimitedRows(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes('|')) delimiter = '|';
  else if (/\s{2,}/.test(firstLine)) delimiter = 'SPLIT_MULTI_SPACE';

  return lines.map((line) => {
    if (delimiter === 'SPLIT_MULTI_SPACE') {
      return line.split(/\s{2,}/).map((s) => s.trim());
    }
    const escaped = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|${escaped})(?:"([^"]*)"|([^"${escaped}]*))`, 'g');
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      const val = m[1] !== undefined ? m[1] : m[2];
      matches.push(val ? val.trim() : '');
    }
    return matches;
  });
}

function parseHtmlTable(text: string): string[][] {
  if (!text.includes('<table') && !text.includes('<tr')) return [];
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const trs = Array.from(doc.querySelectorAll('tr'));
    return trs
      .map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td, th'));
        return cells.map((c) => c.textContent?.trim() || '');
      })
      .filter((r) => r.some((c) => c.length > 0));
  } catch {
    return [];
  }
}

export function parseTableMatrix(rows: string[][], forceScaleMode = false): ParsedImportRow[] {
  if (!rows.length) return [];

  const headers = rows[0].map((h) => String(h || '').toLowerCase().trim());
  const hasHeader = headers.some((h) =>
    ['plu', 'name', 'nombre', 'price', 'precio', 'sku', 'code', 'codigo', 'modo', 'mode'].some((t) => h.includes(t))
  );

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const findIdx = (terms: string[]) => headers.findIndex((h) => terms.some((t) => h.includes(t)));

  const pluIdx = findIdx(['plu no', 'pluno', 'plu_no', 'plu-no', 'plu']);
  const nameIdx = findIdx(['name', 'nombre', 'descripcion', 'description', 'item', 'articulo', 'producto']);
  const codeIdx = findIdx(['code', 'codigo', 'sku', 'barcode', 'codigo_barras', 'ean']);
  const priceIdx = findIdx(['price', 'precio', 'precio_venta', 'saleprice', 'precio/lb', 'unitprice']);
  const costIdx = findIdx(['cost', 'costo', 'precio_costo', 'costprice']);
  const modeIdx = findIdx(['mode', 'modo', 'tipo', 'sale_type', 'saletype', 'type', 'unit', 'unidad']);
  const catIdx = findIdx(['category', 'categoria', 'cat']);
  const stockIdx = findIdx(['stock', 'existencia', 'cant', 'cantidad', 'currentstock']);

  const parsedList: ParsedImportRow[] = [];

  dataRows.forEach((cols, i) => {
    if (cols.length === 0 || (cols.length === 1 && !String(cols[0] || '').trim())) return;

    let rawPlu = pluIdx >= 0 ? String(cols[pluIdx] ?? '') : '';
    let name = nameIdx >= 0 ? String(cols[nameIdx] ?? '') : '';
    let rawCode = codeIdx >= 0 ? String(cols[codeIdx] ?? '') : '';
    let rawPrice = priceIdx >= 0 ? String(cols[priceIdx] ?? '') : '';
    let rawCost = costIdx >= 0 ? String(cols[costIdx] ?? '') : '';
    let rawMode = modeIdx >= 0 ? String(cols[modeIdx] ?? '') : '';
    let category = catIdx >= 0 ? String(cols[catIdx] ?? '') : '';
    let rawStock = stockIdx >= 0 ? String(cols[stockIdx] ?? '') : '';

    if (!hasHeader) {
      rawPlu = String(cols[0] || '');
      name = String(cols[1] || '');
      rawCode = String(cols[2] || '');
      rawPrice = String(cols[3] || '');
      rawMode = String(cols[4] || '');
    }

    if (!name && !rawPlu && !rawCode) return;

    const formattedPlu = padPlu(rawPlu);
    const salePrice = Math.max(0, parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
    const costPrice = rawCost
      ? Math.max(0, parseFloat(String(rawCost).replace(/[^0-9.]/g, '')) || 0)
      : undefined;
    const currentStock = rawStock ? parseFloat(String(rawStock).replace(/[^0-9.]/g, '')) || 0 : 0;
    const isWeightMode =
      forceScaleMode ||
      !!formattedPlu ||
      String(rawMode).trim() === '0' ||
      String(rawMode).toLowerCase().includes('weight') ||
      String(rawMode).toLowerCase().includes('peso') ||
      String(rawMode).toLowerCase().includes('lb') ||
      String(rawMode).toLowerCase().includes('kg');

    parsedList.push(
      buildRow(
        {
          plu: formattedPlu,
          name,
          sku: String(rawCode || '').trim(),
          barcode: String(rawCode || '').trim(),
          category,
          salePrice,
          costPrice,
          currentStock,
          isWeight: isWeightMode,
        },
        i
      )
    );
  });

  return parsedList;
}

export function parseAnyFileContent(rawText: string, forceScaleMode = false): ParsedImportRow[] {
  const text = stripNullBytes(rawText);
  if (!text) return [];

  if (looksLikeScaleDump(text)) {
    const dumpRows = parseScalePluDump(text, true);
    if (dumpRows.length > 0) return dumpRows;
  }

  const htmlRows = parseHtmlTable(text);
  if (htmlRows.length > 0) return parseTableMatrix(htmlRows, forceScaleMode);

  const delimited = parseDelimitedRows(text);
  return parseTableMatrix(delimited, forceScaleMode);
}

export function decodeImportText(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  const hasReplacement = utf8.includes('\uFFFD');
  const looksUseful = looksLikeScaleDump(utf8) || utf8.includes(',') || utf8.includes('\t') || utf8.includes('<table');
  if (looksUseful && !hasReplacement) return utf8;
  try {
    return new TextDecoder('windows-1252').decode(buffer);
  } catch {
    return utf8;
  }
}

function isOleCompound(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
}

function isZipBuffer(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export async function parseImportedFile(file: File, forceScaleMode = false): Promise<ParsedImportRow[]> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (isOleCompound(bytes) || isZipBuffer(bytes)) {
    const mod = await import('xlsx');
    const XLSX = (mod as unknown as { default?: typeof mod } & typeof mod).default ?? mod;
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const matrix = (XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    }) as unknown[][]).map((row) => row.map((cell) => String(cell ?? '').trim()));

    const asText = matrix.map((row) => row.join('\t')).join('\n');
    if (looksLikeScaleDump(asText)) {
      const dumpRows = parseScalePluDump(asText, true);
      if (dumpRows.length > 0) return dumpRows;
    }
    return parseTableMatrix(matrix, forceScaleMode);
  }

  return parseAnyFileContent(decodeImportText(buffer), forceScaleMode);
}

export function annotateImportMatches(
  rows: ParsedImportRow[],
  existingProducts: ScaleImportMatchProduct[]
): ParsedImportRow[] {
  return rows.map((row) => {
    if (!row.isValid) return { ...row, matchStatus: 'create' as const };
    const existing = findExistingImportProduct(existingProducts, row);
    if (!existing) return { ...row, matchStatus: 'create' as const };

    const samePrice = Math.round((existing.salePrice || 0) * 100) === Math.round(row.salePrice * 100);
    const sameName = (existing.name || '').trim().toLowerCase() === row.name.trim().toLowerCase();
    return {
      ...row,
      matchStatus: samePrice && sameName ? 'unchanged' : 'update',
      existingId: existing.id,
      existingName: existing.name,
      existingPrice: existing.salePrice,
    };
  });
}
