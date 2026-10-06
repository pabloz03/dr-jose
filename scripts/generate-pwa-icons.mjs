// Genera íconos PWA placeholder (fondo --accent + círculo --on-accent) hasta
// que el doctor entregue logo/marca real (P2, no bloqueante). Encoder PNG
// manual (zlib nativo de Node) para no depender de una librería de imágenes.
// Uso: node scripts/generate-pwa-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const ACCENT = [0x0a, 0x6f, 0x6a]; // --accent
const ON_ACCENT = [0xff, 0xff, 0xff]; // --on-accent

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** @param {number} size @param {{circleRatio:number, rounded:boolean}} opts */
function drawIcon(size, { circleRatio, rounded }) {
  const px = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size * circleRatio) / 2;
  const cornerR = rounded ? size * 0.22 : 0;

  const insideRoundedRect = (x, y) => {
    if (!rounded) return true;
    const dx = Math.max(0, Math.max(cornerR - x, cornerR - (size - 1 - x)));
    const dy = Math.max(0, Math.max(cornerR - y, cornerR - (size - 1 - y)));
    if (dx === 0 || dy === 0) return true;
    return dx * dx + dy * dy <= cornerR * cornerR;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const inBg = insideRoundedRect(x, y);
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const inCircle = dx * dx + dy * dy <= r * r;
      const [cr, cg, cb] = inCircle ? ON_ACCENT : ACCENT;
      px[i] = cr;
      px[i + 1] = cg;
      px[i + 2] = cb;
      px[i + 3] = inBg ? 255 : 0;
    }
  }
  return px;
}

function encodePng(size, pixels) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { file: "public/icons/icon-192.png", size: 192, circleRatio: 0.55, rounded: true },
  { file: "public/icons/icon-512.png", size: 512, circleRatio: 0.55, rounded: true },
  { file: "public/icons/icon-512-maskable.png", size: 512, circleRatio: 0.42, rounded: false },
  { file: "public/apple-touch-icon.png", size: 180, circleRatio: 0.55, rounded: true },
];

for (const t of targets) {
  const px = drawIcon(t.size, t);
  writeFileSync(t.file, encodePng(t.size, px));
  console.log(`wrote ${t.file}`);
}
