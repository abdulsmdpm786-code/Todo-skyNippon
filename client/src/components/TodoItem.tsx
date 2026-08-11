import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo, Priority } from "../types/todo";
import { PrioritySelect } from "./PrioritySelect";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onPriorityChange,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  isDragging,
  isOverlay,
}: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: todo.id,
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const subtasksCount = todo.subtasks?.length ?? 0;
  const completedCount = todo.subtasks?.filter((s) => s.completed).length ?? 0;

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    onAddSubtask(todo.id, trimmed);
    setNewSubtaskTitle("");
    setIsExpanded(true); // Auto-expand when a subtask is added
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <li
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow ${
        isDragging ? "opacity-30 border-dashed border-slate-300" : ""
      } ${
        isOverlay
          ? "shadow-md cursor-grabbing scale-[1.02] border-indigo-200 ring-2 ring-indigo-500/10"
          : ""
      }`}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Drag handle */}
        <div
          {...(isOverlay ? {} : attributes)}
          {...(isOverlay ? {} : listeners)}
          className={`flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 transition-colors ${
            isOverlay ? "cursor-grabbing" : "cursor-grab"
          }`}
          title="Drag to reorder"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>

        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
          aria-label={`Mark "${todo.title}" as ${todo.completed ? "not completed" : "completed"}`}
        />

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span
            className={`text-sm truncate ${todo.completed ? "line-through text-slate-400" : "text-slate-800"}`}
          >
            {todo.title}
          </span>
          {subtasksCount > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1 select-none"
              title={`${completedCount} of ${subtasksCount} subtasks completed`}
            >
              <span>{completedCount}/{subtasksCount}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
          {subtasksCount === 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] text-slate-400 hover:text-indigo-600 transition-colors font-medium px-1"
              title="Add subtasks"
            >
              + subtasks
            </button>
          )}
        </div>

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
      </div>

      {isExpanded && (
        <div className="pl-9 pr-1 pt-3 pb-1 border-t border-slate-100 mt-3 flex flex-col gap-2">
          {subtasksCount > 0 && (
            <ul className="flex flex-col gap-1.5">
              {todo.subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => onToggleSubtask(todo.id, subtask.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                    aria-label={`Mark subtask "${subtask.title}" as completed`}
                  />
                  <span
                    className={`text-xs flex-1 ${
                      subtask.completed ? "line-through text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask(todo.id, subtask.id)}
                    className="text-slate-400 hover:text-rose-600 text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete subtask"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add subtask input */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a subtask…"
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 flex-1 bg-slate-50/50"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
              className="text-[11px] bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded-md hover:bg-indigo-100 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
