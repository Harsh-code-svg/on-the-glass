import type { GlassKind } from "./types";

/** The door is drawn in a fixed coordinate space and scaled to fit the window. */
export const DOOR_W = 1440;
export const DOOR_H = 900;
export const GLASS = { x: 44, y: 44, w: 1352, h: 812 };

/** Note box (includes the shadow margin) and visible paper size. */
export const NOTE_BOX = 220;
export const NOTE_PAPER = 188;

/** One colour pair per participant, assigned in join order. */
export const PEOPLE_PALETTE = [
  { color: "#FFE27A", ink: "#8A6200" },
  { color: "#FFB3C7", ink: "#A3274F" },
  { color: "#A8D8FF", ink: "#1F5F99" },
  { color: "#BDEBA6", ink: "#2F6B22" },
  { color: "#FFC48A", ink: "#A6480F" },
  { color: "#D9C6FF", ink: "#5A32A0" },
  { color: "#9FF0E1", ink: "#0B6F6B" },
  { color: "#E9E4DA", ink: "#4A4036" },
];

export interface Marker {
  name: string;
  color: string;
}

/** Classic markers for frosted glass, neon markers for clear (dark) glass. */
export const MARKERS: Record<GlassKind, Marker[]> = {
  frosted: [
    { name: "Black", color: "#1d1d1f" },
    { name: "Blue", color: "#1d42a8" },
    { name: "Pink", color: "#b8255a" },
    { name: "Green", color: "#17704a" },
    { name: "Purple", color: "#5a32a0" },
  ],
  clear: [
    { name: "White", color: "#f4efe6" },
    { name: "Cyan", color: "#5fe3ff" },
    { name: "Pink", color: "#ff7ad9" },
    { name: "Lime", color: "#b8ff5c" },
    { name: "Yellow", color: "#ffd84d" },
  ],
};

export const MARKER_SIZE = 6;
export const TEXT_SIZE = 30;
