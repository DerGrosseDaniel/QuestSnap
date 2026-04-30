async function generateFilename(prompt: string, name: string, index: number): Promise<string> {
  const sanitizeForFilename = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-zäöüß0-9\s\.]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\.$/, '')
      .trim();

  const cleanedName = sanitizeForFilename(name) || 'anonymous';
  let cleanedPrompt = sanitizeForFilename(prompt);

  if (cleanedPrompt.length > 100) {
    cleanedPrompt = cleanedPrompt.substring(0, 100);
  }

  return `QuestSnap-${String(index + 1).padStart(3, '0')}-${cleanedName}-${cleanedPrompt}.jpg`;
}

export async function processImageWithBanner(imageBlob: Blob, prompt: string, name: string, index: number): Promise<{ blob: Blob; filename: string }> {
  const filename = await generateFilename(prompt, name, index);
  
  const blob = await new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const bannerHeight = Math.max(img.height * 0.12, 80);
      canvas.width = img.width;
      canvas.height = img.height + bannerHeight;

      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, img.height, canvas.width, bannerHeight);

      ctx.fillStyle = '#ff5f00';
      ctx.textBaseline = 'top';

      const padding = 20;
      const maxTextWidth = canvas.width - 2 * padding;

      const timestamp = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Use much smaller font sizes to keep text compact
      let fontSize = Math.min(bannerHeight * 0.18, 40);
      const minFontSize = 8;

      for (let size = fontSize; size >= minFontSize; size--) {
        ctx.font = `bold ${size}px "Courier New", monospace`;

        const nameWidth = name ? ctx.measureText(name).width : 0;
        const tsWidth = ctx.measureText(timestamp).width;
        const gapWidth = ctx.measureText('  ').width;

        if (nameWidth + gapWidth + tsWidth <= maxTextWidth) {
          fontSize = size;
          break;
        }

        if (size === minFontSize) {
          fontSize = minFontSize;
        }
      }

      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      const lineHeight = fontSize * 1.25;

      // Draw prompt with wrapping
      const promptTop = img.height + padding;
      const words = prompt.split(' ');
      let line = '';
      let lineY = promptTop;
      const maxLines = Math.floor((bannerHeight - 2 * padding) / lineHeight);
      let linesDrawn = 0;

      for (const word of words) {
        const testLine = line ? line + ' ' + word : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxTextWidth && line) {
          ctx.fillText(line, padding, lineY);
          lineY += lineHeight;
          line = word;
          linesDrawn++;
          if (linesDrawn >= maxLines - 1) break;
        } else {
          line = testLine;
        }
      }

      if (line && linesDrawn < maxLines) {
        ctx.fillText(line, padding, lineY);
        lineY += lineHeight;
      }

      // Draw name (left) and timestamp (right) on the next line
      const metaY = Math.min(lineY, img.height + bannerHeight - lineHeight - padding);

      if (name) {
        ctx.fillText(name, padding, metaY);
      }

      const tsWidth = ctx.measureText(timestamp).width;
      ctx.fillText(timestamp, canvas.width - padding - tsWidth, metaY);

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