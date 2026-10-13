/* png.ts — minimal PNG decoder (8-bit RGB/RGBA, non-interlaced: what Chrome screenshots produce). No dependencies. */
import { inflateSync } from 'node:zlib';

export type Image = { width: number; height: number; px: (x: number, y: number) => [number, number, number] };

export const decodePng = (buf: Buffer): Image => {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8, width = 0, height = 0, ctype = 0, depth = 0, interlace = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || interlace || (ctype !== 2 && ctype !== 6)) throw new Error(`unsupported PNG (depth ${depth}, type ${ctype}, interlace ${interlace})`);
  const bpp = ctype === 6 ? 4 : 3, stride = width * bpp, raw = inflateSync(Buffer.concat(idat)), out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, b = y ? out[dst - stride + x] : 0, c = x >= bpp && y ? out[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return { width, height, px: (x, y) => { const i = y * stride + x * bpp; return [out[i], out[i + 1], out[i + 2]]; } };
};
