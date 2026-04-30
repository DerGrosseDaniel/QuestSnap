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

      const padding = 20;
      const maxTextWidth = img.width - 2 * padding;

      const timestamp = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Step 1: Count prompt lines and find font size where everything fits
      const words = prompt.split(' ');
      
      let bestFontSize = 8;

      for (let size = 28; size >= 8; size--) {
        ctx.font = `bold ${size}px "Courier New", monospace`;
        
        // Count how many lines the prompt needs
        let lines = 1;
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth > maxTextWidth && currentLine) {
            lines++;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (lines <= 3) {
          bestFontSize = size;
          break;
        }
      }

      // Step 2: Calculate actual banner height based on line count
      ctx.font = `bold ${bestFontSize}px "Courier New", monospace`;
      const lineHeight = bestFontSize * 1.25;
      const metaFontSize = Math.max(Math.floor(bestFontSize * 0.75), 10);
      
      let promptLineCount = 1;
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
          promptLineCount++;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      const bannerHeight = Math.max(
        promptLineCount * lineHeight + (metaFontSize * 1.25) + 2 * padding,
        80
      );

      canvas.width = img.width;
      canvas.height = img.height + bannerHeight;

      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, img.height, canvas.width, bannerHeight);

      ctx.fillStyle = '#ff5f00';
      ctx.textBaseline = 'top';
      ctx.font = `bold ${bestFontSize}px "Courier New", monospace`;

      // Draw prompt with wrapping
      const promptTop = img.height + padding;
      let lineY = promptTop;
      currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
          ctx.fillText(currentLine, padding, lineY);
          lineY += lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        ctx.fillText(currentLine, padding, lineY);
        lineY += lineHeight;
      }

      // Draw name and timestamp right-aligned as "name, HH:MM"
      ctx.font = `bold ${metaFontSize}px "Courier New", monospace`;
      
      const metaText = name ? `${name}, ${timestamp}` : timestamp;
      const metaWidth = ctx.measureText(metaText).width;
      ctx.fillText(metaText, canvas.width - padding - metaWidth, lineY);

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