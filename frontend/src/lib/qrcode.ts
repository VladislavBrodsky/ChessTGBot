/**
 * Self-contained QR Code Model 2 generator (ISO/IEC 18004).
 * Zero dependencies, runs locally in <1ms, eliminates external image API latency.
 */

// 1. Galois Field GF(256) math with primitive polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1)
const expTable = new Uint8Array(512);
const logTable = new Uint8Array(256);
let val = 1;
for (let i = 0; i < 255; i++) {
  expTable[i] = val;
  expTable[i + 255] = val;
  logTable[val] = i;
  val = (val << 1) ^ (val >= 128 ? 0x11d : 0);
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return expTable[logTable[a] + logTable[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = expTable[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsCompute(data: number[], ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    for (let j = 0; j < ecCount - 1; j++) {
      res[j] = res[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    res[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return res;
}

interface QrVersion {
  v: number;
  size: number;
  ecPerBlock: number;
  g1: number;
  d1: number;
  g2: number;
  d2: number;
  align: number[];
}

// Standard QR Model 2 Version Table for Error Correction Level M
const VERSIONS: (QrVersion | null)[] = [
  null,
  { v: 1,  size: 21, ecPerBlock: 10, g1: 1, d1: 16, g2: 0, d2: 0,  align: [] },
  { v: 2,  size: 25, ecPerBlock: 16, g1: 1, d1: 28, g2: 0, d2: 0,  align: [6, 18] },
  { v: 3,  size: 29, ecPerBlock: 26, g1: 1, d1: 44, g2: 0, d2: 0,  align: [6, 22] },
  { v: 4,  size: 33, ecPerBlock: 18, g1: 2, d1: 32, g2: 0, d2: 0,  align: [6, 26] },
  { v: 5,  size: 37, ecPerBlock: 24, g1: 2, d1: 43, g2: 0, d2: 0,  align: [6, 30] },
  { v: 6,  size: 41, ecPerBlock: 16, g1: 4, d1: 27, g2: 0, d2: 0,  align: [6, 34] },
  { v: 7,  size: 45, ecPerBlock: 18, g1: 4, d1: 31, g2: 0, d2: 0,  align: [6, 22, 38] },
  { v: 8,  size: 49, ecPerBlock: 22, g1: 2, d1: 38, g2: 2, d2: 39, align: [6, 24, 42] },
  { v: 9,  size: 53, ecPerBlock: 22, g1: 3, d1: 36, g2: 2, d2: 37, align: [6, 26, 46] },
  { v: 10, size: 57, ecPerBlock: 26, g1: 4, d1: 43, g2: 1, d2: 44, align: [6, 28, 50] },
];

function encodeUtf8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
  }
  return new Uint8Array(utf8);
}

function selectVersion(dataLen: number): QrVersion {
  for (let v = 1; v <= 10; v++) {
    const ver = VERSIONS[v];
    if (!ver) continue;
    const maxData = ver.g1 * ver.d1 + ver.g2 * ver.d2;
    const overheadBytes = v <= 9 ? 2 : 3;
    if (dataLen + overheadBytes <= maxData) {
      return ver;
    }
  }
  return VERSIONS[10]!;
}

function encodeCodewords(text: string, ver: QrVersion): number[] {
  const bytes = encodeUtf8(text);
  const totalDataBytes = ver.g1 * ver.d1 + ver.g2 * ver.d2;

  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);

  // Character count indicator (8 bits for v <= 9, 16 bits for v >= 10)
  pushBits(bytes.length, ver.v <= 9 ? 8 : 16);

  // Data bytes
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  // Terminator
  const capacityBits = totalDataBytes * 8;
  const termLen = Math.min(4, Math.max(0, capacityBits - bits.length));
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    data.push(b);
  }

  // Pad bytes
  let padByte = 0xec;
  while (data.length < totalDataBytes) {
    data.push(padByte);
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  // Blocks and error correction
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (let b = 0; b < ver.g1; b++) {
    const block = data.slice(offset, offset + ver.d1);
    offset += ver.d1;
    dataBlocks.push(block);
    ecBlocks.push(Array.from(rsCompute(block, ver.ecPerBlock)));
  }
  for (let b = 0; b < ver.g2; b++) {
    const block = data.slice(offset, offset + ver.d2);
    offset += ver.d2;
    dataBlocks.push(block);
    ecBlocks.push(Array.from(rsCompute(block, ver.ecPerBlock)));
  }

  // Interleave data
  const result: number[] = [];
  const maxDataBlockLen = Math.max(ver.d1, ver.d2);
  for (let i = 0; i < maxDataBlockLen; i++) {
    for (let b = 0; b < dataBlocks.length; b++) {
      if (i < dataBlocks[b].length) {
        result.push(dataBlocks[b][i]);
      }
    }
  }

  // Interleave EC
  for (let i = 0; i < ver.ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      result.push(ecBlocks[b][i]);
    }
  }

  return result;
}

function getFormatBits(ecLevel: number, mask: number): number {
  const data = (ecLevel << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) {
      rem ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function createBaseMatrix(ver: QrVersion) {
  const size = ver.size;
  const matrix: (number | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r: number, c: number, val: number, isRes = true) {
    matrix[r][c] = val;
    if (isRes) reserved[r][c] = true;
  }

  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(row, col, isBlack ? 1 : 0);
        } else {
          setModule(row, col, 0);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0;
    if (matrix[6][i] === null) setModule(6, i, val);
    if (matrix[i][6] === null) setModule(i, 6, val);
  }

  // Alignment patterns
  for (const r of ver.align) {
    for (const c of ver.align) {
      if ((r < 9 && c < 9) || (r < 9 && c > size - 10) || (r > size - 10 && c < 9)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, isBlack ? 1 : 0);
        }
      }
    }
  }

  // Dark module
  setModule(4 * ver.v + 9, 8, 1);

  // Format info reservations
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  return { matrix, reserved, size };
}

function placeData(matrix: (number | null)[][], reserved: boolean[][], size: number, codewords: number[], maskPattern: number) {
  const bits: number[] = [];
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;

    const rows: number[] = [];
    if (upward) {
      for (let r = size - 1; r >= 0; r--) rows.push(r);
    } else {
      for (let r = 0; r < size; r++) rows.push(r);
    }
    upward = !upward;

    for (const r of rows) {
      for (let c = right; c >= right - 1; c--) {
        if (!reserved[r][c]) {
          const bit = bitIdx < bits.length ? bits[bitIdx++] : 0;
          let maskCondition = false;
          switch (maskPattern) {
            case 0: maskCondition = (r + c) % 2 === 0; break;
            case 1: maskCondition = r % 2 === 0; break;
            case 2: maskCondition = c % 3 === 0; break;
            case 3: maskCondition = (r + c) % 3 === 0; break;
            case 4: maskCondition = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
            case 5: maskCondition = ((r * c) % 2) + ((r * c) % 3) === 0; break;
            case 6: maskCondition = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; break;
            case 7: maskCondition = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; break;
          }
          matrix[r][c] = bit ^ (maskCondition ? 1 : 0);
        }
      }
    }
  }
}

function placeFormat(matrix: (number | null)[][], size: number, maskPattern: number) {
  const formatBits = getFormatBits(0 /* Level M */, maskPattern);
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    if (i < 6) {
      matrix[8][i] = bit;
    } else if (i === 6) {
      matrix[8][7] = bit;
    } else if (i === 7) {
      matrix[8][8] = bit;
    } else if (i === 8) {
      matrix[7][8] = bit;
    } else {
      matrix[14 - i][8] = bit;
    }

    if (i < 8) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 15 + i] = bit;
    }
  }
}

