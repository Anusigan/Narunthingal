"use client";

import { createClient } from "@/lib/supabase/client";
import { POSITIONS } from "@/lib/types";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ApplyFormProps {
  userId: string;
  email: string;
  defaultName: string;
}

interface ClubRow {
  club: string;
  position: string;
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
  <div className="flex flex-col gap-1.5">
    <label className="label">
      {label} {required && <span style={{ color: "#D4A017" }}>*</span>}
    </label>
    {hint && (
      <p className="text-xs -mt-0.5" style={{ color: "rgba(212,160,23,0.5)" }}>
        {hint}
      </p>
    )}
    {children}
  </div>
  );
}

export default function ApplyForm({ userId, email, defaultName }: ApplyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: defaultName,
    contact_number: "",
    first_preference: "",
    confidence_reason: "",
    second_preference: "",
    second_preference_reason: "",
    volunteered_last_year: "" as "" | "yes" | "no",
    last_year_contribution: "",
    previous_experience: "",
  });

  const [clubs, setClubs] = useState<ClubRow[]>([{ club: "", position: "" }]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function getMaskedPhone(digits: string) {
    const d = digits.slice(0, 10);
    const p = d.padEnd(10, "_");
    return `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    update("contact_number", digits);
    const masked = getMaskedPhone(digits);
    requestAnimationFrame(() => {
      if (phoneRef.current) {
        const pos = masked.indexOf("_");
        const cursor = pos === -1 ? masked.length : pos;
        phoneRef.current.setSelectionRange(cursor, cursor);
      }
    });
  }

  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
  }

  function moveCursorToEnd() {
    requestAnimationFrame(() => {
      if (phoneRef.current) {
        const masked = getMaskedPhone(form.contact_number);
        const pos = masked.indexOf("_");
        const cursor = pos === -1 ? masked.length : pos;
        phoneRef.current.setSelectionRange(cursor, cursor);
      }
    });
  }

  function updateClub(index: number, field: keyof ClubRow, value: string) {
    setClubs((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  function addClubRow() {
    setClubs((prev) => [...prev, { club: "", position: "" }]);
  }

  function removeClubRow(index: number) {
    setClubs((prev) => prev.filter((_, i) => i !== index));
  }

  function serializeClubs(): string | null {
    const filled = clubs.filter((r) => r.club.trim());
    if (filled.length === 0) return null;
    return filled.map((r) => r.position.trim() ? `${r.club.trim()} — ${r.position.trim()}` : r.club.trim()).join("\n");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Full name is required.");
    if (form.contact_number.length < 10) return setError("Please enter a valid 10-digit Sri Lankan number.");
    if (!form.first_preference) return setError("Please select your preferred role.");
    if (!form.confidence_reason.trim()) return setError("Please complete the suitability statement for your preferred role.");
    if (!form.second_preference) return setError("Please select an alternate role preference.");
    if (!form.second_preference_reason.trim())
      return setError("Please complete the suitability statement for your alternate role.");
    if (!form.volunteered_last_year)
      return setError("Please indicate whether you volunteered in the previous Narunthingal event.");
    if (form.volunteered_last_year === "yes" && !form.last_year_contribution.trim())
      return setError("Please describe your contributions in the previous Narunthingal event.");

    setSubmitting(true);

    const supabase = createClient();
    const { error: dbError } = await supabase.from("applications").insert({
      user_id: userId,
      email,
      name: form.name.trim(),
      contact_number: form.contact_number.trim(),
      first_preference: form.first_preference,
      confidence_reason: form.confidence_reason.trim(),
      second_preference: form.second_preference || null,
      second_preference_reason: form.second_preference ? (form.second_preference_reason.trim() || null) : null,
      volunteered_last_year: form.volunteered_last_year === "yes",
      last_year_contribution: form.volunteered_last_year === "yes" ? form.last_year_contribution.trim() : null,
      current_clubs: serializeClubs(),
      previous_experience: form.previous_experience.trim() || null,
    });

    setSubmitting(false);

    if (dbError) {
      if (dbError.code === "23505") {
        setError("You have already submitted an application.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Personal Information */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Personal Information
        </h2>

        <Field label="Full Name" required>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Enter your full name"
          />
        </Field>

        <Field label="IIT Email Address">
          <input className="input opacity-60 cursor-not-allowed" value={email} readOnly />
        </Field>

        <Field label="Contact Number (WhatsApp)" required>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              +94
            </span>
            <input
              ref={phoneRef}
              className="input pl-12"
              value={getMaskedPhone(form.contact_number)}
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
              onFocus={moveCursorToEnd}
              onClick={moveCursorToEnd}
              inputMode="numeric"
            />
          </div>
        </Field>
      </div>

      {/* Role Preferences */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Role Preferences
        </h2>

        <Field label="Preferred Role" required>
          <select
            className="input"
            value={form.first_preference}
            onChange={(e) => update("first_preference", e.target.value)}
          >
            <option value="">Select a position...</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>

        {form.first_preference && (
          <Field
            label="Why do you consider yourself a strong candidate for this role?"
            hint="Outline the key skills, experiences, and qualities that make you well-suited for this position."
            required
          >
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.confidence_reason}
              onChange={(e) => update("confidence_reason", e.target.value)}
              placeholder="Describe your relevant skills, experiences, and what you would bring to this role..."
            />
          </Field>
        )}

        <Field label="Alternate Role Preference" required>
          <select
            className="input"
            value={form.second_preference}
            onChange={(e) => update("second_preference", e.target.value)}
          >
            <option value="">Select a position...</option>
            {POSITIONS.filter((p) => p !== form.first_preference).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>

        {form.second_preference && (
          <Field
            label="Why do you consider yourself a strong candidate for this alternate role?"
            hint="Outline the key skills, experiences, and qualities that make you well-suited for this position."
            required
          >
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.second_preference_reason}
              onChange={(e) => update("second_preference_reason", e.target.value)}
              placeholder="Describe your relevant skills, experiences, and what you would bring to this role..."
            />
          </Field>
        )}
      </div>

      {/* Experience & Background */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Experience &amp; Background
        </h2>

        <Field label="Did you volunteer in the previous Narunthingal event?" required>
          <div className="flex gap-4 mt-1">
            {(["yes", "no"] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="volunteered"
                  value={v}
                  checked={form.volunteered_last_year === v}
                  onChange={() => update("volunteered_last_year", v)}
                  className="w-4 h-4"
                  style={{ accentColor: "#D4A017" } as React.CSSProperties}
                />
                <span className="capitalize" style={{ color: "rgba(245,240,232,0.85)" }}>
                  {v === "yes" ? "Yes" : "No"}
                </span>
              </label>
            ))}
          </div>
        </Field>

        {form.volunteered_last_year === "yes" && (
          <Field
            label="Please describe your role and contributions in the previous Narunthingal event."
            required
          >
            <textarea
              className="input min-h-[100px] resize-y"
              value={form.last_year_contribution}
              onChange={(e) => update("last_year_contribution", e.target.value)}
              placeholder="Outline your responsibilities, key contributions, and any notable achievements during your involvement..."
            />
          </Field>
        )}

        <Field
          label="Club Memberships &amp; Leadership Roles at IIT"
          hint="List the clubs you are currently a member of and your position within each."
        >
          <div className="flex flex-col gap-2">
            {clubs.map((row, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input flex-1"
                  placeholder="Club name"
                  value={row.club}
                  onChange={(e) => updateClub(i, "club", e.target.value)}
                />
                <div className="flex gap-2 sm:flex-1">
                  <input
                    className="input flex-1"
                    placeholder="Your position (optional)"
                    value={row.position}
                    onChange={(e) => updateClub(i, "position", e.target.value)}
                  />
                  {clubs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeClubRow(i)}
                      className="text-xs px-2 py-1 rounded shrink-0"
                      style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addClubRow}
              className="self-start text-xs px-3 py-1.5 rounded mt-1"
              style={{ color: "#D4A017", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)" }}
            >
              + Add another club
            </button>
          </div>
        </Field>

        <Field
          label="Relevant Organizing &amp; Volunteering Experience"
          hint="Include event management, community service, or any relevant roles held outside of IIT."
        >
          <textarea
            className="input min-h-[100px] resize-y"
            value={form.previous_experience}
            onChange={(e) => update("previous_experience", e.target.value)}
            placeholder="Describe any experience in organizing events, managing teams, or community initiatives..."
          />
        </Field>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting..." : "Submit Application"}
      </button>

      <p className="text-xs text-center" style={{ color: "rgba(212,160,23,0.4)" }}>
        Applications are final once submitted. Please ensure all information is accurate before proceeding.
      </p>
    </form>
  );
}
