const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG generator using Node.js built-in zlib
function createPNG(width, height, getPixelRGBA) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      const offset = y * (rowSize + 1) + 1 + x * 4;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
      rawData[offset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.slice(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

// Pixel shader for vibrant gradient icon with lightning symbol
function getPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  const dist = Math.sqrt(cx * cx + cy * cy);

  // Rounded squircle container
  const radius = 0.46;
  if (Math.abs(cx) > radius || Math.abs(cy) > radius) {
    if (dist > 0.49) return [0, 0, 0, 0]; // Transparent outside
  }

  // Gradient background: Indigo to Violet
  const r = Math.floor(79 + 45 * ny);
  const g = Math.floor(70 + 20 * nx);
  const b = Math.floor(229 + 25 * ny);

  // Simple lightning bolt shape mask in center
  const lx = cx * 2;
  const ly = cy * 2;
  let isBolt = false;

  // Upper segment of bolt
  if (ly >= -0.6 && ly <= 0.05 && lx >= (ly * 0.45 - 0.2) && lx <= (ly * 0.45 + 0.25)) {
    isBolt = true;
  }
  // Lower segment of bolt
  if (ly >= -0.05 && ly <= 0.6 && lx >= ((ly - 0.2) * 0.45 - 0.2) && lx <= ((ly - 0.2) * 0.45 + 0.25)) {
    isBolt = true;
  }

  if (isBolt) {
    return [255, 255, 255, 255]; // White bolt
  }

  return [r, g, b, 255];
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuffer = createPNG(size, size, getPixel);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`✅ Generated ${filePath} (${size}x${size})`);
});
