import { useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { Priority, Todo } from "./types/todo";
import * as api from "./api/todos";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchTodos()
      .then(setTodos)
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, []);

  const addTodo = async (title: string, priority: Priority) => {
    try {
      const todo = await api.createTodo(title, priority);
      setTodos((prev) => [...prev, todo]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleCompleted = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      const updated = await api.updateTodo(id, { completed: !todo.completed });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const setPriority = async (id: string, priority: Priority) => {
    try {
      const updated = await api.updateTodo(id, { priority });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addSubtask = async (todoId: string, title: string) => {
    try {
      const updated = await api.createSubtask(todoId, title);
      setTodos((prev) => prev.map((t) => (t.id === todoId ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleSubtaskCompleted = async (todoId: string, subtaskId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const subtask = todo.subtasks?.find((s) => s.id === subtaskId);
    if (!subtask) return;
    try {
      const updated = await api.updateSubtask(todoId, subtaskId, {
        completed: !subtask.completed,
      });
      setTodos((prev) => prev.map((t) => (t.id === todoId ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteSubtask = async (todoId: string, subtaskId: string) => {
    try {
      const updated = await api.deleteSubtask(todoId, subtaskId);
      setTodos((prev) => prev.map((t) => (t.id === todoId ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReorder = async (activeId: string, overId: string) => {
    const activeIndex = todos.findIndex((t) => t.id === activeId);
    const overIndex = todos.findIndex((t) => t.id === overId);
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

    // Optimistically update frontend state
    const originalTodos = [...todos];
    const updated = arrayMove(todos, activeIndex, overIndex);
    setTodos(updated);
    setError(null);

    try {
      const items = updated.map((todo, idx) => ({
        id: todo.id,
        order: idx,
      }));
      await api.reorderTodos(items);
    } catch (err) {
      setError((err as Error).message);
      // Rollback to original state if backend update fails
      setTodos(originalTodos);
    }
  };

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Todo</h1>
        <p className="text-sm text-slate-500 mb-6">
          {todos.length === 0 ? "Nothing here yet" : `${remaining} of ${todos.length} remaining`}
        </p>

        <AddTodoForm onAdd={addTodo} />

        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : (
          <TodoList
            todos={todos}
            onToggle={toggleCompleted}
            onDelete={deleteTodo}
            onPriorityChange={setPriority}
            onReorder={handleReorder}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtaskCompleted}
            onDeleteSubtask={deleteSubtask}
          />
        )}
      </div>
    </div>
  );
}
