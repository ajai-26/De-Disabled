import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Camera,
  CameraOff,
  Gauge,
  PlayCircle,
  PanelRightClose,
  PanelRightOpen,
  RefreshCcw,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHeadCursor } from "@/hooks/useHeadCursor";

type ActionKind =
  | "openPanel"
  | "closePanel"
  | "scrollDown"
  | "scrollUp"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom";

type HoverTarget = { kind: "action"; action: ActionKind } | { kind: "none" };

type TargetInfo = {
  action: ActionKind;
  x: number;
  y: number;
  rect: DOMRect;
};

const BOOK = {
  title: "Alice's Adventures in Wonderland",
  author: "Lewis Carroll",
  note: "Public domain excerpt.",
  paragraphs: ["Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'", "So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.", "There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.", "In another moment down went Alice after it, never once considering how in the world she was to get out again.", "The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.", "Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next.", "Down, down, down. Would the fall NEVER come to an end?", "There were cupboards and book-shelves here and there; she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labeled 'ORANGE MARMALADE', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.", "Down, down, down. There was nothing else to do, so Alice soon began talking to herself. 'Dinah'll miss me very much to-night, I should think!' (Dinah was the cat.) 'I hope they'll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me!'", "Alice was not a bit hurt, and she jumped up on to her feet in a moment: she looked up, but it was all dark overhead; before her was another long passage, and the White Rabbit was still in sight, hurrying down it. There was not a moment to be lost: away went Alice like the wind, and was just in time to hear it say, as it turned a corner, 'Oh my ears and whiskers, how late it's getting!'"],
};

