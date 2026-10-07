import React from "react";

// CR80 portrait (54 x 85.6 mm) at ~6 px per mm. The faces are square-cornered
// on purpose: the preview wrapper rounds them, while the print capture stays
// full-bleed for a die-cut card printer.
export const CARD_W = 324;
export const CARD_H = 512;

// Palette taken from the CISD logo: deep navy for type, the logo's red as the
// single accent, neutral greys for everything else.
const NAVY = "#12263f";
const RED = "#d62839";
const INK = "#0f172a";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const LINE = "#e2e8f0";
const FONT = "Inter, 'Segoe UI', system-ui, sans-serif";

const fmtDay = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const Header = ({ subtitle }) => (
  <div style={{ background: "#fff" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: NAVY, lineHeight: 1.2, whiteSpace: "nowrap" }}>
        CISD
      </div>
      <div style={{ marginLeft: "auto", fontSize: 7, fontWeight: 700, letterSpacing: 1.4, color: FAINT, textAlign: "right", lineHeight: 1.3, whiteSpace: "nowrap" }}>
        {subtitle}
      </div>
    </div>
    <div style={{ height: 3, background: RED }} />
  </div>
);

const Detail = ({ label, value, wide }) => (
  <div style={{ gridColumn: wide ? "1 / -1" : "auto", minWidth: 0 }}>
    <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: 1, color: FAINT, textTransform: "uppercase" }}>{label}</div>
    <div
      style={{
        marginTop: 2,
        fontSize: 10.5,
        fontWeight: 700,
        color: INK,
        lineHeight: 1.25,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: wide ? "normal" : "nowrap",
      }}
    >
      {value || "—"}
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${LINE}` }}>
    <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: FAINT, textTransform: "uppercase" }}>{label}</span>
    <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>{value || "—"}</span>
  </div>
);

const Footer = ({ left, right }) => (
  <div
    style={{
      position: "absolute",
      inset: "auto 0 0 0",
      height: 36,
      background: NAVY,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
    }}
  >
    <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4, color: "#9fb3c8", whiteSpace: "nowrap" }}>{left}</span>
    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{right}</span>
  </div>
);

const shell = { width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#fff", fontFamily: FONT };

export const CardFront = React.forwardRef(({ model }, ref) => (
  <div ref={ref} style={shell}>
    <Header subtitle="STUDENT ID" />

    <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
      <div
        style={{
          width: 118,
          height: 148,
          borderRadius: 12,
          border: `1px solid ${LINE}`,
          boxShadow: "0 6px 18px rgba(18,38,63,.14)",
          overflow: "hidden",
          background: model.photo ? `#eef2f7 url("${model.photo}") center/cover no-repeat` : "#eef2f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!model.photo && <span style={{ fontSize: 40, fontWeight: 800, color: "#9fb3c8" }}>{initials(model.fullName)}</span>}
      </div>
    </div>

    <div style={{ padding: "18px 24px 0", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, lineHeight: 1.15, letterSpacing: -0.2 }}>{model.fullName}</div>
      <div style={{ marginTop: 5, fontSize: 9.5, fontWeight: 600, color: MUTED, lineHeight: 1.3 }}>{model.programName}</div>
      <div
        style={{
          display: "inline-block",
          marginTop: 10,
          padding: "4px 14px",
          borderRadius: 999,
          background: "#f1f5f9",
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: 1.2,
          color: NAVY,
          fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        }}
      >
        {model.regNo}
      </div>
    </div>

    <div style={{ position: "absolute", left: 24, right: 24, top: 352, height: 1, background: LINE }} />
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 364,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        columnGap: 14,
        rowGap: 10,
      }}
    >
      <Detail label="Father's name" value={model.fatherName} />
      <Detail label="CNIC" value={model.cnic} />
      <Detail label="Class" value={model.departmentName} wide />
      <Detail label="Session" value={`${model.issueTerm || "—"} – ${model.endTerm || "—"}`} wide />
    </div>

    <Footer left="VALID UNTIL" right={fmtDay(model.expiryDate).toUpperCase()} />
  </div>
));
CardFront.displayName = "CardFront";

export const CardBack = React.forwardRef(({ model }, ref) => (
  <div ref={ref} style={shell}>
    <Header subtitle="ID CARD" />

    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 22 }}>
      <div style={{ padding: 8, borderRadius: 12, border: `1px solid ${LINE}`, background: "#fff" }}>
        {model.qr ? (
          <img src={model.qr} alt="" style={{ width: 104, height: 104, display: "block" }} />
        ) : (
          <div style={{ width: 104, height: 104, background: "#f1f5f9" }} />
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: NAVY, fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>
        {model.regNo}
      </div>
    </div>

    <div style={{ margin: "18px 26px 0" }}>
      <Row label="Card no." value={model.cardNumber} />
      <Row label="Issued" value={fmtDay(model.issueDate)} />
      <Row label="Valid until" value={fmtDay(model.expiryDate)} />
      <Row label="Session" value={`${model.issueTerm || "—"} – ${model.endTerm || "—"}`} />
    </div>

    <div style={{ margin: "16px 26px 0", fontSize: 7.5, lineHeight: 1.6, color: MUTED }}>
      This card is the property of CISD. It is not transferable and must be carried on campus at
      all times. If found, please return it to the Institute; report a lost or damaged card to the Admission Office
      immediately.
    </div>

    <div style={{ position: "absolute", left: 26, right: 26, bottom: 48, textAlign: "center" }}>
      <div style={{ borderTop: `1px solid ${FAINT}`, width: 116, margin: "0 auto 5px" }} />
      <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.2, color: MUTED }}>ISSUING AUTHORITY · ADMISSION OFFICE</div>
    </div>

    <Footer left="CISD" right="" />
  </div>
));
CardBack.displayName = "CardBack";
