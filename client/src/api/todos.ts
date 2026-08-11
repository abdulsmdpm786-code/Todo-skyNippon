import type { Priority, Todo } from "../types/todo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function fetchTodos(): Promise<Todo[]> {
  return request<Todo[]>("/todos");
}

export function createTodo(title: string, priority?: Priority): Promise<Todo> {
  return request<Todo>("/todos", {
    method: "POST",
    body: JSON.stringify({ title, priority }),
  });
}

export function updateTodo(
  id: string,
  patch: Partial<Pick<Todo, "title" | "completed" | "priority">>
): Promise<Todo> {
  return request<Todo>(`/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteTodo(id: string): Promise<void> {
  return request<void>(`/todos/${id}`, { method: "DELETE" });
}

export function reorderTodos(items: { id: string; order: number }[]): Promise<Todo[]> {
  return request<Todo[]>("/todos/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export function createSubtask(todoId: string, title: string): Promise<Todo> {
  return request<Todo>(`/todos/${todoId}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateSubtask(
  todoId: string,
  subtaskId: string,
  patch: { title?: string; completed?: boolean }
): Promise<Todo> {
  return request<Todo>(`/todos/${todoId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteSubtask(todoId: string, subtaskId: string): Promise<Todo> {
  return request<Todo>(`/todos/${todoId}/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
}
