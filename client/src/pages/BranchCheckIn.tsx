import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getDistanceMeters } from "../../../shared/utils";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BranchCheckIn() {
  const { user } = useAuth();
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: assignedBranches = [], isLoading: branchesLoading } = trpc.manager.getMyBranches.useQuery();
  const { data: visitsData, refetch: refetchVisits } = trpc.visit.myHistory.useQuery({ limit: 5, offset: 0 });
  const activeVisit = visitsData?.items?.find((v: any) => v.status === "checked_in") ?? null;

  const checkInMutation = trpc.visit.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Check-In Success");
      setPhotoBase64(null);
      setNotes("");
      refetchVisits();
    },
    onError: (e) => toast.error(e.message),
  });

  const checkOutMutation = trpc.visit.checkOut.useMutation({
    onSuccess: () => { toast.success("Check-Out Success"); refetchVisits(); },
    onError: (e) => toast.error(e.message),
  });

  // GPS Watcher
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError("GPS not supported"); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setGpsLocation({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }); setGpsError(null); },
      (e) => setGpsError(`GPS Error: ${e.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Auto-select first branch
  useEffect(() => {
    if ((assignedBranches as any[]).length > 0 && !selectedBranch) {
      setSelectedBranch((assignedBranches[0] as any).id);
    }
  }, [assignedBranches, selectedBranch]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setShowCamera(true); }
    } catch { toast.error("Could not access camera"); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        setPhotoBase64(canvasRef.current.toDataURL("image/jpeg"));
        (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
        setShowCamera(false);
      }
    }
  };

  const handleCheckIn = () => {
    if (!selectedBranch || !gpsLocation) { toast.error("Select branch and enable GPS"); return; }
    checkInMutation.mutate({
      branchId: selectedBranch,
      latitude: String(gpsLocation.lat),
      longitude: String(gpsLocation.lon),
      accuracy: String(gpsLocation.accuracy),
      photoBase64: photoBase64 ?? undefined,
      notes: notes,
    });
  };

  const branch = (assignedBranches as any[]).find((b: any) => b.id === selectedBranch);
  const geofenceRadius = branch?.geofenceRadiusMeters ?? 200;
  const distance = branch && gpsLocation
    ? getDistanceMeters(gpsLocation.lat, gpsLocation.lon, parseFloat(branch.latitude), parseFloat(branch.longitude))
    : Infinity;
  const inRange = distance <= geofenceRadius;

  // SVG Progress Ring calculation — max 1000m
  const maxD = 1000;
  const clampedD = Math.min(distance === Infinity ? maxD : distance, maxD);
  const ringRadius = 110;
  const ringCircumference = ringRadius * 2 * Math.PI;
  const ringOffset = ringCircumference - (clampedD / maxD) * ringCircumference;

  if (branchesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} width="640" height="480" className="hidden" />
        <div className="absolute bottom-10 left-0 w-full flex justify-center gap-8 px-8">
          <button onClick={() => { setShowCamera(false); (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop()); }}
                  className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <button onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-on-background font-body-md antialiased bg-background min-h-screen">
      {/* Atmospheric Background Blobs — exactly as in Stitch */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]"></div>
        <div className="absolute top-[40%] right-[10%] w-[250px] h-[250px] rounded-full bg-tertiary/10 blur-[80px]"></div>
      </div>

      {/* TopAppBar — exactly as in Stitch */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-surface/40 backdrop-blur-xl shadow-[0px_0px_12px_rgba(76,215,246,0.1)] flex justify-between items-center px-margin-mobile py-base h-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex justify-center items-center font-bold text-sm bg-primary/10 text-primary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <select
            className="font-display-lg text-[20px] text-primary tracking-tighter bg-transparent border-none outline-none focus:ring-0 appearance-none p-0 cursor-pointer"
            value={selectedBranch ?? ""}
            onChange={(e) => setSelectedBranch(Number(e.target.value))}
          >
            {(assignedBranches as any[]).map(b => (
              <option key={b.id} value={b.id} className="bg-surface text-on-surface text-base font-sans">{b.name}</option>
            ))}
            {assignedBranches.length === 0 && <option value="" className="bg-surface text-on-surface text-base">No branches assigned</option>}
          </select>
        </div>
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-primary active:scale-95 duration-200 cursor-pointer bg-transparent border-none">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content Canvas — exactly as in Stitch */}
      <main className="pt-20 pb-24 px-margin-mobile min-h-screen flex flex-col items-center gap-gutter">

        {!activeVisit ? (
          <>
            {/* Live Range Indicator */}
            <div className={`w-full max-w-md glass-card rounded-xl p-4 flex items-center justify-between mt-4 border-l-4 ${inRange ? "border-tertiary neon-glow-emerald" : "border-error"}`}>
              <div className="flex flex-col">
                <span className={`font-label-caps text-label-caps tracking-widest uppercase ${inRange ? "text-tertiary-fixed" : "text-error"}`}>
                  Live Range Indicator
                </span>
                <span className="font-data-mono text-body-lg text-on-surface">
                  {distance === Infinity ? "Locating..." : `${distance.toFixed(0)}m to Geofence`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_#4edea3] ${inRange ? "bg-tertiary pulse-ring" : "bg-error"}`}></div>
                <span className={`font-headline-sm text-[20px] ${inRange ? "text-tertiary" : "text-error"}`}>
                  {inRange ? "In Range" : "Out of Range"}
                </span>
              </div>
            </div>

            {/* Central Telemetry Progress — exactly as in Stitch */}
            <div className="relative flex items-center justify-center py-12 w-full">
              <svg className="w-64 h-64 md:w-80 md:h-80 drop-shadow-[0_0_20px_rgba(76,215,246,0.2)]">
                <circle className="text-white/5" cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeWidth="8"></circle>
                <circle
                  className={`progress-ring-circle ${inRange ? "text-tertiary" : "text-primary"}`}
                  cx="128" cy="128" fill="transparent" r="110" stroke="currentColor"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round" strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant opacity-70 mb-1">DISTANCE TO BRANCH</span>
                <div className="flex items-baseline gap-1">
                  <span className={`font-data-mono text-[40px] md:text-[48px] font-bold ${inRange ? "text-tertiary" : "text-primary"}`}>
                    {distance === Infinity ? "--" : distance < 1000 ? distance.toFixed(0) : (distance / 1000).toFixed(2)}
                  </span>
                  <span className={`font-label-caps text-[12px] ${inRange ? "text-tertiary" : "text-primary"}`}>
                    {distance === Infinity ? "" : distance < 1000 ? "M" : "KM"}
                  </span>
                </div>
                <div className="mt-4 flex flex-col">
                  <span className="font-headline-sm text-[20px] text-on-surface">{branch?.name ?? "No Branch"}</span>
                  <span className="font-body-md text-on-surface-variant text-sm">{branch?.address ?? "---"}</span>
                </div>
              </div>
            </div>

            {/* Action Cards — exactly as in Stitch */}
            <div className="w-full max-w-md flex flex-col gap-4">

              {/* Notes */}
              <div className="glass-card rounded-2xl p-container-padding flex flex-col border-white/5 focus-within:border-primary/40 transition-all">
                <label className="font-label-caps text-[10px] text-on-surface-variant/70 mb-2">VISIT NOTES</label>
                <textarea
                  className="bg-transparent border-none p-0 focus:ring-0 text-body-md text-on-surface placeholder:text-on-surface-variant/40 resize-none h-14 outline-none w-full"
                  placeholder="Enter visit notes (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Step 1: Camera Upload — exactly as in Stitch */}
              <div onClick={startCamera} className="glass-card rounded-2xl p-container-padding flex items-center justify-between border-white/5 group hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden">
                {photoBase64 && <img src={photoBase64} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Captured" />}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {photoBase64 ? "check_circle" : "photo_camera"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-[18px] text-on-surface">{photoBase64 ? "Photo Captured" : "Camera Upload"}</span>
                    <span className="font-body-md text-sm text-on-surface-variant">Capture storefront verification</span>
                  </div>
                </div>
                <div className="text-on-surface-variant opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all relative z-10">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>

              {/* Step 2: Submit Visit — exactly as in Stitch */}
              <button
                onClick={handleCheckIn}
                disabled={!inRange || checkInMutation.isPending}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(6,182,212,0.3)] active:scale-95 transition-all group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {checkInMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (
                  <>
                    <span className="font-headline-sm text-[20px] text-white relative z-10">تأكيد الزيارة</span>
                    <span className="material-symbols-outlined text-white relative z-10">check_circle</span>
                  </>
                )}
              </button>

              {/* Visit Details Readout — always shown, as in Stitch */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60">CHECK-IN TIME</span>
                  <span className="font-data-mono text-on-surface">
                    {activeVisit ? format(new Date((activeVisit as any).checkInAt), "hh:mm:ss a") : "--:--:-- --"}
                  </span>
                </div>
                <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60">GPS PRECISION</span>
                  <span className="font-data-mono text-tertiary">
                    {gpsLocation ? `± ${gpsLocation.accuracy.toFixed(1)} M` : "-- M"}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Checked-In State */
          <div className="w-full max-w-md flex flex-col items-center pt-12">
            <div className="w-24 h-24 rounded-full bg-tertiary/20 border-2 border-tertiary flex items-center justify-center mb-6 neon-glow-emerald">
              <span className="material-symbols-outlined text-tertiary text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-display-lg text-[32px] text-on-surface tracking-tight mb-2">Visit Active</h2>
            <p className="font-body-lg text-on-surface-variant mb-8">{activeVisit.branchName}</p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60">CHECK-IN TIME</span>
                <span className="font-data-mono text-on-surface">{format(new Date(activeVisit.checkInAt), "hh:mm:ss a")}</span>
              </div>
              <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60">LOCATION STATUS</span>
                <span className="font-data-mono text-tertiary">Verified</span>
              </div>
            </div>

            <button
              onClick={() => checkOutMutation.mutate({ visitId: activeVisit.id })}
              disabled={checkOutMutation.isPending}
              className="w-full h-16 rounded-2xl bg-error/20 border border-error/50 text-error font-bold tracking-wider hover:bg-error/30 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {checkOutMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <span className="material-symbols-outlined text-[24px]">logout</span>
                  <span className="font-headline-sm text-[20px]">Check Out</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
