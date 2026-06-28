type Props = {
  cardId: number;
  favorites?: Set<number>;
  onToggleFavorite?: (cardId: number) => void;
  pinnedIds?: number[];
  onTogglePin?: (cardId: number) => void;
  className?: string;
};

// Pin + favorite buttons used by grid tiles and table rows. Real <button>s with
// stopPropagation so a click never bubbles to the surrounding card (which would
// otherwise open the detail view).
export default function CardActions({
  cardId,
  favorites,
  onToggleFavorite,
  pinnedIds,
  onTogglePin,
  className,
}: Props) {
  if (!onToggleFavorite && !onTogglePin) return null;
  const pinned = pinnedIds?.includes(cardId) ?? false;
  const fav = favorites?.has(cardId) ?? false;

  return (
    <div className={`card-actions${className ? ` ${className}` : ''}`}>
      {onTogglePin ? (
        <button
          type="button"
          className={`card-action pin${pinned ? ' is-active' : ''}`}
          aria-label={pinned ? '比較から外す' : '比較に追加'}
          title={pinned ? '比較から外す' : '比較に追加'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(cardId);
          }}
        >
          📌
        </button>
      ) : null}
      {onToggleFavorite ? (
        <button
          type="button"
          className={`card-action fav${fav ? ' is-active' : ''}`}
          aria-label={fav ? 'お気に入り解除' : 'お気に入りに追加'}
          title={fav ? 'お気に入り解除' : 'お気に入りに追加'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(cardId);
          }}
        >
          {fav ? '★' : '☆'}
        </button>
      ) : null}
    </div>
  );
}
