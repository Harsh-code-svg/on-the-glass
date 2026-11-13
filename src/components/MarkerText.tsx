import { useEffect, useRef } from "react";
import { useStore } from "../scene/store";
import type { TextElement } from "../scene/types";
import { useDragElement } from "./useDragElement";

/** Handwritten text in marker, straight on the glass. */
export function MarkerText({
  el,
  selected,
  editing,
  interactive,
}: {
  el: TextElement;
  selected: boolean;
  editing: boolean;
  interactive: boolean;
}) {
  const drag = useDragElement(el.id, el.x, el.y);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const t = ref.current;
    if (!t) return;
    t.focus();
    t.setSelectionRange(t.value.length, t.value.length);
  }, [editing]);

  useEffect(() => {
    // grow the textarea with its content
    const t = ref.current;
    if (!t) return;
    t.style.height = "0px";
    t.style.height = t.scrollHeight + "px";
    t.style.width = "0px";
    t.style.width = Math.max(t.scrollWidth, 60) + "px";
  }, [editing, el.text]);

  const finish = () => {
    const s = useStore.getState();
    s.setEditing(null);
    const cur = s.scene.elements.find((e) => e.id === el.id);
    if (cur && cur.kind === "text" && !cur.text.trim()) {
      useStore.setState((st) => ({
        scene: { ...st.scene, elements: st.scene.elements.filter((e) => e.id !== el.id) },
        selectedId: null,
      }));
    }
  };

  const style = { left: el.x, top: el.y, zIndex: el.z, color: el.color, fontSize: el.size };

  if (editing) {
    return (
      <textarea
        ref={ref}
        className="marker-text marker-input"
        style={style}
        aria-label="Text on the glass"
        placeholder="Write…"
        value={el.text}
        rows={1}
        onChange={(e) => useStore.getState().patch(el.id, { text: e.target.value })}
        onBlur={finish}
        onKeyDown={(e) => {
          if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      className={"marker-text" + (selected ? " is-selected" : "") + (interactive ? "" : " is-passive")}
      style={style}
      {...drag}
      onDoubleClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        const s = useStore.getState();
        s.checkpoint();
        s.setEditing(el.id);
      }}
    >
      {el.text}
    </div>
  );
}
