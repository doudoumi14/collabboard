import { randomUUID } from "node:crypto";
import { Board, Card } from "./types";

const boards = new Map<string, Board>();

const DEFAULT_COLUMNS = ["To do", "In progress", "Done"];

export function createBoard(name: string): Board {
  const board: Board = {
    id: randomUUID(),
    name,
    columns: DEFAULT_COLUMNS.map((columnName) => ({
      id: randomUUID(),
      name: columnName,
      cards: [],
    })),
  };
  boards.set(board.id, board);
  return board;
}

export function getBoard(boardId: string): Board | undefined {
  return boards.get(boardId);
}

export function addColumn(boardId: string, name: string): Board | undefined {
  const board = boards.get(boardId);
  if (!board) return undefined;
  board.columns.push({ id: randomUUID(), name, cards: [] });
  return board;
}

export function addCard(boardId: string, columnId: string, title: string): Board | undefined {
  const board = boards.get(boardId);
  if (!board) return undefined;
  const column = board.columns.find((c) => c.id === columnId);
  if (!column) return undefined;
  column.cards.push({ id: randomUUID(), title });
  return board;
}

export function moveCard(
  boardId: string,
  cardId: string,
  toColumnId: string,
  toIndex: number,
): Board | undefined {
  const board = boards.get(boardId);
  if (!board) return undefined;

  let movedCard: Card | undefined;
  for (const column of board.columns) {
    const index = column.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      [movedCard] = column.cards.splice(index, 1);
      break;
    }
  }
  if (!movedCard) return undefined;

  const toColumn = board.columns.find((c) => c.id === toColumnId);
  if (!toColumn) return undefined;

  const clampedIndex = Math.max(0, Math.min(toIndex, toColumn.cards.length));
  toColumn.cards.splice(clampedIndex, 0, movedCard);
  return board;
}

export function deleteCard(boardId: string, cardId: string): Board | undefined {
  const board = boards.get(boardId);
  if (!board) return undefined;
  for (const column of board.columns) {
    const index = column.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      column.cards.splice(index, 1);
      break;
    }
  }
  return board;
}

export function clearAllBoards(): void {
  boards.clear();
}
