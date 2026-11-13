import { toPng } from "html-to-image";
import type { Scene } from "./types";

const SCENE_KEY = "on-the-glass:scene";
const ME_KEY = "on-the-glass:me";
export const FILE_EXT = ".glassdoor";

export function isScene(x: unknown): x is Scene {
  if (!x || typeof x !== "object") return false;
  const s = x as Partial<Scene>;
  return (
    s.type === "on-the-glass" &&
    Array.isArray(s.elements) &&
    Array.isArray(s.participants) &&
    typeof s.title === "string"
  );
}

/** Bring older sessions up to date ("clear" glass became "night"). */
export function normalizeScene(scene: Scene): Scene {
  const g = (scene.door?.glass as string) ?? "daylight";
  const glass = g === "clear" ? "night" : g === "frosted" || g === "night" || g === "daylight" ? g : "daylight";
  return { ...scene, door: { ...scene.door, glass } };
}

/* ---------- browser autosave (like Excalidraw's localStorage save) ---------- */

export function loadLocalScene(): Scene | null {
  try {
    const raw = localStorage.getItem(SCENE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isScene(parsed) ? normalizeScene(parsed) : null;
  } catch {
    return null;
  }
}

export function saveLocalScene(scene: Scene): boolean {
  try {
    localStorage.setItem(SCENE_KEY, JSON.stringify(scene));
    return true;
  } catch {
    return false;
  }
}

export function loadMe(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(ME_KEY);
    if (!raw) return null;
    const me = JSON.parse(raw);
    return me && typeof me.id === "string" && typeof me.name === "string" ? me : null;
  } catch {
    return null;
  }
}

export function saveMe(me: { id: string; name: string }) {
  try {
    localStorage.setItem(ME_KEY, JSON.stringify(me));
  } catch {
    /* storage unavailable: the name lasts for this visit only */
  }
}

/* ---------- files ---------- */

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "session";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadScene(scene: Scene) {
  const blob = new Blob([JSON.stringify(scene, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  download(url, slug(scene.title) + FILE_EXT);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readSceneFile(file: File): Promise<Scene> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn’t an On the Glass session.");
  }
  if (!isScene(parsed)) throw new Error("That file isn’t an On the Glass session.");
  return normalizeScene(parsed);
}

export async function exportPng(node: HTMLElement, title: string) {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    // leave the tools out of the snapshot
    filter: (n) => !(n instanceof HTMLElement && n.classList.contains("tray-dock")),
  });
  download(dataUrl, slug(title) + ".png");
}
