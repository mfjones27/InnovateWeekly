import React, { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import SubmissionForm from "./components/SubmissionForm";
import SubmissionsTable from "./components/SubmissionsTable";
import { fetchSubmissions } from "./api";

export default function App() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(`Could not load submissions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  return (
    <div className="app">
      <Header />
      <main className="layout">
        <SubmissionForm onCreated={loadSubmissions} />
        <SubmissionsTable
          submissions={submissions}
          loading={loading}
          error={error}
          onRefresh={loadSubmissions}
        />
      </main>
      <footer className="app-footer">
        <span>InnovateWeekly · internal tool</span>
      </footer>
    </div>
  );
}
