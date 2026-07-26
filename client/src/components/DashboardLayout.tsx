import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";

const adminMenuItems = [
  { icon: "home", label: "الرئيسية", path: "/" },
  { icon: "location_city", label: "الفروع", path: "/branches" },
  { icon: "map", label: "الخريطة", path: "/live-map" },
  { icon: "manage_accounts", label: "المديرين", path: "/managers" },
  { icon: "person", label: "المستخدمين", path: "/users" },
  { icon: "assignment", label: "التقارير", path: "/reports" },
];

const managerMenuItems = [
  { icon: "home", label: "الرئيسية", path: "/" },
  { icon: "location_on", label: "حضور", path: "/check-in" },
  { icon: "history", label: "السجل", path: "/history" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin ? adminMenuItems : managerMenuItems;

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: "#F8F7FF" }} dir="rtl">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-l border-[#EDE9FE] z-40 bg-white">

        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#EDE9FE]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#A78BFA]/30">
            <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              monitoring
            </span>
          </div>
          <div>
            <h1 className="font-bold text-[16px] text-[#7C3AED] tracking-tight leading-none" style={{ fontFamily: "'Cairo', sans-serif" }}>
              Branch Tracker
            </h1>
            <p className="text-[10px] text-[#9CA3AF] leading-none mt-1 uppercase tracking-widest font-semibold">
              {isAdmin ? "Admin Portal" : "Manager Portal"}
            </p>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F7FF] border border-[#EDE9FE]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#A78BFA]/30 flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#111827] truncate" style={{ fontFamily: "'Cairo', sans-serif" }}>
                {user?.name ?? "المستخدم"}
              </p>
              <p className="text-[10px] text-[#9CA3AF] truncate font-mono">{user?.username ?? "user"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] text-[#9CA3AF] uppercase tracking-widest font-bold mb-3">القائمة الرئيسية</p>
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? "bg-[#EDE9FE] text-[#7C3AED]"
                    : "text-[#6B7280] hover:bg-[#F8F7FF] hover:text-[#7C3AED]"
                }`} style={{ fontFamily: "'Cairo', sans-serif" }}>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-150 group-hover:scale-110 ${isActive ? "text-[#7C3AED]" : "text-[#9CA3AF] group-hover:text-[#7C3AED]"}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#EDE9FE]">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            style={{ fontFamily: "'Cairo', sans-serif" }}>
            <span className="material-symbols-outlined text-[20px]">logout</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* ── Mobile Bottom Nav (Admin) ─────────────────────────────────────────── */}
      {isAdmin ? (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-[#EDE9FE]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex justify-around items-center h-16 px-2">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <a className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    isActive ? "text-[#7C3AED]" : "text-[#9CA3AF] hover:text-[#7C3AED]"
                  }`}>
                    <span className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                      {item.icon}
                    </span>
                    <span className="text-[9px] font-bold tracking-wider uppercase" style={{ fontFamily: "'Cairo', sans-serif" }}>
                      {item.label}
                    </span>
                    {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#7C3AED]" />}
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : (
        /* ── Mobile Bottom Nav (Manager) — pill style ──────────────────────── */
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] rounded-full bg-white border border-[#EDE9FE] shadow-xl shadow-[#A78BFA]/20 px-6 flex justify-around items-center h-18 z-50" style={{ height: "64px" }}>
          <Link href="/">
            <a className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              location === "/" ? "text-[#7C3AED]" : "text-[#9CA3AF] hover:text-[#7C3AED]"
            }`}>
              <span className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: location === "/" ? "'FILL' 1" : "'FILL' 0" }}>home</span>
              <span className="text-[9px] font-bold">الرئيسية</span>
            </a>
          </Link>

          <Link href="/check-in">
            <a className="relative -top-5 flex flex-col items-center">
              <button className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-[#6D28D9] to-[#A78BFA] shadow-lg shadow-[#A78BFA]/40 active:scale-95 transition-transform duration-200">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              </button>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#7C3AED] whitespace-nowrap">حضور</span>
            </a>
          </Link>

          <Link href="/history">
            <a className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              location === "/history" ? "text-[#7C3AED]" : "text-[#9CA3AF] hover:text-[#7C3AED]"
            }`}>
              <span className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: location === "/history" ? "'FILL' 1" : "'FILL' 0" }}>history</span>
              <span className="text-[9px] font-bold">السجل</span>
            </a>
          </Link>
        </nav>
      )}
    </div>
  );
}
