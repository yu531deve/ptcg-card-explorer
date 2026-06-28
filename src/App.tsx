import { useEffect, useRef, useState } from 'react';
import FileLoader, { type LoadedPdf } from './components/FileLoader';
import PokemonCardViewer from './viewer/PokemonCardViewer';
import { getPdfIndexPageCount } from './lib/pdfPages';
import type { CardBundle, CardLanguage, CardPdf } from './types';

type BundleMap = Partial<Record<CardLanguage, CardBundle>>;
type PdfMap = Partial<Record<CardLanguage, CardPdf>>;

export default function App() {
  const [bundles, setBundles] = useState<BundleMap>({});
  const [pdfs, setPdfs] = useState<PdfMap>({});
  const [selectedLang, setSelectedLang] = useState<CardLanguage | null>(null);
  const pdfUrlsRef = useRef<string[]>([]);

  // Revoke any blob URLs we created when the app unmounts.
  useEffect(() => {
    return () => {
      for (const url of pdfUrlsRef.current) URL.revokeObjectURL(url);
      pdfUrlsRef.current = [];
    };
  }, []);

  function handleLoaded(bundle: CardBundle) {
    setBundles((current) => ({ ...current, [bundle.lang]: bundle }));
    // A PDF for this language may have been registered before its CSV arrived
    // (index page count 0); recompute it now that the card count is known.
    setPdfs((current) => {
      const pdf = current[bundle.lang];
      if (!pdf) return current;
      return { ...current, [bundle.lang]: { ...pdf, indexPageCount: getPdfIndexPageCount(bundle.cards.length) } };
    });
    setSelectedLang((current) => current ?? bundle.lang);
  }

  function handlePdfLoaded({ lang, fileName, url }: LoadedPdf) {
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
  }

  const availableLangs = (['JP', 'EN'] as CardLanguage[]).filter((lang) => bundles[lang]);
  const activeLang = (selectedLang && bundles[selectedLang] ? selectedLang : availableLangs[0]) ?? null;
  const activeBundle = activeLang ? bundles[activeLang] : undefined;
  const activePdf = activeLang ? (pdfs[activeLang] ?? null) : null;

  if (activeBundle) {
    const langSwitch =
      availableLangs.length > 1 ? (
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
      ) : null;

    return (
      <PokemonCardViewer
        key={activeLang ?? 'single'}
        cards={activeBundle.cards}
        pdfUrl={activePdf?.url ?? null}
        indexPageCount={activePdf?.indexPageCount ?? 0}
        langSwitch={langSwitch}
      />
    );
  }

  return (
    <main className="app-shell">
      <FileLoader onLoaded={handleLoaded} onPdfLoaded={handlePdfLoaded} />
    </main>
  );
}
