import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// ─── Donut Chart (زي صورة 1) ──────────────────────────────────────────────────
function DonutChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / Math.max(max, 1), 1);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg viewBox="0 0 88 88" className="w-20 h-20" aria-hidden="true">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#EDE9FE" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      <text x="44" y="49" textAnchor="middle" fill={color} fontSize="15" fontFamily="'Fira Code', monospace" fontWeight="700">
        {value}
      </text>
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points, 1);
  const w = 80; const h = 28;
  const pts = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar Chart (أسبوعي) ───────────────────────────────────────────────────────
const days = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
const heights = [55, 80, 40, 95, 70, 100, 60];

function WeekBarChart() {
  return (
    <div className="flex items-end gap-1.5 h-16 w-full">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${h * 0.6}%`,
              background: i === 5 ? "#7C3AED" : "#EDE9FE",
              minHeight: 4,
            }}
          />
          <span className={`text-[9px] font-mono ${i === 5 ? "text-[#7C3AED] font-bold" : "text-[#9CA3AF]"}`}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Visit Row ────────────────────────────────────────────────────────────────
function VisitRow({ name, time, status, manager }: {
  name: string; time: string; status: "checked_in" | "checked_out"; manager: string;
}) {
  const isActive = status === "checked_in";
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA] rounded-xl px-2 transition-colors cursor-pointer group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-[#EDE9FE]" : "bg-[#ECFDF5]"}`}>
        <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-[#7C3AED]" : "text-[#059669]"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}>
          {isActive ? "radio_button_checked" : "task_alt"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#111827] text-sm truncate">{name}</p>
        <p className="text-[#9CA3AF] text-xs mt-0.5">{manager}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs text-[#9CA3AF] font-mono">{time}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-[#EDE9FE] text-[#7C3AED]" : "bg-[#ECFDF5] text-[#059669]"}`}>
          {isActive ? "نشط" : "منتهى"}
        </span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.visit.stats.useQuery();
  const { data: recentVisits = [], isLoading: recentLoading } = trpc.visit.recentVisits.useQuery({ limit: 5 });
  const [activeTab, setActiveTab] = useState<"week" | "month" | "year">("week");

  const totalBranches = (stats as any)?.totalBranches ?? 0;
  const totalManagers = (stats as any)?.totalManagers ?? 0;
  const todayVisits   = (stats as any)?.todayVisits   ?? 0;
  const completionRate = Math.min(Math.round((todayVisits / Math.max(totalBranches, 1)) * 100), 100);
  const now = new Date();

  const coverageData = [
    { label: "القاهرة", pct: 82, color: "#7C3AED" },
    { label: "الإسكندرية", pct: 67, color: "#8B5CF6" },
    { label: "الجيزة", pct: 90, color: "#A78BFA" },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#F8F7FF" }}>

      {/* ── Top Bar (Mobile) ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#EDE9FE] md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#A78BFA] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                monitoring
              </span>
            </div>
            <div>
              <h1 className="font-bold text-[15px] text-[#7C3AED] tracking-tight leading-none" style={{ fontFamily: "'Cairo', sans-serif" }}>
                Branch Tracker
              </h1>
              <p className="text-[10px] text-[#9CA3AF] leading-none mt-0.5">
                {format(now, "EEE d MMM", { locale: ar })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-[#6B7280] hover:text-[#7C3AED] hover:bg-[#EDE9FE] rounded-xl transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 pt-6 max-w-7xl mx-auto space-y-5">

        {/* ── Greeting ──────────────────────────────────────────────────────── */}
        <div className="hidden md:block">
          <h2 className="text-2xl font-bold text-[#111827]" style={{ fontFamily: "'Cairo', sans-serif" }}>
            مرحباً، الأدمن! 👋
          </h2>
          <p className="text-[#6B7280] text-sm mt-1">{format(now, "EEEE، d MMMM yyyy", { locale: ar })}</p>
        </div>

        {/* ── KPI Cards (زي صورة 1 — الـ balance cards) ────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* الفروع */}
          <div
            className="bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg hover:shadow-[#A78BFA]/30 transition-all duration-200 col-span-2 md:col-span-1"
            onClick={() => navigate("/branches")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_city</span>
              </div>
              <Sparkline points={[8, 10, 9, 12, 11, totalBranches, totalBranches]} color="rgba(255,255,255,0.7)" />
            </div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">الفروع</p>
            <p className="font-bold text-4xl leading-none font-mono">
              {isLoading ? "—" : totalBranches}
            </p>
            <p className="text-white/60 text-xs mt-2">إجمالي الفروع المسجلة</p>
          </div>

          {/* المديرين */}
          <div
            className="bg-white rounded-2xl p-5 border border-[#EDE9FE] cursor-pointer hover:border-[#A78BFA] hover:shadow-md transition-all duration-200"
            onClick={() => navigate("/managers")}
          >
            <div className="w-9 h-9 bg-[#EDE9FE] rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#7C3AED] text-[20px]">manage_accounts</span>
            </div>
            <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest mb-1">المديرين</p>
            <p className="font-bold text-3xl text-[#111827] leading-none font-mono">
              {isLoading ? "—" : totalManagers}
            </p>
            <p className="text-[#9CA3AF] text-xs mt-2">نشط الآن</p>
          </div>

          {/* زيارات اليوم */}
          <div
            className="bg-white rounded-2xl p-5 border border-[#D1FAE5] cursor-pointer hover:border-[#6EE7B7] hover:shadow-md transition-all duration-200"
            onClick={() => navigate("/reports")}
          >
            <div className="w-9 h-9 bg-[#ECFDF5] rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#059669] text-[20px]">task_alt</span>
            </div>
            <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest mb-1">زيارات اليوم</p>
            <p className="font-bold text-3xl text-[#111827] leading-none font-mono">
              {isLoading ? "—" : todayVisits}
            </p>
            <div className="mt-3 h-1.5 bg-[#D1FAE5] rounded-full overflow-hidden">
              <div className="h-full bg-[#059669] rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
          </div>

          {/* معدل الإنجاز */}
          <div className="bg-white rounded-2xl p-5 border border-[#EDE9FE] flex flex-col items-center justify-center">
            <p className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest mb-3 self-start">معدل الإنجاز</p>
            <DonutChart value={completionRate} max={100} color="#7C3AED" />
            <p className="text-[#9CA3AF] text-xs mt-2">% من الهدف اليومي</p>
          </div>
        </section>

        {/* ── Chart + Quick Actions ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Area Chart */}
          <div className="bg-white rounded-2xl p-5 border border-[#EDE9FE] md:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#111827] text-base" style={{ fontFamily: "'Cairo', sans-serif" }}>تردد الزيارات</h2>
                <p className="text-[#9CA3AF] text-xs mt-0.5">خلال الأسبوع الحالي</p>
              </div>
              <div className="flex bg-[#F3F4F6] rounded-xl p-1 gap-0.5">
                {(["week", "month", "year"] as const).map(t => (
                  <button key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === t ? "bg-white text-[#7C3AED] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"
                    }`}>
                    {t === "week" ? "أسبوع" : t === "month" ? "شهر" : "سنة"}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative h-[150px] w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="areaLilac" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 37, 75, 112, 150].map(y => (
                  <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#F3F4F6" strokeWidth="1" />
                ))}
                {/* Lilac line */}
                <path d="M0,110 C100,100 150,130 233,90 S350,50 467,80 S600,60 700,70 L700,150 L0,150 Z" fill="url(#areaLilac)" />
                <path d="M0,110 C100,100 150,130 233,90 S350,50 467,80 S600,60 700,70" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
                {/* Purple main line */}
                <path d="M0,90 C80,70 160,40 233,60 S350,120 467,70 S580,20 700,35 L700,150 L0,150 Z" fill="url(#areaPurple)" />
                <path d="M0,90 C80,70 160,40 233,60 S350,120 467,70 S580,20 700,35" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="580" cy="20" r="5" fill="#7C3AED" />
                <circle cx="580" cy="20" r="9" fill="#7C3AED" opacity="0.2" />
              </svg>
            </div>

            <div className="flex justify-between mt-3 px-1">
              {days.map((d, i) => (
                <span key={i} className={`text-[11px] font-mono ${i === 5 ? "text-[#7C3AED] font-bold" : "text-[#9CA3AF]"}`}>{d}</span>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> إقليمي
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" /> المقر الرئيسي
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            {[
              { icon: "map", label: "الخريطة المباشرة", sub: "تتبع فوري للمديرين", path: "/live-map", color: "#7C3AED", bg: "#EDE9FE" },
              { icon: "assignment", label: "التقارير", sub: "تحليلات شاملة وتصدير", path: "/reports", color: "#059669", bg: "#ECFDF5" },
              { icon: "group", label: "المستخدمون", sub: "إدارة الصلاحيات", path: "/users", color: "#D97706", bg: "#FEF3C7" },
            ].map(({ icon, label, sub, path, color, bg }) => (
              <button key={path}
                onClick={() => navigate(path)}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 text-right border border-[#F3F4F6] hover:border-[#EDE9FE] hover:shadow-md transition-all duration-200 cursor-pointer w-full group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform" style={{ color, fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-[#111827]" style={{ fontFamily: "'Cairo', sans-serif" }}>{label}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-[#D1D5DB] group-hover:text-[#7C3AED] transition-colors flex-shrink-0">chevron_left</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recent Activity ───────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-5 border border-[#EDE9FE]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#111827] text-base" style={{ fontFamily: "'Cairo', sans-serif" }}>النشاط الأخير</h2>
            <button onClick={() => navigate("/reports")} className="text-[#7C3AED] text-xs font-bold hover:underline cursor-pointer">
              عرض الكل
            </button>
          </div>
          {recentLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
            </div>
          ) : (recentVisits as any[]).length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF] text-sm">لا توجد زيارات بعد</div>
          ) : (
            (recentVisits as any[]).map((v: any) => (
              <VisitRow
                key={v.id}
                name={v.branchName}
                time={format(new Date(v.checkInAt), "hh:mm a", { locale: ar })}
                status={v.status}
                manager={v.managerName ?? "—"}
              />
            ))
          )}
        </section>

        {/* ── Bottom Row: Week Performance + Coverage ───────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* أداء الأسبوع */}
          <div className="bg-white rounded-2xl p-5 border border-[#EDE9FE]">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm text-[#111827]" style={{ fontFamily: "'Cairo', sans-serif" }}>أداء الأسبوع</p>
              <span className="text-[#059669] font-bold text-xs bg-[#ECFDF5] px-2 py-1 rounded-full">+14%</span>
            </div>
            <p className="text-[#9CA3AF] text-xs mb-4">مقارنةً بالأسبوع الماضي</p>
            <WeekBarChart />
          </div>

          {/* نسبة التغطية */}
          <div className="bg-white rounded-2xl p-5 border border-[#EDE9FE]">
            <p className="font-bold text-sm text-[#111827] mb-1" style={{ fontFamily: "'Cairo', sans-serif" }}>نسبة التغطية</p>
            <p className="text-[#9CA3AF] text-xs mb-4">الفروع التي تمت زيارتها اليوم</p>
            <div className="space-y-3">
              {coverageData.map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#6B7280] font-medium">{label}</span>
                    <span className="font-bold font-mono" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate("/branches")}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-40 bg-gradient-to-br from-[#6D28D9] to-[#A78BFA] shadow-lg shadow-[#A78BFA]/40 hover:scale-110 active:scale-90 transition-transform duration-200 cursor-pointer"
        aria-label="إضافة فرع">
        <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>
    </div>
  );
}
