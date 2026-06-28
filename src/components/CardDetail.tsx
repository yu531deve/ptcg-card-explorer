import { useEffect, type ReactNode } from 'react';
import EnergyPip from './EnergyPip';
import CardImage from './CardImage';
import { kindLabel } from '../lib/labels';
import type { Card, CardPdf } from '../types';

type Props = {
  card: Card;
  comparisonCard?: Card | null;
  pdf?: CardPdf | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onPdfLoaded: (file: File) => void;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
};

export default function CardDetail({
  card,
  comparisonCard,
  pdf,
  isFavorite,
  onToggleFavorite,
  isPinned,
  onTogglePin,
  onPdfLoaded,
  onClose,
  onNext,
  onPrevious,
}: Props) {
  const activeFlags = Object.entries(card.flags)
    .filter(([, active]) => active)
    .map(([flag]) => flag);
  const imagePage = pdf ? card.cardId + pdf.indexPageCount : null;
  const abilities = card.moves.filter((move) => move.isAbility);
  const attacks = card.moves.filter((move) => !move.isAbility);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') onPrevious?.();
      else if (event.key === 'ArrowRight') onNext?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrevious, onNext]);

  return (
    <aside className="detail-panel" aria-label="カード詳細">
      <header className="detail-header">
        <button type="button" className="back-button" onClick={onClose} aria-label="一覧に戻る">
          ← 戻る
        </button>
        <div className="detail-title">
          <span className="tile-id">#{card.cardId}</span>
          <h2>{card.name}</h2>
        </div>
        <div className="detail-header-actions">
          {onTogglePin ? (
            <button
              type="button"
              className={`pin-button${isPinned ? ' is-active' : ''}`}
              onClick={onTogglePin}
              aria-pressed={isPinned}
              title={isPinned ? '比較から外す' : '比較に追加'}
            >
              {isPinned ? '📌 比較中' : '📌 比較に追加'}
            </button>
          ) : null}
          {onToggleFavorite ? (
            <button
              type="button"
              className={`fav-button${isFavorite ? ' is-active' : ''}`}
              onClick={onToggleFavorite}
              aria-pressed={isFavorite}
              title={isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          ) : null}
          <button type="button" className="icon-button" onClick={onClose} aria-label="詳細を閉じる" title="閉じる">
            ×
          </button>
        </div>
      </header>

      <div className="detail-nav">
        <button type="button" onClick={onPrevious} disabled={!onPrevious}>
          ← 前のカード
        </button>
        <button type="button" onClick={onNext} disabled={!onNext}>
          次のカード →
        </button>
      </div>

      <section className="detail-section image-section">
        <div className="section-heading-row">
          <h3>カード画像</h3>
          <label className="small-file-action">
            PDFを選択
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPdfLoaded(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </div>
        {pdf && imagePage ? (
          <>
            <p className="image-meta">
              {pdf.fileName} / page {imagePage}
            </p>
            <CardImage
              key={`${pdf.url}-${imagePage}`}
              url={pdf.url}
              page={imagePage}
              alt={`${card.name} card image`}
            />
          </>
        ) : (
          <div className="pdf-empty">
            <p>PDF未選択</p>
          </div>
        )}
      </section>

      <section className="detail-section">
        <dl className="detail-fields">
          <Field label="種別" value={kindLabel(card.kind)} />
          <Field label="進化段階/種類" value={card.stageOrType} />
          <Field label="HP" value={card.hp ?? 'n/a'} />
          <Field label="タイプ">
            <EnergyPip value={card.type} />
          </Field>
          <Field label="弱点">
            <EnergyPip value={card.weakness} />
          </Field>
          <Field label="抵抗力">
            <EnergyPip value={card.resistance} />
          </Field>
          <Field label="にげる" value={card.retreat ?? 'n/a'} />
          <Field label="拡張" value={card.expansion} />
          <Field label="コレクション番号" value={card.collectionNo} />
          <Field label="進化前" value={card.prevStage ?? 'n/a'} />
          <Field label="ルール" value={card.rule} />
          <Field label="カテゴリ" value={card.category} />
        </dl>

        {activeFlags.length ? (
          <div className="flag-list">
            {activeFlags.map((flag) => (
              <span key={flag}>{flag}</span>
            ))}
          </div>
        ) : null}
      </section>

      {abilities.length ? (
        <section className="detail-section">
          <h3>特性</h3>
          <div className="move-list ability-list">
            {abilities.map((move, index) => (
              <details key={`ability-${move.name}-${index}`} open>
                <summary>
                  <span className="ability-tag">特性</span>
                  <span>{move.name.replace(/^\[特性\]/, '')}</span>
                </summary>
                <div className="move-body">
                  <p>{move.effect}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="detail-section">
        <h3>ワザ</h3>
        <div className="move-list">
          {attacks.length ? (
            attacks.map((move, index) => (
              <details key={`${move.name}-${index}`} open={index === 0}>
                <summary>
                  <span>{move.name}</span>
                  <strong>{move.damage}</strong>
                </summary>
                <div className="move-body">
                  <EnergyPip value={move.cost} />
                  {move.dpe != null ? <p className="move-dpe">DPE: {move.dpe}</p> : null}
                  <p>{move.effect}</p>
                </div>
              </details>
            ))
          ) : (
            <p className="muted">n/a</p>
          )}
        </div>
      </section>

      {comparisonCard ? (
        <section className="detail-section comparison-section">
          <h3>{comparisonCard._lang} との比較</h3>
          <dl className="detail-fields">
            <Field label="名前" value={comparisonCard.name} />
            <Field label="進化段階/種類" value={comparisonCard.stageOrType} />
            <Field label="ルール" value={comparisonCard.rule} />
            <Field label="カテゴリ" value={comparisonCard.category} />
          </dl>
          <div className="comparison-moves">
            {comparisonCard.moves.map((move, index) => (
              <div key={`${move.name}-${index}`}>
                <strong>{move.name}</strong>
                <span>{move.damage}</span>
                <p>{move.effect}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="detail-section">
        <h3>全フィールド</h3>
        <table className="raw-table">
          <tbody>
            {Object.entries(card.raw).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{value || 'n/a'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </aside>
  );
}

function Field({ label, value, children }: { label: string; value?: string | number; children?: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children ?? value}</dd>
    </div>
  );
}
