import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import EnergyPip from './EnergyPip';
import CardImage from './CardImage';
import CardActions from './CardActions';
import type { Card, CardPdf } from '../types';

type Props = {
  cards: Card[];
  onSelect?: (card: Card) => void;
  selectedCardId?: number | null;
  favorites?: Set<number>;
  onToggleFavorite?: (cardId: number) => void;
  pinnedIds?: number[];
  onTogglePin?: (cardId: number) => void;
  pdf?: CardPdf | null;
};

export default function CardGrid({
  cards,
  onSelect,
  selectedCardId,
  favorites,
  onToggleFavorite,
  pinnedIds,
  onTogglePin,
  pdf,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);
  const rowCount = Math.ceil(cards.length / columns);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 192,
    overscan: 6,
  });

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextColumns = Math.max(1, Math.floor(entry.contentRect.width / 260));
      setColumns(nextColumns);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="grid-shell" aria-label="カードグリッド">
      <div className="virtual-scroll" ref={parentRef}>
        <div className="virtual-spacer" style={{ height: rowVirtualizer.getTotalSize() }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const start = virtualRow.index * columns;
            const rowCards = cards.slice(start, start + columns);
            return (
              <div
                className="grid-row"
                key={virtualRow.index}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowCards.map((card) => (
                  <div
                    role="button"
                    tabIndex={0}
                    className={`card-tile${selectedCardId === card.cardId ? ' is-selected' : ''}`}
                    key={card.cardId}
                    onClick={() => onSelect?.(card)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect?.(card);
                      }
                    }}
                  >
                    <CardActions
                      className="tile-actions"
                      cardId={card.cardId}
                      favorites={favorites}
                      onToggleFavorite={onToggleFavorite}
                      pinnedIds={pinnedIds}
                      onTogglePin={onTogglePin}
                    />
                    <div className="tile-thumb">
                      {pdf ? (
                        <CardImage
                          url={pdf.url}
                          page={card.cardId + pdf.indexPageCount}
                          alt=""
                          scale={1}
                          thumb
                          className="tile-thumb-img"
                        />
                      ) : null}
                    </div>
                    <div className="tile-body">
                      <span className="tile-id">#{card.cardId}</span>
                      <strong>{card.name}</strong>
                      <span>{card.stageOrType}</span>
                      {card.hasAbility ? <span className="tile-ability">特性</span> : null}
                      <EnergyPip value={card.type} compact />
                      <dl>
                        <div>
                          <dt>HP</dt>
                          <dd>{card.hp ?? 'n/a'}</dd>
                        </div>
                        <div>
                          <dt>にげる</dt>
                          <dd>{card.retreat ?? 'n/a'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
