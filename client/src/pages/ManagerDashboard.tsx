import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { data: branches = [] } = trpc.manager.getMyBranches.useQuery();
  const { data: visitsData, isLoading: visitsLoading } = trpc.visit.myHistory.useQuery({ limit: 100, offset: 0 });

  const visits = visitsData?.items ?? [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayVisits = (visits as any[]).filter((v: any) => new Date(v.checkInAt) >= today).length;
  const activeVisits = (visits as any[]).filter((v: any) => v.status === "checked_in");

  return (
    <div className="font-body-md text-on-surface bg-background min-h-screen">
      {/* Atmospheric Background Blobs — exactly as in Stitch */}
      <div className="bg-blob bg-primary" style={{ top: "-100px", left: "-100px" }}></div>
      <div className="bg-blob bg-secondary-container" style={{ bottom: "-100px", right: "-100px" }}></div>
      <div className="bg-blob bg-tertiary-container" style={{ top: "50%", left: "33%", opacity: 0.05 }}></div>

      {/* Top App Bar — exactly as in Stitch */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-surface/40 backdrop-blur-xl shadow-[0px_0px_12px_rgba(76,215,246,0.1)]">
        <div className="flex justify-between items-center px-margin-mobile py-4 md:px-margin-desktop">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center overflow-hidden bg-primary/10 text-primary font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-display-lg text-[20px] md:text-headline-sm text-primary tracking-tighter">
              Branch Tracker
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-primary hover:bg-white/5 p-2 rounded-full transition-colors cursor-pointer bg-transparent border-none">
              notifications
            </button>
            <button className="hidden md:block material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-full transition-colors cursor-pointer bg-transparent border-none">
              settings
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto space-y-8">

        {/* Top Section: Status Cards (Horizontal Scroll) — exactly as in Stitch */}
        <section>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">

            {/* Active Visits — with neon border as in Stitch */}
            <div className="min-w-[280px] flex-shrink-0 neon-border-primary glass-pane p-container-padding rounded-2xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                </div>
                <span className="font-data-mono text-primary text-label-caps bg-primary/20 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="space-y-1">
                <p className="text-on-surface-variant font-label-caps uppercase">Active Visits</p>
                <h3 className="font-headline-md text-primary">{activeVisits.length}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-tertiary">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="font-data-mono text-[12px]">+12% from avg</span>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-[100px]">sensors</span>
              </div>
            </div>

            {/* Completed Today */}
            <div className="min-w-[280px] flex-shrink-0 glass-pane p-container-padding rounded-2xl group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-tertiary/10 rounded-lg">
                  <span className="material-symbols-outlined text-tertiary">task_alt</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-on-surface-variant font-label-caps uppercase">Completed Today</p>
                <h3 className="font-headline-md text-on-surface">{todayVisits}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
                <span className="font-data-mono text-[12px]">Target: {Math.max(branches.length * 2, 10)}</span>
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: todayVisits > 0 ? `${Math.min((todayVisits / Math.max(branches.length * 2, 10)) * 100, 100)}%` : "0%" }}></div>
                </div>
              </div>
            </div>

            {/* Pending Approval */}
            <div className="min-w-[280px] flex-shrink-0 glass-pane p-container-padding rounded-2xl group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <span className="material-symbols-outlined text-secondary">pending_actions</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-on-surface-variant font-label-caps uppercase">Pending Approval</p>
                <h3 className="font-headline-md text-on-surface">12</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span className="font-data-mono text-[12px]">3 Critical Flags</span>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Section: Frequency Chart — exactly as in Stitch */}
        <section className="glass-pane rounded-2xl p-container-padding">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-headline-sm text-on-surface">Visit Frequency</h2>
              <p className="text-on-surface-variant text-body-md">Activity tracking over the last 7 days</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 font-label-caps text-on-surface-variant">
                <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_#4cd7f6]"></span> Regional
              </span>
              <span className="flex items-center gap-1.5 font-label-caps text-on-surface-variant">
                <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_#d0bcff]"></span> HQ
              </span>
            </div>
          </div>
          <div className="relative h-[240px] w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyanGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0"></stop>
                </linearGradient>
                <linearGradient id="purpleGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d0bcff" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#d0bcff" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line stroke="white" strokeOpacity="0.05" x1="0" x2="1000" y1="0" y2="0"></line>
              <line stroke="white" strokeOpacity="0.05" x1="0" x2="1000" y1="100" y2="100"></line>
              <line stroke="white" strokeOpacity="0.05" x1="0" x2="1000" y1="200" y2="200"></line>
              <line stroke="white" strokeOpacity="0.05" x1="0" x2="1000" y1="300" y2="300"></line>
              {/* Purple Path */}
              <path d="M0,220 C100,210 200,280 300,240 S400,100 500,150 S600,120 700,180 S800,200 900,160 S1000,140 1000,140" fill="none" stroke="#d0bcff" strokeLinecap="round" strokeWidth="3"></path>
              <path d="M0,220 C100,210 200,280 300,240 S400,100 500,150 S600,120 700,180 S800,200 900,160 S1000,140 1000,140 L1000,300 L0,300 Z" fill="url(#purpleGrad)"></path>
              {/* Cyan Path */}
              <path className="drop-shadow-[0_0_10px_rgba(76,215,246,0.5)]" d="M0,150 C100,140 200,100 300,120 S400,250 500,200 S600,80 700,100 S800,50 900,80 S1000,60 1000,60" fill="none" stroke="#4cd7f6" strokeLinecap="round" strokeWidth="3"></path>
              <path d="M0,150 C100,140 200,100 300,120 S400,250 500,200 S600,80 700,100 S800,50 900,80 S1000,60 1000,60 L1000,300 L0,300 Z" fill="url(#cyanGrad)"></path>
            </svg>
            {/* X-Axis Labels */}
            <div className="flex justify-between mt-4 px-2">
              <span className="font-data-mono text-[11px] text-on-surface-variant">MON</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant">TUE</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant">WED</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant">THU</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant">FRI</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant">SAT</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant text-primary">SUN</span>
            </div>
          </div>
        </section>

        {/* Bottom Section: Recent Visits List — exactly as in Stitch */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-on-surface">Recent Activity</h2>
            <button className="text-primary font-label-caps hover:underline cursor-pointer bg-transparent border-none">VIEW ALL</button>
          </div>

          <div className="space-y-2">
            {visitsLoading && <p className="text-center text-on-surface-variant py-8 font-body-md">Loading...</p>}
            {!visitsLoading && visits.length === 0 && (
              <p className="text-center text-on-surface-variant py-8 font-body-md">No recent visits</p>
            )}

            {(visits as any[]).slice(0, 5).map((visit: any) => (
              <div key={visit.id} className={`glass-pane p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all ${visit.status === "checked_in" ? "border-l-2 border-l-primary" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        {visit.status === "checked_in" ? "location_on" : "store"}
                      </span>
                    </div>
                    {visit.status === "checked_in" && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center">
                        <span className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_#4cd7f6]"></span>
                        <span className="absolute w-3 h-3 bg-primary rounded-full animate-ping opacity-75"></span>
                      </div>
                    )}
                    {visit.status !== "checked_in" && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full border-2 border-surface shadow-[0_0_8px_#4edea3]"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-body-lg text-on-surface leading-tight">{visit.branchName}</h4>
                    <p className="text-on-surface-variant font-data-mono text-[12px]">Assigned to: {user?.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`font-data-mono ${visit.status === "checked_in" ? "text-primary" : "text-on-surface"}`}>
                    {visit.status === "checked_in" ? "In Progress" : format(new Date(visit.checkInAt), "hh:mm a")}
                  </span>
                  <span className={`text-[12px] px-2 py-0.5 rounded border font-label-caps ${
                    visit.status === "checked_in"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-tertiary/10 text-tertiary border-tertiary/20"
                  }`}>
                    {visit.status === "checked_in" ? "ACTIVE" : "COMPLETED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FAB — exactly as in Stitch */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center active:scale-95 transition-transform z-40 cursor-pointer hover:scale-105 border-none">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
}
