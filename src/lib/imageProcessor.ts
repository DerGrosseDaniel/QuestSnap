async function generateFilename(prompt: string, index: number, name: string): Promise<string> {
  const sanitizeForFilename = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-zäöüß0-9\s.]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\.$/, '')
      .trim();

  let cleanedPrompt = sanitizeForFilename(prompt);
  let cleanedName = sanitizeForFilename(name);

  if (cleanedPrompt.length > 100) {
    cleanedPrompt = cleanedPrompt.substring(0, 100);
  }

  const namePart = cleanedName ? `-${cleanedName}` : '';

  return `QuestSnap-${String(index + 1).padStart(3, '0')}${namePart}-${cleanedPrompt}.jpg`;
}

function centerCropToSquare(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destSize: number,
) {
  const srcSize = Math.min(img.width, img.height);
  const srcX = (img.width - srcSize) / 2;
  const srcY = (img.height - srcSize) / 2;
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, destX, destY, destSize, destSize);
}

async function loadFrame(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load frame.png'));
    img.src = './frame.png';
  });
}

const CANVAS_W = 2393;
const CANVAS_H = 2870;
const TEXT_Y = 2260;
const TEXT_H = CANVAS_H - TEXT_Y;
const TEXT_PAD_H = Math.round(CANVAS_W * 0.07);
const TEXT_PAD_V = Math.round(TEXT_H * 0.07);
const TEXT_MAX_W = CANVAS_W - 2 * TEXT_PAD_H;
const TEXT_MAX_H = TEXT_H - 2 * TEXT_PAD_V;
const AREA_BOTTOM = TEXT_Y + TEXT_H - TEXT_PAD_V;
const LINE_HEIGHT_RATIO = 1.04;
const GLYPH_SAFETY = 0.3;
const MAX_FONT_SIZE = Math.floor(TEXT_MAX_H / LINE_HEIGHT_RATIO);

function countLines(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number): number {
  let lines = 1;
  let line = '';
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines++;
      line = word;
    } else {
      line = testLine;
    }
  }
  return lines;
}

export async function calcOptimalFontSize(prompt: string): Promise<number> {
  await document.fonts.load('1px "PermanentMarker"');

  const words = prompt.split(' ');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 12;

  let low = 12;
  let high = MAX_FONT_SIZE;
  let bestSize = 12;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    ctx.font = `${mid}px "PermanentMarker"`;

    const lines = countLines(ctx, words, TEXT_MAX_W);
    const lastLineTop = TEXT_Y + TEXT_PAD_V + (lines - 1) * mid * LINE_HEIGHT_RATIO;
    const textBottom = lastLineTop + mid * (1 + GLYPH_SAFETY);

    if (textBottom <= AREA_BOTTOM) {
      bestSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestSize;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  ctx.font = `${fontSize}px "PermanentMarker"`;

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function processImageWithBanner(
  imageBlob: Blob,
  prompt: string,
  index: number,
  name: string,
): Promise<{ blob: Blob; filename: string }> {
  const filename = await generateFilename(prompt, index, name);

  await document.fonts.ready;

  const blob = await new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.filter = 'blur(5px)';
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      centerCropToSquare(ctx, img, 135, 135, 2140);

      try {
        const frameImg = await loadFrame();
        ctx.drawImage(frameImg, 0, 0, CANVAS_W, CANVAS_H);
      } catch (e) {
        console.warn('Frame not loaded, continuing without overlay', e);
      }

      const bestSize = await calcOptimalFontSize(prompt);

      ctx.textBaseline = 'top';
      ctx.font = `${bestSize}px "PermanentMarker"`;
      ctx.fillStyle = '#000000';

      const lineHeight = bestSize * LINE_HEIGHT_RATIO;
      const lines = wrapText(ctx, prompt, bestSize, TEXT_MAX_W);

      let lineY = TEXT_Y + TEXT_PAD_V;
      for (const line of lines) {
        ctx.fillText(line, TEXT_PAD_H, lineY);
        lineY += lineHeight;
      }

      if (name) {
        const nameFontSize = 100;
        ctx.font = `${nameFontSize}px "PermanentMarker"`;
        ctx.fillStyle = '#000000';

        const nameX = Math.round(CANVAS_W - 135 / 2) + 50;
        const nameStartY = CANVAS_H - 800;

        const chars = name.split('');
        for (let i = 0; i < chars.length; i++) {
          ctx.save();
          ctx.translate(nameX, nameStartY - i * nameFontSize);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(chars[i], 0, 0);
          ctx.restore();
        }
      }

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.95,
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });

  return { blob, filename };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
