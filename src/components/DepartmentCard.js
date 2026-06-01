import Link from "next/link";

export default function DepartmentCard({ department, index, loading = false }) {
  const isFirst = index === 0;
  const formatStat = (value) =>
    loading ? "…" : Number.isFinite(value) ? value.toLocaleString() : "—";
  const resourceTotal = department.paperCount;

  return (
    <Link
      href={`/search?q=${encodeURIComponent(department.name)}`}
      className="card dept-card"
      id={`dept-card-${department.id}`}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="dept-card-body">
        <div className="dept-card-avatar">
          <div className={`dept-card-avatar-inner ${isFirst ? "primary" : "neutral"}`}>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {department.icon}
            </span>
          </div>
        </div>

        <h3 className="dept-card-name">{department.name}</h3>
        <p className="dept-card-desc">
          {department.description || "Resources curated for this department."}
        </p>

        <div className="dept-card-stats">
          <div className="dept-card-stat">
            <span className="dept-card-stat-value">
              {formatStat(department.paperCount)}
            </span>
            <span className="dept-card-stat-label">Papers</span>
          </div>
          <div className="dept-card-stat">
            <span className="dept-card-stat-value">
              {formatStat(department.courseCount)}
            </span>
            <span className="dept-card-stat-label">Subjects</span>
          </div>
          <div className="dept-card-stat">
            <span className="dept-card-stat-value">
              {formatStat(resourceTotal)}
            </span>
            <span className="dept-card-stat-label">Resources</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
