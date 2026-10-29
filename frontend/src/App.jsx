import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";
import { Brand, ErrorMessage } from "./components/UI";
import Auth from "./pages/Auth";
import Workspace from "./pages/Workspace";

export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function initialize() {
    setLoading(true);
    setError("");
    try {
      setUser(await api("/auth/me"));
    } catch (e) {
      if (e.status !== 401)
        setError("Cannot reach the server. Start the backend and try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    initialize();
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  if (loading)
    return (
      <div className="startup">
        <Brand />
        <p>Opening your workspace…</p>
      </div>
    );
  if (error)
    return (
      <div className="startup">
        <Brand />
        <ErrorMessage message={error} />
        <button onClick={initialize}>Retry connection</button>
      </div>
    );
  return user ? (
    <Workspace user={user} onLogout={() => setUser(null)} />
  ) : (
    <Auth onLogin={setUser} />
  );
}
