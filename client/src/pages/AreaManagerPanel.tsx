import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, ChevronDown } from "lucide-react";
import { SERVER_BASE_URL } from "@/lib/config";

function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}س ${m}د`;
  return `${m} دقيقة`;
}

function durationMin(checkIn: any, checkOut: any): number {
  if (!checkOut) return 0;
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60_000);
}

function fmtDur(min: number): string {
  if (min === 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

function Avatar({ name, photoUrl, size = 44 }: { name?: string | null; photoUrl?: string | null; size?: number }) {
  const src = photoUrl ? `${SERVER_BASE_URL}${photoUrl}` : null;
  const initials = name?.charAt(0)?.toUpperCase() || "?";
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, rgba(15,165,248,0.25) 0%, rgba(99,102,241,0.25) 100%)",
      border: "1.5px solid rgba(15,165,248,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#0fa5f8",
    }}>
      {initials}
    </div>
  );
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      {active && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "#34d399", opacity: 0.7,
          animation: "panel-ping 1.4s ease-out infinite",
        }} />
      )}
      <span style={{
        position: "relative", display: "inline-flex",
        width: 10, height: 10, borderRadius: "50%",
        background: active ? "#34d399" : "rgba(255,255,255,0.2)",
      }} />
    </span>
  );
}

function MemberCard({ sub, now, index }: { sub: any; now: number; index: number }) {
  const isActive = !!sub.activeVisit;
  const duration = isActive ? formatDuration(now - new Date(sub.activeVisit.checkInAt).getTime()) : null;
  const checkInTime = isActive ? format(new Date(sub.activeVisit.checkInAt), "hh:mm a") : null;

  return (
    <div style={{
      background: isActive
        ? "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(30,34,40,0.85) 100%)"
        : "rgba(30,34,40,0.6)",
      border: `1px solid ${isActive ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 20,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      animation: `panel-fade-up 0.4s ease-out ${index * 0.07}s both`,
      transition: "border-color 0.3s, background 0.3s",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          padding: 2, borderRadius: "50%",
          border: `2px solid ${isActive ? "#34d399" : "rgba(255,255,255,0.1)"}`,
          transition: "border-color 0.3s",
        }}>
          <Avatar name={sub.name} photoUrl={sub.photoUrl} size={44} />
        </div>
        <div style={{ position: "absolute", bottom: 0, right: 0, background: "#111417", borderRadius: "50%", padding: 1 }}>
          <LiveDot active={isActive} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sub.name ?? "—"}
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, flexShrink: 0 }}>store</span>
          {sub.branchName ?? "—"}
        </p>
        {isActive && checkInTime && (
          <p style={{ fontSize: 11, color: "rgba(52,211,153,0.8)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>login</span>
            دخل {checkInTime}
          </p>
        )}
      </div>

      <div style={{ textAlign: "end", flexShrink: 0 }}>
        {isActive ? (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#34d399", lineHeight: 1 }}>{duration}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>منذ الدخول</div>
          </>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            غير متواجد
          </span>
        )}
      </div>
    </div>
  );
}

