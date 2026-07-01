import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpenText,
  Camera,
  CameraOff,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Volume1,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useHeadCursor } from "@/hooks/useHeadCursor";

type HoverTarget =
  | { kind: "none" }
  | { kind: "control"; id: ControlId };

type ControlId =
  | "playpause"
  | "back"
  | "forward"
  | "volup"
  | "voldown"
  | "restart";

const DWELL_MS = 650;
const ACTION_COOLDOWN_MS = 650;

export default function MediaPlayer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Webcam (for head cursor tracking)
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Cursor tuning
  const [invertX, setInvertX] = useState(false);
  const [invertY, setInvertY] = useState(false);
  const [sensitivity, setSensitivity] = useState(88);
  const [smoothing, setSmoothing] = useState(0.86);

  const head = useHeadCursor(webcamRef, cameraActive, {
    invertX,
    invertY,
    sensitivity,
    smoothing,
  });

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream as any;
        await webcamRef.current.play();
      }
      setCameraActive(true);
    } catch (e: any) {
      setCameraError(e?.message || "Could not access camera.");
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
      streamRef.current = null;
      if (webcamRef.current) webcamRef.current.srcObject = null;
    } catch {}
    setCameraActive(false);
  }, []);

  // Player
  const playerRef = useRef<HTMLVideoElement | null>(null);
  // Area where the virtual cursor is rendered (video + bottom controls)
  const playerAreaRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.6);

  useEffect(() => {
    const v = playerRef.current;
    if (!v) return;
    v.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(async () => {
    const v = playerRef.current;
    if (!v) return;
    try {
      if (v.paused) {
        await v.play();
        setIsPlaying(true);
      } else {
        v.pause();
        setIsPlaying(false);
      }
    } catch (e: any) {
      toast({ title: "Playback blocked", description: "Click the page once, then try again." });
    }
  }, [toast]);

  const seekBy = useCallback((deltaSeconds: number) => {
    const v = playerRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 1e9, v.currentTime + deltaSeconds));
  }, []);

  const restart = useCallback(() => {
    const v = playerRef.current;
    if (!v) return;
    v.currentTime = 0;
  }, []);

  const volBy = useCallback((delta: number) => {
    setVolume((prev) => Math.max(0, Math.min(1, +(prev + delta).toFixed(2))));
  }, []);

  // Controls hover & dwell
  const controlsAreaRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<ControlId, HTMLDivElement | null>>({
    playpause: null,
    back: null,
    forward: null,
    volup: null,
    voldown: null,
    restart: null,
  });

  const [hover, setHover] = useState<HoverTarget>({ kind: "none" });
  const [hoverStart, setHoverStart] = useState<number>(0);
  const lastActionAtRef = useRef<number>(0);

  const cursorPx = useMemo(() => {
    const area = playerAreaRef.current;
    if (!area) return { x: 0, y: 0, ready: false };
    const r = area.getBoundingClientRect();

    // Cursor can travel across the whole player (video + bottom controls)
    const x = r.left + (head.cursor.x / 100) * r.width;
    const y = r.top + (head.cursor.y / 100) * r.height;

    return { x, y, ready: true, rect: r };
  }, [head.cursor.x, head.cursor.y]);

  const cursorHiddenOverVideo = useMemo(() => {
    const v = playerRef.current;
    if (!v || !cursorPx.ready) return false;
    const r = v.getBoundingClientRect();
    return cursorPx.x >= r.left && cursorPx.x <= r.right && cursorPx.y >= r.top && cursorPx.y <= r.bottom;
  }, [cursorPx.ready, cursorPx.x, cursorPx.y]);

  const computeHover = useCallback(() => {
    if (!cameraActive || !cursorPx.ready) return { kind: "none" } as HoverTarget;

    const { x, y } = cursorPx;

    // Only allow selecting controls when the cursor is in the bottom controls panel
    const ctrl = controlsAreaRef.current?.getBoundingClientRect();
    if (!ctrl) return { kind: "none" } as HoverTarget;
    const inControls = x >= ctrl.left && x <= ctrl.right && y >= ctrl.top && y <= ctrl.bottom;
    if (!inControls) return { kind: "none" } as HoverTarget;

    const entries = Object.entries(buttonRefs.current) as Array<[ControlId, HTMLDivElement | null]>;

    let best: { id: ControlId; dist: number } | null = null;

    for (const [id, el] of entries) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

      if (inside) return { kind: "control", id };

      // Snap-hover if near (magnet assist)
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < 90 && (!best || dist < best.dist)) best = { id, dist };
    }

    if (best) return { kind: "control", id: best.id };
    return { kind: "none" };
  }, [cameraActive, cursorPx, cursorPx.ready]);

  useEffect(() => {
    if (!cameraActive) {
      setHover({ kind: "none" });
      return;
    }
    let raf = 0;
    const tick = () => {
      const h = computeHover();
      setHover((prev) => {
        const changed =
          prev.kind !== h.kind || (prev.kind === "control" && h.kind === "control" && prev.id !== h.id);
        if (changed) setHoverStart(Date.now());
        return h;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraActive, computeHover]);

  const dwellProgress = useMemo(() => {
    if (hover.kind === "none") return 0;
    const now = Date.now();
    const elapsed = now - hoverStart;
    return Math.max(0, Math.min(1, elapsed / DWELL_MS));
  }, [hover, hoverStart]);

  const runAction = useCallback(
    (id: ControlId) => {
      switch (id) {
        case "playpause":
          togglePlay();
          return;
        case "back":
          seekBy(-5);
          return;
        case "forward":
          seekBy(5);
          return;
        case "volup":
          volBy(0.08);
          return;
        case "voldown":
          volBy(-0.08);
          return;
        case "restart":
          restart();
          return;
      }
    },
    [restart, seekBy, togglePlay, volBy]
  );

  useEffect(() => {
    if (hover.kind !== "control") return;
    if (dwellProgress < 1) return;

    const now = Date.now();
    if (now - lastActionAtRef.current < ACTION_COOLDOWN_MS) return;

    lastActionAtRef.current = now;
    runAction(hover.id);
  }, [dwellProgress, hover, runAction]);

  const demoSrc = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/30">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Media player</div>
              <div className="text-xs text-muted-foreground">Head cursor • Dwell controls (bottom panel)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/vote")}>
              <Play className="mr-2 h-4 w-4" />
              Vote
            </Button>
            <Button variant="outline" onClick={() => navigate("/reading")}>
              <BookOpenText className="mr-2 h-4 w-4" />
              Reading
            </Button>
            <Button variant="outline" onClick={() => navigate("/welfare")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Welfare
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        {/* Main video */}
        <Card className="overflow-hidden">
          <div ref={playerAreaRef} className="relative">
            <div className="bg-black/95">
              <video
                ref={playerRef}
                className="h-[420px] w-full object-contain"
                src={demoSrc}
                autoPlay
                muted
                loop
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>

            {/* Controls area (buttons below video) */}
            <div ref={controlsAreaRef} className="relative border-t bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <span>Volume: {(volume * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>{cameraActive ? (head.isTracking ? "Tracking locked" : "Searching…") : "Camera off"}</span>
              </div>
            </div>

            <div className="mb-4">
              <Slider value={[Math.round(volume * 100)]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={1} />
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              <ControlTile
                label={isPlaying ? "Pause" : "Play"}
                icon={isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                active={hover.kind === "control" && hover.id === "playpause"}
                progress={hover.kind === "control" && hover.id === "playpause" ? dwellProgress : 0}
                setRef={(el) => (buttonRefs.current.playpause = el)}
              />
              <ControlTile
                label="Back 5s"
                icon={<SkipBack className="h-5 w-5" />}
                active={hover.kind === "control" && hover.id === "back"}
                progress={hover.kind === "control" && hover.id === "back" ? dwellProgress : 0}
                setRef={(el) => (buttonRefs.current.back = el)}
              />
              <ControlTile
                label="Forward 5s"
                icon={<SkipForward className="h-5 w-5" />}
                active={hover.kind === "control" && hover.id === "forward"}
                progress={hover.kind === "control" && hover.id === "forward" ? dwellProgress : 0}
                setRef={(el) => (buttonRefs.current.forward = el)}
              />
              <ControlTile
                label="Vol +"
                icon={<Volume2 className="h-5 w-5" />}
                active={hover.kind === "control" && hover.id === "volup"}
                progress={hover.kind === "control" && hover.id === "volup" ? dwellProgress : 0}
                setRef={(el) => (buttonRefs.current.volup = el)}
              />
              <ControlTile
                label="Vol −"
                icon={<Volume1 className="h-5 w-5" />}
                active={hover.kind === "control" && hover.id === "voldown"}
                progress={hover.kind === "control" && hover.id === "voldown" ? dwellProgress : 0}
                setRef={(el) => (buttonRefs.current.voldown = el)}
              />
              <ControlTile
                label="Restart"
                icon={<RotateCcw className="h-5 w-5" />}
                active={hover.kind === "control" && hover.id === "restart"}
                progress={hover.kind === "control" && hover.id === "restart" ? dwellProgress : 0}
                setRef={(el) => (buttonRefs.current.restart = el)}
              />
            </div>

            </div>

            {/* Virtual cursor: allowed to move over video, but hidden while inside the video area */}
            {cameraActive && cursorPx.ready && (
              <motion.div
                className="pointer-events-none absolute z-20"
                style={{
                  left: `${head.cursor.x}%`,
                  top: `${head.cursor.y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: cursorHiddenOverVideo ? 0 : 1,
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: cursorHiddenOverVideo ? 0 : 1 }}
                transition={{ duration: 0.12 }}
              >
                <div className="relative">
                  <div className="h-5 w-5 rounded-full border bg-background shadow" />
                  {hover.kind === "control" && !cursorHiddenOverVideo && (
                    <div
                      className="absolute -inset-2 rounded-full border"
                      style={{
                        clipPath: `inset(${(1 - dwellProgress) * 100}% 0 0 0)`,
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Right: tracking setup */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Head cursor</div>
                <div className="text-xs text-muted-foreground">
                  Start camera → Calibrate → use controls below video (cursor is hidden while over the video).
                </div>
              </div>
              <Button
                variant={cameraActive ? "destructive" : "default"}
                onClick={cameraActive ? stopCamera : startCamera}
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="mr-2 h-4 w-4" /> Stop
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" /> Start
                  </>
                )}
              </Button>
            </div>

            {cameraError && (
              <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {cameraError}
              </div>
            )}

            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-muted/30 p-3 text-xs">
                  <div className="text-muted-foreground">Tracking</div>
                  <div className="font-medium">{cameraActive ? (head.isTracking ? "Locked" : "Searching…") : "Off"}</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-xs">
                  <div className="text-muted-foreground">Calibrated</div>
                  <div className="font-medium">{head.calibrated ? "Yes" : "No"}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={head.calibrate}
                  disabled={!cameraActive || !head.yawPitchRoll}
                >
                  Calibrate
                </Button>
                <Button className="flex-1" variant="outline" onClick={head.resetCalibration} disabled={!cameraActive}>
                  Reset
                </Button>
              </div>

              <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground">Mirror correction</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={invertX ? "default" : "outline"} onClick={() => setInvertX((v) => !v)}>
                      X
                    </Button>
                    <Button size="sm" variant={invertY ? "default" : "outline"} onClick={() => setInvertY((v) => !v)}>
                      Y
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sensitivity</span>
                    <span className="font-medium">{sensitivity}</span>
                  </div>
                  <Slider value={[sensitivity]} onValueChange={(v) => setSensitivity(v[0])} min={50} max={120} step={1} />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Smoothing</span>
                    <span className="font-medium">{smoothing.toFixed(2)}</span>
                  </div>
                  <Slider value={[Math.round(smoothing * 100)]} onValueChange={(v) => setSmoothing(v[0] / 100)} min={70} max={95} step={1} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold">Webcam preview</div>
            <div className="mt-2 overflow-hidden rounded-xl border bg-black/20">
              <video ref={webcamRef} className="h-[220px] w-full object-cover" playsInline muted />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Keep your face centered. Good lighting improves stability.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ControlTile({
  label,
  icon,
  active,
  progress,
  setRef,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  progress: number; // 0..1
  setRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={setRef}
      className={[
        "relative flex select-none flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center",
        active ? "border-primary/60 bg-primary/5" : "bg-muted/10 hover:bg-muted/20",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
        {icon}
      </div>
      <div className="text-xs font-medium">{label}</div>

      {active && (
        <div className="absolute inset-x-3 bottom-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
