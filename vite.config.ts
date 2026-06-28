import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Serves the local, gitignore-able `data/` folder at `/data/*` with HTTP range
// support so pdf.js can fetch only the pages it needs from large PDFs instead of
// downloading the whole file. Files are streamed from disk and never bundled.
function serveDataFolder() {
  const dataDir = join(process.cwd(), 'data');

  function middleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const url = req.url ?? '';
    if (!url.startsWith('/data/')) return next();

    const rel = decodeURIComponent(url.slice('/data/'.length).split('?')[0]);
    const file = normalize(join(dataDir, rel));
    if (file !== dataDir && !file.startsWith(dataDir + sep)) {
      res.statusCode = 403;
      return res.end();
    }

    let size: number;
    try {
      const stat = statSync(file);
      if (!stat.isFile()) throw new Error('not a file');
      size = stat.size;
    } catch {
      res.statusCode = 404;
      return res.end();
    }

    const type = file.endsWith('.pdf')
      ? 'application/pdf'
      : file.endsWith('.csv')
        ? 'text/csv; charset=utf-8'
        : 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    // Streams the file (or a byte range) to the response, cleaning up safely
    // when the client aborts a request — otherwise an unhandled stream 'error'
    // event (ETIMEDOUT/EPIPE) would crash the dev server.
    function stream(start: number, end: number) {
      const readStream = createReadStream(file, { start, end });
      readStream.on('error', () => {
        readStream.destroy();
        if (!res.headersSent) res.statusCode = 500;
        res.end();
      });
      const cleanup = () => readStream.destroy();
      res.on('close', cleanup);
      res.on('error', cleanup);
      readStream.pipe(res);
    }

    const range = req.headers.range;
    const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
    if (match) {
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start > end) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${size}`);
        return res.end();
      }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      stream(start, end);
    } else {
      res.setHeader('Content-Length', String(size));
      stream(0, size - 1);
    }
  }

  return {
    name: 'serve-data-folder',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), serveDataFolder()],
});