function HomeTab() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data: subordinates = [], isLoading } = trpc.manager.getSubordinateBranchManagers.useQuery(undefined, {
    staleTime: 30_000, refetchInterval: 60_000,
  });

  const subs = subordinates as any[];
  const activeCount = subs.filter((s) => s.activeVisit).length;
  const offCount = subs.length - activeCount;

  const sorted = useMemo(
    () => [...subs].sort((a, b) => (b.activeVisit ? 1 : 0) - (a.activeVisit ? 1 : 0)),
    [subs]
  );

  const kpis = [
    { label: "الفريق",     value: isLoading ? "—" : subs.length,   icon: "group",      color: "#0fa5f8", iconBg: "rgba(15,165,248,0.15)",  cardBg: "rgba(15,165,248,0.06)",  border: "rgba(15,165,248,0.15)"  },
    { label: "متواجدون",  value: isLoading ? "—" : activeCount,    icon: "sensors",    color: "#34d399", iconBg: "rgba(52,211,153,0.15)",  cardBg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.15)"  },
    { label: "غائبون",   value: isLoading ? "—" : offCount,       icon: "person_off", color: "rgba(255,255,255,0.5)", iconBg: "rgba(255,255,255,0.07)", cardBg: "rgba(30,34,40,0.6)",    border: "rgba(255,255,255,0.07)" },
  ];

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={k.label} style={{
            background: k.cardBg,
            border: `1px solid ${k.border}`,
            borderRadius: 18,
            padding: "16px 10px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            animation: `panel-fade-up 0.35s ease-out ${i * 0.08}s both`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: k.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 19, color: k.color, fontVariationSettings: "'FILL' 1" }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em", textAlign: "center" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>مديرو الفروع</h2>
        {!isLoading && activeCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "panel-live-blink 1.4s ease-in-out infinite" }} />
            {activeCount} نشط الآن
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 20, background: "rgba(30,34,40,0.6)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)", animation: "panel-shimmer 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(30,34,40,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "rgba(255,255,255,0.15)", display: "block", marginBottom: 12 }}>group_off</span>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>لا يوجد مديرو فروع مرتبطون بمنطقتك بعد</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((sub: any, i: number) => (
            <MemberCard key={sub.managerId} sub={sub} now={now} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const now = new Date();
  const defaultStart = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [filters, setFilters] = useState({ startDate: defaultStart, endDate: defaultEnd, managerId: "" });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const { data: subordinates = [] } = trpc.manager.getSubordinateBranchManagers.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const subs = subordinates as any[];
  const subManagerIds = subs.map((s: any) => s.managerId);

  const { data, isLoading } = trpc.visit.adminList.useQuery(
    { managerId: filters.managerId ? Number(filters.managerId) : undefined, startDate: filters.startDate || undefined, endDate: filters.endDate || undefined, limit: 1000, offset: 0 },
    { enabled: subManagerIds.length > 0 }
  );

  const allVisits = (data?.items ?? []) as any[];
  const visits = allVisits.filter((v: any) => {
    if (filters.managerId) return v.managerId === Number(filters.managerId);
    return subManagerIds.includes(v.managerId);
  });

  const dayGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const v of visits) {
      const day = format(new Date(v.checkInAt), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(v);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, dayVisits]) => ({ date, dateLabel: format(new Date(date), "EEEE، d MMMM", { locale: ar }), visits: dayVisits }));
  }, [visits]);

  const checkedOut = visits.filter((v) => v.checkOutAt);
  const totalMin = checkedOut.reduce((acc, v) => acc + durationMin(v.checkInAt, v.checkOutAt), 0);
  const activeNow = visits.filter((v) => v.status === "checked_in").length;

  const summaryKpis = [
    { label: "إجمالي الزيارات", value: isLoading ? "—" : visits.length,                             icon: "place",          color: "#0fa5f8", iconBg: "rgba(15,165,248,0.12)"  },
    { label: "ساعات العمل",    value: isLoading ? "—" : `${Math.floor(totalMin / 60)}س ${totalMin % 60}د`, icon: "schedule",       color: "#f59e0b", iconBg: "rgba(245,158,11,0.12)"  },
    { label: "نشطة الآن",      value: isLoading ? "—" : activeNow,                                   icon: "sensors",        color: "#34d399", iconBg: "rgba(52,211,153,0.12)"  },
    { label: "أيام العمل",     value: isLoading ? "—" : dayGroups.length,                            icon: "calendar_month", color: "#a78bfa", iconBg: "rgba(167,139,250,0.12)" },
  ];

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{ background: "rgba(30,34,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "18px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>المدير</div>
          <select value={filters.managerId} onChange={(e) => setFilters((f) => ({ ...f, managerId: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", outline: "none", fontFamily: "'Cairo', sans-serif" }}>
            <option value="" style={{ background: "#1e2228" }}>جميع مديري الفروع</option>
            {subs.map((s: any) => (<option key={s.managerId} value={s.managerId} style={{ background: "#1e2228" }}>{s.name}</option>))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {([["startDate", "من تاريخ"], ["endDate", "إلى تاريخ"]] as const).map(([key, label]) => (
            <div key={key}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
              <input type="date" value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", padding: "10px", borderRadius: 12, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {summaryKpis.map((k) => (
          <div key={k.label} style={{
            background: "rgba(30,34,40,0.65)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: k.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 19, color: k.color, fontVariationSettings: "'FILL' 1" }}>{k.icon}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: k.color, lineHeight: 1.1, whiteSpace: "nowrap" }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#0fa5f8" }} />
        </div>
      ) : dayGroups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(30,34,40,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "rgba(255,255,255,0.15)", display: "block", marginBottom: 12 }}>inbox</span>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>لا توجد زيارات في هذه الفترة</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dayGroups.map((group, gi) => {
            const open = expandedDay === group.date;
            const dayMin = group.visits.filter((v: any) => v.checkOutAt).reduce((acc: number, v: any) => acc + durationMin(v.checkInAt, v.checkOutAt), 0);
            const activeInDay = group.visits.filter((v: any) => v.status === "checked_in").length;
            return (
              <div key={group.date} style={{ background: "rgba(30,34,40,0.6)", border: `1px solid ${open ? "rgba(15,165,248,0.2)" : "rgba(255,255,255,0.05)"}`, borderRadius: 18, overflow: "hidden", transition: "border-color 0.2s", animation: `panel-fade-up 0.35s ease-out ${gi * 0.05}s both` }}>
                <button onClick={() => setExpandedDay(open ? null : group.date)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "rgba(15,165,248,0.1)", border: "1px solid rgba(15,165,248,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#0fa5f8", lineHeight: 1 }}>{format(new Date(group.date), "d")}</span>
                      <span style={{ fontSize: 9, color: "rgba(15,165,248,0.7)", fontWeight: 700 }}>{format(new Date(group.date), "EEE", { locale: ar })}</span>
                    </div>
                    <div style={{ textAlign: "start" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{group.dateLabel}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                        {group.visits.length} زيارة{dayMin > 0 && ` • ${fmtDur(dayMin)}`}
                        {activeInDay > 0 && <span style={{ color: "#34d399" }}> • {activeInDay} نشط</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <ChevronDown size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
                  </div>
                </button>
                {open && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {group.visits.map((v: any, vi: number) => {
                      const dur = v.checkOutAt ? durationMin(v.checkInAt, v.checkOutAt) : null;
                      const isCheckedIn = v.status === "checked_in";
                      return (
                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: vi < group.visits.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: isCheckedIn ? "rgba(52,211,153,0.04)" : "rgba(0,0,0,0.1)" }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isCheckedIn ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: isCheckedIn ? "#34d399" : "rgba(255,255,255,0.3)", fontVariationSettings: "'FILL' 1" }}>{isCheckedIn ? "sensors" : "check_circle"}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.managerName}</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {v.branchName ?? "مأمورية خارجية"} • {format(new Date(v.checkInAt), "hh:mm a")}
                              {v.checkOutAt && ` › ${format(new Date(v.checkOutAt), "hh:mm a")}`}
                            </p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, flexShrink: 0, background: isCheckedIn ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)", color: isCheckedIn ? "#34d399" : "rgba(255,255,255,0.5)", border: `1px solid ${isCheckedIn ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                            {isCheckedIn ? "نشطة" : dur ? fmtDur(dur) : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AreaManagerPanelInner() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"home" | "reports">("home");

  const tabs = [
    { key: "home" as const, label: "الفريق", icon: "group" },
    { key: "reports" as const, label: "التقارير", icon: "assessment" },
  ];

  // ── زر الرجوع: window.location.href بدل wouter Link لأن ProtectedRouter في App.tsx
  // بيتحقق من window.location.pathname وقت الـ render، مش عن طريق wouter subscription
  const handleBack = () => { window.location.href = "/"; };

  return (
    <>
      <style>{`
        @keyframes panel-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes panel-ping {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes panel-live-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes panel-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .panel-tab-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; height: 100%; border: none; background: transparent;
          font-size: 13px; font-weight: 700; font-family: 'Cairo', sans-serif;
          cursor: pointer; color: rgba(255,255,255,0.4); transition: color 0.2s;
          position: relative;
        }
        .panel-tab-btn.active { color: #0fa5f8; }
        .panel-tab-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 15%; right: 15%;
          height: 2.5px; border-radius: 2px 2px 0 0; background: #0fa5f8;
        }
        .panel-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.65);
          font-size: 12px; font-weight: 700;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .panel-back-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .panel-back-btn:active { transform: scale(0.97); }
      `}</style>

      <div style={{
        minHeight: "100svh",
        background: "#111417",
        color: "#fff",
        fontFamily: "'Cairo', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Ambient Glows */}
        <div style={{ position: "fixed", top: -120, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,165,248,0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -100, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* ── Header ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(17,20,23,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}>
          {/* Title Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px" }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>لوحة المتابعة</p>
              <h1 style={{ fontSize: 19, fontWeight: 800, margin: "3px 0 0", letterSpacing: "-0.01em", color: "#fff" }}>
                {user?.name || "مدير المنطقة"}
              </h1>
            </div>
            {/* ✅ زر رجوع native — يعمل بدون اعتماد على wouter subscription */}
            <button className="panel-back-btn" onClick={handleBack}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
              رجوع
            </button>
          </div>

          {/* Tab Bar */}
          <div style={{ display: "flex", height: 44, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`panel-tab-btn${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 17, fontVariationSettings: tab === t.key ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Content ── */}
        <main style={{ flex: 1, position: "relative", zIndex: 1, overflowY: "auto" }}>
          {tab === "home" ? <HomeTab /> : <ReportsTab />}
        </main>
      </div>
    </>
  );
}

export default function AreaManagerPanel() {
  return <AreaManagerPanelInner />;
}
