import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBoard } from "../api/http";
import { getSocket } from "../socket";
import type { Board as BoardData } from "../types";

export function Board() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const draggingCardId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetchBoard(id)
      .then((data) => {
        if (!cancelled) setBoard(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    const socket = getSocket();
    const handleState = (data: BoardData) => {
      if (data.id === id) setBoard(data);
    };
    socket.on("board:state", handleState);
    socket.emit("board:join", id);

    return () => {
      cancelled = true;
      socket.off("board:state", handleState);
    };
  }, [id]);

  function handleAddColumn(e: FormEvent) {
    e.preventDefault();
    if (!id || !newColumnName.trim()) return;
    getSocket().emit("column:create", { boardId: id, name: newColumnName.trim() });
    setNewColumnName("");
  }

  function handleAddCard(columnId: string, title: string) {
    if (!id || !title.trim()) return;
    getSocket().emit("card:create", { boardId: id, columnId, title: title.trim() });
  }

  function handleDeleteCard(cardId: string) {
    if (!id) return;
    getSocket().emit("card:delete", { boardId: id, cardId });
  }

  function handleDropOnCard(e: DragEvent, toColumnId: string, toIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    const cardId = draggingCardId.current;
    if (!id || !cardId) return;
    getSocket().emit("card:move", { boardId: id, cardId, toColumnId, toIndex });
    draggingCardId.current = null;
  }

  function handleDropOnColumn(e: DragEvent, toColumnId: string, columnLength: number) {
    e.preventDefault();
    const cardId = draggingCardId.current;
    if (!id || !cardId) return;
    getSocket().emit("card:move", { boardId: id, cardId, toColumnId, toIndex: columnLength });
    draggingCardId.current = null;
  }

  if (notFound) {
    return (
      <div className="page">
        <p>Board not found.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  if (!board) return <div className="page">Loading...</div>;

  return (
    <div className="board-page">
      <div className="board-header">
        <div>
          <h1>{board.name}</h1>
          <p className="board-id">
            Board ID: <code>{board.id}</code> — share it to collaborate live
          </p>
        </div>
        <form className="add-column-form" onSubmit={handleAddColumn}>
          <input
            type="text"
            placeholder="New column"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
          />
          <button type="submit" disabled={!newColumnName.trim()}>
            Add column
          </button>
        </form>
      </div>

      <div className="columns">
        {board.columns.map((column) => (
          <div
            key={column.id}
            className="column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnColumn(e, column.id, column.cards.length)}
          >
            <h2>
              {column.name} <span className="card-count">{column.cards.length}</span>
            </h2>

            <div className="cards">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  className="card"
                  draggable
                  onDragStart={() => {
                    draggingCardId.current = card.id;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnCard(e, column.id, index)}
                >
                  <span>{card.title}</span>
                  <button className="card-delete" onClick={() => handleDeleteCard(card.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <AddCardForm onAdd={(title) => handleAddCard(column.id, title)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddCardForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title);
    setTitle("");
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a card..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </form>
  );
}