function evaluatePenalty(matrix: (number | null)[][], size: number): number {
  let penalty = 0;
  for (let r = 0; r < size; r++) {
    let runColor = matrix[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }
  for (let c = 0; c < size; c++) {
    let runColor = matrix[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const color = matrix[r][c];
      if (color === matrix[r + 1][c] && color === matrix[r][c + 1] && color === matrix[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }
  return penalty;
}

export interface QrMatrixResult {
  matrix: boolean[][];
  size: number;
  version: number;
}

/**
 * Generate a boolean 2D matrix representing dark (true) and light (false) modules.
 */
export function generateQrMatrix(text: string): QrMatrixResult {
  const ver = selectVersion(encodeUtf8(text).length);
  const codewords = encodeCodewords(text, ver);

  let bestPenalty = Infinity;
  let bestMatrix: boolean[][] = [];

  for (let mask = 0; mask < 8; mask++) {
    const { matrix, reserved, size } = createBaseMatrix(ver);
    placeData(matrix, reserved, size, codewords, mask);
    placeFormat(matrix, size, mask);
    const penalty = evaluatePenalty(matrix, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = matrix.map(row => row.map(v => v === 1));
    }
  }

  return { matrix: bestMatrix, size: ver.size, version: ver.v };
}

/**
 * Convert QR matrix to SVG path data string for ultra-efficient rendering.
 */
export function matrixToSvgPath(matrix: boolean[][], quietZone = 2): { path: string; totalSize: number } {
  const size = matrix.length;
  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        path += `M${c + quietZone},${r + quietZone}h1v1h-1z `;
      }
    }
  }
  return { path, totalSize: size + quietZone * 2 };
}
