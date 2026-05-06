// Frontend-only CSV export. Builds a CSV string from the in-memory
// submissions array, wraps it in a Blob, and triggers a browser download.

function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Per RFC 4180: wrap in quotes if the cell contains a comma, quote, or newline.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function flattenTools(tools = []) {
  // Single column "Name (rating★) - link" entries joined by " | ".
  return tools
    .map((t) => {
      const link = t.tool_link ? ` <${t.tool_link}>` : "";
      return `${t.tool_name} (${t.tool_rating}★)${link}`;
    })
    .join(" | ");
}

const COLUMNS = [
  ["Submission ID", (s) => s.id],
  ["Created At", (s) => s.created_at],
  ["Employee Name", (s) => s.employee_name],
  ["Team / Department", (s) => s.team_or_department],
  ["Week Of", (s) => s.week_of || ""],
  ["Weekly Accomplishments", (s) => s.weekly_accomplishments],
  ["Goals Next Week", (s) => s.goals_next_week],
  ["Challenges / Blockers", (s) => s.challenges_blockers || ""],
  ["Tools Evaluated", (s) => flattenTools(s.tools_evaluated)],
  ["Tool Count", (s) => s.tools_evaluated?.length ?? 0],
];

export function buildCsv(submissions) {
  const header = COLUMNS.map(([name]) => escapeCsvCell(name)).join(",");
  const rows = submissions.map((s) =>
    COLUMNS.map(([, getter]) => escapeCsvCell(getter(s))).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export function exportSubmissionsToCsv(submissions, filename) {
  const csv = buildCsv(submissions);
  // Prepend BOM so Excel correctly detects UTF-8.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().slice(0, 10);
  const finalName = filename || `weekly-checkins-${stamp}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
