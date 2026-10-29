import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Plus,
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  CalendarDays,
  Check,
  Menu,
} from "lucide-react";
import { api } from "../api";
import { statuses, label } from "../constants";
import { Brand, ErrorMessage } from "../components/UI";
import LeadEditor from "../components/LeadEditor";
import DeleteDialog from "../components/DeleteDialog";
import Detail from "../components/LeadDetails";

export default function Workspace({ user, onLogout }) {
  const [view, setView] = useState("dashboard"),
    [mobile, setMobile] = useState(false),
    [stats, setStats] = useState(null),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [reload, setReload] = useState(0),
    [toast, setToast] = useState("");
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(0),
    [modal, setModal] = useState(null),
    [exporting, setExporting] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    const params = new URLSearchParams({
      search: query,
      page: String(page),
      size: "10",
    });
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    Promise.all([api("/leads?" + params), api("/leads/stats")])
      .then(([rows, counts]) => {
        if (active) {
          setData(rows);
          setStats(counts);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [query, status, from, to, page, reload]);
  function saved(message) {
    setModal(null);
    setToast(message);
    setReload((n) => n + 1);
    setPage(0);
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      onLogout();
    } catch (e) {
      setError(e.message);
    }
  }
  async function exportCsv() {
    setExporting(true);
    try {
      let rows = [],
        p = 0,
        result;
      do {
        const params = new URLSearchParams({
          search: query,
          page: String(p++),
          size: "100",
        });
        if (status) params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        result = await api("/leads?" + params);
        rows.push(...result.content);
      } while (p < result.totalPages);
      const keys = [
        "name",
        "email",
        "phone",
        "company",
        "service",
        "status",
        "followUpDate",
        "notes",
        "createdAt",
      ];
      // Prefix spreadsheet formulas to prevent CSV formula injection.
      const cell = (value) => {
        let s = String(value ?? "");
        if (/^[=+@\-\t\r\n]/.test(s)) s = "'" + s;
        return '"' + s.replaceAll('"', '""') + '"';
      };
      const csv = [
        keys.join(","),
        ...rows.map((row) => keys.map((key) => cell(row[key])).join(",")),
      ].join("\r\n");
      const url = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      a.click();
      URL.revokeObjectURL(url);
      setToast("CSV exported");
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }
  const total = stats?.TOTAL || 0;
  return (
    <div className="app-shell">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <Brand />
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => {
              setView("dashboard");
              setMobile(false);
            }}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button
            className={view === "leads" ? "active" : ""}
            onClick={() => {
              setView("leads");
              setMobile(false);
            }}
          >
            <Users size={18} />
            All leads<span>{total}</span>
          </button>
        </nav>
        <div className="sidebar-note">
          <div className="note-icon">
            <ArrowUpRight size={22} />
          </div>
          <strong>Every lead is a beginning.</strong>
          <p>
            Keep the conversation moving.
            <br />
            Make your next step count.
          </p>
        </div>
        <div className="user-panel">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <small>Sales workspace</small>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>{view === "dashboard" ? "Overview" : "All leads"}</strong>
          </span>
          <span className="today">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                A LITTLE CLARITY. A LOT OF POSSIBILITY.
              </span>
              <h1>
                {view === "dashboard"
                  ? "Your pipeline, at a glance."
                  : "Make the next connection."}
              </h1>
              <p>
                {view === "dashboard"
                  ? "A clear view of every opportunity and what comes next."
                  : "One place for every lead, every detail, and every next step."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() => setModal({ type: "edit" })}
            >
              <Plus size={18} />
              Add lead
            </button>
          </div>
          <ErrorMessage message={error} />
          {error && (
            <button onClick={() => setReload((n) => n + 1)}>Try again</button>
          )}
          {view === "dashboard" && (
            <>
              <section className="stats-grid" aria-label="Lead statistics">
                {["TOTAL", ...statuses].map((s, i) => (
                  <div className={"stat-card stat-" + s.toLowerCase()} key={s}>
                    <div>
                      <span>{s === "TOTAL" ? "Total leads" : label(s)}</span>
                      <span className="stat-mark">
                        {i === 0 ? <Users size={16} /> : <i />}
                      </span>
                    </div>
                    <strong>{stats ? stats[s] : "—"}</strong>
                    <small>
                      {s === "TOTAL"
                        ? "Your entire pipeline"
                        : `${total ? Math.round(((stats?.[s] || 0) / total) * 100) : 0}% of all leads`}
                    </small>
                  </div>
                ))}
              </section>
              <section className="insights">
                <div className="chart-card">
                  <div className="section-title">
                    <div>
                      <h2>Pipeline breakdown</h2>
                      <p>Where your opportunities stand</p>
                    </div>
                    <span className="subtle-tag">All time</span>
                  </div>
                  <div className="chart-content">
                    <div
                      className="donut"
                      role="img"
                      aria-label={
                        stats
                          ? statuses
                              .map((s) => `${label(s)}: ${stats[s]}`)
                              .join(", ")
                          : "Loading chart"
                      }
                      style={{
                        background: total
                          ? `conic-gradient(${(() => {
                              let n = 0;
                              const colors = [
                                "#87a9f0",
                                "#deb96e",
                                "#a995d5",
                                "#4d9277",
                                "#d88e82",
                              ];
                              return statuses
                                .map((s, i) => {
                                  const start = n;
                                  n += (stats[s] / total) * 100;
                                  return `${colors[i]} ${start}% ${n}%`;
                                })
                                .join(",");
                            })()})`
                          : "#e7ebe8",
                      }}
                    >
                      <div>
                        <strong>{total}</strong>
                        <span>total leads</span>
                      </div>
                    </div>
                    <div className="chart-legend">
                      {statuses.map((s) => (
                        <div key={s}>
                          <span>
                            <i className={"dot " + s.toLowerCase()} />
                            {label(s)}
                          </span>
                          <strong>{stats?.[s] ?? "—"}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="focus-card">
                  <span className="eyebrow">THE BIGGER PICTURE</span>
                  <h2>
                    Turn conversations
                    <br />
                    into customers.
                  </h2>
                  <div className="conversion">
                    {total ? Math.round((stats.CONVERTED / total) * 100) : 0}
                    <span>%</span>
                    <ArrowUpRight size={30} />
                  </div>
                  <p>Conversion rate · converted leads / total leads</p>
                  <div className="focus-footer">
                    <span>{stats?.QUALIFIED || 0} qualified opportunities</span>
                    <button
                      aria-label="View qualified leads"
                      onClick={() => {
                        setStatus("QUALIFIED");
                        setPage(0);
                        setView("leads");
                      }}
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
          <section className="leads-card">
            <div className="section-title">
              <div>
                <h2>
                  {view === "dashboard" ? "Your leads" : "Lead directory"}{" "}
                  <span className="count">{data?.totalElements ?? 0}</span>
                </h2>
                <p>Small follow-ups. Stronger relationships.</p>
              </div>
              <button
                className="export-button"
                disabled={exporting || busy}
                onClick={exportCsv}
              >
                <Download size={16} />
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>
            <div className="filters">
              <label className="search">
                <Search size={17} />
                <input
                  aria-label="Search name, email or phone"
                  placeholder="Search name, email, or phone…"
                  maxLength={254}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option value={s} key={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
              <label className="date-filter">
                Created from
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <label className="date-filter">
                To
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              {(search || status || from || to) && (
                <button
                  className="clear"
                  onClick={() => {
                    setSearch("");
                    setQuery("");
                    setStatus("");
                    setFrom("");
                    setTo("");
                    setPage(0);
                  }}
                >
                  Reset
                </button>
              )}
            </div>
            <div className="table-wrap" aria-busy={busy}>
              <table>
                <thead>
                  <tr>
                    <th>Name / contact</th>
                    <th>Company</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Follow-up</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {busy ? (
                    <tr>
                      <td colSpan={6} className="empty">
                        Loading your leads…
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="empty">
                        Could not load leads. Please retry.
                      </td>
                    </tr>
                  ) : !data?.content.length ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty">
                          <div className="empty-symbol">
                            <Users size={25} />
                          </div>
                          <h3>
                            {total
                              ? "No matching leads"
                              : "Your next opportunity starts here"}
                          </h3>
                          <p>
                            {total
                              ? "Try another search or reset your filters."
                              : "Add your first lead to start building your pipeline."}
                          </p>
                          {!total && (
                            <button
                              className="primary"
                              onClick={() => setModal({ type: "edit" })}
                            >
                              <Plus size={16} />
                              Add your first lead
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.content.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <button
                            className="lead-name"
                            onClick={() => setModal({ type: "detail", lead })}
                          >
                            {lead.name}
                          </button>
                          <span className="secondary-text">{lead.email}</span>
                        </td>
                        <td>{lead.company}</td>
                        <td>
                          <span className="service-label">{lead.service}</span>
                        </td>
                        <td>
                          <span
                            className={"badge " + lead.status.toLowerCase()}
                          >
                            <i />
                            {label(lead.status)}
                          </span>
                        </td>
                        <td>
                          {lead.followUpDate || (
                            <span className="muted">Not scheduled</span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              aria-label={"Edit " + lead.name}
                              onClick={() => setModal({ type: "edit", lead })}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={"Delete " + lead.name}
                              onClick={() => setModal({ type: "delete", lead })}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                {data?.totalElements
                  ? `${page * 10 + 1}–${Math.min((page + 1) * 10, data.totalElements)} of ${data.totalElements} leads`
                  : "0 leads"}
                <span className="utc-note"> · Date filters use UTC</span>
              </span>
              <div>
                <button
                  aria-label="Previous page"
                  disabled={busy || page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {page + 1} of {Math.max(1, data?.totalPages || 1)}
                </span>
                <button
                  aria-label="Next page"
                  disabled={busy || page + 1 >= (data?.totalPages || 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
          <footer className="page-footer">
            A little more organized. A little closer to your next win.
            <span>LEADROOM</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal?.type === "edit" && (
        <LeadEditor
          lead={modal.lead}
          onClose={() => setModal(null)}
          onSaved={() => saved(modal.lead ? "Lead updated" : "Lead created")}
        />
      )}{" "}
      {modal?.type === "delete" && (
        <DeleteDialog
          lead={modal.lead}
          onClose={() => setModal(null)}
          onDeleted={() => saved("Lead deleted")}
        />
      )}{" "}
      {modal?.type === "detail" && (
        <Detail
          lead={modal.lead}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ ...modal, type: "edit" })}
        />
      )}
    </div>
  );
}
