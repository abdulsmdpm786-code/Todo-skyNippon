export type Priority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  todoId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  order: number;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}
