import sharp from 'sharp';

/**
 * Loads an image buffer from a data URL, http(s) URL, or local file.
 */
export async function loadImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('data:image/')) {
      const parts = imageUrl.split(',');
      const base64Data = parts[1] || '';
      return Buffer.from(base64Data, 'base64');
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ShopShot/1.0',
        },
      });
      if (!res.ok) {
        console.warn(`[LocalProcessor] Failed to fetch image ${imageUrl}: status ${res.status}`);
        return null;
      }
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    // Attempt local file if it exists
    const fs = await import('fs');
    if (fs.existsSync(imageUrl)) {
      return fs.readFileSync(imageUrl);
    }

    return null;
  } catch (err: any) {
    console.error(`[LocalProcessor] Error loading image ${imageUrl}:`, err.message);
    return null;
  }
}

/**
 * Performs edge-connected BFS background removal on the user's actual image.
 * Safely removes backgrounds (white, light studio, solid, or slight gradient)
 * without cutting into product interiors, returning a high-res transparent PNG.
 */
export async function smartRemoveBackground(
  imageUrl: string
): Promise<{ dataUrl: string; width: number; height: number; buffer: Buffer }> {
  const buffer = await loadImageBuffer(imageUrl);

  if (!buffer) {
    // If image could not be loaded, return original
    return {
      dataUrl: imageUrl,
      width: 1024,
      height: 1024,
      buffer: Buffer.alloc(0),
    };
  }

  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    const origWidth = meta.width || 1024;
    const origHeight = meta.height || 1024;

    // Constrain max dimension to 1400px for speed and memory efficiency
    const maxDim = 1400;
    let working = img;
    if (origWidth > maxDim || origHeight > maxDim) {
      working = working.resize(maxDim, maxDim, { fit: 'inside' });
    }

    const { data, info } = await working
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;

    // Sample border & corner pixels to detect the background color
    const samples: Array<[number, number, number]> = [];
    const getPixel = (x: number, y: number): [number, number, number] => {
      const idx = (y * w + x) * 4;
      return [data[idx] ?? 0, data[idx + 1] ?? 0, data[idx + 2] ?? 0];
    };

    const step = Math.max(1, Math.floor(Math.min(w, h) / 30));
    for (let x = 0; x < w; x += step) {
      samples.push(getPixel(x, 0), getPixel(x, h - 1));
    }
    for (let y = 0; y < h; y += step) {
      samples.push(getPixel(0, y), getPixel(w - 1, y));
    }

    // Always include exact 4 corners
    samples.push(getPixel(0, 0), getPixel(w - 1, 0), getPixel(0, h - 1), getPixel(w - 1, h - 1));

    const avgR = samples.reduce((acc, s) => acc + s[0], 0) / samples.length;
    const avgG = samples.reduce((acc, s) => acc + s[1], 0) / samples.length;
    const avgB = samples.reduce((acc, s) => acc + s[2], 0) / samples.length;

    const isLightBg = avgR > 190 && avgG > 190 && avgB > 190;
    const isDarkBg = avgR < 60 && avgG < 60 && avgB < 60;
    const tolerance = isLightBg ? 65 : isDarkBg ? 55 : 48;

    const colorDist = (r: number, g: number, b: number) => {
      return Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);
    };

    const canBeBg = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      const dist = colorDist(r, g, b);
      if (dist <= tolerance) return true;
      if (isLightBg && r > 232 && g > 232 && b > 232) return true;
      if (isDarkBg && r < 25 && g < 25 && b < 25) return true;
      return false;
    };

    // BFS Flood Fill from edges
    const isBg = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const pushQueue = (x: number, y: number) => {
      const pos = y * w + x;
      if (isBg[pos] === 0 && canBeBg(x, y)) {
        isBg[pos] = 1;
        queue[tail++] = pos;
      }
    };

    // Seed BFS from all outer boundary pixels
    for (let x = 0; x < w; x++) {
      pushQueue(x, 0);
      pushQueue(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      pushQueue(0, y);
      pushQueue(w - 1, y);
    }

    while (head < tail) {
      const pos = queue[head++];
      if (pos === undefined) continue;
      const px = pos % w;
      const py = Math.floor(pos / w);

      if (px > 0) pushQueue(px - 1, py);
      if (px < w - 1) pushQueue(px + 1, py);
      if (py > 0) pushQueue(px, py - 1);
      if (py < h - 1) pushQueue(px, py + 1);
    }

    // Set transparency on background pixels
    for (let i = 0; i < w * h; i++) {
      if (isBg[i] === 1) {
        data[i * 4 + 3] = 0;
      }
    }

    // 1-pixel anti-aliased edge smoothing on boundary
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const pos = y * w + x;
        if (isBg[pos] === 0) {
          const hasBgNeighbor =
            isBg[pos - 1] === 1 ||
            isBg[pos + 1] === 1 ||
            isBg[pos - w] === 1 ||
            isBg[pos + w] === 1;

          if (hasBgNeighbor) {
            const idx = pos * 4;
            const r = data[idx] ?? 0;
            const g = data[idx + 1] ?? 0;
            const b = data[idx + 2] ?? 0;
            const dist = colorDist(r, g, b);
            const alpha = Math.min(255, Math.max(100, Math.round(140 + dist * 1.5)));
            data[idx + 3] = alpha;
          }
        }
      }
    }

    const pngBuffer = await sharp(data, {
      raw: {
        width: w,
        height: h,
        channels: 4,
      },
    })
      .png({ compressionLevel: 6 })
      .toBuffer();

    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    return {
      dataUrl,
      width: w,
      height: h,
      buffer: pngBuffer,
    };
  } catch (err: any) {
    console.error('[LocalProcessor] Smart background removal failed:', err.message);
    return {
      dataUrl: imageUrl,
      width: 1024,
      height: 1024,
      buffer: Buffer.alloc(0),
    };
  }
}

