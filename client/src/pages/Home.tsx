import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createBoard } from "../api/http";

export function Home() {
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const board = await createBoard(name.trim() || "Untitled board");
      navigate(`/board/${board.id}`);
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (joinId.trim()) navigate(`/board/${joinId.trim()}`);
  }

  return (
    <div className="home">
      <h1>CollabBoard</h1>
      <p className="subtitle">
        Real-time kanban boards — no account needed. Open the same board in two tabs to watch it
        sync live.
      </p>

      <div className="home-cards">
        <form className="home-card" onSubmit={handleCreate}>
          <h2>Create a board</h2>
          <input
            type="text"
            placeholder="Board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create board"}
          </button>
        </form>

        <form className="home-card" onSubmit={handleJoin}>
          <h2>Join a board</h2>
          <input
            type="text"
            placeholder="Paste a board ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button type="submit" disabled={!joinId.trim()}>
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
