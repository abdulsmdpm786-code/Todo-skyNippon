# Todo App — Starter

Technical setup instructions. For the actual assignment brief (bugs to fix, tasks to complete, how to submit), see [ASSIGNMENT.md](ASSIGNMENT.md).

## Stack

- **Client**: React 18 + TypeScript + Vite + Tailwind CSS
- **Server**: Node + Express + TypeScript + Prisma + SQLite
- Two independent dev servers in one repo, run together via npm workspaces + `concurrently`

## Prerequisites

- Node.js 20+
- npm 10+

## Getting started

```bash
npm run setup   # installs both workspaces + runs the initial Prisma migration
npm run dev     # boots server (:4000) and client (:5173) together
```

Then open http://localhost:5173.

If you'd rather run them separately (e.g. in two terminals):

```bash
npm run dev -w server   # http://localhost:4000
npm run dev -w client   # http://localhost:5173
```

## Environment variables

- `server/.env` (copy from `server/.env.example`) — created automatically by `npm run setup`.
- `client/.env` (copy from `client/.env.example`) — only needed if you want to point the client at an API URL other than the default `http://localhost:4000/api`.

## Resetting sample data

```bash
npm run prisma:seed -w server
```

## Project structure

```
client/   React app (Vite)
server/   Express API (Prisma + SQLite)
```

See `server/src/routes/todos.ts` for the API and `client/src/` for the frontend. Both are small enough to read end to end before you start.

Bug fixes

1. Adding todos quickly sometimes failed

Symptom: adding two todos in rapid succession occasionally broke the second one.

Root cause: the todo id was generated manually as String(Math.floor(Date.now() / 1000)) — a timestamp truncated to whole seconds. Two POST requests inside the same second produced the same id, and since id is the Prisma primary key, the second insert failed on a unique-constraint violation.

Fix: removed manual id generation; id now uses Prisma's @default(uuid()) in the schema, so every row gets a guaranteed-unique id regardless of timing. This removes the collision risk entirely rather than reducing its likelihood (e.g. via debouncing, which would have hidden the symptom without fixing the cause).

2. Deleting a todo sometimes removed the wrong one

Symptom: clicking delete on one todo occasionally removed a different one — not randomly, but consistently under certain conditions.

Root cause: the delete route located the clicked todo's index in the ordered list, then deleted ordered[index + 1] — the next item — instead of the todo at index itself. It only appeared to "work" when deleting the last item in the list, since index + 1 was then out of bounds.

Fix: the route now deletes directly by the id passed in the URL param — prisma.todo.delete({ where: { id } }) — with no index lookup at all. The fix is simpler than the buggy code it replaced, which was itself a useful signal that the index-based approach was solving a problem that didn't need solving.

3. Checkbox / priority changes didn't stick

Symptom: toggling a todo's completed state or changing its priority appeared to work in the UI, but the change would revert or never actually persisted.

Root cause: the PATCH /api/todos/:id route called prisma.todo.update(...) without await, then immediately responded with existing — the record fetched before the write. The client always received a stale, pre-update snapshot, and the actual database write raced in the background with no guarantee it completed or that errors were surfaced.

Fix: wrapped the update in an awaited prisma.$transaction, and the response now returns the freshly-written record instead of the pre-write snapshot. This same transaction now also handles the parent/subtask completion cascade (see Subtasks) atomically — a crash mid-write can't leave a todo and its subtasks in an inconsistent state.

Drag-and-drop reordering

For the drag-and-drop feature, I used a modern library called @dnd-kit to let users sort their tasks up and down the list.

To make the app feel polished, I added a small movement rule. This means if a user slightly twitches their mouse while trying to click a checkbox, it won't accidentally start dragging the item. It only starts dragging if they click and actually move the cursor a few pixels.

To make the app feel lightning-fast, I used an 'optimistic UI.' When you drop a task into a new spot, I update the screen instantly so you don't feel any lag. Behind the scenes, my code talks to the database to save that new order. If for some reason the server throws an error, I just snap the task back to its original position.

I also made sure the list order is saved permanently. I added an 'order' column to my database, so if you refresh the page or come back tomorrow, your tasks stay exactly where you left them.

I specifically chose @dnd-kit after looking at a few options. I avoided the browser's built-in drag-and-drop because it's terrible on mobile, and I skipped the famous react-beautiful-dnd library because its creators abandoned it. @dnd-kit is actively maintained, works great on mobile phones, and is fully accessible for users who rely on screen readers.

Subtasks

``` prisma
model Subtask {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  todoId    String
  todo      Todo     @relation(fields: [todoId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
1. The Database Design (Data Model)
I decided to allow only one level of subtasks (meaning you can't have sub-sub-tasks). I wanted to keep it simple, like a standard checklist, without overcomplicating the scope of the project.

I also added a database rule called Cascade Delete. This just means if a user deletes a main task, the database automatically wipes out all of its subtasks too. This prevents our database from getting cluttered with 'orphaned' subtasks that belong to a deleted parent.

2. The API 
I designed the API so that subtasks are always strictly tied to their parent task. A subtask can't exist on its own.

Also, a neat trick I used: whenever a user updates a subtask, my server doesn't just send back that one subtask—it sends back the entire updated main task. I did this because it makes the frontend code way easier to manage. The app only has to keep track of one main list of tasks, rather than trying to perfectly sync two separate lists (one for tasks and one for subtasks).

3. The Checkbox Logic (Parent/Child Behavior)
I wanted the checkboxes to feel smart, just like professional apps like Todoist or Things. The main task's checkbox is directly tied to what is happening with its subtasks:

If you check off the main task, it automatically checks off all the subtasks for you.

If you uncheck a subtask, the main task unchecks too .

If you check off the very last subtask, the app goes and automatically checks off the main task.

If you add a brand-new subtask to a task that was already checked off, it unchecks the main task.

(And if a task doesn't have any subtasks at all, the checkbox just works normally like it always did).

4. The User Interface (UI)
Instead of making the user click into a completely separate page to view subtasks, I built them directly underneath the main task using a simple expand/collapse button. It keeps the app feeling lightweight, fast, and easy to use without adding unnecessary navigation screens.


Live demo
https://todo-sky-nippon-client.vercel.app/
