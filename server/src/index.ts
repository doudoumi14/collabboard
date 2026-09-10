import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { addCard, addColumn, createBoard, deleteCard, getBoard, moveCard } from "./store";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/boards", (req, res) => {
  const name =
    typeof req.body?.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : "Untitled board";
  const board = createBoard(name);
  res.status(201).json(board);
});

app.get("/api/boards/:id", (req, res) => {
  const board = getBoard(req.params.id);
  if (!board) return res.status(404).json({ error: "Board not found" });
  res.json(board);
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

function roomName(boardId: string) {
  return `board:${boardId}`;
}

function broadcastBoard(boardId: string) {
  const board = getBoard(boardId);
  if (board) io.to(roomName(boardId)).emit("board:state", board);
}

io.on("connection", (socket: Socket) => {
  socket.on("board:join", (boardId: unknown) => {
    if (typeof boardId !== "string") return;
    socket.join(roomName(boardId));
    const board = getBoard(boardId);
    if (board) socket.emit("board:state", board);
  });

  socket.on("column:create", (payload: { boardId?: unknown; name?: unknown }) => {
    if (typeof payload?.boardId !== "string" || typeof payload?.name !== "string") return;
    if (!payload.name.trim()) return;
    addColumn(payload.boardId, payload.name.trim());
    broadcastBoard(payload.boardId);
  });

  socket.on(
    "card:create",
    (payload: { boardId?: unknown; columnId?: unknown; title?: unknown }) => {
      if (
        typeof payload?.boardId !== "string" ||
        typeof payload?.columnId !== "string" ||
        typeof payload?.title !== "string" ||
        !payload.title.trim()
      ) {
        return;
      }
      addCard(payload.boardId, payload.columnId, payload.title.trim());
      broadcastBoard(payload.boardId);
    },
  );

  socket.on(
    "card:move",
    (payload: {
      boardId?: unknown;
      cardId?: unknown;
      toColumnId?: unknown;
      toIndex?: unknown;
    }) => {
      if (
        typeof payload?.boardId !== "string" ||
        typeof payload?.cardId !== "string" ||
        typeof payload?.toColumnId !== "string" ||
        typeof payload?.toIndex !== "number"
      ) {
        return;
      }
      moveCard(payload.boardId, payload.cardId, payload.toColumnId, payload.toIndex);
      broadcastBoard(payload.boardId);
    },
  );

  socket.on("card:delete", (payload: { boardId?: unknown; cardId?: unknown }) => {
    if (typeof payload?.boardId !== "string" || typeof payload?.cardId !== "string") return;
    deleteCard(payload.boardId, payload.cardId);
    broadcastBoard(payload.boardId);
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
httpServer.listen(port, () => {
  console.log(`CollabBoard server listening on http://localhost:${port}`);
});
