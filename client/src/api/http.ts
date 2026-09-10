import axios from "axios";
import type { Board } from "../types";

const api = axios.create({ baseURL: "/api" });

export async function createBoard(name: string): Promise<Board> {
  const res = await api.post<Board>("/boards", { name });
  return res.data;
}

export async function fetchBoard(id: string): Promise<Board> {
  const res = await api.get<Board>(`/boards/${id}`);
  return res.data;
}
