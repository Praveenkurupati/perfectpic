import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PerfectPic — Premium Photobooks & Albums That Last Generations";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #090D16 0%, #0F172A 50%, #07090E 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "4px solid #ffffff",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: "32px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                <span>PERFECT</span>
                <span
                  style={{
                    color: "#F43F5E",
                    marginLeft: "4px",
                  }}
                >
                  PIC
                </span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "4px", color: "#94A3B8" }}>
                PREMIUM PHOTOBOOKS
              </span>
            </div>
          </div>

          {/* Domain badge */}
          <div
            style={{
              padding: "10px 24px",
              borderRadius: "999px",
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#E2E8F0",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            perfectpic.in
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "950px" }}>
          <h1
            style={{
              fontSize: "62px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              margin: 0,
              color: "#F8FAFC",
            }}
          >
            Premium Custom Photo Books <br />
            <span style={{ color: "#F43F5E" }}>
              That Last Generations.
            </span>
          </h1>
          <p style={{ fontSize: "24px", color: "#94A3B8", margin: 0, lineHeight: 1.4 }}>
            Archival non-tearable paper. Seamless 180° lay-flat binding. Design in 60s with smart auto-layout.
          </p>
        </div>

        {/* Bottom Badges */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#F1F5F9",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            ✨ Non-Tearable Pages
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#F1F5F9",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            📖 180° Lay-Flat
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#F1F5F9",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            🎨 HD Color Fidelity
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#F1F5F9",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            🇮🇳 All-India Delivery
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
