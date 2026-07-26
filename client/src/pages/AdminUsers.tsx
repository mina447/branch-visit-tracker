import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const emptyForm = { username: "", password: "", name: "", email: "", role: "user" as "user" | "admin" };

export default function AdminUsers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: users = [], isLoading, refetch } = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success(`تم إنشاء حساب ${form.username} ✅`);
      refetch(); setCreateOpen(false); setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.username) { toast.error("اسم المستخدم مطلوب"); return; }
    if (form.password.length < 6) { toast.error("كلمة السر 6 أحرف على الأقل"); return; }
    createMutation.mutate({ username: form.username, password: form.password, name: form.name || undefined, email: form.email || undefined, role: form.role });
  };

  const admins   = (users as any[]).filter(u => u.role === "admin");
  const managers = (users as any[]).filter(u => u.role === "user");

  return (
    <div className="page-enter min-h-screen pb-24 md:pb-8">

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-2xl md:hidden" style={{ background: "rgba(2,6,23,0.9)" }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#a78bfa] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <h1 className="font-bold text-[15px] text-[#e2e8f0]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>المستخدمين</h1>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-ghost w-9 h-9 flex items-center justify-center text-[#a78bfa]">
            <span className="material-symbols-outlined text-[24px]">person_add</span>
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 pt-5 md:pt-8 max-w-7xl mx-auto space-y-5">

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e2e8f0]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>إدارة المستخدمين</h1>
            <p className="text-[#64748b] text-sm mt-1">إنشاء وإدارة حسابات الدخول</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-primary h-10 px-5 flex items-center gap-2 rounded-xl text-sm font-semibold cursor-pointer transition-transform hover:scale-105">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            مستخدم جديد
          </button>
        </div>

        {/* Stats */}
        <div className="stagger grid grid-cols-3 gap-3">
          {[
            { label: "الإجمالي", value: isLoading ? "—" : (users as any[]).length, color: "#00d4ff", icon: "group" },
            { label: "مديرو النظام", value: isLoading ? "—" : admins.length, color: "#a78bfa", icon: "shield" },
            { label: "مديرو الفروع", value: isLoading ? "—" : managers.length, color: "#34d399", icon: "manage_accounts" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="stat-card text-center">
              <div className="icon-box mx-auto mb-2" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color }}>{icon}</span>
              </div>
              <p className="text-[#4a5568] text-[10px] uppercase tracking-widest font-bold mb-1">{label}</p>
              <p className="font-bold text-2xl font-mono" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Users List */}
        <section className="bento-card p-1 md:p-5">
          <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-white/[0.04] mb-2">
            <h2 className="font-semibold text-[#e2e8f0] text-sm">كل الحسابات</h2>
            <span className="text-[#4a5568] text-xs font-mono">{(users as any[]).length} حساب</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#00d4ff]" />
            </div>
          ) : (users as any[]).length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#4a5568] text-[32px]">person_off</span>
              </div>
              <p className="text-[#64748b] text-sm">لا توجد حسابات مسجلة</p>
            </div>
          ) : (
            <div className="space-y-1 p-2 md:p-0 stagger">
              {(users as any[]).map((u: any) => {
                const isAdmin = u.role === "admin";
                const color = isAdmin ? "#a78bfa" : "#34d399";
                return (
                  <div key={u.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                           style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
                        {(u.name ?? u.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-[#e2e8f0]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                            {u.name ?? u.username}
                          </span>
                          <span className="text-[10px] font-mono text-[#4a5568] bg-white/5 border border-white/[0.06] px-2 py-0.5 rounded-full">
                            @{u.username}
                          </span>
                          <span className="badge text-[9px] px-2 py-0.5" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                            {isAdmin ? "أدمن" : "مدير فرع"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {u.email && <span className="text-[#4a5568] text-xs">{u.email}</span>}
                          {u.lastSignedIn && (
                            <span className="text-[#4a5568] text-xs font-mono">
                              آخر دخول: {format(new Date(u.lastSignedIn), "dd MMM yyyy", { locale: ar })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Role indicator dot */}
                    <div className="w-2 h-2 rounded-full self-end md:self-auto flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0b1326] border border-white/[0.1] text-[#e2e8f0] p-0 overflow-hidden sm:rounded-2xl max-w-lg">
          <DialogHeader className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
            <DialogTitle className="text-base font-semibold" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              إنشاء حساب جديد
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-[#4a5568] text-[10px] uppercase tracking-widest font-bold mb-2">الدور</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: "user", label: "مدير فرع", icon: "manage_accounts", color: "#34d399" },
                  { role: "admin", label: "أدمن نظام", icon: "shield", color: "#a78bfa" },
                ].map(({ role, label, icon, color }) => (
                  <button key={role} onClick={() => setForm(f => ({ ...f, role: role as "user" | "admin" }))}
                    className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all"
                    style={{
                      background: form.role === role ? `${color}15` : "transparent",
                      borderColor: form.role === role ? `${color}50` : "rgba(255,255,255,0.06)",
                      color: form.role === role ? color : "#4a5568",
                    }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: form.role === role ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                    <span className="font-semibold text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "username", label: "اسم المستخدم *", placeholder: "ahmed.ali", type: "text" },
                { key: "name", label: "الاسم الكامل", placeholder: "أحمد علي", type: "text" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[#4a5568] text-[10px] uppercase tracking-widest font-bold mb-1.5">{label}</label>
                  <input type={type} className="input-field w-full h-10 px-3 text-sm" placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: key === "username" ? e.target.value.toLowerCase().replace(/\s/g, ".") : e.target.value }))}
                    style={{ fontFamily: "'Fira Sans', 'Cairo', sans-serif" }} />
                </div>
              ))}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#4a5568] text-[10px] uppercase tracking-widest font-bold mb-1.5">كلمة السر *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="input-field w-full h-10 px-3 pr-10 text-sm" placeholder="6 أحرف على الأقل"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#94a3b8]">
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#4a5568] text-[10px] uppercase tracking-widest font-bold mb-1.5">البريد الإلكتروني (اختياري)</label>
              <input type="email" className="input-field w-full h-10 px-3 text-sm" placeholder="ahmed@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            {form.role === "user" && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#00d4ff]/5 border border-[#00d4ff]/15">
                <span className="material-symbols-outlined text-[#00d4ff] text-[16px] mt-0.5 flex-shrink-0">info</span>
                <p className="text-[#64748b] text-xs leading-relaxed">
                  بعد إنشاء الحساب، روح لصفحة <strong className="text-[#00d4ff]">المديرين</strong> عشان تضيف بروفايل المدير وتخصصله فروع.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <button onClick={() => setCreateOpen(false)} className="btn-ghost px-4 py-2 text-sm font-semibold rounded-xl">إلغاء</button>
            <button onClick={handleSave} disabled={createMutation.isPending} className="btn-primary px-5 py-2 text-sm font-semibold flex items-center gap-2 rounded-xl">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء الحساب
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
