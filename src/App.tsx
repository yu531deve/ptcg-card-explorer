import { useEffect, useState } from 'react';
import FileLoader from './components/FileLoader';
import PokemonCardViewer from './viewer/PokemonCardViewer';
import { loadDataDir } from './csv/loadDataDir';
import { getPdfIndexPageCount } from './lib/pdfPages';
import type { CardBundle, CardLanguage, CardPdf } from './types';

type BundleMap = Partial<Record<CardLanguage, CardBundle>>;
type PdfMap = Partial<Record<CardLanguage, CardPdf>>;

export default function App() {
  const [bundles, setBundles] = useState<BundleMap>({});
  const [pdfs, setPdfs] = useState<PdfMap>({});
  const [autoLoading, setAutoLoading] = useState(true);

  // Auto-load CSV (and register PDFs) from the local data/ folder on startup.
  useEffect(() => {
    let cancelled = false;
    loadDataDir()
      .then(({ bundles: loaded, pdfs: loadedPdfs }) => {
        if (cancelled) return;
        if (loaded.length) {
          setBundles((current) => {
            const next = { ...current };
            for (const bundle of loaded) next[bundle.lang] = bundle;
            return next;
          });
        }
        if (loadedPdfs.length) {
          const counts = new Map(loaded.map((bundle) => [bundle.lang, bundle.cards.length]));
          setPdfs((current) => {
            const next = { ...current };
            for (const pdf of loadedPdfs) {
              const sourceCount = counts.get(pdf.lang) ?? loaded[0]?.cards.length ?? 0;
              next[pdf.lang] = { ...pdf, indexPageCount: getPdfIndexPageCount(sourceCount) };
            }
            return next;
          });
        }
      })
      .finally(() => {
        if (!cancelled) setAutoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryBundle = bundles.EN ?? bundles.JP;
  const cards = primaryBundle?.cards ?? [];
  const primaryPdf = primaryBundle ? (pdfs[primaryBundle.lang] ?? pdfs.JP ?? pdfs.EN ?? null) : null;

  if (cards.length > 0) {
    return (
      <PokemonCardViewer
        cards={cards}
        pdfUrl={primaryPdf?.url ?? null}
        indexPageCount={primaryPdf?.indexPageCount ?? 0}
      />
    );
  }

  if (autoLoading) {
    return (
      <main className="app-shell">
        <section className="file-loader">
          <div>
            <p className="eyebrow">Local data/</p>
            <h1>data/ から読み込み中...</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <FileLoader onLoaded={(bundle) => setBundles((current) => ({ ...current, [bundle.lang]: bundle }))} />
    </main>
  );
}
