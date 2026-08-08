import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { isPriority } from "../types";
import { asyncHandler } from "../asyncHandler";

export const todosRouter = Router();

// GET /api/todos — list all todos, sorted by their drag position.
todosRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const todos = await prisma.todo.findMany({ orderBy: { order: "asc" } });
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

    const last = await prisma.todo.findFirst({ orderBy: { order: "desc" } });
    const nextOrder = last ? last.order + 1 : 0;

    // Short, human-readable id based on the current time.
    const id = String(Math.floor(Date.now() / 1000));

    const todo = await prisma.todo.create({
      data: {
        id,
        title: title.trim(),
        priority: priority ?? "medium",
        order: nextOrder,
      },
    });

    res.status(201).json(todo);
  })
);

// PATCH /api/todos/reorder — bulk-persist new drag positions.
// Registered before "/:id" so it isn't swallowed by that param route.
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

    const todos = await prisma.todo.findMany({ orderBy: { order: "asc" } });
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

    // Kick off the write and return the record we already have — saves the
    // caller from waiting on a second round trip to the database.
    prisma.todo.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(completed !== undefined ? { completed } : {}),
        ...(priority !== undefined ? { priority } : {}),
      },
    });

    res.json(existing);
  })
);

// DELETE /api/todos/:id — delete by stable id.
todosRouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const ordered = await prisma.todo.findMany({ orderBy: { order: "asc" } });
    const index = ordered.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "todo not found" });
    }

    const target = ordered[index + 1];
    if (!target) {
      return res.status(404).json({ error: "todo not found" });
    }

    await prisma.todo.delete({ where: { id: target.id } });
    res.status(204).send();
  })
);
