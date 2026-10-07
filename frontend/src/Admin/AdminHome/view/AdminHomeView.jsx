import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminLinks } from "../services/dminLinks";
import {
  Shield,
  Search,
  ArrowUpRight,
  Users,
  BookOpen,
  Layers,
  Settings2,
  ChevronRight,
} from "lucide-react";

/* ─── Category icon map ─── */
const CATEGORY_ICONS = {
  Users: Users,
  Academics: BookOpen,
  Courses: Layers,
  System: Settings2,
};

/* ─── Category accent colors ─── */
const CATEGORY_COLORS = {
  Users:     { accent: "#2563eb", bg: "#eff6ff", light: "#dbeafe" },
  Academics: { accent: "#7c3aed", bg: "#f5f3ff", light: "#ede9fe" },
  Courses:   { accent: "#0891b2", bg: "#ecfeff", light: "#cffafe" },
  System:    { accent: "#dc2626", bg: "#fef2f2", light: "#fee2e2" },
};

/* ─── Module Card ─── */
const ModuleCard = ({ link, index }) => {
  const navigate = useNavigate();
  const Icon = link.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => navigate(link.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        background: hovered ? link.bg : "#fff",
        border: `1px solid ${hovered ? link.accent + "33" : "#e2e8f0"}`,
        borderRadius: 16,
        padding: "20px 22px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 12px 32px ${link.accent}18`
          : "0 1px 3px rgba(0,0,0,0.04)",
        animation: `cardFadeUp 0.4s ease both`,
        animationDelay: `${index * 0.05}s`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle corner glow on hover */}
      <div style={{
        position: "absolute",
        top: -30, right: -30,
        width: 80, height: 80,
        borderRadius: "50%",
        background: link.accent,
        opacity: hovered ? 0.07 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: hovered ? link.accent : link.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: hovered ? "#fff" : link.accent,
        marginBottom: 14,
        transition: "all 0.18s ease",
        flexShrink: 0,
      }}>
        <Icon size={19} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2, lineHeight: 1.2 }}>
          {link.title}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: link.accent,
          textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
        }}>
          {link.subtitle}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
          {link.description}
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        marginTop: 14, fontSize: 11, fontWeight: 700,
        color: hovered ? link.accent : "#cbd5e1",
        transition: "color 0.18s ease",
      }}>
        Open module <ArrowUpRight size={12} />
      </div>
    </button>
  );
};

/* ─── Category Section ─── */
const CategorySection = ({ category, links }) => {
  const CatIcon = CATEGORY_ICONS[category] || Settings2;
  const colors = CATEGORY_COLORS[category] || { accent: "#64748b", bg: "#f8fafc", light: "#f1f5f9" };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Category header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: colors.light,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: colors.accent,
        }}>
          <CatIcon size={14} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {category}
        </span>
        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
        <span style={{
          fontSize: 10, fontWeight: 700, color: colors.accent,
          background: colors.bg, padding: "2px 8px", borderRadius: 20,
        }}>
          {links.length} module{links.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}>
        {links.map((link, i) => (
          <ModuleCard key={link.id} link={link} index={i} />
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
════════════════════════════════════════════ */
const AdminDashboard = () => {
  const allLinks = useMemo(() => getAdminLinks(), []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    allLinks.filter(
      (l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        l.category.toLowerCase().includes(search.toLowerCase())
    ),
    [allLinks, search]
  );

  const categories = useMemo(() => {
    const map = new Map();
    filtered.forEach((l) => {
      if (!map.has(l.category)) map.set(l.category, []);
      map.get(l.category).push(l);
    });
    return map;
  }, [filtered]);

  const totalModules = allLinks.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "28px",
      fontFamily: "inherit",
    }}>
      <style>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes headerSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 1300, margin: "0 auto" }}>

        {/* ══ HEADER ══ */}
        <div style={{
          background: "#0f172a",
          borderRadius: 20,
          padding: "28px 36px",
          marginBottom: 28,
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          animation: "headerSlide 0.4s ease both",
        }}>
          {/* Decorative shapes */}
          <div style={{
            position: "absolute", top: -40, right: 60,
            width: 160, height: 160, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -30, right: -20,
            width: 110, height: 110, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Left content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Eyebrow */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(37,99,235,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={14} color="#93c5fd" />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#93c5fd",
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                CISD · Admin Portal
              </span>
            </div>

            <h1 style={{
              margin: "0 0 6px",
              fontSize: 28,
              fontWeight: 900,
              color: "#f1f5f9",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              Administration
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              Manage users, academics, courses, and system configuration from one place
            </p>
          </div>

          {/* Right: stat chips */}
          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap",
            position: "relative", zIndex: 1,
          }}>
            {[
              { label: "Total Modules", value: totalModules, color: "#93c5fd" },
              { label: "Categories", value: [...new Set(allLinks.map(l => l.category))].length, color: "#c4b5fd" },
            ].map((chip) => (
              <div key={chip.label} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 18px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                  {chip.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: chip.color }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SEARCH + TOOLBAR ══ */}
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 28,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <div style={{
            position: "relative",
            flex: 1,
            minWidth: 200,
            maxWidth: 360,
          }}>
            <Search size={15} color="#94a3b8" style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules…"
              style={{
                width: "100%", boxSizing: "border-box",
                paddingLeft: 36, paddingRight: 14,
                paddingTop: 9, paddingBottom: 9,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: 13, color: "#334155",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            />
          </div>

          {/* Category quick filters */}
          {[...new Set(allLinks.map((l) => l.category))].map((cat) => {
            const colors = CATEGORY_COLORS[cat] || {};
            const CatIcon = CATEGORY_ICONS[cat] || ChevronRight;
            const active = search.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSearch(active ? "" : cat)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 10,
                  border: `1px solid ${active ? colors.accent + "44" : "#e2e8f0"}`,
                  background: active ? colors.bg : "#fff",
                  color: active ? colors.accent : "#64748b",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <CatIcon size={13} />
                {cat}
              </button>
            );
          })}
        </div>

        {/* ══ MODULE CATEGORIES ══ */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            color: "#94a3b8", fontSize: 14, fontWeight: 500,
          }}>
            No modules match "{search}"
          </div>
        ) : (
          Array.from(categories.entries()).map(([category, links]) => (
            <CategorySection key={category} category={category} links={links} />
          ))
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;