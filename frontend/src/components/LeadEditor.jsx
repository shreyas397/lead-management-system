import React, { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { api } from "../api";
import { ErrorMessage } from "./UI";
import { statuses, label, emptyLead, services } from "../constants";

export default function LeadEditor({ lead, onClose, onSaved }) {
  const [values, setValues] = useState(lead || emptyLead),
    [error, setError] = useState(""),
    [fields, setFields] = useState({}),
    [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  const change = (event) =>
    setValues({ ...values, [event.target.name]: event.target.value });
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFields({});
    try {
      const body = Object.fromEntries(
        Object.keys(emptyLead).map((key) => [key, values[key]]),
      );
      body.followUpDate ||= null;
      await api("/leads" + (lead ? "/" + lead.id : ""), {
        method: lead ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (e) {
      setError(e.message);
      setFields(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  function field(name, title, type = "text", max = 100) {
    return (
      <label>
        {title}
        <input
          autoFocus={name === "name"}
          name={name}
          type={type}
          value={values[name] || ""}
          onChange={change}
          required={name !== "followUpDate"}
          maxLength={max}
          aria-invalid={!!fields[name]}
        />
        {fields[name] && <small className="field-error">{fields[name]}</small>}
      </label>
    );
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">YOUR PIPELINE</span>
          <h2>{lead ? "Edit lead" : "A new opportunity"}</h2>
        </div>
        <button
          className="icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close editor"
        >
          <X />
        </button>
      </div>
      <form onSubmit={save}>
        <ErrorMessage message={error} />
        <div className="form-grid">
          {field("name", "Full name")}
          {field("company", "Company", "text", 150)}
          {field("email", "Email address", "email", 254)}
          {field("phone", "Phone number", "tel", 30)}
          <label>
            Service interested
            <select name="service" value={values.service} onChange={change}>
              {services.map((s) => (
                <option key={s}>{s}</option>
              ))}
              {!services.includes(values.service) && (
                <option>{values.service}</option>
              )}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={values.status} onChange={change}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </label>
          {field("followUpDate", "Follow-up date", "date")}
          <label>
            Created date
            <input
              disabled
              value={
                lead
                  ? new Date(lead.createdAt).toLocaleDateString()
                  : "Set automatically when saved"
              }
            />
          </label>
          <label className="full">
            Notes
            <textarea
              name="notes"
              value={values.notes}
              onChange={change}
              maxLength={4000}
              rows={4}
              placeholder="Conversation details, goals, or the next step…"
            />
            {fields.notes && (
              <small className="field-error">{fields.notes}</small>
            )}
          </label>
        </div>
        <div className="dialog-footer">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : lead ? "Save changes" : "Create lead"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
