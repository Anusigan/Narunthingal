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

export default function SelectionsClient({ applicants, selections: initialSelections }: Props) {
  const [activeRole, setActiveRole] = useState<Position>(POSITIONS[0]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Optimistic local state — updates instantly on click
  const [localSelections, setLocalSelections] = useState<Selection[]>(initialSelections);

  // Build a set of selected application_ids for current role
  const selectedIds = new Set(
    localSelections.filter((s) => s.role === activeRole).map((s) => s.application_id)
  );

  // Map of applicant_id → already-selected role across ALL roles (for conflict detection)
  const selectedRoleByApplicant = new Map<string, string>(
    localSelections.map((s) => [s.application_id, s.role])
  );

  // Count selections per role for summary
  const selectionCountByRole = POSITIONS.reduce<Record<string, number>>((acc, pos) => {
    acc[pos] = localSelections.filter((s) => s.role === pos).length;
    return acc;
  }, {});

  // Candidates for active role — selected first, then 1st pref, then 2nd pref
  const roleApplicants = applicants
    .filter((a) => a.first_preference === activeRole || a.second_preference === activeRole)
    .sort((a, b) => {
      const aSelected = selectedIds.has(a.id) ? 0 : 1;
      const bSelected = selectedIds.has(b.id) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      const aFirst = a.first_preference === activeRole ? 0 : 1;
      const bFirst = b.first_preference === activeRole ? 0 : 1;
      return aFirst - bFirst;
    });

  function toggleSelection(applicant: Applicant) {
    setActionError(null);
    const isSelected = selectedIds.has(applicant.id);

    if (!isSelected) {
      // Check if already selected for a different role
      const existingRole = selectedRoleByApplicant.get(applicant.id);
      if (existingRole && existingRole !== activeRole) {
        setActionError(`${applicant.name} is already selected for ${existingRole}`);
        return;
      }
    }

    // Optimistic update — instant UI change
    if (isSelected) {
      setLocalSelections((prev) =>
        prev.filter((s) => !(s.application_id === applicant.id && s.role === activeRole))
      );
    } else {
      setLocalSelections((prev) => [
        ...prev,
        { application_id: applicant.id, role: activeRole, selected_by: "", selected_at: new Date().toISOString() },
      ]);
    }

    // Sync with server in background
    startTransition(async () => {
      try {
        if (isSelected) {
          await deselectCandidate(applicant.id, activeRole);
        } else {
          await selectCandidate(applicant.id, activeRole);
        }
      } catch (e) {
        // Revert on error
        setLocalSelections(initialSelections);
        setActionError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const totalSelected = localSelections.length;

  // Applicants not selected for ANY role
  const selectedAppIds = new Set(localSelections.map((s) => s.application_id));
  const unselectedApplicants = applicants.filter((a) => !selectedAppIds.has(a.id));

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

          {/* Unselected people */}
          <div className="card p-2 flex flex-col gap-1 mt-3">
            <p className="text-xs uppercase tracking-widest px-2 py-1" style={{ color: "rgba(245,240,232,0.35)" }}>
              Unselected{" "}
              <span className="font-bold" style={{ color: unselectedApplicants.length > 0 ? "#f87171" : "#4ade80" }}>
                {unselectedApplicants.length}
              </span>
            </p>
            {unselectedApplicants.length === 0 ? (
              <p className="text-xs px-2 py-1" style={{ color: "rgba(74,222,128,0.6)" }}>Everyone selected ✓</p>
            ) : (
              unselectedApplicants.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setActiveRole(a.first_preference as Position); setExpanded(null); }}
                  className="flex flex-col rounded-lg px-3 py-2 text-left transition-colors w-full"
                  style={{ color: "rgba(245,240,232,0.55)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
                  title={`Jump to ${a.first_preference}`}
                >
                  <span className="text-xs font-medium truncate text-white">{a.name}</span>
                  <span className="text-xs truncate" style={{ color: "rgba(245,240,232,0.35)" }}>{a.first_preference}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Candidates panel */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">{activeRole}</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                {roleApplicants.length} applicant{roleApplicants.length !== 1 ? "s" : ""}
                {selectedIds.size > 0 ? (
                  <span style={{ color: "#4ade80" }}> · {selectedIds.size} selected</span>
                ) : (
                  <span> · none selected</span>
                )}
              </p>
            </div>
            {actionError && (
              <p className="text-xs text-right max-w-xs" style={{ color: "#f87171" }}>{actionError}</p>
            )}
          </div>

          {roleApplicants.length === 0 ? (
            <div className="card text-center py-10" style={{ color: "rgba(245,240,232,0.35)" }}>
              No applicants for this role yet.
            </div>
          ) : (
            roleApplicants.map((a, idx) => {
              const prevSelected = idx > 0 && selectedIds.has(roleApplicants[idx - 1].id);
              const thisSelected = selectedIds.has(a.id);
              const showDivider = !thisSelected && prevSelected;
              const isSelected = selectedIds.has(a.id);
              const isPrimary = a.first_preference === activeRole;
              const conflictRole = !isSelected ? selectedRoleByApplicant.get(a.id) : undefined;
              return (
                <div key={a.id}>
                  {showDivider && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      <span className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>Not yet selected</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                  )}
                <div
                  className="card flex flex-col gap-3"
                  style={{
                    borderColor: isSelected ? "rgba(74,222,128,0.35)" : conflictRole ? "rgba(248,113,113,0.2)" : "rgba(212,160,23,0.12)",
                    background: isSelected ? "rgba(74,222,128,0.04)" : conflictRole ? "rgba(248,113,113,0.03)" : undefined,
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
                        {conflictRole && (
                          <span
                            className="text-xs rounded-full px-2 py-0.5"
                            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}
                          >
                            Selected for {conflictRole}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{a.email}</p>
                    </div>
                    <button
                      onClick={() => toggleSelection(a)}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                      style={isSelected ? {
                        background: "rgba(74,222,128,0.12)",
                        border: "1px solid rgba(74,222,128,0.35)",
                        color: "#4ade80",
                      } : conflictRole ? {
                        background: "rgba(248,113,113,0.06)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        color: "rgba(248,113,113,0.5)",
                        cursor: "not-allowed",
                      } : {
                        background: "rgba(212,160,23,0.08)",
                        border: "1px solid rgba(212,160,23,0.25)",
                        color: "#D4A017",
                      }}
                    >
                      {isSelected ? "✓ Selected · Undo" : conflictRole ? "Taken" : "Select"}
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
                            Why suitable: {isPrimary ? a.first_preference : a.second_preference}
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
