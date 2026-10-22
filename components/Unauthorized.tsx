export default function Unauthorized() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{
        background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)",
      }}
    >
      <div className="text-7xl mb-6">🚨</div>

      <h1 className="text-3xl font-bold text-white mb-2">bro no entry here</h1>
      <p className="text-lg mb-1" style={{ color: "rgba(212,160,23,0.8)" }}>
        please mind your own business 💀
      </p>
      <p className="text-sm mb-8" style={{ color: "rgba(245,240,232,0.3)" }}>
        this page is for admins only and you are definitely not one
      </p>

      <div
        className="rounded-2xl px-6 py-5 mb-8 max-w-sm"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,160,23,0.15)" }}
      >
        <p className="text-4xl mb-3">🕵️</p>
        <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
          our security team has been notified
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.2)" }}>
          (just kidding, but seriously, go back)
        </p>
      </div>

      <a
        href="/"
        className="btn-primary px-8"
      >
        take me home 🏠
      </a>
    </div>
  );
}
