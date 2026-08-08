import type { Todo, Priority } from "../types/todo";
import { PrioritySelect } from "./PrioritySelect";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onPriorityChange }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "not completed" : "completed"}`}
      />

      <span
        className={`flex-1 text-sm ${todo.completed ? "line-through text-slate-400" : "text-slate-800"}`}
      >
        {todo.title}
      </span>

      <PrioritySelect value={todo.priority} onChange={(priority) => onPriorityChange(todo.id, priority)} />

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        className="text-slate-400 hover:text-rose-600 text-sm px-1"
        aria-label={`Delete "${todo.title}"`}
        title="Delete"
      >
        ✕
      </button>
    </li>
  );
}
