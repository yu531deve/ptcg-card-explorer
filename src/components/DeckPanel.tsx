import { DECK_SIZE, MAX_COPIES_PER_NAME, deckTotalCount, validateDeck } from '../lib/deck';
import type { Card, Deck } from '../types';

type Props = {
  deck: Deck;
  cardsById: Map<number, Card>;
};

// Deck-mode side panel. The deck domain model (lib/deck.ts) is fully wired here,
// but card-adding interactions are intentionally not built yet — this renders
// the current deck and live rule validation so the builder can drop in later.
export default function DeckPanel({ deck, cardsById }: Props) {
  const total = deckTotalCount(deck);
  const validation = validateDeck(deck, cardsById);

  return (
    <div className="deck-panel">
      <div className="side-panel-head">
        <h2>{deck.name}</h2>
        <span className={`deck-count${total === DECK_SIZE ? ' is-ok' : ''}`}>
          {total} / {DECK_SIZE}
        </span>
      </div>

      {deck.entries.length === 0 ? (
        <div className="side-empty">
          <p>デッキ作成モード（準備中）。</p>
          <p className="deck-rules-title">適用予定のルール</p>
          <ul className="deck-rules">
            <li>デッキはちょうど {DECK_SIZE} 枚。</li>
            <li>同名カードは {MAX_COPIES_PER_NAME} 枚まで（基本エネルギーは無制限）。</li>
            <li>たねポケモンを1枚以上含む。</li>
          </ul>
        </div>
      ) : (
        <>
          <ul className="deck-entries">
            {deck.entries.map((entry) => {
              const card = cardsById.get(entry.cardId);
              return (
                <li key={entry.cardId}>
                  <span className="deck-entry-count">{entry.count}×</span>
                  <span className="deck-entry-name">{card?.name ?? `#${entry.cardId}`}</span>
                </li>
              );
            })}
          </ul>
          {validation.errors.length ? (
            <ul className="deck-errors">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : (
            <p className="deck-ok">ルールを満たしています。</p>
          )}
        </>
      )}
    </div>
  );
}
