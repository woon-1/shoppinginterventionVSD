/**
 * Generate the Pause toolbar icon: the brand-mark indigo square, centered on
 * a transparent background, at the four sizes Chrome wants. Run on demand:
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes public/icons/icon-{16,32,48,128}.png. Tweak ACCENT or INSET_RATIO
 * to rebrand without depending on an image library.
 */

import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";

const OUT_DIR = "public/icons";
const SIZES = [16, 32, 48, 128];
const ACCENT = { r: 0x5b, g: 0x5c, b: 0xff, a: 255 }; // matches --accent
const INSET_RATIO = 0.22; // 22% margin → ~56% center square, like the wordmark dot

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function makePng(size, fg, bg) {
  const inset = Math.max(1, Math.round(size * INSET_RATIO));
  const end = size - inset;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const c = x >= inset && x < end && y >= inset && y < end ? fg : bg;
      const off = 1 + x * 4;
      row[off] = c.r;
      row[off + 1] = c.g;
      row[off + 2] = c.b;
      row[off + 3] = c.a;
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // ihdr[10..12] left at 0: compression / filter / interlace defaults

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });

const transparent = { r: 0, g: 0, b: 0, a: 0 };
for (const size of SIZES) {
  const png = makePng(size, ACCENT, transparent);
  const file = path.join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`[icons] wrote ${file} (${png.length} bytes)`);
}