/**
 * Creates studio scene backdrops and composites the user's product onto them.
 */
export async function smartGenerateScenes(
  imageUrl: string,
  variationCount = 4
): Promise<Array<{ url: string; width: number; height: number }>> {
  // First obtain the cut-out of the user's product
  const cutout = await smartRemoveBackground(imageUrl);
  const productBuffer = cutout.buffer.length > 0 ? cutout.buffer : await loadImageBuffer(imageUrl);

  const count = Math.min(Math.max(variationCount, 1), 4);
  const results: Array<{ url: string; width: number; height: number }> = [];

  // Scene backdrop themes
  const themes = [
    {
      name: 'Minimalist Studio',
      bgSvg: `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g1" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="60%" stop-color="#f1f3f5"/>
            <stop offset="100%" stop-color="#e2e6ea"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g1)"/>
        <ellipse cx="512" cy="740" rx="320" ry="40" fill="rgba(0,0,0,0.06)"/>
      </svg>`,
    },
    {
      name: 'Warm Sunset Glow',
      bgSvg: `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff5eb"/>
            <stop offset="50%" stop-color="#fed7aa"/>
            <stop offset="100%" stop-color="#f97316" stop-opacity="0.3"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g2)"/>
        <ellipse cx="512" cy="740" rx="340" ry="45" fill="rgba(194,65,12,0.1)"/>
      </svg>`,
    },
    {
      name: 'Luxury Slate Marble',
      bgSvg: `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g3" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="70%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g3)"/>
        <ellipse cx="512" cy="740" rx="320" ry="38" fill="rgba(0,0,0,0.4)"/>
      </svg>`,
    },
    {
      name: 'Cyber Neon Horizon',
      bgSvg: `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g4" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#18181b"/>
            <stop offset="75%" stop-color="#09090b"/>
            <stop offset="100%" stop-color="#000000"/>
          </radialGradient>
          <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.25"/>
            <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.25"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g4)"/>
        <ellipse cx="512" cy="740" rx="350" ry="45" fill="url(#neon)"/>
      </svg>`,
    },
  ];

  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length]!;
    try {
      if (productBuffer && productBuffer.length > 0) {
        // Resize product to ~620px to sit beautifully inside the 1024x1024 scene
        const resizedProduct = await sharp(productBuffer)
          .resize(620, 620, { fit: 'inside' })
          .png()
          .toBuffer();

        const prodMeta = await sharp(resizedProduct).metadata();
        const pw = prodMeta.width || 620;
        const ph = prodMeta.height || 620;

        const left = Math.round((1024 - pw) / 2);
        const top = Math.round(720 - ph); // align bottom to contact plane

        const composite = await sharp(Buffer.from(theme.bgSvg))
          .composite([{ input: resizedProduct, left, top: Math.max(80, top) }])
          .jpeg({ quality: 90 })
          .toBuffer();

        results.push({
          url: `data:image/jpeg;base64,${composite.toString('base64')}`,
          width: 1024,
          height: 1024,
        });
      } else {
        // Fallback backdrop
        const svgBuf = await sharp(Buffer.from(theme.bgSvg)).jpeg().toBuffer();
        results.push({
          url: `data:image/jpeg;base64,${svgBuf.toString('base64')}`,
          width: 1024,
          height: 1024,
        });
      }
    } catch (err: any) {
      console.warn(`[LocalProcessor] Failed to composite scene variation ${i}:`, err.message);
      results.push({
        url: imageUrl,
        width: 1024,
        height: 1024,
      });
    }
  }

  return results;
}

