"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const AVENUES = [
  "Logistics",
  "Decorations",
  "Editorial",
  "Event Management",
];

const YEARS = ["Foundation", "First Year", "Second Year"];

export default function VolunteerForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact_number: "",
    degree_pathway: "",
    current_year: "",
  });

  // Max 2 avenues; reasons keyed by avenue name
  const [selectedAvenues, setSelectedAvenues] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleAvenue(avenue: string) {
    setSelectedAvenues((prev) => {
      if (prev.includes(avenue)) {
        // Deselect — remove reason too
        setReasons((r) => {
          const next = { ...r };
          delete next[avenue];
          return next;
        });
        return prev.filter((a) => a !== avenue);
      }
      if (prev.length >= 2) return prev; // already at max
      return [...prev, avenue];
    });
  }

  function updateReason(avenue: string, value: string) {
    setReasons((r) => ({ ...r, [avenue]: value }));
  }

  function formatPhoneDisplay(digits: string) {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    update("contact_number", digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Full name is required.");
    if (form.contact_number.length < 10) return setError("Please enter a valid 10-digit number.");
    if (!form.contact_number.startsWith("07")) return setError("Please enter a valid Sri Lankan mobile number starting with 07.");
    if (!form.degree_pathway) return setError("Please select your degree pathway.");
    if (!form.current_year) return setError("Please select your current year.");
    if (selectedAvenues.length === 0) return setError("Please select at least one volunteering avenue.");

    for (const avenue of selectedAvenues) {
      if (!reasons[avenue]?.trim()) {
        return setError(`Please describe why you're a good fit for ${avenue}.`);
      }
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: dbError } = await supabase.from("volunteers").insert({
      name: form.name.trim(),
      contact_number: form.contact_number,
      degree_pathway: form.degree_pathway,
      current_year: form.current_year,
      volunteering_avenues: selectedAvenues,
      suitability_reasons: reasons,
    });
    setSubmitting(false);

    if (dbError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div
        className="card text-center py-10 flex flex-col items-center gap-3"
        style={{ borderColor: "rgba(16,185,129,0.3)" }}
      >
        <p className="text-3xl">✓</p>
        <p className="text-lg font-semibold text-white">Registration received!</p>
        <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
          Thank you for your interest in volunteering for Narunthingal &apos;27. We&apos;ll be in touch.
        </p>
        <button onClick={() => router.push("/")} className="btn-secondary mt-2">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Personal Details */}
      <div className="card flex flex-col gap-5">
        <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          Personal Details
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="label">Full Name <span style={{ color: "#D4A017" }}>*</span></label>
          <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Enter your full name" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">WhatsApp Number <span style={{ color: "#D4A017" }}>*</span></label>
          <input
            className="input"
            inputMode="numeric"
            value={formatPhoneDisplay(form.contact_number)}
            onChange={handlePhoneChange}
            placeholder="07X XXX XXXX"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Degree Pathway <span style={{ color: "#D4A017" }}>*</span></label>
          <select className="input" value={form.degree_pathway} onChange={(e) => update("degree_pathway", e.target.value)}>
            <option value="">Select your pathway...</option>
            <option value="Computing">Computing</option>
            <option value="Business">Business</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Current Year <span style={{ color: "#D4A017" }}>*</span></label>
          <select className="input" value={form.current_year} onChange={(e) => update("current_year", e.target.value)}>
            <option value="">Select your year...</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Volunteering Preferences */}
      <div className="card flex flex-col gap-5">
        <div>
          <h2 className="font-semibold pb-3" style={{ color: "#f5f0e8", borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
            Volunteering Preferences
          </h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">
            Avenues you&apos;d like to volunteer for <span style={{ color: "#D4A017" }}>*</span>
          </label>
          <p className="text-xs -mt-0.5" style={{ color: "rgba(212,160,23,0.5)" }}>
            Select up to 2. You must explain your fit for each one selected.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {AVENUES.map((avenue) => {
              const checked = selectedAvenues.includes(avenue);
              const maxed = !checked && selectedAvenues.length >= 2;
              return (
                <button
                  key={avenue}
                  type="button"
                  onClick={() => toggleAvenue(avenue)}
                  disabled={maxed}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-left transition-all"
                  style={checked ? {
                    background: "rgba(212,160,23,0.15)",
                    border: "1px solid rgba(212,160,23,0.45)",
                    color: "#D4A017",
                  } : maxed ? {
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: "rgba(245,240,232,0.25)",
                    cursor: "not-allowed",
                  } : {
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(245,240,232,0.6)",
                  }}
                >
                  {checked ? "✓ " : ""}{avenue}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-avenue reason textareas — appear when avenue is selected */}
        {selectedAvenues.map((avenue) => (
          <div key={avenue} className="flex flex-col gap-1.5">
            <label className="label">
              Why are you a good fit for <span style={{ color: "#D4A017" }}>{avenue}</span>?{" "}
              <span style={{ color: "#D4A017" }}>*</span>
            </label>
            <p className="text-xs -mt-0.5" style={{ color: "rgba(212,160,23,0.5)" }}>Keep it brief (2–3 sentences)</p>
            <textarea
              className="input resize-none"
              rows={3}
              value={reasons[avenue] ?? ""}
              onChange={(e) => updateReason(avenue, e.target.value)}
              placeholder={`Why would you be a great fit for ${avenue}?`}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting..." : "Submit Registration"}
      </button>
    </form>
  );
}
