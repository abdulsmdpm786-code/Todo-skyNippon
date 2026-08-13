import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { isPriority } from "../types";
import { asyncHandler } from "../asyncHandler";

export const todosRouter = Router();

// GET /api/todos — list all todos, sorted by their drag position, with subtasks.
todosRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const todos = await prisma.todo.findMany({
      orderBy: { order: "asc" },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    res.json(todos);
  })
);

// POST /api/todos — create a todo. Appends to the end of the list.
todosRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { title, priority } = req.body ?? {};

    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required" });
    }
    if (priority !== undefined && !isPriority(priority)) {
      return res.status(400).json({ error: "priority must be low, medium, or high" });
    }

    // Compute the next order value and create the todo inside a single
    // transaction so the read (find last order) and the write (create)
    // happen atomically. Previously these were two separate queries, so
    // two rapid POST requests could both read the same "last" todo before
    // either had written — both would then compute the same nextOrder,
    // producing a duplicate order value (or a failed insert on the second
    // request, if order is constrained to be unique in the schema).
    const todo = await prisma.$transaction(async (tx) => {
      const last = await tx.todo.findFirst({ orderBy: { order: "desc" } });
      const nextOrder = last ? last.order + 1 : 0;

      return tx.todo.create({
        data: {
          title: title.trim(),
          priority: priority ?? "medium",
          order: nextOrder,
        },
        include: {
          subtasks: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    res.status(201).json(todo);
  })
);

// PATCH /api/todos/reorder — bulk-persist new drag positions.
todosRouter.patch(
  "/reorder",
  asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body ?? {};

    if (!Array.isArray(items) || items.some((i) => typeof i.id !== "string" || typeof i.order !== "number")) {
      return res.status(400).json({ error: "items must be an array of { id, order }" });
    }

    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.todo.update({ where: { id: item.id }, data: { order: item.order } })
      )
    );

    const todos = await prisma.todo.findMany({
      orderBy: { order: "asc" },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    res.json(todos);
  })
);

// PATCH /api/todos/:id — update title/completed/priority.
todosRouter.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, completed, priority } = req.body ?? {};

    if (priority !== undefined && !isPriority(priority)) {
      return res.status(400).json({ error: "priority must be low, medium, or high" });
    }

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "todo not found" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the parent todo
      const todo = await tx.todo.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(completed !== undefined ? { completed } : {}),
          ...(priority !== undefined ? { priority } : {}),
        },
      });

      // 2. Side effect: if completing the parent todo, complete all of its subtasks
      if (completed === true) {
        await tx.subtask.updateMany({
          where: { todoId: id },
          data: { completed: true },
        });
      }

      // 3. Fetch and return complete record with sorted subtasks
      return tx.todo.findUniqueOrThrow({
        where: { id },
        include: {
          subtasks: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    res.json(updated);
  })
);

// DELETE /api/todos/:id — delete by stable id.
todosRouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(404).json({ error: "todo not found" });
    }

    await prisma.todo.delete({ where: { id: id } });
    res.status(204).send();
  })
);

// POST /api/todos/:todoId/subtasks — Create a subtask for a todo
todosRouter.post(
  "/:todoId/subtasks",
  asyncHandler(async (req: Request, res: Response) => {
    const { todoId } = req.params;
    const { title } = req.body ?? {};

    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "subtask title is required" });
    }

    const existingTodo = await prisma.todo.findUnique({ where: { id: todoId } });
    if (!existingTodo) {
      return res.status(404).json({ error: "todo not found" });
    }

    await prisma.$transaction(async (tx) => {
      // Create subtask
      await tx.subtask.create({
        data: {
          title: title.trim(),
          todoId,
          completed: false,
        },
      });

      // Adding a new uncompleted subtask means the parent todo becomes uncompleted
      await tx.todo.update({
        where: { id: todoId },
        data: { completed: false },
      });
    });

    const updatedTodo = await prisma.todo.findUniqueOrThrow({
      where: { id: todoId },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.status(201).json(updatedTodo);
  })
);

// PATCH /api/todos/:todoId/subtasks/:subtaskId — Update subtask title or completed status
todosRouter.patch(
  "/:todoId/subtasks/:subtaskId",
  asyncHandler(async (req: Request, res: Response) => {
    const { todoId, subtaskId } = req.params;
    const { title, completed } = req.body ?? {};

    const existingTodo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: { subtasks: true },
    });
    if (!existingTodo) {
      return res.status(404).json({ error: "todo not found" });
    }

    const existingSubtask = existingTodo.subtasks.find((s) => s.id === subtaskId);
    if (!existingSubtask) {
      return res.status(404).json({ error: "subtask not found" });
    }

    await prisma.$transaction(async (tx) => {
      // Update the subtask
      await tx.subtask.update({
        where: { id: subtaskId },
        data: {
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(completed !== undefined ? { completed } : {}),
        },
      });

      if (completed !== undefined) {
        if (completed === false) {
          // Uncompleting a subtask means parent todo must be uncompleted
          await tx.todo.update({
            where: { id: todoId },
            data: { completed: false },
          });
        } else {
          // Completing a subtask: check if all sibling subtasks are completed
          const siblingSubtasks = await tx.subtask.findMany({
            where: { todoId, id: { not: subtaskId } },
          });
          const allOthersCompleted = siblingSubtasks.every((s) => s.completed);
          if (allOthersCompleted) {
            await tx.todo.update({
              where: { id: todoId },
              data: { completed: true },
            });
          }
        }
      }
    });

    const updatedTodo = await prisma.todo.findUniqueOrThrow({
      where: { id: todoId },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.json(updatedTodo);
  })
);

// DELETE /api/todos/:todoId/subtasks/:subtaskId — Delete a subtask
todosRouter.delete(
  "/:todoId/subtasks/:subtaskId",
  asyncHandler(async (req: Request, res: Response) => {
    const { todoId, subtaskId } = req.params;

    const existingTodo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: { subtasks: true },
    });
    if (!existingTodo) {
      return res.status(404).json({ error: "todo not found" });
    }

    const existingSubtask = existingTodo.subtasks.find((s) => s.id === subtaskId);
    if (!existingSubtask) {
      return res.status(404).json({ error: "subtask not found" });
    }

    await prisma.$transaction(async (tx) => {
      // Delete subtask
      await tx.subtask.delete({ where: { id: subtaskId } });

      // Check if remaining subtasks are all completed
      const remainingSubtasks = await tx.subtask.findMany({
        where: { todoId },
      });
      if (remainingSubtasks.length > 0 && remainingSubtasks.every((s) => s.completed)) {
        await tx.todo.update({
          where: { id: todoId },
          data: { completed: true },
        });
      }
    });

    const updatedTodo = await prisma.todo.findUniqueOrThrow({
      where: { id: todoId },
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.json(updatedTodo);
  })
);