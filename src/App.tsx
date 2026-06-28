import { useEffect, useRef, useState } from 'react';
import FileLoader, { type LoadedPdf } from './components/FileLoader';
import PokemonCardViewer from './viewer/PokemonCardViewer';
import { parseCsvText } from './csv/loadCsv';
import { getPdfIndexPageCount } from './lib/pdfPages';
import { clearAll, loadAll, saveCsv, savePdf } from './lib/cardStore';
import type { CardBundle, CardLanguage, CardPdf } from './types';

type BundleMap = Partial<Record<CardLanguage, CardBundle>>;
type PdfMap = Partial<Record<CardLanguage, CardPdf>>;

export default function App() {
  const [bundles, setBundles] = useState<BundleMap>({});
  const [pdfs, setPdfs] = useState<PdfMap>({});
  const [selectedLang, setSelectedLang] = useState<CardLanguage | null>(null);
  const [restoring, setRestoring] = useState(true);
  const pdfUrlsRef = useRef<string[]>([]);

  // Restore previously uploaded CSV/PDF files from IndexedDB on startup.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { csvs, pdfs: storedPdfs } = await loadAll();
      if (cancelled) return;
      const nextBundles: BundleMap = {};
      const counts = new Map<CardLanguage, number>();
      for (const csv of csvs) {
        try {
          const bundle = await parseCsvText(csv.text, csv.fileName);
          nextBundles[bundle.lang] = bundle;
          counts.set(bundle.lang, bundle.cards.length);
        } catch {
          // Skip an unparseable stored file rather than blocking startup.
        }
      }
      const nextPdfs: PdfMap = {};
      for (const pdf of storedPdfs) {
        const url = URL.createObjectURL(pdf.blob);
        pdfUrlsRef.current.push(url);
        nextPdfs[pdf.lang] = {
          lang: pdf.lang,
          fileName: pdf.fileName,
          url,
          indexPageCount: getPdfIndexPageCount(counts.get(pdf.lang) ?? 0),
        };
      }
      if (cancelled) return;
      setBundles(nextBundles);
      setPdfs(nextPdfs);
      setRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Revoke any blob URLs we created when the app unmounts.
  useEffect(() => {
    return () => {
      for (const url of pdfUrlsRef.current) URL.revokeObjectURL(url);
      pdfUrlsRef.current = [];
    };
  }, []);

  function handleLoaded(bundle: CardBundle, csvText: string) {
    setBundles((current) => ({ ...current, [bundle.lang]: bundle }));
    // A PDF for this language may have been registered before its CSV arrived
    // (index page count 0); recompute it now that the card count is known.
    setPdfs((current) => {
      const pdf = current[bundle.lang];
      if (!pdf) return current;
      return { ...current, [bundle.lang]: { ...pdf, indexPageCount: getPdfIndexPageCount(bundle.cards.length) } };
    });
    setSelectedLang((current) => current ?? bundle.lang);
    void saveCsv(bundle.lang, bundle.fileName, csvText);
  }

  function handlePdfLoaded({ lang, fileName, url, file }: LoadedPdf) {
    pdfUrlsRef.current.push(url);
    setPdfs((current) => {
      const previous = current[lang];
      if (previous) URL.revokeObjectURL(previous.url);
      const sourceCount = bundles[lang]?.cards.length ?? 0;
      return {
        ...current,
        [lang]: { lang, fileName, url, indexPageCount: getPdfIndexPageCount(sourceCount) },
      };
    });
    void savePdf(lang, fileName, file);
  }

  async function handleReset() {
    for (const url of pdfUrlsRef.current) URL.revokeObjectURL(url);
    pdfUrlsRef.current = [];
    setBundles({});
    setPdfs({});
    setSelectedLang(null);
    await clearAll();
  }

  const availableLangs = (['JP', 'EN'] as CardLanguage[]).filter((lang) => bundles[lang]);
  const activeLang = (selectedLang && bundles[selectedLang] ? selectedLang : availableLangs[0]) ?? null;
  const activeBundle = activeLang ? bundles[activeLang] : undefined;
  const activePdf = activeLang ? (pdfs[activeLang] ?? null) : null;

  if (restoring) {
    return <main className="app-shell" />;
  }

  if (activeBundle) {
    const headerControls = (
      <div className="viewer-data-controls">
        {availableLangs.length > 1 ? (
          <div className="lang-switch" role="group" aria-label="表示言語">
            {availableLangs.map((lang) => (
              <button
                key={lang}
                type="button"
                className={lang === activeLang ? 'is-active' : ''}
                aria-pressed={lang === activeLang}
                onClick={() => setSelectedLang(lang)}
              >
                {lang === 'JP' ? '日本語' : 'English'}
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="data-reset" onClick={() => void handleReset()} title="別のファイルを読み込む">
          別ファイル
        </button>
      </div>
    );

    return (
      <PokemonCardViewer
        key={activeLang ?? 'single'}
        cards={activeBundle.cards}
        pdfUrl={activePdf?.url ?? null}
        indexPageCount={activePdf?.indexPageCount ?? 0}
        lang={activeLang ?? 'JP'}
        langSwitch={headerControls}
      />
    );
  }

  return (
    <main className="app-shell">
      <FileLoader onLoaded={handleLoaded} onPdfLoaded={handlePdfLoaded} />
    </main>
  );
}
