export const PDF_INDEX_ROWS_PER_PAGE = 33;

export function getCardImagePage(cardId: number, uniqueCardCount: number): number {
  const indexPageCount = Math.max(1, Math.ceil(uniqueCardCount / PDF_INDEX_ROWS_PER_PAGE));
  return cardId + indexPageCount;
}

export function getPdfIndexPageCount(uniqueCardCount: number): number {
  return Math.max(1, Math.ceil(uniqueCardCount / PDF_INDEX_ROWS_PER_PAGE));
}
