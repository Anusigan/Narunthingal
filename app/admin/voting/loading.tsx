export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(212,160,23,0.4)", borderTopColor: "#D4A017" }}
        />
        <p className="text-sm" style={{ color: "rgba(212,160,23,0.5)" }}>Loading…</p>
      </div>
    </div>
  );
}
