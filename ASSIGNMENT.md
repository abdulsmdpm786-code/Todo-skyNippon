# Coding Assignment — Todo App

Welcome! This is a small, mostly-working Todo app with a React client and an Express API. It's intentionally left unfinished in a few ways — that's the point of the exercise. Please read this whole document before you start.

**Live reference:** [http://se001-asmt.skynippon.jp](http://se001-asmt.skynippon.jp) — this is the fully-finished version of the app. Use it to see exactly how each feature (including drag-to-reorder, which this repo doesn't have yet) is supposed to behave. You will not have access to its source code.

## Tools you can use

You may use **any coding tools or AI tools** (editors, copilots, ChatGPT, Cursor, etc.) while working on this assignment. That is allowed and expected.

What we evaluate is **your understanding**, not whether you typed every line by hand. Be ready to explain:

- The **project** end to end (client, API, data flow)
- The **tech stack / tools** you used and why
- The **bugs** you found and **how / why** you fixed them at the root cause

**Understanding the project is the most important thing.** Shipping code you cannot explain will not score well.

## What's already here

- A React + TypeScript + Vite + Tailwind CSS client
- An Express + TypeScript + Prisma + SQLite API
- List / add / delete / mark-complete / set-priority for todos, wired end to end
- Two independent dev servers in this one repo (see [README.md](README.md) for how to run them)

## What's missing, and what we're asking you to do

### 1. Fix 3 bugs

The app mostly works, but three things are broken. We're deliberately not telling you the root cause — just the symptom, the way a real bug report would read. Please fix all three, and fix the actual cause rather than papering over the symptom.

1. **Adding todos quickly sometimes fails or misbehaves.** If you add two todos in rapid succession, something occasionally goes wrong with the second one.
2. **Deleting a todo sometimes removes a different todo than the one you clicked.** It's not random — try to figure out exactly when it happens.
3. **Checking a box or changing a todo's priority doesn't stick.** The change doesn't seem to actually take effect (or reverts), even though nothing looks wrong in the UI at first glance.

None of these are one-character typos — each one requires actually reading the relevant code path (client → API call → server route → database) to understand what's really happening before you fix it. Please don't guess-and-check; we care about whether you can diagnose a bug, not just make a symptom go away.

### 2. Reintroduce state management and drag-and-drop

The reference app (the hosted demo) has two things this starter project doesn't:

- **A state management library** for the todo list on the client (this starter just uses plain React `useState`, prop-drilled down).
- **Drag-and-drop reordering** of todos, persisted to the server.

Pick whatever state management library and whatever drag-and-drop library you're comfortable with (or want to learn) — there's no required choice here. The server already has a working endpoint for persisting a new order: `PATCH /api/todos/reorder`, which accepts `{ items: [{ id, order }, ...] }` and returns the updated list. You're free to change it if you have a good reason, but you shouldn't need to.

As part of your submission, include a **small presentation** comparing a few state management options and explaining why you chose the one you used (see [Submission](#submission)).

### 3. Add subtasks to a todo

Add the ability to break a todo down into smaller subtasks — the checklist-within-a-checklist pattern most todo apps eventually grow. Concretely, a todo should be able to have zero or more subtasks, where each subtask has at least its own text and its own completed state.

Some things to think about (not a spec — your call on all of it):
- **Data model:** how a subtask relates to its parent todo, and how that's represented in Prisma/SQLite.
- **API:** whether subtasks get their own endpoints (e.g. nested under `/api/todos/:id/subtasks`) or ride along on the existing todo routes — and what a sensible payload shape looks like either way.
- **UI:** where subtasks appear (inline under the todo? expand/collapse? a detail view?), how you add/toggle/delete one, and whether/how a todo's own completed state relates to its subtasks' state (e.g. does completing all subtasks do anything to the parent — your call, just be intentional about it).

We're deliberately not specifying the schema or the UI — that's the point of this task. Design something you think is genuinely usable, implement it end to end (client + server), and note your reasoning and any assumptions in your submission README. The live reference demo does **not** include subtasks, precisely because this part isn't meant to be benchmarked against a hidden "correct" answer — it's evaluated on your own design judgment.

## What "done" looks like

- All 3 bugs are fixed at the root cause.
- A state management library is in place for the todo list.
- Drag-and-drop reordering works and persists (survives a page refresh).
- Subtasks are implemented end to end (client + server), with your own data model, API, and UI design.
- A short presentation comparing state management tools and explaining why you chose the one in your project.
- The app still runs via `npm run dev` from a clean clone (see README.md).
- No test suite is required.

## Submission

1. **Push your code** to a **repository you own** (any host you like — GitHub, GitLab, etc.).
2. Email **skynippon.it@gmail.com** with:
   - Your **repo URL**
   - Your **hosted URL** (if you hosted a live version)
   - Your **presentation** (PPT/PDF) comparing state management tools and why you chose the one used in your project
3. Hosting a live version is optional and your choice of platform — it isn't required, but candidates who do include one stand out favorably in review, since it's a meaningful signal of the shipping ability this assignment is designed to test.

### Presentation (required)

Create a **small presentation** (a few slides is enough) that covers:

- A short **comparison of different state management tools** (e.g. Redux, Zustand, Jotai, Recoil, React Context, MobX — pick the ones you considered)
- **Why you chose** the tool you used in your project (trade-offs, fit for this app, familiarity, bundle size, DX, etc.)

Attach the PPT (or PDF export) when you email your submission.

## Deadline

**You have 1 week from when you received this assignment.** If something comes up and you need more time, just tell us — we'd rather you say so than rush it.

## Questions

If anything in this brief is ambiguous, use your best judgment and note the assumption you made in your submission (a line or two in your README is fine). Reasonable, documented assumptions are totally fine — we're evaluating how you think, not whether you guessed the one "correct" interpretation.
