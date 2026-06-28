import { useCallback, useState } from 'react';
import { loadCsvFile } from '../csv/loadCsv';
import type { CardBundle } from '../types';

type Props = {
  onLoaded: (bundle: CardBundle) => void;
};

export default function FileLoader({ onLoaded }: Props) {
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const readFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((file) => /\.csv$/i.test(file.name));
      if (!files.length) {
        setError('CSVファイルを選択してください。');
        return;
      }

      setError(null);
      setLoading(true);
      try {
        for (const file of files) {
          onLoaded(await loadCsvFile(file));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'CSVの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    },
    [onLoaded],
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
        <p className="eyebrow">Local CSV</p>
        <h1>EN_Card_Data.csv を選択</h1>
        <p>JP_Card_Data.csv は任意で追加できます。読み込んだデータはブラウザのメモリだけで扱います。</p>
      </div>
      <label className="primary-action">
        {isLoading ? '読み込み中...' : 'CSVを選択'}
        <input
          type="file"
          accept=".csv,text/csv"
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
