import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../api";
import { Brand, ErrorMessage } from "../components/UI";

export default function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.email = values.email.trim().toLowerCase();
    try {
      if (register)
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify(values),
        });
      await api("/auth/login", {
        method: "POST",
        body: new URLSearchParams({
          email: values.email,
          password: values.password,
        }),
      });
      onLogin(await api("/auth/me"));
    } catch (e) {
      setError(Object.values(e.fields || {}).join(". ") || e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">LESS ADMIN. MORE OPPORTUNITY.</span>
          <h1>
            Good relationships
            <br />
            start with a<br />
            <em>clear next step.</em>
          </h1>
          <p>
            Your leads, conversations, and follow-ups.
            <br />
            Together in one thoughtfully simple workspace.
          </p>
          <div className="story-note">
            <span>01 — 05</span>
            <p>
              From first hello
              <br />
              to your next customer.
            </p>
            <ArrowUpRight size={36} />
          </div>
        </div>
        <small>BUILT FOR SOFTWARE & DIGITAL TEAMS</small>
      </section>
      <main className="auth-main">
        <div className="auth-card">
          <span className="eyebrow">YOUR SALES WORKSPACE</span>
          <h2>{register ? "Make room for growth." : "Welcome back."}</h2>
          <p>
            {register
              ? "Create your account and start building your pipeline."
              : "Sign in to pick up where you left off."}
          </p>
          <ErrorMessage message={error} />
          <form onSubmit={submit}>
            {register && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                placeholder="you@company.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 10 : undefined}
                maxLength={64}
              />
            </label>
            {register && (
              <small>Use 10–64 characters (at most 72 UTF-8 bytes).</small>
            )}
            <button className="primary wide" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="switch-auth">
            {register ? "Already have an account?" : "New to Leadroom?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <div className="secure-note">
            Your workspace is private. Only you can access your leads.
          </div>
        </div>
      </main>
    </div>
  );
}
