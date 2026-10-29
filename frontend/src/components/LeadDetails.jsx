import React, { useState, useEffect, useRef } from "react";
import { X, Pencil } from "lucide-react";
import { label } from "../constants";

export default function LeadDetails({ lead, onClose, onEdit }) {
  const dialog = useRef(null);
  useEffect(() => dialog.current.showModal(), []);
  return (
    <dialog ref={dialog} onCancel={onClose}>
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">LEAD DETAILS</span>
          <h2>{lead.name}</h2>
        </div>
        <button
          autoFocus
          className="icon-button"
          onClick={onClose}
          aria-label="Close details"
        >
          <X />
        </button>
      </div>
      <div className="detail-grid">
        {[
          ["Email", lead.email],
          ["Phone", lead.phone],
          ["Company", lead.company],
          ["Service", lead.service],
          ["Status", label(lead.status)],
          ["Follow-up", lead.followUpDate || "Not scheduled"],
          ["Created", new Date(lead.createdAt).toLocaleString()],
        ].map(([k, v]) => (
          <div key={k}>
            <small>{k}</small>
            <p>{v}</p>
          </div>
        ))}
      </div>
      <small>Notes</small>
      <p className="notes">{lead.notes || "No notes yet."}</p>
      <div className="dialog-footer">
        <button className="primary" onClick={onEdit}>
          Edit lead
          <Pencil size={16} />
        </button>
      </div>
    </dialog>
  );
}
