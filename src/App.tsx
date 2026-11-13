import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog, NameDialog } from "./components/Dialog";
import { Stage } from "./components/Stage";
import { TopBar } from "./components/TopBar";
import { addNoteInOpenSpot } from "./components/Tray";
import { MARKERS } from "./scene/constants";
import {
  downloadScene,
  exportPng,
  FILE_EXT,
  loadLocalScene,
  loadMe,
  readSceneFile,
  saveLocalScene,
  saveMe,
} from "./scene/persistence";
import { uid, useStore } from "./scene/store";

export default function App() {
  const doorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [me, setMe] = useState(loadMe);
  const [askName, setAskName] = useState(!me);
  const [confirmNew, setConfirmNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<"saved" | "unsaved" | "unavailable">("saved");
  const [dragOver, setDragOver] = useState(false);

  // restore the last session from this browser, then join it
  useEffect(() => {
    const local = loadLocalScene();
    if (local) useStore.getState().load(local);
    if (me) useStore.getState().join(me);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // autosave (debounced), like Excalidraw does in localStorage
  useEffect(() => {
    let t: number | undefined;
    const unsub = useStore.subscribe((s, prev) => {
      if (s.scene === prev.scene) return;
      setSavedState("unsaved");
      window.clearTimeout(t);
      t = window.setTimeout(() => setSavedState(saveLocalScene(useStore.getState().scene) ? "saved" : "unavailable"), 400);
    });
    const flush = () => saveLocalScene(useStore.getState().scene);
    window.addEventListener("beforeunload", flush);
    return () => {
      unsub();
      window.clearTimeout(t);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 2600);
  };

  const openFile = useCallback(async (file: File) => {
    try {
      const scene = await readSceneFile(file);
      useStore.getState().load(scene);
      const current = loadMe();
      if (current) useStore.getState().join(current);
      flash(`Opened “${scene.title}”`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Couldn’t open that file.");
    }
  }, []);

  const save = useCallback(() => {
    downloadScene(useStore.getState().scene);
    flash("Saved a copy to your downloads");
  }, []);

  const exportImage = useCallback(async () => {
    const node = doorRef.current;
    if (!node) return;
    const s = useStore.getState();
    s.select(null);
    s.setEditing(null);
    try {
      // render the door at its natural size
      const prev = node.style.transform;
      node.style.transform = "none";
      await exportPng(node, s.scene.title);
      node.style.transform = prev;
      flash("Image exported");
    } catch {
      flash("Couldn’t export the image in this browser.");
    }
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest("input, textarea, [contenteditable='true']");
      const mod = e.metaKey || e.ctrlKey;
      const s = useStore.getState();

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        fileRef.current?.click();
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
        return;
      }
      if (mod || e.altKey) return;

      const markers = MARKERS[s.scene.door.glass];
      const k = e.key.toLowerCase();
      if (k === "v" || k === "escape") s.setTool("select");
      else if (k === "p" || k === "m") s.setMarkerIndex(s.markerIndex);
      else if (k === "t") s.setTool("text");
      else if (k === "e") s.setTool("eraser");
      else if (k === "n") {
        e.preventDefault();
        addNoteInOpenSpot();
      } else if (/^[1-9]$/.test(k) && Number(k) <= markers.length) s.setMarkerIndex(Number(k) - 1);
      else if ((e.key === "Delete" || e.key === "Backspace") && s.selectedId) {
        e.preventDefault();
        s.remove(s.selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  return (
    <div
      className="app"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) openFile(file);
      }}
    >
      <TopBar
        onNew={() => setConfirmNew(true)}
        onOpen={() => fileRef.current?.click()}
        onSave={save}
        onExport={exportImage}
        onRename={() => setAskName(true)}
        savedState={savedState}
      />

      <Stage ref={doorRef} />

      <input
        ref={fileRef}
        type="file"
        accept={`${FILE_EXT},application/json,.json`}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openFile(file);
          e.target.value = "";
        }}
      />

      {dragOver && <div className="drop-hint">Drop a {FILE_EXT} file to open it</div>}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {askName && (
        <NameDialog
          initial={me?.name ?? ""}
          onCancel={me ? () => setAskName(false) : undefined}
          onDone={(name) => {
            const next = { id: me?.id ?? uid(), name };
            saveMe(next);
            setMe(next);
            useStore.getState().join(next);
            setAskName(false);
          }}
        />
      )}

      {confirmNew && (
        <ConfirmDialog
          title="Start a new session?"
          body="This wipes the door in this browser. Save to file first if you want to keep this one."
          confirm="Wipe the door"
          onCancel={() => setConfirmNew(false)}
          onConfirm={() => {
            useStore.getState().reset();
            const current = loadMe();
            if (current) useStore.getState().join(current);
            setConfirmNew(false);
          }}
        />
      )}
    </div>
  );
}