const DWELL_OPEN_MS = 650;
const DWELL_ACTION_MS = 450;
const ACTION_COOLDOWN_MS = 650;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function Reading() {
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetCentersRef = useRef<TargetInfo[]>([]);
  const cooldownUntilRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [invertX, setInvertX] = useState(true);
  const [invertY, setInvertY] = useState(false);
  const [sensitivity, setSensitivity] = useState(65);
  const [smoothing, setSmoothing] = useState(0.85);

  const [panelOpen, setPanelOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);

  const [hover, setHover] = useState<HoverTarget>({ kind: "none" });
  const [hoverStart, setHoverStart] = useState<number | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  const head = useHeadCursor(videoRef, cameraActive, {
    invertX,
    invertY,
    sensitivity,
    smoothing,
  });

  const cursorPx = useMemo(() => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: r.left + (head.cursor.x / 100) * r.width,
      y: r.top + (head.cursor.y / 100) * r.height,
    };
  }, [head.cursor.x, head.cursor.y]);

  // Intuitive reading: if the cursor goes near the top/bottom edge of the text area,
  // scroll slowly in that direction (speed increases the closer you are to the edge).
  useEffect(() => {
    if (!cameraActive || !autoScroll) return;

    let raf = 0;
    const tick = () => {
      const sc = scrollRef.current;
      if (sc && head.isTracking) {
        const r = sc.getBoundingClientRect();

        const insideX = cursorPx.x >= r.left && cursorPx.x <= r.right;
        const insideY = cursorPx.y >= r.top && cursorPx.y <= r.bottom;

        if (insideX && insideY) {
          const zone = Math.max(70, Math.min(150, r.height * 0.14)); // activation band
          const topBand = r.top + zone;
          const bottomBand = r.bottom - zone;

          let dy = 0;
          if (cursorPx.y < topBand) {
            const t = (topBand - cursorPx.y) / zone; // 0..1
            dy = -clamp(t, 0, 1) * 2.0; // px per frame (slow)
          } else if (cursorPx.y > bottomBand) {
            const t = (cursorPx.y - bottomBand) / zone; // 0..1
            dy = clamp(t, 0, 1) * 2.0;
          }

          if (Math.abs(dy) > 0.01) {
            sc.scrollTop += dy;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll, cameraActive, cursorPx.x, cursorPx.y, head.isTracking]);

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

  const doAction = useCallback((action: ActionKind) => {
    const now = performance.now();
    if (now < cooldownUntilRef.current) return;
    cooldownUntilRef.current = now + ACTION_COOLDOWN_MS;

    if (action === "openPanel") return setPanelOpen(true);
    if (action === "closePanel") return setPanelOpen(false);

    if (action === "scrollDown") return scrollRef.current?.scrollBy({ top: 260, behavior: "smooth" });
    if (action === "scrollUp") return scrollRef.current?.scrollBy({ top: -260, behavior: "smooth" });

    if (action === "zoomIn") return setZoom((z) => clamp(Math.round((z + 0.1) * 10) / 10, 0.8, 2.0));
    if (action === "zoomOut") return setZoom((z) => clamp(Math.round((z - 0.1) * 10) / 10, 0.8, 2.0));
    if (action === "resetZoom") return setZoom(1);
  }, []);

  // Cache action target rectangles.
  useEffect(() => {
    const update = () => {
      const list: TargetInfo[] = [];
      document.querySelectorAll<HTMLElement>("[data-action]").forEach((el) => {
        const action = el.dataset.action as ActionKind;
        const r = el.getBoundingClientRect();
        list.push({
          action,
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          rect: r,
        });
      });
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
  }, []);

  // Hover detection (hit-test + snap).
  useEffect(() => {
    if (!cameraActive) {
      setHover({ kind: "none" });
      setHoverStart(null);
      setDwellProgress(0);
      return;
    }

    const HOVER_SNAP_PX = 90;
    let raf = 0;

    const tick = () => {
      const el = containerRef.current;
      if (!el) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const r = el.getBoundingClientRect();
      const within =
        cursorPx.x >= r.left && cursorPx.x <= r.right && cursorPx.y >= r.top && cursorPx.y <= r.bottom;

      let next: HoverTarget = { kind: "none" };

      if (within) {
        const targets = targetCentersRef.current;

        const hit = targets.find(
          (t) =>
            cursorPx.x >= t.rect.left &&
            cursorPx.x <= t.rect.right &&
            cursorPx.y >= t.rect.top &&
            cursorPx.y <= t.rect.bottom
        );

        if (hit) {
          next = { kind: "action", action: hit.action };
        } else {
          let best: { t: TargetInfo; d: number } | null = null;
          for (const t of targets) {
            const d = Math.hypot(cursorPx.x - t.x, cursorPx.y - t.y);
            if (!best || d < best.d) best = { t, d };
          }
          if (best && best.d <= HOVER_SNAP_PX) next = { kind: "action", action: best.t.action };
        }
      }

      const changed =
        next.kind !== hover.kind ||
        (next.kind === "action" && hover.kind === "action" && next.action !== hover.action);

      if (changed) {
        setHover(next);
        setHoverStart(next.kind === "none" ? null : performance.now());
        setDwellProgress(0);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraActive, cursorPx.x, cursorPx.y, hover]);

  // Dwell-to-fire (stable "hover to use").
  useEffect(() => {
    if (!cameraActive) return;

    let raf = 0;
    const tick = () => {
      if (!hoverStart || hover.kind !== "action") {
        setDwellProgress(0);
        raf = requestAnimationFrame(tick);
        return;
      }

      const elapsed = performance.now() - hoverStart;
      const isOpenClose = hover.action === "openPanel" || hover.action === "closePanel";
      const targetMs = isOpenClose ? DWELL_OPEN_MS : DWELL_ACTION_MS;

      const p = Math.min(1, elapsed / targetMs);
      setDwellProgress(p);

      if (p >= 1) {
        doAction(hover.action);
        setHoverStart(performance.now());
        setDwellProgress(0);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraActive, hover, hoverStart, doAction]);

  const actionLabel = (a: ActionKind) => {
    switch (a) {
      case "openPanel":
        return "Open controls";
      case "closePanel":
        return "Close controls";
      case "scrollDown":
        return "Scroll down";
      case "scrollUp":
        return "Scroll up";
      case "zoomIn":
        return "Zoom in";
      case "zoomOut":
        return "Zoom out";
      case "resetZoom":
        return "Reset zoom";
      default:
        return "—";
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight">Reading for the Disabled</div>
              <div className="text-xs text-muted-foreground">Head cursor • Hover actions • Scroll & Zoom</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/vote")}>
              <BookOpenText className="mr-2 h-4 w-4" />
              Vote
            </Button>
            <Button variant="ghost" onClick={() => navigate("/welfare")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Welfare
            </Button>
            <Button variant="ghost" onClick={() => navigate("/media")}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Media player
            </Button>

            <Button variant={cameraActive ? "secondary" : "default"} onClick={cameraActive ? stopCamera : startCamera}>
              {cameraActive ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
              {cameraActive ? "Stop camera" : "Start camera"}
            </Button>

            <Button variant="outline" onClick={() => head.calibrate()}>
              <Gauge className="mr-2 h-4 w-4" />
              Calibrate
            </Button>
            <Button variant="outline" onClick={() => head.resetCalibration()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {cameraError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {cameraError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black/90">
                <video ref={videoRef} className="h-full w-full object-cover opacity-95" playsInline muted />
                {!cameraActive && (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                    Start camera to enable head cursor
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 text-xs text-white/80">
                  {head.isTracking ? `Tracking • FPS ${head.fps}` : "Not tracking"}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">Cursor tuning</div>
              </div>

              <div className="space-y-3 text-sm">
                <label className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Mirror correction (X)</span>
                  <input className="h-4 w-4" type="checkbox" checked={invertX} onChange={(e) => setInvertX(e.target.checked)} />
                </label>

                <label className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Invert Y</span>
                  <input className="h-4 w-4" type="checkbox" checked={invertY} onChange={(e) => setInvertY(e.target.checked)} />
                </label>

                
                <label className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Auto-scroll near edges</span>
                  <input className="h-4 w-4" type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
                </label>
<div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Sensitivity</span>
                    <span className="font-mono text-xs">{sensitivity}</span>
                  </div>
                  <input className="w-full" type="range" min={40} max={120} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Smoothing</span>
                    <span className="font-mono text-xs">{smoothing.toFixed(2)}</span>
                  </div>
                  <input className="w-full" type="range" min={0.3} max={0.98} step={0.01} value={smoothing} onChange={(e) => setSmoothing(Number(e.target.value))} />
                </div>

                <div className="rounded-md border bg-secondary/30 p-2 text-xs text-muted-foreground">
                  Tip: Calibrate while looking straight, then hover the Controls button to open actions.
                </div>
              </div>
            </Card>
          </div>

          <Card className="relative overflow-hidden">
            <div className="border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpenText className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-semibold">{BOOK.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {BOOK.author} • {BOOK.note} • Zoom {zoom.toFixed(1)}x
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div ref={scrollRef} className="h-[70vh] overflow-auto px-6 py-6 leading-relaxed">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    width: `${100 / zoom}%`,
                  }}
                >
                  {BOOK.paragraphs.map((p, idx) => (
                    <p key={idx} className="mb-4 text-base md:text-lg text-foreground/90">
                      {p}
                    </p>
                  ))}
                </div>
              </div>

              <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
                {!panelOpen ? (
                  <div data-action="openPanel" className="flex cursor-default items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-sm">
                    <PanelRightOpen className="h-4 w-4 text-primary" />
                    <div className="text-sm font-semibold">Controls</div>
                  </div>
                ) : (
                  <div className="w-56 rounded-2xl border bg-background/95 p-2 shadow-lg">
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="text-xs font-semibold text-muted-foreground">Hover to use</div>
                      <div data-action="closePanel" className="cursor-default rounded-md px-2 py-1 text-xs hover:bg-secondary">
                        <PanelRightClose className="mr-1 inline h-3 w-3" />
                        Close
                      </div>
                    </div>

                    <div className="grid gap-2 p-2">
                      <div data-action="scrollDown" className="flex cursor-default items-center gap-2 rounded-xl border px-3 py-2 hover:bg-secondary">
                        <ArrowDown className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Scroll down</div>
                      </div>
                      <div data-action="scrollUp" className="flex cursor-default items-center gap-2 rounded-xl border px-3 py-2 hover:bg-secondary">
                        <ArrowUp className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Scroll up</div>
                      </div>
                      <div data-action="zoomIn" className="flex cursor-default items-center gap-2 rounded-xl border px-3 py-2 hover:bg-secondary">
                        <ZoomIn className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Zoom in</div>
                      </div>
                      <div data-action="zoomOut" className="flex cursor-default items-center gap-2 rounded-xl border px-3 py-2 hover:bg-secondary">
                        <ZoomOut className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Zoom out</div>
                      </div>
                      <div data-action="resetZoom" className="flex cursor-default items-center gap-2 rounded-xl border px-3 py-2 hover:bg-secondary">
                        <RefreshCcw className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Reset zoom</div>
                      </div>
                    </div>

                    <div className="px-2 pb-2 text-[11px] text-muted-foreground">
                      Actions trigger after a short stable hover to prevent misfires.
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute left-3 bottom-3 z-20 rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                Hover target: <span className="text-foreground">{hover.kind === "action" ? actionLabel(hover.action) : "None"}</span>
                {hover.kind === "action" && <span className="ml-2 inline-block w-20 text-right font-mono">{Math.round(dwellProgress * 100)}%</span>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {cameraActive && (
        <motion.div
          className="pointer-events-none fixed z-[999] -translate-x-1/2 -translate-y-1/2"
          style={{ left: cursorPx.x, top: cursorPx.y }}
          animate={{ scale: hover.kind === "action" ? 1.12 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div className="relative">
            <div className="h-6 w-6 rounded-full border border-primary/70 bg-primary/20 shadow-[0_0_30px_rgba(120,180,255,0.25)]" />
            <div className="absolute -inset-2 rounded-full border border-primary/25" />
            {hover.kind === "action" && (
              <svg className="absolute -inset-3 h-12 w-12">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={(1 - dwellProgress) * 2 * Math.PI * 20}
                  opacity="0.9"
                />
              </svg>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}