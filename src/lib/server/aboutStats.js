import { unstable_noStore as noStore } from "next/cache";
import { DEPARTMENT_NAMES } from "@/lib/constants";
import { formatActiveStudentsDisplay } from "@/lib/formatStats";
import { ensureSchema, query } from "@/lib/server/db";

function formatCount(value) {
  if (!Number.isFinite(value) || value < 0) return "0";
  return value.toLocaleString("en-US");
}

function parseCount(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function getActiveStudentsFromDb() {
  const result = await query(
    `SELECT value FROM portal_settings WHERE key = 'active_students_count' LIMIT 1`
  );
  return parseCount(result.rows[0]?.value);
}

async function getActiveStudentsFromEnv() {
  return parseCount(process.env.ACTIVE_STUDENTS_COUNT);
}

async function getActiveStudentsCount() {
  const envCount = await getActiveStudentsFromEnv();
  if (envCount !== null) return envCount;
  return getActiveStudentsFromDb();
}

export async function setActiveStudentsCount(count) {
  await ensureSchema();
  const parsed = parseCount(count);
  if (parsed === null) {
    throw new Error("Active students count must be a non-negative number.");
  }

  await query(
    `
      INSERT INTO portal_settings (key, value, updated_at)
      VALUES ('active_students_count', $1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [String(parsed)]
  );

  return parsed;
}

export async function getPortalStatsForAdmin() {
  const stats = await getAboutStats();
  const envCount = await getActiveStudentsFromEnv();
  const dbCount = await getActiveStudentsFromDb();
  const envOverrides = envCount !== null;

  return {
    ...stats,
    activeStudentsSource: envOverrides ? "env" : dbCount !== null ? "database" : "unset",
    activeStudentsEditable: !envOverrides,
    activeStudentsDbValue: dbCount,
    activeStudentsDisplayed: stats.activeStudents,
  };
}

export async function getAboutStats() {
  noStore();
  await ensureSchema();

  const [papersResult, subjectsResult, departmentsResult] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM papers`),
    query(`SELECT COUNT(DISTINCT subject_code)::int AS count FROM papers`),
    query(`SELECT COUNT(DISTINCT department)::int AS count FROM papers`),
  ]);

  const pastPapers = papersResult.rows[0]?.count ?? 0;
  const subjectsCovered = subjectsResult.rows[0]?.count ?? 0;
  const departmentsWithPapers = departmentsResult.rows[0]?.count ?? 0;
  const activeStudents = await getActiveStudentsCount();

  return {
    pastPapers,
    subjectsCovered,
    departmentsWithPapers,
    totalDepartments: DEPARTMENT_NAMES.length,
    activeStudents,
    display: [
      { number: formatCount(pastPapers), label: "Past Papers" },
      { number: formatCount(subjectsCovered), label: "Subjects Covered" },
      {
        number: formatCount(departmentsWithPapers || DEPARTMENT_NAMES.length),
        label: "Departments",
      },
      {
        number: formatActiveStudentsDisplay(activeStudents),
        label: "Active Students",
      },
    ],
  };
}
