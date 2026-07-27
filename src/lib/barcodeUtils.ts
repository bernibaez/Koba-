/** Utility for auto-generating unique barcodes and rendering barcode vectors */

/** Generate a unique 13-digit barcode (EAN-13 structure with 789 prefix for DO local products) */
export function generateUniqueBarcode(): string {
  const prefix = '789';
  let middle = '';
  for (let i = 0; i < 9; i++) {
    middle += Math.floor(Math.random() * 10).toString();
  }
  const raw12 = prefix + middle;
  // Calculate EAN-13 checksum digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(raw12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return raw12 + checkDigit.toString();
}

/** Simple Code 128 / Barcode pattern generator for HTML SVG visualization */
export function generateBarcodeBars(code: string): { width: number; key: string }[] {
  const clean = code.replace(/[^0-9A-Z-]/gi, '') || '1234567890';
  const bars: { width: number; key: string }[] = [];
  let seed = 0;
  for (let i = 0; i < clean.length; i++) {
    seed += clean.charCodeAt(i);
  }

  // Quiet zone start
  bars.push({ width: 3, key: 'start-space' });
  bars.push({ width: 2, key: 'start-bar-1' });
  bars.push({ width: 1, key: 'start-space-1' });

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const w2 = ((charCode * 2) % 3) + 1;
    const w3 = ((charCode * 3) % 2) + 1;
    bars.push({ width: w1, key: `b-${i}-1` });
    bars.push({ width: 1, key: `s-${i}-1` });
    bars.push({ width: w2, key: `b-${i}-2` });
    bars.push({ width: 1, key: `s-${i}-2` });
    bars.push({ width: w3, key: `b-${i}-3` });
    bars.push({ width: 2, key: `s-${i}-3` });
  }

  // Stop pattern
  bars.push({ width: 2, key: 'stop-bar-1' });
  bars.push({ width: 1, key: 'stop-space-1' });
  bars.push({ width: 3, key: 'stop-bar-2' });

  return bars;
}