/**
 * Performs smart local upscaling on the user's actual image.
 */
export async function smartUpscale(
  imageUrl: string,
  scale: 2 | 4 = 2
): Promise<{ dataUrl: string; width: number; height: number }> {
  const buffer = await loadImageBuffer(imageUrl);
  if (!buffer) {
    return { dataUrl: imageUrl, width: 1024 * scale, height: 1024 * scale };
  }

  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    const w = (meta.width || 1024) * scale;
    const h = (meta.height || 1024) * scale;

    const upscaled = await img
      .resize(w, h, {
        kernel: 'lanczos3',
      })
      .sharpen({ sigma: 1.0, m1: 0.5, m2: 1.5 })
      .png({ compressionLevel: 6 })
      .toBuffer();

    return {
      dataUrl: `data:image/png;base64,${upscaled.toString('base64')}`,
      width: w,
      height: h,
    };
  } catch (err: any) {
    console.error('[LocalProcessor] Smart upscale failed:', err.message);
    return { dataUrl: imageUrl, width: 1024 * scale, height: 1024 * scale };
  }
}

/**
 * Performs magic editing on the user's actual image.
 */
export async function smartMagicEdit(
  imageUrl: string,
  instruction = ''
): Promise<{ dataUrl: string; width: number; height: number }> {
  const buffer = await loadImageBuffer(imageUrl);
  if (!buffer) {
    return { dataUrl: imageUrl, width: 1024, height: 1024 };
  }

  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    const w = meta.width || 1024;
    const h = meta.height || 1024;

    // Apply lighting and vibrance enhancements
    const isBrighten = instruction.toLowerCase().includes('bright') || instruction.toLowerCase().includes('light');
    const isWarm = instruction.toLowerCase().includes('warm') || instruction.toLowerCase().includes('gold');

    let pipeline = img
      .modulate({
        brightness: isBrighten ? 1.12 : 1.04,
        saturation: isWarm ? 1.15 : 1.08,
      })
      .sharpen();

    const outputBuffer = await pipeline.png().toBuffer();

    return {
      dataUrl: `data:image/png;base64,${outputBuffer.toString('base64')}`,
      width: w,
      height: h,
    };
  } catch (err: any) {
    console.error('[LocalProcessor] Smart magic edit failed:', err.message);
    return { dataUrl: imageUrl, width: 1024, height: 1024 };
  }
}
