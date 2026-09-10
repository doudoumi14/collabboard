import { beforeEach, describe, expect, it } from "vitest";
import {
  addCard,
  addColumn,
  clearAllBoards,
  createBoard,
  deleteCard,
  getBoard,
  moveCard,
} from "../src/store";

beforeEach(() => {
  clearAllBoards();
});

describe("createBoard", () => {
  it("creates a board with three default columns", () => {
    const board = createBoard("Sprint Planning");
    expect(board.name).toBe("Sprint Planning");
    expect(board.columns.map((c) => c.name)).toEqual(["To do", "In progress", "Done"]);
    expect(board.columns.every((c) => c.cards.length === 0)).toBe(true);
  });

  it("is retrievable by id", () => {
    const board = createBoard("Retrievable");
    expect(getBoard(board.id)?.name).toBe("Retrievable");
  });
});

describe("addCard", () => {
  it("adds a card to the given column", () => {
    const board = createBoard("Board");
    const columnId = board.columns[0].id;

    const updated = addCard(board.id, columnId, "Write tests");
    expect(updated?.columns[0].cards).toHaveLength(1);
    expect(updated?.columns[0].cards[0].title).toBe("Write tests");
  });

  it("returns undefined for an unknown board", () => {
    expect(addCard("missing-board", "col-1", "Task")).toBeUndefined();
  });

  it("returns undefined for an unknown column", () => {
    const board = createBoard("Board");
    expect(addCard(board.id, "missing-column", "Task")).toBeUndefined();
  });
});

describe("moveCard", () => {
  it("moves a card between columns", () => {
    const board = createBoard("Board");
    const [todo, inProgress] = board.columns;
    addCard(board.id, todo.id, "Ship feature");
    const cardId = getBoard(board.id)!.columns[0].cards[0].id;

    const updated = moveCard(board.id, cardId, inProgress.id, 0);
    expect(updated?.columns[0].cards).toHaveLength(0);
    expect(updated?.columns[1].cards).toHaveLength(1);
    expect(updated?.columns[1].cards[0].id).toBe(cardId);
  });

  it("reorders a card within the same column", () => {
    const board = createBoard("Board");
    const column = board.columns[0];
    addCard(board.id, column.id, "First");
    addCard(board.id, column.id, "Second");
    const [first, second] = getBoard(board.id)!.columns[0].cards;

    moveCard(board.id, second.id, column.id, 0);
    const titles = getBoard(board.id)!.columns[0].cards.map((c) => c.title);
    expect(titles).toEqual(["Second", "First"]);
    expect(first.id).not.toBe(second.id);
  });

  it("clamps an out-of-range target index", () => {
    const board = createBoard("Board");
    const [todo, done] = [board.columns[0], board.columns[2]];
    addCard(board.id, todo.id, "Only card");
    const cardId = getBoard(board.id)!.columns[0].cards[0].id;

    const updated = moveCard(board.id, cardId, done.id, 999);
    expect(updated?.columns[2].cards).toHaveLength(1);
  });

  it("returns undefined when the card doesn't exist", () => {
    const board = createBoard("Board");
    expect(moveCard(board.id, "missing-card", board.columns[0].id, 0)).toBeUndefined();
  });
});

describe("deleteCard", () => {
  it("removes a card from its column", () => {
    const board = createBoard("Board");
    const column = board.columns[0];
    addCard(board.id, column.id, "Temporary");
    const cardId = getBoard(board.id)!.columns[0].cards[0].id;

    const updated = deleteCard(board.id, cardId);
    expect(updated?.columns[0].cards).toHaveLength(0);
  });
});

describe("addColumn", () => {
  it("appends a new empty column", () => {
    const board = createBoard("Board");
    const updated = addColumn(board.id, "Blocked");
    expect(updated?.columns).toHaveLength(4);
    expect(updated?.columns[3]).toMatchObject({ name: "Blocked", cards: [] });
  });
});
