import type { Priority } from "../types/todo";

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  high: "bg-rose-100 text-rose-700 border-rose-300",
};

interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      className={`text-xs font-medium rounded-full border px-2 py-1 capitalize cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 ${PRIORITY_STYLES[value]}`}
      aria-label="Priority"
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  );
}
