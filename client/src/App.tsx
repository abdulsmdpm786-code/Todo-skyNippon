import { useEffect, useState } from "react";
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
          />
        )}
      </div>
    </div>
  );
}
