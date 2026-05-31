"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/admin/StatsCard";

function formatStat(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("en-US");
}

export default function PortalStatsPanel() {
  const [stats, setStats] = useState(null);
  const [activeStudentsInput, setActiveStudentsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/portal-stats", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Failed to load portal stats.");
      }
      setStats(payload.stats);
      const value =
        payload.stats.activeStudentsDbValue ?? payload.stats.activeStudentsDisplayed ?? "";
      setActiveStudentsInput(value === null ? "" : String(value));
      setStatus({ type: "idle", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to load portal stats.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/admin/portal-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeStudentsCount: activeStudentsInput,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Failed to save active students count.");
      }
      setStats(payload.stats);
      setStatus({ type: "success", message: "About page stats updated." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to save active students count.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card admin-panel admin-portal-stats">
      <div className="admin-panel-header">
        <div>
          <h2 className="text-headline-sm">About Page Stats</h2>
          <p className="text-body-md admin-portal-stats-desc">
            Shown on the public About Us page. Paper counts update automatically from
            the database.
          </p>
        </div>
      </div>

      {status.type !== "idle" && (
        <div className={`form-status form-status--${status.type}`}>{status.message}</div>
      )}

      <div className="admin-portal-stats-grid">
        <StatsCard
          icon="description"
          label="Past Papers"
          value={loading ? "—" : formatStat(stats?.pastPapers)}
          hint="From database"
        />
        <StatsCard
          icon="menu_book"
          label="Subjects Covered"
          value={loading ? "—" : formatStat(stats?.subjectsCovered)}
          hint="Unique subject codes"
        />
        <StatsCard
          icon="domain"
          label="Departments"
          value={loading ? "—" : formatStat(stats?.departmentsWithPapers)}
          hint={`${stats?.totalDepartments ?? 5} faculty departments`}
        />
        <StatsCard
          icon="groups"
          label="Active Students (live)"
          value={loading ? "—" : formatStat(stats?.activeStudentsDisplayed)}
          hint={
            stats?.activeStudentsSource === "env"
              ? "Using ACTIVE_STUDENTS_COUNT env"
              : stats?.activeStudentsSource === "database"
                ? "Saved in portal settings"
                : "Not set yet"
          }
        />
      </div>

      <form className="admin-portal-stats-form" onSubmit={handleSave}>
        <div className="form-field">
          <label htmlFor="activeStudentsCount">Active Students Count</label>
          <input
            id="activeStudentsCount"
            className="input-field"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 5000"
            value={activeStudentsInput}
            onChange={(event) => setActiveStudentsInput(event.target.value)}
            disabled={loading || saving || !stats?.activeStudentsEditable}
          />
          {stats?.activeStudentsSource === "env" ? (
            <p className="admin-portal-stats-note">
              This value is locked because <code>ACTIVE_STUDENTS_COUNT</code> is set in
              your environment. Remove it from Vercel to edit here instead.
            </p>
          ) : (
            <p className="admin-portal-stats-note">
              Saves to the database and appears on the About Us page immediately after
              refresh.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || saving || !stats?.activeStudentsEditable}
        >
          {saving ? "Saving..." : "Save Active Students"}
        </button>
      </form>
    </div>
  );
}
