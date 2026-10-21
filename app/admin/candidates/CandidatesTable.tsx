"use client";

import { POSITIONS, type Application, type Position } from "@/lib/types";
import { useState, useMemo } from "react";

interface Props {
  applications: Application[];
}

type SortKey =
  | "submitted_at"
  | "name"
  | "first_preference"
  | "volunteered_last_year";

export default function CandidatesTable({ applications }: Props) {
  const [search, setSearch] = useState("");
  const [filterPosition, setFilterPosition] = useState<Position | "">("");
  const [filterVolunteered, setFilterVolunteered] = useState<
    "all" | "yes" | "no"
  >("all");
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...applications];

    // Search by name or email
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      );
    }

    // Filter by position
    if (filterPosition) {
      list = list.filter((a) => a.first_preference === filterPosition);
    }

    // Filter by volunteered
    if (filterVolunteered !== "all") {
      list = list.filter((a) =>
        filterVolunteered === "yes"
          ? a.volunteered_last_year
          : !a.volunteered_last_year
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA: string | boolean =
        sortKey === "submitted_at" ? a.submitted_at : a[sortKey];
      let valB: string | boolean =
        sortKey === "submitted_at" ? b.submitted_at : b[sortKey];

      if (typeof valA === "boolean") valA = valA ? "1" : "0";
      if (typeof valB === "boolean") valB = valB ? "1" : "0";

      const cmp = String(valA).localeCompare(String(valB));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [applications, search, filterPosition, filterVolunteered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1" style={{ color: "rgba(212,160,23,0.35)" }}>&#x21C5;</span>;
    return (
      <span className="ml-1" style={{ color: "#D4A017" }}>
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Email",
      "WhatsApp",
      "First Preference",
      "Second Preference",
      "Why Suitable",
      "Volunteered Last Year",
      "Last Year Contribution",
      "Current Clubs",
      "Previous Experience",
      "Submitted At",
    ];
    const rows = filtered.map((a) => [
      a.name,
      a.email,
      a.contact_number,
      a.first_preference,
      a.second_preference ?? "",
      a.confidence_reason.replace(/"/g, '""'),
      a.volunteered_last_year ? "Yes" : "No",
      (a.last_year_contribution ?? "").replace(/"/g, '""'),
      (a.current_clubs ?? "").replace(/"/g, '""'),
      (a.previous_experience ?? "").replace(/"/g, '""'),
      new Date(a.submitted_at).toLocaleString(),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "narunthingal-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[180px]">
          <label className="label">Position</label>
          <select
            className="input"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value as Position | "")}
          >
            <option value="">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="label">Volunteered Last Year</label>
          <select
            className="input"
            value={filterVolunteered}
            onChange={(e) =>
              setFilterVolunteered(e.target.value as "all" | "yes" | "no")
            }
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <button
          onClick={exportCSV}
          className="btn-secondary flex items-center gap-2 self-end"
        >
          <span>⬇</span> Export CSV
        </button>
      </div>

      <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
        Showing <span style={{ color: "#f5f0e8" }}>{filtered.length}</span> of{" "}
        {applications.length} applications
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(212,160,23,0.18)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide" style={{ background: "rgba(212,160,23,0.06)", color: "rgba(212,160,23,0.7)" }}>
              <th
                className="px-4 py-3 cursor-pointer hover:text-white whitespace-nowrap"
                onClick={() => toggleSort("name")}
              >
                Name <SortIcon col="name" />
              </th>
              <th className="px-4 py-3 whitespace-nowrap">Email / WhatsApp</th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-white whitespace-nowrap"
                onClick={() => toggleSort("first_preference")}
              >
                1st Pref <SortIcon col="first_preference" />
              </th>
              <th className="px-4 py-3 whitespace-nowrap">2nd Pref</th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-white whitespace-nowrap"
                onClick={() => toggleSort("volunteered_last_year")}
              >
                Volunteered <SortIcon col="volunteered_last_year" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-white whitespace-nowrap"
                onClick={() => toggleSort("submitted_at")}
              >
                Submitted <SortIcon col="submitted_at" />
              </th>
              <th className="px-4 py-3 whitespace-nowrap">Details</th>
            </tr>
          </thead>
          <tbody style={{ borderTop: "1px solid rgba(212,160,23,0.1)" }}>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12"
                  style={{ color: "rgba(245,240,232,0.4)" }}
                >
                  No applications match your filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <>
                <tr
                  key={a.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid rgba(212,160,23,0.08)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,160,23,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {a.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>{a.email}</div>
                    <div className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                      {a.contact_number}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ background: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.35)" }}>
                      {a.first_preference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>
                    {a.second_preference ?? (
                      <span style={{ color: "rgba(245,240,232,0.2)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.volunteered_last_year ? (
                      <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                        Yes
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.4)" }}>
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(245,240,232,0.35)" }}>
                    {new Date(a.submitted_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setExpanded(expanded === a.id ? null : a.id)
                      }
                      className="text-xs transition-colors"
                      style={{ color: "#D4A017" }}
                    >
                      {expanded === a.id ? "▲ Hide" : "▼ View"}
                    </button>
                  </td>
                </tr>

                {expanded === a.id && (
                  <tr key={`${a.id}-expanded`} style={{ background: "rgba(212,160,23,0.04)" }}>
                    <td colSpan={7} className="px-6 py-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <Detail label={`Suitability — ${a.first_preference}`}>
                          {a.confidence_reason}
                        </Detail>
                        {a.second_preference && a.second_preference_reason && (
                          <Detail label={`Suitability — ${a.second_preference}`}>
                            {a.second_preference_reason}
                          </Detail>
                        )}
                        {a.volunteered_last_year && a.last_year_contribution && (
                          <Detail label="Previous Narunthingal Contributions">
                            {a.last_year_contribution}
                          </Detail>
                        )}
                        {a.current_clubs && (
                          <Detail label="Club Memberships & Roles">
                            {a.current_clubs}
                          </Detail>
                        )}
                        {a.previous_experience && (
                          <Detail label="Organizing & Volunteering Experience">
                            {a.previous_experience}
                          </Detail>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(212,160,23,0.6)" }}>
        {label}
      </dt>
      <dd className="text-sm whitespace-pre-wrap" style={{ color: "rgba(245,240,232,0.8)" }}>{children}</dd>
    </div>
  );
}
