"use client";

import { createClient } from "@/lib/supabase/client";
import { POSITIONS } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApplyFormProps {
  userId: string;
  email: string;
  defaultName: string;
}

export default function ApplyForm({
  userId,
  email,
  defaultName,
}: ApplyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: defaultName,
    contact_number: "",
    first_preference: "",
    confidence_reason: "",
    second_preference: "",
    volunteered_last_year: "" as "" | "yes" | "no",
    last_year_contribution: "",
    current_clubs: "",
    previous_experience: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Name is required.");
    if (!form.contact_number.trim())
      return setError("WhatsApp number is required.");
    if (!form.first_preference)
      return setError("Please select your first preference.");
    if (!form.confidence_reason.trim())
      return setError("Please explain why you are suitable.");
    if (!form.volunteered_last_year)
      return setError(
        "Please indicate if you volunteered in last year's Narunthingal."
      );
    if (
      form.volunteered_last_year === "yes" &&
      !form.last_year_contribution.trim()
    )
      return setError("Please describe what you did last year.");

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
      volunteered_last_year: form.volunteered_last_year === "yes",
      last_year_contribution:
        form.volunteered_last_year === "yes"
          ? form.last_year_contribution.trim()
          : null,
      current_clubs: form.current_clubs.trim() || null,
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

  const Field = ({
    label,
    hint,
    required,
    children,
  }: {
    label: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="label">
        {label} {required && <span style={{ color: "#D4A017" }}>*</span>}
      </label>
      {hint && <p className="text-xs -mt-0.5" style={{ color: "rgba(212,160,23,0.5)" }}>{hint}</p>}
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Personal info */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Personal Information
        </h2>

        <Field label="Full Name" required>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your full name"
          />
        </Field>

        <Field label="Email">
          <input
            className="input opacity-60 cursor-not-allowed"
            value={email}
            readOnly
          />
        </Field>

        <Field
          label="WhatsApp Number"
          hint="Include country code, e.g. +94 77 123 4567"
          required
        >
          <input
            className="input"
            value={form.contact_number}
            onChange={(e) => update("contact_number", e.target.value)}
            placeholder="+94 77 000 0000"
          />
        </Field>
      </div>

      {/* Position preferences */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Position Preferences
        </h2>

        <Field label="First Preference" required>
          <select
            className="input"
            value={form.first_preference}
            onChange={(e) => update("first_preference", e.target.value)}
          >
            <option value="">Select a position...</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Why are you suitable for this position?"
          hint="Tell us about your confidence, skills, and what you bring to this role."
          required
        >
          <textarea
            className="input min-h-[120px] resize-y"
            value={form.confidence_reason}
            onChange={(e) => update("confidence_reason", e.target.value)}
            placeholder="Describe why you are the right fit..."
          />
        </Field>

        <Field label="Second Preference">
          <select
            className="input"
            value={form.second_preference}
            onChange={(e) => update("second_preference", e.target.value)}
          >
            <option value="">None (optional)</option>
            {POSITIONS.filter((p) => p !== form.first_preference).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Experience */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Experience & Background
        </h2>

        <Field
          label="Did you volunteer in last year's Narunthingal?"
          required
        >
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
                <span className="capitalize" style={{ color: "rgba(245,240,232,0.85)" }}>{v}</span>
              </label>
            ))}
          </div>
        </Field>

        {form.volunteered_last_year === "yes" && (
          <Field
            label="What did you do in last year's Narunthingal?"
            required
          >
            <textarea
              className="input min-h-[100px] resize-y"
              value={form.last_year_contribution}
              onChange={(e) => update("last_year_contribution", e.target.value)}
              placeholder="Describe your role, tasks, and responsibilities..."
            />
          </Field>
        )}

        <Field
          label="Current clubs at IIT and your positions"
          hint="E.g. IEEE — Member, Drama Club — Vice President"
        >
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.current_clubs}
            onChange={(e) => update("current_clubs", e.target.value)}
            placeholder="Club name — Position, Club name — Position..."
          />
        </Field>

        <Field
          label="Previous volunteering / organizing experience"
          hint="Outside IIT as well — cultural events, community work, etc."
        >
          <textarea
            className="input min-h-[100px] resize-y"
            value={form.previous_experience}
            onChange={(e) => update("previous_experience", e.target.value)}
            placeholder="Describe any relevant experience..."
          />
        </Field>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting..." : "Submit Application"}
      </button>

      <p className="text-xs text-center" style={{ color: "rgba(212,160,23,0.4)" }}>
        Applications are final once submitted. Make sure all details are
        correct.
      </p>
    </form>
  );
}
