/** A session is one JSON "scene", the same idea as an .excalidraw file. */

export type Tool = "select" | "marker" | "text" | "eraser";
export type GlassKind = "frosted" | "clear";

export interface Participant {
  id: string;
  name: string;
  /** Note colour. */
  color: string;
  /** Darker tone for avatars and initials. */
  ink: string;
}

interface BaseElement {
  id: string;
  /** Stacking order; higher is in front. */
  z: number;
}

export interface NoteElement extends BaseElement {
  kind: "note";
  x: number;
  y: number;
  tilt: number;
  author: string;
  text: string;
  createdAt: string;
}

export interface StrokeElement extends BaseElement {
  kind: "stroke";
  color: string;
  size: number;
  /** [x, y, pressure] in door coordinates. */
  points: [number, number, number][];
}

export interface TextElement extends BaseElement {
  kind: "text";
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export type SceneElement = NoteElement | StrokeElement | TextElement;

export interface Scene {
  type: "on-the-glass";
  version: 1;
  title: string;
  door: { glass: GlassKind };
  participants: Participant[];
  elements: SceneElement[];
}
