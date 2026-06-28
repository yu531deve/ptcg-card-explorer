import ComparePanel from './ComparePanel';
import DeckPanel from './DeckPanel';
import type { AppMode, Card, CardPdf, Deck } from '../types';

type Props = {
  mode: AppMode;
  // Compare (search mode)
  pinnedCards: Card[];
  onOpen: (card: Card) => void;
  onRemovePin: (cardId: number) => void;
  onClearPins: () => void;
  onCollapse?: () => void;
  pdf?: CardPdf | null;
  // Deck (deck mode)
  deck: Deck;
  cardsById: Map<number, Card>;
};

// Right-hand workspace panel that swaps content by mode: the compare tray in
// search mode, the deck builder in deck mode.
export default function SidePanel({
  mode,
  pinnedCards,
  onOpen,
  onRemovePin,
  onClearPins,
  onCollapse,
  deck,
  cardsById,
  pdf,
}: Props) {
  return (
    <aside className="side-panel" aria-label={mode === 'deck' ? 'デッキ' : '比較トレイ'}>
      {onCollapse ? (
        <button type="button" className="side-collapse" onClick={onCollapse} title="サイドバーを閉じる">
          ▶
        </button>
      ) : null}
      {mode === 'deck' ? (
        <DeckPanel deck={deck} cardsById={cardsById} />
      ) : (
        <ComparePanel cards={pinnedCards} onOpen={onOpen} onRemove={onRemovePin} onClear={onClearPins} pdf={pdf} />
      )}
    </aside>
  );
}
