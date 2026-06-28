import { useState } from 'react';
import EnergyPip from './EnergyPip';
import CardImage from './CardImage';
import { kindLabel } from '../lib/labels';
import type { Card, CardPdf } from '../types';

type Props = {
  cards: Card[];
  onOpen: (card: Card) => void;
  onRemove: (cardId: number) => void;
  onClear: () => void;
  pdf?: CardPdf | null;
};

// Search-mode side panel: a "一時保存" tray of pinned cards laid out so they can
// be compared side by side. Click a card to open its full detail.
export default function ComparePanel({ cards, onOpen, onRemove, onClear, pdf }: Props) {
  const [imageOnly, setImageOnly] = useState(false);

  return (
    <div className={`compare-panel${imageOnly ? ' is-image-only' : ''}`}>
      <div className="side-panel-head">
        <h2>比較トレイ{cards.length ? ` (${cards.length})` : ''}</h2>
        <div className="side-head-actions">
          {cards.length ? (
            <button
              type="button"
              className="chip-button"
              onClick={() => setImageOnly((value) => !value)}
              title={imageOnly ? '詳細も表示（1列）' : '画像だけ表示（2列）'}
            >
              {imageOnly ? '詳細も表示' : '画像だけ'}
            </button>
          ) : null}
          {cards.length ? (
            <button type="button" className="link-button" onClick={onClear}>
              すべて外す
            </button>
          ) : null}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="side-empty">
          カードの「比較に追加」を押すと、ここに並べて見比べられます。
        </p>
      ) : (
        <div className="compare-cards">
          {cards.map((card) => (
            <article className="compare-card" key={card.cardId}>
              <header>
                <button type="button" className="compare-open" onClick={() => onOpen(card)} title="詳細を開く">
                  <span className="tile-id">#{card.cardId}</span>
                  <strong>{card.name}</strong>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onRemove(card.cardId)}
                  aria-label="比較から外す"
                  title="外す"
                >
                  ×
                </button>
              </header>
              {pdf ? (
                <button
                  type="button"
                  className="compare-image-button"
                  onClick={() => onOpen(card)}
                  title="詳細を開く"
                >
                  <CardImage
                    url={pdf.url}
                    page={card.cardId + pdf.indexPageCount}
                    alt={`${card.name} の画像`}
                    scale={1}
                    thumb
                    className="compare-image"
                  />
                </button>
              ) : null}
              <dl className="compare-fields">
                <Row label="種別" value={kindLabel(card.kind)} />
                <Row label="段階/種類" value={card.stageOrType} />
                <Row label="HP" value={card.hp ?? 'n/a'} />
                <Row label="タイプ">
                  <EnergyPip value={card.type} compact />
                </Row>
                <Row label="弱点">
                  <EnergyPip value={card.weakness} compact />
                </Row>
                <Row label="にげる" value={card.retreat ?? 'n/a'} />
                <Row label="特性" value={card.hasAbility ? `あり (${card.abilityCount})` : 'なし'} />
                <Row label="最大DPE" value={card.bestDpe ?? 'n/a'} />
                <Row label="最大ダメージ" value={card.peakDamage ?? 'n/a'} />
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children ?? value}</dd>
    </div>
  );
}
