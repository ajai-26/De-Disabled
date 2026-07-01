import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenText,
  Camera,
  CameraOff,
  CheckCircle2,
  Gauge,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useHeadCursor } from "@/hooks/useHeadCursor";

type Candidate = { id: number; name: string; party: string; slogan: string };

const candidates: Candidate[] = [
  { id: 1, name: "Aarav Mehta", party: "People First", slogan: "Access for all." },
  { id: 2, name: "Diya Nair", party: "Unity Alliance", slogan: "Security. Inclusion. Progress." },
  { id: 3, name: "Kabir Singh", party: "Future Forward", slogan: "Tech-enabled democracy." },
];

type HoverTarget =
  | { kind: "candidate"; id: number }
  | { kind: "confirm" }
  | { kind: "confirmYes" }
  | { kind: "confirmNo" }
  | { kind: "none" };

type TargetInfo = {
  kind: "candidate" | "confirm" | "confirmYes" | "confirmNo";
  id?: number;
  x: number;
  y: number;
  rect: DOMRect;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const Vote = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const targetCentersRef = useRef<TargetInfo[]>([]);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [invertX, setInvertX] = useState(true);
  const [invertY, setInvertY] = useState(false);
  const [sensitivity, setSensitivity] = useState(65);
  const [smoothing, setSmoothing] = useState(0.85);

  const [hover, setHover] = useState<HoverTarget>({ kind: "none" });
  const [hoverStart, setHoverStart] = useState<number | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);

  const [confirmStep, setConfirmStep] = useState<"idle" | "review">("idle");

  const head = useHeadCursor(videoRef, cameraActive, {
    invertX,
    invertY,
    sensitivity,
    smoothing,
  });

  // --- Cursor mapping (0..100 -> px) + slight magnet assist ---
  const cursorPx = useMemo(() => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();

    const raw = {
      x: r.left + (head.cursor.x / 100) * r.width,
      y: r.top + (head.cursor.y / 100) * r.height,
    };

    const targets = targetCentersRef.current;
    if (!cameraActive || targets.length === 0 || !head.isTracking) return raw;

    const MAGNET_RADIUS = 110; // px
    const MAGNET_STRENGTH = 0.65; // 0..1

    let best: { x: number; y: number; d: number } | null = null;
    for (const t of targets) {
      const d = Math.hypot(t.x - raw.x, t.y - raw.y);
      if (!best || d < best.d) best = { x: t.x, y: t.y, d };
    }

    if (best && best.d < MAGNET_RADIUS) {
      const pull = (1 - best.d / MAGNET_RADIUS) * MAGNET_STRENGTH;
      return { x: raw.x + (best.x - raw.x) * pull, y: raw.y + (best.y - raw.y) * pull };
    }

    return raw;
  }, [head.cursor.x, head.cursor.y, cameraActive, head.isTracking]);

  // --- Camera controls ---
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e: any) {
      setCameraError(e?.message || "Could not access camera.");
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // --- Hover detection under cursor ---
  useEffect(() => {
    if (!cameraActive) {
      setHover({ kind: "none" });
      setHoverStart(null);
      return;
    }

    const HOVER_SNAP_PX = 90;
    const check = () => {
      const el = containerRef.current;
      if (!el) return;

      const within = (p: { x: number; y: number }) => {
        const r = el.getBoundingClientRect();
        return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
      };

      let next: HoverTarget = { kind: "none" };

      if (within(cursorPx)) {
        const targets = targetCentersRef.current;

        // 1) Contains-point hit-test (most reliable)
        for (const t of targets) {
          const r = t.rect;
          if (cursorPx.x >= r.left && cursorPx.x <= r.right && cursorPx.y >= r.top && cursorPx.y <= r.bottom) {
            if (t.kind === "candidate") next = { kind: "candidate", id: t.id! };
            else if (t.kind === "confirm") next = { kind: "confirm" };
            else if (t.kind === "confirmYes") next = { kind: "confirmYes" };
            else if (t.kind === "confirmNo") next = { kind: "confirmNo" };
            break;
          }
        }

        // 2) Snap-hover to nearest center within radius
        if (next.kind === "none" && targets.length) {
          let best: { t: TargetInfo; d: number } | null = null;
          for (const t of targets) {
            const d = Math.hypot(t.x - cursorPx.x, t.y - cursorPx.y);
            if (!best || d < best.d) best = { t, d };
          }
          if (best && best.d <= HOVER_SNAP_PX) {
            const t = best.t;
            if (t.kind === "candidate") next = { kind: "candidate", id: t.id! };
            else if (t.kind === "confirm") next = { kind: "confirm" };
            else if (t.kind === "confirmYes") next = { kind: "confirmYes" };
            else if (t.kind === "confirmNo") next = { kind: "confirmNo" };
          }
        }
      }

      setHover((prev) => {
        const same =
          prev.kind === next.kind &&
          (prev.kind !== "candidate" || (next.kind === "candidate" && prev.id === next.id));
        if (!same) {
          setHoverStart(performance.now());
          return next;
        }
        return prev;
      });
    };

    let raf = 0;
    const loop = () => {
      check();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraActive, cursorPx]);

  const selected = useMemo(() => candidates.find((c) => c.id === selectedCandidate) ?? null, [selectedCandidate]);

  // Cache interactive target rectangles (candidates + confirm + dialog buttons).
  useEffect(() => {
    const update = () => {
      const list: TargetInfo[] = [];

      document.querySelectorAll<HTMLElement>("[data-candidate-id]").forEach((el) => {
        const r = el.getBoundingClientRect();
        list.push({
          kind: "candidate",
          id: Number(el.dataset.candidateId),
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          rect: r,
        });
      });

      const confirm = document.querySelector<HTMLElement>("[data-confirm]");
      if (confirm) {
        const r = confirm.getBoundingClientRect();
        list.push({ kind: "confirm", x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r });
      }

      const yes = document.querySelector<HTMLElement>("[data-confirm-yes]");
      if (yes) {
        const r = yes.getBoundingClientRect();
        list.push({ kind: "confirmYes", x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r });
      }

      const no = document.querySelector<HTMLElement>("[data-confirm-no]");
      if (no) {
        const r = no.getBoundingClientRect();
        list.push({ kind: "confirmNo", x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r });
      }

      targetCentersRef.current = list;
    };

    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    const id = window.setInterval(update, 200);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(id);
    };
  }, [confirmStep]);

  const hoverStable = useMemo(() => {
    if (!hoverStart) return 0;
    return performance.now() - hoverStart;
  }, [hoverStart, hover.kind]);

  const dwellFiredRef = useRef<number | null>(null);

  // --- Dwell-to-select (no mic). Avoid repeated firing by locking to hoverStart timestamp. ---
  useEffect(() => {
    if (!cameraActive) return;

    let raf = 0;
    const loop = () => {
      if (!hoverStart || voteConfirmed) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const stableMs = performance.now() - hoverStart;

      // Only fire once per hover session.
      if (dwellFiredRef.current !== hoverStart) {
        let threshold = Infinity;

        if (confirmStep === "review") {
          if (hover.kind === "confirmYes" || hover.kind === "confirmNo") threshold = 800;
        } else {
          if (hover.kind === "candidate") threshold = 650;
          if (hover.kind === "confirm") threshold = 750;
        }

        if (stableMs >= threshold) {
          dwellFiredRef.current = hoverStart;

          // Double-check step
          if (confirmStep === "review") {
            if (hover.kind === "confirmYes") {
              setVoteConfirmed(true);
              setConfirmStep("idle");
            } else if (hover.kind === "confirmNo") {
              setConfirmStep("idle");
            }
          } else {
            if (hover.kind === "candidate") {
              setSelectedCandidate(hover.id);
            } else if (hover.kind === "confirm" && selectedCandidate != null) {
              setConfirmStep("review");
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraActive, confirmStep, hover, hoverStart, selectedCandidate, voteConfirmed]);


  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">

            <Button variant="outline" onClick={() => navigate("/reading")}>
              <BookOpenText className="mr-2 h-4 w-4" />
              Reading
            </Button>
            <Button variant="outline" onClick={() => navigate("/welfare")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Welfare Hub
            </Button>
            <Button variant="outline" onClick={() => navigate("/media")}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Media player
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[420px_1fr]">
        {/* Left: Camera + controls */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Camera feed</div>
                <div className="text-xs text-muted-foreground">Keep your face well lit and centered.</div>
              </div>
              <div className="text-xs text-muted-foreground">{cameraActive ? `FPS: ${head.fps || "…"}` : "offline"}</div>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border bg-black/20">
              <video ref={videoRef} className="h-[240px] w-full object-cover" playsInline muted />
            </div>

            {cameraError && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {cameraError}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={head.calibrate} disabled={!cameraActive || !head.rawPitchRoll}>
                <Gauge className="mr-2 h-4 w-4" />
                Calibrate
              </Button>
              <Button variant="outline" onClick={head.resetCalibration} disabled={!cameraActive}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="mt-3 rounded-xl border bg-muted/30 p-3 text-xs">
              <div className="font-medium">How to vote</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Start camera → sit ~50–70cm away → press <b>Calibrate</b>.</li>
                <li>Hover the cursor on a candidate card until it selects.</li>
                <li>Hover <b>Confirm vote</b> until the double-check appears.</li>
                <li>Hover <b>YES</b> to cast the vote, or <b>NO</b> to go back.</li>
              </ol>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Tip: If selection triggers too fast, slightly increase Head smoothing or lower sensitivity.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Precision controls
            </div>

            <div className="space-y-3 text-xs">
              <label className="block">
                <div className="mb-1 flex items-center justify-between text-muted-foreground">
                  <span>Head sensitivity</span>
                  <span className="tabular-nums">{sensitivity}</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={95}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex items-center justify-between text-muted-foreground">
                  <span>Head smoothing</span>
                  <span className="tabular-nums">{smoothing.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={0.95}
                  step={0.01}
                  value={smoothing}
                  onChange={(e) => setSmoothing(Number(e.target.value))}
                  className="w-full"
                />
              </label>

              <div className="flex items-center justify-between rounded-lg border bg-background p-2">
                <span className="text-muted-foreground">Mirror correction (X)</span>
                <button
                  onClick={() => setInvertX((v) => !v)}
                  className="rounded-md border bg-muted/40 px-2 py-1 text-xs"
                >
                  {invertX ? "ON" : "OFF"}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-background p-2">
                <span className="text-muted-foreground">Invert Y</span>
                <button
                  onClick={() => setInvertY((v) => !v)}
                  className="rounded-md border bg-muted/40 px-2 py-1 text-xs"
                >
                  {invertY ? "ON" : "OFF"}
                </button>
              </div>

              <div className="text-[11px] text-muted-foreground">
                Hover lock: {Math.round(clamp(hoverStable, 0, 999))}ms • Target:{" "}
                <span className="font-medium">
                  {hover.kind === "candidate"
                    ? `Candidate #${hover.id}`
                    : hover.kind === "confirm"
                      ? "Confirm"
                      : hover.kind === "confirmYes"
                        ? "YES"
                        : hover.kind === "confirmNo"
                          ? "NO"
                          : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Voting UI */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold tracking-tight">Select your candidate</div>
                <div className="text-sm text-muted-foreground">
                  Hover a card to select (dwell). Then confirm (double-check).
                </div>
              </div>

              <div className="flex items-center gap-2">

                <Button
                  variant={cameraActive ? "destructive" : "default"}
                  onClick={cameraActive ? stopCamera : startCamera}
                  className="h-10"
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="mr-2 h-4 w-4" />
                      Stop camera
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Start camera
                    </>
                  )}
                </Button>

                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                  <div className="text-muted-foreground">Tracking</div>
                  <div className="font-medium">{cameraActive ? (head.isTracking ? "Locked" : "Searching…") : "Off"}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                  <div className="text-muted-foreground">Calibrated</div>
                  <div className="font-medium">{head.calibrated ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {candidates.map((c) => {
                const isSelected = selectedCandidate === c.id;
                const isHover = hover.kind === "candidate" && hover.id === c.id;

                return (
                  <div
                    key={c.id}
                    data-candidate-id={c.id}
                    className={[
                      "relative rounded-2xl border bg-background p-4 transition",
                      isSelected ? "border-primary/50 shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]" : "hover:border-primary/30",
                      isHover ? "ring-2 ring-primary/30" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.party}</div>
                      </div>
                      {isSelected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <div className="h-5 w-5 rounded-full border bg-muted/30" />}
                    </div>

                    <div className="mt-3 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">“{c.slogan}”</div>

                    <div className="mt-3 text-[11px] text-muted-foreground">
                      {isHover ? "Hovering… (dwell to select)" : " "}
                    </div>

                    {isHover && <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/5" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">Selected</div>
                <div className="text-sm text-muted-foreground">{selected ? `${selected.name} • ${selected.party}` : "None"}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    data-confirm
                    size="lg"
                    disabled={!selectedCandidate || voteConfirmed}
                    className="rounded-xl"
                    onClick={() => {
                      // Mouse fallback (still double-check)
                      if (selectedCandidate) setConfirmStep("review");
                    }}
                  >
                    {voteConfirmed ? "Vote submitted" : "Confirm vote"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setVoteConfirmed(false);
                    setConfirmStep("idle");
                  }}
                  disabled={voteConfirmed}
                >
                  Clear
                </Button>
              </div>
            </div>

            {voteConfirmed && (
              <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                <div className="text-sm font-semibold">✅ Vote successfully recorded</div>
                <div className="text-sm text-muted-foreground">
                  (Demo) In the real system, this is where the encrypted vote would be submitted.
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold tracking-tight">Virtual cursor</div>
            <div className="mt-1 text-sm text-muted-foreground">
              The browser can’t move the OS cursor, so we render a precise in-app cursor. Hover highlights show what will be selected when dwell completes.
            </div>
          </div>
        </div>
      </div>

      {/* Double-check dialog */}
      {confirmStep === "review" && !voteConfirmed && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-5 shadow-xl">
            <div className="text-sm font-semibold">Double-check vote</div>
            <div className="mt-1 text-sm text-muted-foreground">
              You selected <b>{selected ? `${selected.name} (${selected.party})` : "—"}</b>. Hover <b>YES</b> or <b>NO</b> until the dwell completes.
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                data-confirm-yes
                className={[
                  "rounded-2xl border p-4 text-center text-sm font-semibold transition",
                  hover.kind === "confirmYes" ? "ring-2 ring-primary/40 bg-primary/5 border-primary/40" : "hover:border-primary/30",
                ].join(" ")}
              >
                YES, cast vote
                <div className="mt-1 text-xs font-normal text-muted-foreground">Dwell to confirm</div>
              </div>

              <div
                data-confirm-no
                className={[
                  "rounded-2xl border p-4 text-center text-sm font-semibold transition",
                  hover.kind === "confirmNo" ? "ring-2 ring-primary/40 bg-primary/5 border-primary/40" : "hover:border-primary/30",
                ].join(" ")}
              >
                NO, go back
                <div className="mt-1 text-xs font-normal text-muted-foreground">Dwell to cancel</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmStep("idle")}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual cursor */}
      {cameraActive && (
        <motion.div
          className="pointer-events-none fixed z-[90] h-6 w-6 rounded-full border border-primary/60 bg-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.25)]"
          animate={{ left: cursorPx.x - 12, top: cursorPx.y - 12 }}
          transition={{ type: "spring", stiffness: 700, damping: 40 }}
        />
      )}
    </div>
  );
};

export default Vote;
