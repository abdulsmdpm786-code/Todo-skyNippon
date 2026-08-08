export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  order: number;
  createdAt: string;
  updatedAt: string;
}
