/**
 * useGeofence — Background Geolocation + Software Geofencing Hook
 *
 * Uses @capacitor-community/background-geolocation which runs an Android
 * Foreground Service (persistent notification) to keep tracking even when
 * the app is in the background or the screen is off.
 *
 * Geofencing is implemented in software by comparing the current position
 * against each assigned branch's coordinates using the Haversine formula.
 *
 * Flow:
 *  1. On mount: fetch assigned branches.
 *  2. Start background watcher (native Foreground Service on Android).
 *  3. On each position update → check distance against all branches.
 *  4. If inside a branch radius and not checked-in → auto check-in.
 *  5. If outside active branch radius and checked-in → auto check-out.
 *  6. All location updates are queued in localforage when offline and synced on reconnect.
 */

import { useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import localforage from "localforage";
import { getDistanceMeters } from "../../../shared/utils";

// ─── Offline store ────────────────────────────────────────────────────────────
const locationStore = localforage.createInstance({
  name: "branch-tracker",
  storeName: "offline_locations",
});

interface OfflineLocation {
  latitude: string;
  longitude: string;
  accuracy?: string;
  timestamp: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGeofence() {
  const { data: branches = [] } = trpc.manager.getMyBranches.useQuery();
  const { data: historyData, refetch: refetchHistory, isLoading: historyLoading } =
    trpc.visit.myHistory.useQuery({ limit: 1, offset: 0 });

  const checkInMutation = trpc.visit.checkIn.useMutation();
  const checkOutMutation = trpc.visit.checkOut.useMutation();
  const syncOfflineMutation = trpc.visit.syncOfflineData.useMutation();

  const activeVisit = historyData?.items[0]?.status === "checked_in"
    ? historyData.items[0]
    : null;

  // Keep refs fresh for use inside callbacks (avoid stale closures)
  const activeVisitRef = useRef(activeVisit);
  activeVisitRef.current = activeVisit;

  const branchesRef = useRef(branches);
  branchesRef.current = branches;

  const historyLoadingRef = useRef(historyLoading);
  historyLoadingRef.current = historyLoading;

  const refetchHistoryRef = useRef(refetchHistory);
  refetchHistoryRef.current = refetchHistory;

  // Ref to hold the background watcher ID so cleanup can remove it
  const watcherIdRef = useRef<string | null>(null);

  // ── Sync offline queue to server ─────────────────────────────────────────
  const syncOfflineData = useCallback(async () => {
    try {
      const pending: OfflineLocation[] = (await locationStore.getItem("queue")) || [];
      if (pending.length > 0) {
        const res = await syncOfflineMutation.mutateAsync({ locations: pending });
        if (res.success) {
          await locationStore.setItem("queue", []);
        }
      }
    } catch {
      // silently fail — will retry next time
    }
  }, [syncOfflineMutation]);

  // Periodic sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(syncOfflineData, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [syncOfflineData]);

  // ── Handle a position update (shared between native & web paths) ──────────
  const handlePositionUpdate = useCallback(async (
    currentLat: number,
    currentLng: number,
    accuracy?: number,
  ) => {
    if (historyLoadingRef.current) return;

    // 1. Save to offline queue
    const pending: OfflineLocation[] = (await locationStore.getItem("queue")) || [];
    pending.push({
      latitude: currentLat.toString(),
      longitude: currentLng.toString(),
      accuracy: accuracy?.toString(),
      timestamp: new Date().toISOString(),
    });
    await locationStore.setItem("queue", pending);

    // Fire-and-forget sync attempt
    syncOfflineData();

    const currentActiveVisit = activeVisitRef.current;
    const currentBranches = branchesRef.current;

    // 2. Auto check-out if outside active branch radius
    if (currentActiveVisit) {
      const activeBranch = currentBranches.find(
        (b) => b.id === currentActiveVisit.branchId
      );
      if (activeBranch?.latitude && activeBranch?.longitude) {
        const dist = getDistanceMeters(
          currentLat, currentLng,
          parseFloat(activeBranch.latitude),
          parseFloat(activeBranch.longitude)
        );
        // Add 50m GPS tolerance before triggering check-out
        if (dist > (activeBranch.geofenceRadiusMeters || 200) + 50) {
          try {
            await checkOutMutation.mutateAsync({ visitId: currentActiveVisit.id });
            toast.info(`🔴 تسجيل خروج تلقائي من ${activeBranch.name}`);
            refetchHistoryRef.current();
          } catch (err: any) {
            // Only suppress "already checked out" duplicates — anything else must surface
            const msg: string = err?.message ?? "";
            const isDuplicate =
              msg.includes("already") ||
              msg.includes("checked_out") ||
              msg.includes("not found");
            if (!isDuplicate) {
              console.error("[Geofence] Auto check-out failed:", err);
              toast.error(`تعذّر تسجيل الخروج التلقائي من ${activeBranch.name} — يرجى الخروج يدوياً`);
            }
          }
        }
      }
      return; // Don't check for check-in while already checked in
    }

    // 3. Auto check-in if inside any assigned branch radius
    for (const branch of currentBranches) {
      if (!branch.latitude || !branch.longitude) continue;
      const dist = getDistanceMeters(
        currentLat, currentLng,
        parseFloat(branch.latitude),
        parseFloat(branch.longitude)
      );
      if (dist <= (branch.geofenceRadiusMeters || 200)) {
        try {
          await checkInMutation.mutateAsync({
            branchId: branch.id,
            latitude: currentLat.toString(),
            longitude: currentLng.toString(),
          });
          toast.success(`✅ تسجيل دخول تلقائي في ${branch.name}`);
          refetchHistoryRef.current();
          break; // Only check into one branch at a time
        } catch (err: any) {
          // Suppress "already checked in" — that's expected; surface other failures
          const msg: string = err?.message ?? "";
          const isAlreadyIn =
            msg.includes("Already checked") ||
            msg.includes("checked_in");
          if (!isAlreadyIn) {
            console.error("[Geofence] Auto check-in failed:", err);
            toast.error(`تعذّر تسجيل الدخول التلقائي في ${branch.name}`);
          }
        }
      }
    }
  }, [syncOfflineData, checkInMutation, checkOutMutation]);

  // ── Setup geolocation watcher (native or web) ─────────────────────────────
  useEffect(() => {
    if (branches.length === 0) return; // Wait until branches are loaded

    let cleanupFn: (() => void) | null = null;

    const setup = async () => {
      if (Capacitor.isNativePlatform()) {
        // ─────────────────────────────────────────────────────────────────────
        // NATIVE PATH: @capacitor-community/background-geolocation
        // Runs an Android Foreground Service with a persistent notification.
        // Continues tracking when screen is off or app is backgrounded.
        // ─────────────────────────────────────────────────────────────────────
        try {
          // @capacitor-community/background-geolocation has no JS exports
          const core = await import("@capacitor/core");
          const BackgroundGeolocation = core.registerPlugin("BackgroundGeolocation");

          const id = await BackgroundGeolocation.addWatcher(
            {
              // Notification shown in the Android status bar while tracking
              backgroundTitle: "تتبع الزيارات نشط",
              backgroundMessage: "يتم تتبع موقعك لضمان دقة الزيارات الميدانية.",
              // Request permissions from the user if not already granted
              requestPermissions: true,
              // Don't return stale (cached) positions
              stale: false,
              // Only fire callback if moved at least 20 meters (saves battery)
              distanceFilter: 20,
            },
            async (location: any, error: any) => {
              if (error) {
                if (error.code === "NOT_AUTHORIZED") {
                  // User denied background location — guide them to settings
                  toast.error(
                    "يرجى السماح بالوصول للموقع دائماً من الإعدادات",
                    {
                      action: {
                        label: "الإعدادات",
                        onClick: () => BackgroundGeolocation.openSettings(),
                      },
                    }
                  );
                }
                console.warn("[Geofence] Location error:", error);
                return;
              }
              if (location) {
                await handlePositionUpdate(
                  location.latitude,
                  location.longitude,
                  location.accuracy
                );
              }
            }
          );

          // Store watcher ID for cleanup
          watcherIdRef.current = id;

          cleanupFn = async () => {
            if (watcherIdRef.current) {
              await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
              watcherIdRef.current = null;
            }
          };

        } catch (err) {
          console.error("[Geofence] Native setup error:", err);
        }

      } else {
        // ─────────────────────────────────────────────────────────────────────
        // WEB PATH: Standard HTML5 Geolocation API (foreground only)
        // ─────────────────────────────────────────────────────────────────────
        const { Geolocation } = await import("@capacitor/geolocation");

        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== "granted") {
          const req = await Geolocation.requestPermissions();
          if (req.location !== "granted") {
            console.warn("[Geofence] Web location permission denied");
            return;
          }
        }

        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
          (pos, err) => {
            if (!err && pos) {
              handlePositionUpdate(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy
              );
            }
          }
        );

        cleanupFn = () => Geolocation.clearWatch({ id: watchId });
      }
    };

    setup();

    // Sync offline queue whenever app comes back to foreground
    const listenerPromise = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) syncOfflineData();
    });

    return () => {
      if (typeof cleanupFn === "function") {
        cleanupFn();
      }
      listenerPromise.then((l) => l.remove());
    };
  }, [branches, handlePositionUpdate, syncOfflineData, checkInMutation, checkOutMutation]);
}
