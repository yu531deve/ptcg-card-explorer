import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// One loading task per PDF url. getDocument streams over HTTP range requests
// (our Vite middleware advertises Accept-Ranges), so large PDFs are not fully
// downloaded — only the pages we render are fetched.
const documents = new Map<string, Promise<pdfjs.PDFDocumentProxy>>();
// Cache cropped card images so re-opening the same card is instant.
const images = new Map<string, Promise<string>>();

function getDocument(url: string): Promise<pdfjs.PDFDocumentProxy> {
  let doc = documents.get(url);
  if (!doc) {
    doc = pdfjs.getDocument({ url, disableAutoFetch: true, disableStream: false }).promise;
    documents.set(url, doc);
  }
  return doc;
}

export function getCardImage(url: string, pageNumber: number, scale = 2): Promise<string> {
  const key = `${url}#${pageNumber}@${scale}`;
  let image = images.get(key);
  if (!image) {
    image = renderCropped(url, pageNumber, scale).catch((error) => {
      images.delete(key);
      throw error;
    });
    images.set(key, image);
  }
  return image;
}

async function renderCropped(url: string, pageNumber: number, scale: number): Promise<string> {
  const doc = await getDocument(url);
  if (pageNumber < 1 || pageNumber > doc.numPages) {
    throw new Error(`Page ${pageNumber} is out of range (PDF has ${doc.numPages} pages).`);
  }
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D context unavailable.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: context, viewport }).promise;
  page.cleanup();

  const box = findContentBox(context, canvas.width, canvas.height);
  const cropped = document.createElement('canvas');
  cropped.width = box.width;
  cropped.height = box.height;
  const croppedContext = cropped.getContext('2d');
  if (!croppedContext) throw new Error('Canvas 2D context unavailable.');
  croppedContext.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);

  const blob = await new Promise<Blob | null>((resolve) => cropped.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to encode cropped card image.');
  return URL.createObjectURL(blob);
}

type Box = { x: number; y: number; width: number; height: number };

// Scans the rendered page and returns the bounding box of the card art only.
// The PDF page also contains a thin "[表に戻す]" link line below the card; that
// line is separated from the card by a white gap and has very low ink density,
// so we isolate the densest contiguous band of rows (the card) and ignore it.
function findContentBox(context: CanvasRenderingContext2D, width: number, height: number): Box {
  const { data } = context.getImageData(0, 0, width, height);
  const whiteThreshold = 244;
  const rowInk = new Array<number>(height).fill(0);
  const colInk = new Array<number>(width).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const isWhite =
        data[i + 3] < 8 ||
        (data[i] >= whiteThreshold && data[i + 1] >= whiteThreshold && data[i + 2] >= whiteThreshold);
      if (!isWhite) {
        rowInk[y]++;
        colInk[x]++;
      }
    }
  }

  const maxRowInk = Math.max(...rowInk);
  if (maxRowInk === 0) return { x: 0, y: 0, width, height };

  // A row belongs to the card if it has substantial horizontal ink coverage.
  // Stray text lines (like the link) fall well below this threshold.
  const rowThreshold = Math.max(maxRowInk * 0.15, width * 0.04);
  const gapTolerance = Math.round(height * 0.01); // bridge tiny white seams in art
  const band = largestRun(rowInk, rowThreshold, gapTolerance);

  // Tighten the left/right edges using only the columns within the card band.
  let minX = width;
  let maxX = -1;
  for (let x = 0; x < width; x++) {
    if (colInk[x] > 0) {
      let inkInBand = 0;
      for (let y = band.start; y <= band.end; y++) {
        const i = (y * width + x) * 4;
        const isWhite =
          data[i + 3] < 8 ||
          (data[i] >= whiteThreshold && data[i + 1] >= whiteThreshold && data[i + 2] >= whiteThreshold);
        if (!isWhite) inkInBand++;
      }
      if (inkInBand > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, width, height };

  const pad = Math.round(Math.min(width, height) * 0.01);
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, band.start - pad);
  const right = Math.min(width, maxX + 1 + pad);
  const bottom = Math.min(height, band.end + 1 + pad);
  return { x, y, width: right - x, height: bottom - y };
}

// Finds the longest contiguous run of rows whose ink is at/above `threshold`,
// allowing up to `gap` consecutive below-threshold rows inside the run.
function largestRun(rowInk: number[], threshold: number, gap: number): { start: number; end: number } {
  let best = { start: 0, end: rowInk.length - 1, length: -1 };
  let runStart = -1;
  let lastHit = -1;

  for (let y = 0; y <= rowInk.length; y++) {
    const hit = y < rowInk.length && rowInk[y] >= threshold;
    if (hit) {
      if (runStart === -1) runStart = y;
      lastHit = y;
    } else if (runStart !== -1 && (y - lastHit > gap || y === rowInk.length)) {
      const length = lastHit - runStart + 1;
      if (length > best.length) best = { start: runStart, end: lastHit, length };
      runStart = -1;
    }
  }
  return { start: best.start, end: best.end };
}
