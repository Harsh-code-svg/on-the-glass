import { useRef } from "react";
import { useStore } from "../scene/store";
import { useStage } from "./StageContext";

/**
 * Select tool: press to bring to front and select, drag to move.
 * The undo checkpoint is taken only once the pointer actually moves.
 */
export function useDragElement(id: string, x: number, y: number) {
  const { toDoor } = useStage();
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean; pid: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const s = useStore.getState();
    if (s.tool !== "select" || e.button !== 0) return;
    if (s.editingId === id) return; // let the textarea handle it
    e.stopPropagation();
    s.raise(id);
    s.select(id);
    const focused = document.activeElement as HTMLElement | null;
    if (focused && focused.tagName === "TEXTAREA") focused.blur();
    const p = toDoor(e.clientX, e.clientY);
    drag.current = { sx: p.x, sy: p.y, ox: x, oy: y, moved: false, pid: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.pid !== e.pointerId) return;
    const p = toDoor(e.clientX, e.clientY);
    const dx = p.x - d.sx;
    const dy = p.y - d.sy;
    if (!d.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 4) return;
      d.moved = true;
      useStore.getState().checkpoint();
    }
    useStore.getState().patch(id, { x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current?.pid === e.pointerId) drag.current = null;
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}
