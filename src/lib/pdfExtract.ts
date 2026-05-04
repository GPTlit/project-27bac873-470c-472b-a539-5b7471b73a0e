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