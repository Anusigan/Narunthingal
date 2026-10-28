"use client";

import { useEffect, useState } from "react";

// Wednesday 28 Oct 2026 20:00:00 Sri Lanka time (UTC+5:30)
const DEADLINE = new Date("2026-10-28T14:30:00Z");

function getTimeLeft() {
  const diff = DEADLINE.getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const mins = Math.floor((diff / 1000 / 60) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return { hours, mins, secs };
}

export default function DeadlineCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return (
    <div className="flex items-center justify-center mt-3">
      <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full" style={{ color: "rgba(252,165,165,0.8)", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
        Applications closed
      </span>
    </div>
  );

  const { hours, mins, secs } = timeLeft;

  return (
    <div
      className="flex items-center justify-center gap-2 flex-wrap mt-3"
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.55)" }}>
        Application closes in
      </span>
      <div className="flex items-center gap-1.5">
        {[
          { value: hours, label: "hr" },
          { value: mins, label: "min" },
          { value: secs, label: "sec" },
        ].map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-1.5">
            {i > 0 && <span style={{ color: "rgba(212,160,23,0.3)" }}>:</span>}
            <div className="flex flex-col items-center">
              <span
                className="text-base font-bold tabular-nums"
                style={{ color: "#D4A017", minWidth: "2ch", textAlign: "center" }}
              >
                {String(value).padStart(2, "0")}
              </span>
              <span className="text-xs" style={{ color: "rgba(212,160,23,0.4)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
