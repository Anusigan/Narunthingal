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
    if (sortKey !== col) return <span className="text-gray-600 ml-1">⇅</span>;
    return (
      <span className="text-purple-400 ml-1">
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

      <p className="text-sm text-gray-500">
        Showing <span className="text-gray-300">{filtered.length}</span> of{" "}
        {applications.length} applications
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-left text-gray-400 text-xs uppercase tracking-wide">
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
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-500 py-12"
                >
                  No applications match your filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <>
                <tr
                  key={a.id}
                  className="bg-gray-900/50 hover:bg-gray-900 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {a.name}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <div className="text-xs">{a.email}</div>
                    <div className="text-gray-500 text-xs">
                      {a.contact_number}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-purple-900/60 text-purple-300 border border-purple-800">
                      {a.first_preference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {a.second_preference ?? (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.volunteered_last_year ? (
                      <span className="badge bg-emerald-900/60 text-emerald-400 border border-emerald-800">
                        Yes
                      </span>
                    ) : (
                      <span className="badge bg-gray-800 text-gray-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(a.submitted_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setExpanded(expanded === a.id ? null : a.id)
                      }
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {expanded === a.id ? "▲ Hide" : "▼ View"}
                    </button>
                  </td>
                </tr>

                {expanded === a.id && (
                  <tr key={`${a.id}-expanded`} className="bg-gray-900/80">
                    <td colSpan={7} className="px-6 py-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <Detail label="Why suitable">
                          {a.confidence_reason}
                        </Detail>
                        {a.volunteered_last_year && a.last_year_contribution && (
                          <Detail label="Last year contribution">
                            {a.last_year_contribution}
                          </Detail>
                        )}
                        {a.current_clubs && (
                          <Detail label="Current clubs & positions">
                            {a.current_clubs}
                          </Detail>
                        )}
                        {a.previous_experience && (
                          <Detail label="Previous experience">
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
      <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-gray-300 text-sm whitespace-pre-wrap">{children}</dd>
    </div>
  );
}
