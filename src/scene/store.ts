import { create } from "zustand";
import { GLASS, NOTE_BOX, PEOPLE_PALETTE } from "./constants";
import type { GlassKind, NoteElement, Scene, SceneElement, Tool } from "./types";

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const emptyScene = (): Scene => ({
  type: "on-the-glass",
  version: 1,
  title: "Untitled session",
  door: { glass: "frosted" },
  participants: [],
  elements: [],
});

const HISTORY_LIMIT = 100;

interface State {
  scene: Scene;
  tool: Tool;
  markerIndex: number;
  selectedId: string | null;
  editingId: string | null;
  focusAuthor: string | null;
  meId: string | null;
  /** True while the local user is drawing or writing (their silhouette steps closer). */
  active: boolean;
  past: SceneElement[][];
  future: SceneElement[][];

  setTool: (tool: Tool) => void;
  setMarkerIndex: (i: number) => void;
  select: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  toggleFocus: (author: string) => void;
  setActive: (active: boolean) => void;

  /** Record the current elements so the next change can be undone. */
  checkpoint: () => void;
  add: (el: SceneElement) => void;
  patch: (id: string, patch: Partial<SceneElement>) => void;
  remove: (id: string) => void;
  raise: (id: string) => void;
  addNote: (cx: number, cy: number) => string | null;
  undo: () => void;
  redo: () => void;

  load: (scene: Scene) => void;
  reset: () => void;
  setTitle: (title: string) => void;
  setGlass: (glass: GlassKind) => void;
  join: (me: { id: string; name: string }) => void;
}

const topZ = (els: SceneElement[]) => els.reduce((m, e) => Math.max(m, e.z), 0);

export const useStore = create<State>((set, get) => ({
  scene: emptyScene(),
  tool: "select",
  markerIndex: 1,
  selectedId: null,
  editingId: null,
  focusAuthor: null,
  meId: null,
  active: false,
  past: [],
  future: [],

  setTool: (tool) => set({ tool, selectedId: null, editingId: null }),
  setMarkerIndex: (markerIndex) => set({ markerIndex, tool: "marker", selectedId: null, editingId: null }),
  select: (selectedId) => set({ selectedId }),
  setEditing: (editingId) => set({ editingId, active: editingId !== null }),
  toggleFocus: (author) => set((s) => ({ focusAuthor: s.focusAuthor === author ? null : author })),
  setActive: (active) => set({ active }),

  checkpoint: () =>
    set((s) => ({
      past: [...s.past, s.scene.elements].slice(-HISTORY_LIMIT),
      future: [],
    })),

  add: (el) => {
    get().checkpoint();
    set((s) => ({ scene: { ...s.scene, elements: [...s.scene.elements, el] } }));
  },

  patch: (id, patch) =>
    set((s) => ({
      scene: {
        ...s.scene,
        elements: s.scene.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as SceneElement) : e)),
      },
    })),

  remove: (id) => {
    get().checkpoint();
    set((s) => ({
      scene: { ...s.scene, elements: s.scene.elements.filter((e) => e.id !== id) },
      selectedId: s.selectedId === id ? null : s.selectedId,
      editingId: s.editingId === id ? null : s.editingId,
    }));
  },

  raise: (id) => {
    const els = get().scene.elements;
    const el = els.find((e) => e.id === id);
    if (!el) return;
    const top = topZ(els);
    if (el.z === top && els.filter((e) => e.z === top).length === 1) return;
    get().patch(id, { z: top + 1 });
  },

  addNote: (cx, cy) => {
    const { meId, scene } = get();
    if (!meId) return null;
    const half = NOTE_BOX / 2;
    const x = Math.min(Math.max(cx - half, GLASS.x - 14), GLASS.x + GLASS.w - NOTE_BOX + 14);
    const y = Math.min(Math.max(cy - half, GLASS.y - 14), GLASS.y + GLASS.h - NOTE_BOX + 14);
    const tilt = Math.round((1 + Math.random() * 2) * (Math.random() < 0.5 ? -1 : 1) * 2) / 2;
    const note: NoteElement = {
      id: uid(),
      kind: "note",
      x: Math.round(x),
      y: Math.round(y),
      tilt,
      author: meId,
      text: "",
      createdAt: new Date().toISOString(),
      z: topZ(scene.elements) + 1,
    };
    get().add(note);
    set({ selectedId: note.id, editingId: note.id, tool: "select", active: true });
    return note.id;
  },

  undo: () => {
    const { past, future, scene } = get();
    if (!past.length) return;
    set({
      past: past.slice(0, -1),
      future: [scene.elements, ...future].slice(0, HISTORY_LIMIT),
      scene: { ...scene, elements: past[past.length - 1] },
      selectedId: null,
      editingId: null,
    });
  },

  redo: () => {
    const { past, future, scene } = get();
    if (!future.length) return;
    set({
      past: [...past, scene.elements],
      future: future.slice(1),
      scene: { ...scene, elements: future[0] },
      selectedId: null,
      editingId: null,
    });
  },

  /** Replace the session. Call join() afterwards so the local user is in it. */
  load: (scene) =>
    set({ scene, past: [], future: [], selectedId: null, editingId: null, focusAuthor: null }),

  reset: () => {
    const { meId, scene } = get();
    const me = scene.participants.find((p) => p.id === meId);
    const next = emptyScene();
    next.door = scene.door;
    if (me) next.participants = [{ ...me, ...PEOPLE_PALETTE[0] }];
    set({ scene: next, past: [], future: [], selectedId: null, editingId: null, focusAuthor: null });
  },

  setTitle: (title) => set((s) => ({ scene: { ...s.scene, title } })),
  setGlass: (glass) => set((s) => ({ scene: { ...s.scene, door: { ...s.scene.door, glass } } })),

  join: (me) =>
    set((s) => {
      const existing = s.scene.participants.find((p) => p.id === me.id);
      if (existing) {
        if (existing.name === me.name) return { meId: me.id };
        return {
          meId: me.id,
          scene: {
            ...s.scene,
            participants: s.scene.participants.map((p) => (p.id === me.id ? { ...p, name: me.name } : p)),
          },
        };
      }
      const colors = PEOPLE_PALETTE[s.scene.participants.length % PEOPLE_PALETTE.length];
      return {
        meId: me.id,
        scene: { ...s.scene, participants: [...s.scene.participants, { id: me.id, name: me.name, ...colors }] },
      };
    }),
}));
