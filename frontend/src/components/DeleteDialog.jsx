import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { ErrorMessage } from "./UI";

export default function DeleteDialog({ lead, onClose, onDeleted }) {
  const dialog = useRef(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => dialog.current.showModal(), []);
  async function remove() {
    setBusy(true);
    try {
      await api("/leads/" + lead.id, { method: "DELETE" });
      onDeleted();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <dialog
      className="small-dialog"
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2>Delete {lead.name}?</h2>
      <p>This permanently removes the lead and its notes.</p>
      <ErrorMessage message={error} />
      <div className="dialog-footer">
        <button autoFocus onClick={onClose} disabled={busy}>
          Keep lead
        </button>
        <button className="danger" onClick={remove} disabled={busy}>
          {busy ? "Deleting…" : "Delete lead"}
        </button>
      </div>
    </dialog>
  );
}
