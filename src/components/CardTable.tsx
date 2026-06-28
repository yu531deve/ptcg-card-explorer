import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import EnergyPip from './EnergyPip';
import CardImage from './CardImage';
import CardActions from './CardActions';
import { kindLabel } from '../lib/labels';
import type { Card, CardPdf } from '../types';

type Props = {
  cards: Card[];
  onSelect?: (card: Card) => void;
  selectedCardId?: number | null;
  pdf?: CardPdf | null;
  favorites?: Set<number>;
  onToggleFavorite?: (cardId: number) => void;
  pinnedIds?: number[];
  onTogglePin?: (cardId: number) => void;
};

export default function CardTable({
  cards,
  onSelect,
  selectedCardId,
  pdf,
  favorites,
  onToggleFavorite,
  pinnedIds,
  onTogglePin,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 12,
  });

  return (
    <section className="table-shell" aria-label="カード一覧">
      <div className="table-header card-row">
        <span>画像</span>
        <span>ID</span>
        <span>名前</span>
        <span>種別</span>
        <span>進化段階 / 種類</span>
        <span>タイプ</span>
        <span>HP</span>
        <span>にげる</span>
        <span>拡張</span>
        <span>操作</span>
      </div>
      <div className="virtual-scroll" ref={parentRef}>
        <div className="virtual-spacer" style={{ height: rowVirtualizer.getTotalSize() }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const card = cards[virtualRow.index];
            return (
              <div
                role="button"
                tabIndex={0}
                className={`card-row table-row${selectedCardId === card.cardId ? ' is-selected' : ''}`}
                key={card.cardId}
                onClick={() => onSelect?.(card)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect?.(card);
                  }
                }}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <span className="row-thumb">
                  {pdf ? (
                    <CardImage
                      url={pdf.url}
                      page={card.cardId + pdf.indexPageCount}
                      alt=""
                      scale={1}
                      thumb
                      className="card-thumb"
                    />
                  ) : null}
                </span>
                <span>{card.cardId}</span>
                <strong>{card.name}</strong>
                <span>{kindLabel(card.kind)}</span>
                <span>{card.stageOrType}</span>
                <span>
                  <EnergyPip value={card.type} compact />
                </span>
                <span>{card.hp ?? 'n/a'}</span>
                <span>{card.retreat ?? 'n/a'}</span>
                <span>{card.expansion}</span>
                <CardActions
                  className="row-actions"
                  cardId={card.cardId}
                  favorites={favorites}
                  onToggleFavorite={onToggleFavorite}
                  pinnedIds={pinnedIds}
                  onTogglePin={onTogglePin}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
