import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using unpkg CDN matching the installed version
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup note:', e);
  }
}

export interface PdfDocumentInfo {
  numPages: number;
  extractedText: string;
  pageTexts: string[];
}

/**
 * Converts a Base64 Data URL to Uint8Array bytes
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const base64Str = parts[1];
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Failed to decode dataUrl to Uint8Array:', err);
    return null;
  }
}

/**
 * Loads a PDF and extracts text from all pages
 */
export async function extractTextFromPdfData(data: Uint8Array | ArrayBuffer): Promise<PdfDocumentInfo> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data as any,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pageTexts.push(pageText);
    }

    const extractedText = pageTexts.join('\n\n');
    return {
      numPages,
      extractedText,
      pageTexts,
    };
  } catch (err) {
    console.warn('PDF text extraction error:', err);
    return {
      numPages: 0,
      extractedText: '',
      pageTexts: [],
    };
  }
}

/**
 * Renders a specific PDF page onto an HTML5 Canvas element
 */
export async function renderPdfPageToCanvas(
  pdfData: Uint8Array | ArrayBuffer,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<{ width: number; height: number } | null> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData as any,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    if (pageNum < 1 || pageNum > pdfDoc.numPages) return null;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;
    return {
      width: viewport.width,
      height: viewport.height,
    };
  } catch (err) {
    console.warn(`Error rendering PDF page ${pageNum}:`, err);
    return null;
  }
}

/**
 * Converts OKLCH and oklab color functions in CSS string to standard RGB for html2canvas compatibility
 */
export function convertOklchInString(str: string): string {
  let result = str.replace(/oklch\s*\(\s*([0-9.%]+)\s+([0-9.%]+)\s+([0-9.%]+)(?:\s*[\/,]\s*([0-9.%]+))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
    try {
      let L = parseFloat(lStr);
      if (lStr.endsWith('%')) L = L / 100;

      let C = parseFloat(cStr);
      if (cStr.endsWith('%')) C = C / 100;

      let H = parseFloat(hStr);

      let alpha = 1;
      if (aStr) {
        alpha = parseFloat(aStr);
        if (aStr.endsWith('%')) alpha = alpha / 100;
      }

      if (isNaN(L) || isNaN(C) || isNaN(H)) return 'rgb(128, 128, 128)';

      const a_lab = C * Math.cos((H * Math.PI) / 180);
      const b_lab = C * Math.sin((H * Math.PI) / 180);

      const l_ = L + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
      const m_ = L - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
      const s_ = L - 0.0894841775 * a_lab - 1.2914855480 * b_lab;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

      const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055);

      const r = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
      const g = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
      const b = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));

      if (alpha < 1) {
        return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return 'rgb(128, 128, 128)';
    }
  });

  result = result.replace(/oklch\([^)]+\)/gi, 'rgb(128, 128, 128)');
  result = result.replace(/oklab\([^)]+\)/gi, 'rgb(128, 128, 128)');
  result = result.replace(/color-mix\([^)]+\)/gi, 'rgb(128, 128, 128)');

  return result;
}

/**
 * High-Quality PDF Exporter Function using html2canvas & jsPDF with dynamic imports
 */
export async function exportElementToPDF(
  elementId: string, 
  defaultFileName: string, 
  onNotice?: (msg: string) => void
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    if (onNotice) onNotice('Report element not found — switching to browser print.');
    window.print();
    return;
  }

  const [html2canvasModule, jsPDFModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);

  const html2canvas = html2canvasModule.default;
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 5000,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const styleTags = clonedDoc.querySelectorAll('style');
      styleTags.forEach(styleTag => {
        if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('color-mix') || styleTag.textContent.includes('oklab'))) {
          styleTag.textContent = convertOklchInString(styleTag.textContent);
        }
      });

      const allEls = clonedDoc.querySelectorAll('*');
      allEls.forEach(el => {
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('color-mix') || inlineStyle.includes('oklab'))) {
          el.setAttribute('style', convertOklchInString(inlineStyle));
        }
      });

      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.maxHeight = 'none';
        clonedEl.style.height = 'auto';
        clonedEl.style.overflow = 'visible';
        clonedEl.style.position = 'static';
        clonedEl.style.width = '100%';
      }
    }
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const scaledHeight = (imgHeight * pdfWidth) / imgWidth;

  if (scaledHeight <= pdfHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight);
  } else {
    let heightLeft = scaledHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }
  }

  pdf.save(defaultFileName);

  try {
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  } catch (err) {
    console.log('Blob download fallback skipped:', err);
  }
}
