import { useEffect, useState } from 'react';
import { getCardImage } from '../lib/pdfRender';

type Props = {
  url: string;
  page: number;
  alt: string;
  scale?: number;
  className?: string;
  /** Compact thumbnail mode: smaller loading box, no error text. */
  thumb?: boolean;
};

export default function CardImage({ url, page, alt, scale = 2, className, thumb = false }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setError(null);
    getCardImage(url, page, scale)
      .then((result) => {
        if (!cancelled) setSrc(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '画像の生成に失敗しました。');
      });
    return () => {
      cancelled = true;
    };
  }, [url, page, scale]);

  if (error) {
    return thumb ? <span className={`${className ?? 'card-thumb'} is-empty`} /> : <p className="inline-error">{error}</p>;
  }
  if (!src) {
    return thumb ? (
      <span className={`${className ?? 'card-thumb'} is-loading`} />
    ) : (
      <div className="card-image-loading">画像を生成中...</div>
    );
  }
  return <img className={className ?? 'card-image'} src={src} alt={alt} loading="lazy" draggable={false} />;
}
