import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractPdfSample(file: File, maxPages = 5): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = Math.min(maxPages, pdf.numPages);
  let out = '';
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    out += text + '\n\n';
    if (out.length > 6000) break;
  }
  return out.slice(0, 6000);
}

export async function extractPdfFirstPageImage(
  file: File,
  maxWidth = 800,
): Promise<Blob | null> {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, maxWidth / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85),
    );
  } catch (e) {
    console.error('cover render failed', e);
    return null;
  }
}

export async function getPdfPageCount(source: File | string): Promise<number | null> {
  try {
    let task;
    if (typeof source === 'string') {
      task = pdfjsLib.getDocument({ url: source });
    } else {
      const buf = await source.arrayBuffer();
      task = pdfjsLib.getDocument({ data: buf });
    }
    const pdf = await task.promise;
    return pdf.numPages;
  } catch (e) {
    console.error('page count failed', e);
    return null;
  }
}