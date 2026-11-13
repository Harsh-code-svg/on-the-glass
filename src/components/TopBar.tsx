import { Check, Download, FilePlus2, FolderOpen, Image, Menu, Redo2, Undo2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../scene/store";
import type { GlassKind } from "../scene/types";

export function TopBar({
  onNew,
  onOpen,
  onSave,
  onExport,
  onRename,
  savedState,
}: {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onRename: () => void;
  savedState: "saved" | "unsaved" | "unavailable";
}) {
  const title = useStore((s) => s.scene.title);
  const glass = useStore((s) => s.scene.door.glass);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = (label: string, hint: string, icon: React.ReactNode, run: () => void) => (
    <button
      type="button"
      role="menuitem"
      className="menu-item"
      onClick={() => {
        setOpen(false);
        run();
      }}
    >
      {icon}
      <span className="menu-label">{label}</span>
      <kbd>{hint}</kbd>
    </button>
  );

  const glassItem = (g: GlassKind, label: string) => (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={glass === g}
      className="menu-item"
      onClick={() => useStore.getState().setGlass(g)}
    >
      <span className="menu-check">{glass === g && <Check size={16} />}</span>
      <span className="menu-label">{label}</span>
    </button>
  );

  return (
    <header className="topbar">
      <div className="topbar-left" ref={menuRef}>
        <button
          type="button"
          className="chip-btn"
          aria-label="Menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Menu size={20} />
        </button>
        <label className="title-field">
          <span className="sr-only">Session title</span>
          <input
            value={title}
            onChange={(e) => useStore.getState().setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            spellCheck={false}
          />
        </label>
        {open && (
          <div className="menu" role="menu">
            {item("New session", "", <FilePlus2 size={18} />, onNew)}
            {item("Open…", "Ctrl O", <FolderOpen size={18} />, onOpen)}
            {item("Save to file", "Ctrl S", <Download size={18} />, onSave)}
            {item("Export image", "", <Image size={18} />, onExport)}
            <div className="menu-sep" />
            <p className="menu-heading">Glass</p>
            {glassItem("frosted", "Frosted · classic markers")}
            {glassItem("clear", "Clear · neon markers")}
            <div className="menu-sep" />
            {item("Change your name", "", <UserRound size={18} />, onRename)}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <span className={"save-state save-" + savedState} role="status">
          {savedState === "saved" && "Saved in this browser"}
          {savedState === "unsaved" && "Saving…"}
          {savedState === "unavailable" && "Can’t save in this browser — use Save to file"}
        </span>
        <button
          type="button"
          className="chip-btn"
          aria-label="Undo (Ctrl Z)"
          title="Undo — Ctrl Z"
          disabled={!canUndo}
          onClick={() => useStore.getState().undo()}
        >
          <Undo2 size={20} />
        </button>
        <button
          type="button"
          className="chip-btn"
          aria-label="Redo (Ctrl Shift Z)"
          title="Redo — Ctrl Shift Z"
          disabled={!canRedo}
          onClick={() => useStore.getState().redo()}
        >
          <Redo2 size={20} />
        </button>
      </div>
    </header>
  );
}
