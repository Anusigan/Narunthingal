"use client";

import { useState, useTransition } from "react";
import { POSITIONS, type Position } from "@/lib/types";
import { selectCandidate, deselectCandidate } from "./actions";

interface Applicant {
  id: string;
  name: string;
  email: string;
  contact_number: string;
  first_preference: string;
  second_preference: string | null;
  degree_pathway: string | null;
  volunteered_last_year: boolean;
  confidence_reason: string;
  second_preference_reason: string | null;
}

interface Selection {
  application_id: string;
  role: string;
  selected_by: string;
  selected_at: string;
}

interface Props {
  applicants: Applicant[];
  selections: Selection[];
}

export default function SelectionsClient({ applicants, selections }: Props) {
  const [activeRole, setActiveRole] = useState<Position>(POSITIONS[0]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Build a set of selected application_ids for current role
  const selectedIds = new Set(
    selections.filter((s) => s.role === activeRole).map((s) => s.application_id)
  );

  // Count selections per role for summary
  const selectionCountByRole = POSITIONS.reduce<Record<string, number>>((acc, pos) => {
    acc[pos] = selections.filter((s) => s.role === pos).length;
    return acc;
  }, {});

  // Candidates for active role (1st pref first, then 2nd pref only)
  const roleApplicants = applicants
    .filter((a) => a.first_preference === activeRole || a.second_preference === activeRole)
    .sort((a, b) => {
      const aFirst = a.first_preference === activeRole ? 0 : 1;
      const bFirst = b.first_preference === activeRole ? 0 : 1;
      return aFirst - bFirst;
    });

  function toggleSelection(applicant: Applicant) {
    setActionError(null);
    const isSelected = selectedIds.has(applicant.id);
    startTransition(async () => {
      try {
        if (isSelected) {
          await deselectCandidate(applicant.id, activeRole);
        } else {
          await selectCandidate(applicant.id, activeRole);
        }
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const totalSelected = selections.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card flex flex-col gap-1 py-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.6)" }}>Total Selected</p>
          <p className="text-2xl font-bold text-white">{totalSelected}</p>
        </div>
        <div className="card flex flex-col gap-1 py-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.6)" }}>Roles Filled</p>
          <p className="text-2xl font-bold text-white">
            {POSITIONS.filter((p) => selectionCountByRole[p] > 0).length}
            <span className="text-sm font-normal ml-1" style={{ color: "rgba(245,240,232,0.4)" }}>/ {POSITIONS.length}</span>
          </p>
        </div>
        <div className="card flex flex-col gap-1 py-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.6)" }}>Total Applicants</p>
          <p className="text-2xl font-bold text-white">{applicants.length}</p>
        </div>
        <div className="card flex flex-col gap-1 py-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.6)" }}>Viewing Role</p>
          <p className="text-sm font-semibold text-white truncate">{activeRole}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Role sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="card p-2 flex flex-col gap-1">
            <p className="text-xs uppercase tracking-widest px-2 py-1" style={{ color: "rgba(212,160,23,0.5)" }}>Roles</p>
            {POSITIONS.map((pos) => {
              const count = selectionCountByRole[pos] ?? 0;
              const applicantCount = applicants.filter(
                (a) => a.first_preference === pos || a.second_preference === pos
              ).length;
              return (
                <button
                  key={pos}
                  onClick={() => { setActiveRole(pos as Position); setExpanded(null); }}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors"
                  style={{
                    background: activeRole === pos ? "rgba(212,160,23,0.12)" : "transparent",
                    color: activeRole === pos ? "#D4A017" : "rgba(245,240,232,0.65)",
                    border: activeRole === pos ? "1px solid rgba(212,160,23,0.25)" : "1px solid transparent",
                  }}
                >
                  <span className="truncate">{pos}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>{applicantCount}</span>
                    {count > 0 && (
                      <span
                        className="text-xs font-semibold rounded-full px-1.5 py-0.5"
                        style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}
                      >
                        ✓{count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Candidates panel */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">{activeRole}</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                {roleApplicants.length} applicant{roleApplicants.length !== 1 ? "s" : ""} ·{" "}
                {selectedIds.size} selected
              </p>
            </div>
            {actionError && (
              <p className="text-xs" style={{ color: "#f87171" }}>{actionError}</p>
            )}
          </div>

          {roleApplicants.length === 0 ? (
            <div className="card text-center py-10" style={{ color: "rgba(245,240,232,0.35)" }}>
              No applicants for this role yet.
            </div>
          ) : (
            roleApplicants.map((a) => {
              const isSelected = selectedIds.has(a.id);
              const isPrimary = a.first_preference === activeRole;
              return (
                <div
                  key={a.id}
                  className="card flex flex-col gap-3"
                  style={{
                    borderColor: isSelected ? "rgba(74,222,128,0.35)" : "rgba(212,160,23,0.12)",
                    background: isSelected ? "rgba(74,222,128,0.04)" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{a.name}</p>
                        <span
                          className="text-xs rounded-full px-2 py-0.5"
                          style={{
                            background: isPrimary ? "rgba(212,160,23,0.15)" : "rgba(255,255,255,0.06)",
                            color: isPrimary ? "#D4A017" : "rgba(245,240,232,0.4)",
                            border: isPrimary ? "1px solid rgba(212,160,23,0.3)" : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {isPrimary ? "1st choice" : "2nd choice"}
                        </span>
                        {a.degree_pathway && (
                          <span className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                            {a.degree_pathway}
                          </span>
                        )}
                        {a.volunteered_last_year && (
                          <span
                            className="text-xs rounded-full px-2 py-0.5"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}
                          >
                            Volunteered before
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{a.email}</p>
                    </div>
                    <button
                      disabled={isPending}
                      onClick={() => toggleSelection(a)}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                      style={isSelected ? {
                        background: "rgba(74,222,128,0.12)",
                        border: "1px solid rgba(74,222,128,0.35)",
                        color: "#4ade80",
                      } : {
                        background: "rgba(212,160,23,0.08)",
                        border: "1px solid rgba(212,160,23,0.25)",
                        color: "#D4A017",
                      }}
                    >
                      {isSelected ? "✓ Selected" : "Select"}
                    </button>
                  </div>

                  {/* Suitability reason */}
                  <div>
                    <button
                      onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                      className="text-xs"
                      style={{ color: "rgba(212,160,23,0.55)" }}
                    >
                      {expanded === a.id ? "▲ Hide details" : "▼ View details"}
                    </button>
                    {expanded === a.id && (
                      <div className="mt-3 flex flex-col gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(212,160,23,0.5)" }}>
                            Why suitable — {isPrimary ? a.first_preference : a.second_preference}
                          </p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "rgba(245,240,232,0.7)" }}>
                            {isPrimary ? a.confidence_reason : (a.second_preference_reason ?? a.confidence_reason)}
                          </p>
                        </div>
                        {a.second_preference && (
                          <p className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                            Also applied for: <span style={{ color: "rgba(245,240,232,0.55)" }}>{a.second_preference}</span>
                          </p>
                        )}
                        <p className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                          WhatsApp: <span style={{ color: "rgba(245,240,232,0.55)" }}>{a.contact_number}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
