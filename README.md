# On the Glass

A brainstorming glass door for the browser. Stick notes on frosted glass, write on it with markers, and save the session the way Excalidraw does.

## What works today

- **The door**: clear glass double doors onto a bright office (aluminium frame, chrome fittings and handles, a frosted privacy strip, reflections and glass edges). Switch to frosted privacy glass or a night mode with neon markers from the menu. Each participant is someone in the office; whoever is writing walks up to the door.
- **Sticky notes**: drag one off the pad (or press `N`), type, press Enter. Each person has their own note colour, and every note is signed with your name and the date. Click a note to bring it to the front, drag it to move it, double-click to edit it.
- **Markers**: five classic markers on frosted glass, five neon markers on clear glass. Freehand strokes use [perfect-freehand](https://github.com/steveruizok/perfect-freehand), with pen pressure when there is one.
- **Text** in marker handwriting, and an **eraser** that wipes marker (never notes).
- **Faces**: tap a face to highlight that person's notes.
- **Undo / redo** for every change.

## Saving (like Excalidraw)

| | |
|---|---|
| Autosave | The session is saved in this browser as you work (`localStorage`). Reload and it's still there. |
| Save to file | `Ctrl/Cmd + S` downloads a `.glassdoor` file (plain JSON). |
| Open | `Ctrl/Cmd + O`, or drop a `.glassdoor` file anywhere on the page. |
| Export image | Menu → Export image saves a PNG of the door. |

### The session format

A session is a single JSON scene (`src/scene/types.ts`):

```json
{
  "type": "on-the-glass",
  "version": 1,
  "title": "Onboarding brainstorm",
  "door": { "glass": "frosted" },
  "participants": [{ "id": "…", "name": "Amara", "color": "#FFE27A", "ink": "#8A6200" }],
  "elements": [
    { "id": "…", "kind": "note", "x": 96, "y": 196, "tilt": -2, "z": 3, "author": "…", "text": "Buddy pairs", "createdAt": "2026-11-13T15:00:00Z" },
    { "id": "…", "kind": "stroke", "color": "#1d42a8", "size": 6, "z": 4, "points": [[80, 120, 0.5], [190, 113, 0.5]] },
    { "id": "…", "kind": "text", "x": 80, "y": 70, "z": 5, "text": "Product strategy", "color": "#1d1d1f", "size": 30 }
  ]
}
```

Door coordinates are a fixed 1440 × 900 space, scaled to fit the window.

## Keyboard

| Key | |
|---|---|
| `V` / `Esc` | Select and move |
| `1`–`5` | Pick a marker |
| `T` | Text |
| `E` | Eraser |
| `N` | New note |
| `Delete` | Delete the selected note or text |
| `Ctrl/Cmd + Z`, `Ctrl/Cmd + Shift + Z` | Undo, redo |
| `Ctrl/Cmd + S`, `Ctrl/Cmd + O` | Save to file, open |

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
```

## Deploy on Vercel

Import the GitHub repo in Vercel. It detects Vite automatically: build command `npm run build`, output directory `dist`. No environment variables are needed.

## Project layout

```
src/
  scene/        types, store (zustand + undo history), persistence, geometry
  components/   Stage (scaling + pointer input), GlassDoor, StickyNote, MarkerText, Tray, TopBar, Dialog
```

## Next up

- Shapes and arrows (circle a cluster, connect ideas), tape lines
- Activities from the design explorations: silent write and reveal, dot voting, left door vs right door
- Live collaboration and share links (Yjs + a small sync server), using the same scene format
