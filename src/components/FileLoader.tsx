import { useCallback, useState } from 'react';
import { parseCsvText } from '../csv/loadCsv';
import type { CardBundle, CardLanguage } from '../types';

export type LoadedPdf = {
  lang: CardLanguage;
  fileName: string;
  url: string;
  file: File;
};

type Props = {
  onLoaded: (bundle: CardBundle, csvText: string) => void;
  onPdfLoaded: (pdf: LoadedPdf) => void;
};

// PDFs are named like `Card_ID List_JP.pdf` / `Card_ID List_EN.pdf`. Treat any
// name containing "JP" (case-insensitive) as Japanese, everything else English.
function inferPdfLanguage(fileName: string): CardLanguage {
  return /jp/i.test(fileName) ? 'JP' : 'EN';
}

export default function FileLoader({ onLoaded, onPdfLoaded }: Props) {
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const readFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const csvFiles = files.filter((file) => /\.csv$/i.test(file.name));
      const pdfFiles = files.filter((file) => /\.pdf$/i.test(file.name));
      const rejected = files.filter((file) => !/\.(csv|pdf)$/i.test(file.name));

      if (!csvFiles.length && !pdfFiles.length) {
        setError('CSVまたはPDFファイルを選択してください。');
        return;
      }

      setError(null);
      setLoading(true);
      try {
        for (const file of pdfFiles) {
          onPdfLoaded({
            lang: inferPdfLanguage(file.name),
            fileName: file.name,
            url: URL.createObjectURL(file),
            file,
          });
        }
        for (const file of csvFiles) {
          const text = await file.text();
          onLoaded(await parseCsvText(text, file.name), text);
        }
        if (rejected.length) {
          setError(`未対応のファイルは無視しました: ${rejected.map((file) => file.name).join(', ')}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    },
    [onLoaded, onPdfLoaded],
  );

  return (
    <section
      className={`file-loader${isDragging ? ' is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void readFiles(event.dataTransfer.files);
      }}
    >
      <div>
        <p className="eyebrow">Local files</p>
        <h1>CSV・PDFをアップロード（日本語/英語どちらも可）</h1>
        <p>
          カードデータの <code>.csv</code> と、カード画像リストの <code>.pdf</code>（任意）をまとめて選択できます。
          EN/JP の両方を読み込むと言語を切り替えられます。データはブラウザのメモリだけで扱います。
        </p>
      </div>
      <label className="primary-action">
        {isLoading ? '読み込み中...' : 'ファイルを選択'}
        <input
          type="file"
          accept=".csv,text/csv,.pdf,application/pdf"
          multiple
          onChange={(event) => {
            if (event.target.files) void readFiles(event.target.files);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {error ? <p className="inline-error">{error}</p> : null}
    </section>
  );
}
