import React from "react";
import { Target } from "lucide-react";

export function Brand() {
  return (
    <div className="brand">
      <span>
        <Target size={22} />
      </span>
      leadroom<span className="brand-dot">.</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return message ? (
    <div className="error" role="alert">
      {message}
    </div>
  ) : null;
}
