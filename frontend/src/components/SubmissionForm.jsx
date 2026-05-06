import React, { useState } from "react";
import { createSubmission } from "../api";

const emptyTool = () => ({
  tool_name: "",
  tool_description: "",
  tool_link: "",
  tool_rating: 3,
});

const emptyForm = () => ({
  employee_name: "",
  team_or_department: "",
  week_of: "",
  weekly_accomplishments: "",
  goals_next_week: "",
  challenges_blockers: "",
  tools_evaluated: [],
});

export default function SubmissionForm({ onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  const updateField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const updateTool = (index, key) => (event) => {
    const value = key === "tool_rating" ? Number(event.target.value) : event.target.value;
    setForm((prev) => {
      const tools = prev.tools_evaluated.map((tool, i) =>
        i === index ? { ...tool, [key]: value } : tool
      );
      return { ...prev, tools_evaluated: tools };
    });
  };

  const addTool = () =>
    setForm((prev) => ({
      ...prev,
      tools_evaluated: [...prev.tools_evaluated, emptyTool()],
    }));

  const removeTool = (index) =>
    setForm((prev) => ({
      ...prev,
      tools_evaluated: prev.tools_evaluated.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    // Strip empty optional fields and convert blank links to null for the API.
    const payload = {
      ...form,
      week_of: form.week_of || null,
      tools_evaluated: form.tools_evaluated.map((tool) => ({
        ...tool,
        tool_link: tool.tool_link?.trim() ? tool.tool_link.trim() : null,
      })),
    };

    try {
      await createSubmission(payload);
      setForm(emptyForm());
      setFeedback({ type: "success", text: "Check-in submitted. Thanks!" });
      onCreated?.();
    } catch (err) {
      setFeedback({ type: "error", text: `Submission failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>New Weekly Check-In</h2>

      <div className="grid-2">
        <label>
          Your Name
          <input
            type="text"
            required
            value={form.employee_name}
            onChange={updateField("employee_name")}
          />
        </label>

        <label>
          Team / Department
          <input
            type="text"
            required
            value={form.team_or_department}
            onChange={updateField("team_or_department")}
          />
        </label>
      </div>

      <label>
        Week Of <span className="muted">(optional)</span>
        <input type="date" value={form.week_of} onChange={updateField("week_of")} />
      </label>

      <label>
        Weekly Accomplishments
        <textarea
          required
          rows={3}
          value={form.weekly_accomplishments}
          onChange={updateField("weekly_accomplishments")}
        />
      </label>

      <label>
        Goals for the Upcoming Week
        <textarea
          required
          rows={3}
          value={form.goals_next_week}
          onChange={updateField("goals_next_week")}
        />
      </label>

      <label>
        Major Challenges / Blockers
        <textarea
          rows={3}
          value={form.challenges_blockers}
          onChange={updateField("challenges_blockers")}
        />
      </label>

      <fieldset className="tools-section">
        <legend>Tools / Tech Evaluated</legend>

        {form.tools_evaluated.length === 0 && (
          <p className="muted">No tools added yet.</p>
        )}

        {form.tools_evaluated.map((tool, index) => (
          <div className="tool-row" key={index}>
            <div className="tool-row__header">
              <strong>Tool #{index + 1}</strong>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => removeTool(index)}
              >
                Remove
              </button>
            </div>

            <div className="grid-2">
              <label>
                Name
                <input
                  type="text"
                  required
                  value={tool.tool_name}
                  onChange={updateTool(index, "tool_name")}
                />
              </label>
              <label>
                Rating
                <select
                  value={tool.tool_rating}
                  onChange={updateTool(index, "tool_rating")}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}{"☆".repeat(5 - n)} ({n})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Short Description
              <textarea
                required
                rows={2}
                value={tool.tool_description}
                onChange={updateTool(index, "tool_description")}
              />
            </label>

            <label>
              Link <span className="muted">(optional)</span>
              <input
                type="text"
                placeholder="https://... (optional)"
                value={tool.tool_link}
                onChange={updateTool(index, "tool_link")}
              />
            </label>
          </div>
        ))}

        <button type="button" className="btn btn--secondary" onClick={addTool}>
          + Add another tool
        </button>
      </fieldset>

      {feedback && (
        <div className={`feedback feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Check-In"}
      </button>
    </form>
  );
}
