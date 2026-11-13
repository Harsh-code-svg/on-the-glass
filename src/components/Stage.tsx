import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DOOR_H, DOOR_W, MARKER_SIZE, MARKERS, TEXT_SIZE } from "../scene/constants";
import { hitsErasable, strokePath } from "../scene/geometry";
import { uid, useStore } from "../scene/store";
import type { StrokeElement, TextElement } from "../scene/types";
import { DoorHardware, GlassBack } from "./GlassDoor";
import { MarkerText } from "./MarkerText";
import { StageContext } from "./StageContext";
import { StickyNote } from "./StickyNote";
import { Tray } from "./Tray";

type Pt = [number, number, number];

/** The door, scaled to fit the window, plus all pointer input on the glass. */
export const Stage = forwardRef<HTMLDivElement>(function Stage(_props, doorRef) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const scene = useStore((s) => s.scene);
  const tool = useStore((s) => s.tool);
  const markerIndex = useStore((s) => s.markerIndex);
  const selectedId = useStore((s) => s.selectedId);
  const editingId = useStore((s) => s.editingId);
  const focusAuthor = useStore((s) => s.focusAuthor);
  const meId = useStore((s) => s.meId);
  const active = useStore((s) => s.active);

  const [draft, setDraft] = useState<Pt[] | null>(null);
  const draftRef = useRef<Pt[] | null>(null);
  const erasing = useRef<{ recorded: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

  // fit the 1440×900 door into the window
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      setScale(Math.min(r.width / DOOR_W, r.height / DOOR_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toDoor = useCallback((clientX: number, clientY: number) => {
    const r = innerRef.current?.getBoundingClientRect();
    if (!r) return { x: clientX, y: clientY };
    const s = r.width / DOOR_W || 1;
    return { x: (clientX - r.left) / s, y: (clientY - r.top) / s };
  }, []);
  const api = useMemo(() => ({ toDoor }), [toDoor]);

  const markerColor = MARKERS[scene.door.glass][markerIndex]?.color ?? MARKERS[scene.door.glass][0].color;
  const sorted = useMemo(() => [...scene.elements].sort((a, b) => a.z - b.z), [scene.elements]);
  const people = useMemo(() => new Map(scene.participants.map((p) => [p.id, p])), [scene.participants]);
  const topZ = sorted.length ? sorted[sorted.length - 1].z : 0;

  const eraseAt = (x: number, y: number) => {
    const s = useStore.getState();
    const hit = s.scene.elements.filter((e) => hitsErasable(e, x, y, 10));
    if (!hit.length) return;
    if (erasing.current && !erasing.current.recorded) {
      s.checkpoint();
      erasing.current.recorded = true;
    }
    const ids = new Set(hit.map((h) => h.id));
    useStore.setState((st) => ({ scene: { ...st.scene, elements: st.scene.elements.filter((e) => !ids.has(e.id)) } }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const s = useStore.getState();
    const p = toDoor(e.clientX, e.clientY);
    if (s.tool === "marker") {
      e.currentTarget.setPointerCapture(e.pointerId);
      const pts: Pt[] = [[p.x, p.y, e.pointerType === "pen" ? e.pressure : 0.5]];
      draftRef.current = pts;
      setDraft(pts);
      s.setActive(true);
    } else if (s.tool === "eraser") {
      e.currentTarget.setPointerCapture(e.pointerId);
      erasing.current = { recorded: false };
      eraseAt(p.x, p.y);
    } else if (s.tool === "text") {
      e.preventDefault();
      const el: TextElement = {
        id: uid(),
        kind: "text",
        x: Math.round(p.x),
        y: Math.round(p.y - TEXT_SIZE * 0.7),
        text: "",
        color: markerColor,
        size: TEXT_SIZE,
        z: topZ + 1,
      };
      s.add(el);
      // like Excalidraw: after placing text, go back to the select tool
      useStore.setState({ tool: "select", selectedId: el.id, editingId: el.id, active: true });
    } else {
      s.select(null);
      // blurring lets the note/text finish itself (and drop off if empty)
      const focused = document.activeElement as HTMLElement | null;
      if (focused && focused.tagName === "TEXTAREA") focused.blur();
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (draftRef.current) {
      const events = (e.nativeEvent.getCoalescedEvents?.() ?? []) as PointerEvent[];
      const list = events.length ? events : [e.nativeEvent];
      const next = [...draftRef.current];
      for (const ev of list) {
        const p = toDoor(ev.clientX, ev.clientY);
        next.push([p.x, p.y, ev.pointerType === "pen" ? ev.pressure : 0.5]);
      }
      draftRef.current = next;
      setDraft(next);
    } else if (erasing.current) {
      const p = toDoor(e.clientX, e.clientY);
      eraseAt(p.x, p.y);
    }
  };

  const endGesture = () => {
    const pts = draftRef.current;
    if (pts) {
      draftRef.current = null;
      setDraft(null);
      const s = useStore.getState();
      s.setActive(false);
      {
        const stroke: StrokeElement = {
          id: uid(),
          kind: "stroke",
          color: markerColor,
          size: MARKER_SIZE,
          points: pts.map(([x, y, pr]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(pr * 100) / 100]),
          z: topZ + 1,
        };
        s.add(stroke);
      }
    }
    erasing.current = null;
  };

  // Esc while drawing cancels the stroke
  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        draftRef.current = null;
        setDraft(null);
        useStore.getState().setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  const interactive = tool === "select";

  return (
    <StageContext.Provider value={api}>
      <div ref={wrapRef} className="stage-wrap">
        <div className="stage-fit" style={{ width: DOOR_W * scale, height: DOOR_H * scale }}>
          <div
            ref={(node) => {
              innerRef.current = node;
              if (typeof doorRef === "function") doorRef(node);
              else if (doorRef) doorRef.current = node;
            }}
            className={"door tool-" + tool + " glass-" + scene.door.glass}
            style={{ transform: `scale(${scale})` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
          >
            <GlassBack glass={scene.door.glass} participants={scene.participants} nearId={active ? meId : null} />

            <div className="content">
              <svg className="strokes" width={DOOR_W} height={DOOR_H} viewBox={`0 0 ${DOOR_W} ${DOOR_H}`} aria-hidden="true">
                {sorted.map((el) =>
                  el.kind === "stroke" ? <path key={el.id} d={strokePath(el.points, el.size)} fill={el.color} /> : null,
                )}
                {draft && <path d={strokePath(draft, MARKER_SIZE)} fill={markerColor} />}
              </svg>

              {sorted.map((el) => {
                if (el.kind === "note") {
                  const dimmed = !!focusAuthor && el.author !== focusAuthor;
                  return (
                    <StickyNote
                      key={el.id}
                      note={el}
                      author={people.get(el.author)}
                      selected={selectedId === el.id}
                      editing={editingId === el.id}
                      dimmed={dimmed}
                      interactive={interactive || editingId === el.id}
                    />
                  );
                }
                if (el.kind === "text") {
                  return (
                    <MarkerText
                      key={el.id}
                      el={el}
                      selected={selectedId === el.id}
                      editing={editingId === el.id}
                      interactive={interactive}
                    />
                  );
                }
                return null;
              })}
            </div>

            <DoorHardware />

            {scene.elements.length === 0 && !draft && (
              <p className="empty-hint">
                Pull a note off the pad, or pick a marker and write on the glass.
              </p>
            )}

            <div className="tray-dock">
              <Tray onGhost={setGhost} />
            </div>

            {ghost && (
              <div
                className="note-ghost"
                style={{ left: ghost.x - 94, top: ghost.y - 94, background: people.get(meId ?? "")?.color ?? "#FFE27A" }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </div>
    </StageContext.Provider>
  );
});
