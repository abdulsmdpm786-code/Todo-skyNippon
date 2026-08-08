import type { Priority, Todo } from "../types/todo";
import { TodoItem } from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}

export function TodoList({ todos, onToggle, onDelete, onPriorityChange }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No todos yet — add one above.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onPriorityChange={onPriorityChange}
        />
      ))}
    </ul>
  );
}
