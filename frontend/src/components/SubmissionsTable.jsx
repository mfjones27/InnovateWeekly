import React, { useMemo, useState } from "react";
import { exportSubmissionsToCsv } from "../csv";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function ToolList({ tools }) {
  if (!tools?.length) return <em className="muted">No tools logged.</em>;
  return (
    <ul className="tool-list">
      {tools.map((t, i) => (
        <li key={i}>
          <div className="tool-list__title">
            <strong>{t.tool_name}</strong>
            <span className="tool-list__rating">
              {"★".repeat(t.tool_rating)}{"☆".repeat(5 - t.tool_rating)}
            </span>
          </div>
          <p className="tool-list__desc">{t.tool_description}</p>
          {t.tool_link && (
            <a href={t.tool_link} target="_blank" rel="noopener noreferrer">
              {t.tool_link}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function SubmissionsTable({ submissions, loading, error, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const teams = useMemo(() => {
    const set = new Set(submissions.map((s) => s.team_or_department).filter(Boolean));
    return Array.from(set).sort();
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (teamFilter && s.team_or_department !== teamFilter) return false;
      if (!q) return true;
      const haystack = [
        s.employee_name,
        s.team_or_department,
        ...(s.tools_evaluated || []).map((t) => t.tool_name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [submissions, search, teamFilter]);

  return (
    <section className="card">
      <div className="table-toolbar">
        <h2>Submissions</h2>
        <div className="table-toolbar__actions">
          <button className="btn btn--ghost" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => exportSubmissionsToCsv(filtered)}
            disabled={filtered.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by name or tool…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="feedback feedback--error">{error}</div>}

      <div className="table-wrap">
        <table className="submissions">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Employee</th>
              <th>Team</th>
              <th>Accomplishments</th>
              <th>Goals</th>
              <th>Blockers</th>
              <th>Tools</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="empty">
                  No submissions match your filters yet.
                </td>
              </tr>
            )}

            {filtered.map((s) => {
              const isOpen = expandedId === s.id;
              return (
                <React.Fragment key={s.id}>
                  <tr>
                    <td>{formatDate(s.created_at)}</td>
                    <td>{s.employee_name}</td>
                    <td>{s.team_or_department}</td>
                    <td className="cell-clip">{s.weekly_accomplishments}</td>
                    <td className="cell-clip">{s.goals_next_week}</td>
                    <td className="cell-clip">{s.challenges_blockers || "—"}</td>
                    <td>{s.tools_evaluated?.length ?? 0}</td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setExpandedId(isOpen ? null : s.id)}
                      >
                        {isOpen ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="details-row">
                      <td colSpan={8}>
                        <div className="details">
                          <div>
                            <h4>Accomplishments</h4>
                            <p>{s.weekly_accomplishments}</p>
                          </div>
                          <div>
                            <h4>Goals Next Week</h4>
                            <p>{s.goals_next_week}</p>
                          </div>
                          <div>
                            <h4>Challenges / Blockers</h4>
                            <p>{s.challenges_blockers || "—"}</p>
                          </div>
                          <div>
                            <h4>Tools Evaluated</h4>
                            <ToolList tools={s.tools_evaluated} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
