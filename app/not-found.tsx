export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{
        background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)",
      }}
    >
      <div className="text-7xl mb-6">🔍</div>

      <h1 className="text-3xl font-bold text-white mb-2">lost bro?</h1>
      <p className="text-lg mb-1" style={{ color: "rgba(212,160,23,0.8)" }}>
        this page does not exist 💀
      </p>
      <p className="text-sm mb-8" style={{ color: "rgba(245,240,232,0.3)" }}>
        whatever you were looking for, it&apos;s not here
      </p>

      <div
        className="rounded-2xl px-6 py-5 mb-8 max-w-sm"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,160,23,0.15)" }}
      >
        <p className="text-4xl mb-3">🗺️</p>
        <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
          maybe you typed the wrong URL
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.2)" }}>
          or maybe you&apos;re just exploring, no judgment
        </p>
      </div>

      <a href="/" className="btn-primary px-8">
        take me home 🏠
      </a>
    </div>
  );
}
