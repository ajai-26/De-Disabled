import { useCallback, useEffect, useRef, useState } from "react";

type CursorPos = { x: number; y: number }; // 0..100 (%)

type HeadCursorState = {
  cursor: CursorPos;
  isTracking: boolean;
  yawPitchRoll: { yaw: number; pitch: number; roll: number } | null; // radians
  fps: number;
  calibrated: boolean;
};

type Options = {
  sensitivity?: number; // pixels per rad-ish mapped to % (internally)
  smoothing?: number; // 0..1 (EMA), higher = smoother
  invertX?: boolean; // mirror correction for left/right
  invertY?: boolean;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Browser-only, on-device head-movement cursor using MediaPipe Tasks Vision FaceLandmarker.
 * Uses facial transformation matrix to compute yaw/pitch/roll and maps it to a virtual cursor (0..100%).
 *
 * - No server calls
 * - Works with normal webcam
 */
export function useHeadCursor(
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean,
  opts: Options = {}
) {
  const {
    sensitivity = 65, // higher = faster cursor
    smoothing = 0.85,
    invertX = true,
    invertY = false,
  } = opts;

  const [state, setState] = useState<HeadCursorState>({
    cursor: { x: 50, y: 50 },
    isTracking: false,
    yawPitchRoll: null,
    fps: 0,
    calibrated: false,
  });

  const landmarkerRef = useRef<any>(null);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const emaRef = useRef<CursorPos>({ x: 50, y: 50 });
  const neutralRef = useRef<{ yaw: number; pitch: number } | null>(null);
  const fpsRef = useRef({ t: performance.now(), frames: 0, fps: 0 });

  const setCalibrated = useCallback((v: boolean) => {
    setState(prev => ({ ...prev, calibrated: v }));
  }, []);

  const calibrate = useCallback(() => {
    if (state.yawPitchRoll) {
      neutralRef.current = { yaw: state.yawPitchRoll.yaw, pitch: state.yawPitchRoll.pitch };
      setCalibrated(true);
    }
  }, [state.yawPitchRoll, setCalibrated]);

  const resetCalibration = useCallback(() => {
    neutralRef.current = null;
    setCalibrated(false);
    emaRef.current = { x: 50, y: 50 };
    setState(prev => ({ ...prev, cursor: { x: 50, y: 50 } }));
  }, [setCalibrated]);

  // Extract yaw/pitch/roll from a 4x4 column-major matrix (MediaPipe output).
  // Assumes the upper-left 3x3 is rotation.
  
const rad2deg = (r: number) => (r * 180) / Math.PI;

// Extract yaw/pitch/roll from a 4x4 column-major matrix (MediaPipe output).
// We interpret the rotation as R = Rz(roll) * Ry(yaw) * Rx(pitch)  (ZYX / yaw-pitch-roll in common UI terms).
// NOTE: The previous implementation mixed axes, which makes the cursor feel "wrong" and unstable.
const yprFromMat = (m: number[]) => {
  const r00 = m[0],  r01 = m[4],  r02 = m[8];
  const r10 = m[1],  r11 = m[5],  r12 = m[9];
  const r20 = m[2],  r21 = m[6],  r22 = m[10];

  // yaw (about Y)
  const yaw = Math.asin(clamp(-r20, -1, 1));

  // roll (about Z) and pitch (about X)
  let roll = Math.atan2(r10, r00);
  let pitch = Math.atan2(r21, r22);

  // Gimbal lock handling (rare but helps stability near extreme yaw).
  if (Math.abs(Math.cos(yaw)) < 1e-6) {
    roll = Math.atan2(-r01, r11);
    pitch = 0;
  }

  return { yaw, pitch, roll };
};

  const start = useCallback(async () => {
    if (!videoRef.current) return;
    if (runningRef.current) return;

    runningRef.current = true;

    // Dynamic import from CDN to avoid bundler/wasm asset hassles.
    // NOTE: pinned version for stability.
    const visionUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
    const vision = await import(/* @vite-ignore */ (visionUrl as any));

    const { FaceLandmarker, FilesetResolver } = (vision as any).default ?? vision;

    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    landmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });

    const loop = () => {
      if (!runningRef.current) return;
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Only run when we have a new frame
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        const nowMs = performance.now();
        const res = landmarker.detectForVideo(video, nowMs);

        const matrices = res?.facialTransformationMatrixes;
        if (matrices && matrices.length > 0 && matrices[0]?.data?.length === 16) {
          const m = Array.from(matrices[0].data) as number[];
          const ypr = yprFromMat(m);

          // Neutral calibration
          const neutral = neutralRef.current;
          const dyaw = ypr.yaw - (neutral?.yaw ?? 0);
          const dpitch = ypr.pitch - (neutral?.pitch ?? 0);


// Map yaw/pitch to cursor in percentage space with:
// 1) deadzone to remove micro-jitter
// 2) non-linear response curve for more precision near the center
// 3) gain scaling derived from sensitivity
const DEADZONE_DEG = 1.2;         // ignore tiny involuntary movements
const MAX_YAW_DEG = 24;           // comfortable left/right head turn
const MAX_PITCH_DEG = 18;         // comfortable up/down head tilt
const CURVE_EXP = 1.35;           // >1 = finer control near center

const applyDeadzone = (deg: number) => {
  const ad = Math.abs(deg);
  if (ad <= DEADZONE_DEG) return 0;
  return Math.sign(deg) * (ad - DEADZONE_DEG);
};

const curve = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), CURVE_EXP);

const gain = sensitivity / 65; // keep existing UI roughly consistent

const yawDeg = applyDeadzone(rad2deg(dyaw));
const pitchDeg = applyDeadzone(rad2deg(dpitch));

const nx = clamp(yawDeg / MAX_YAW_DEG, -1, 1);
const ny = clamp(pitchDeg / MAX_PITCH_DEG, -1, 1);

const sx = (invertX ? -1 : 1) * curve(nx) * 45 * gain;
const sy = (invertY ? -1 : 1) * curve(ny) * 38 * gain;

          const target = {
            x: clamp(50 + sx, 2, 98),
            y: clamp(50 + sy, 6, 94),
          };


// EMA smoothing (adaptive):
// - when moving fast: reduce smoothing to reduce lag
// - when steady: increase smoothing to suppress jitter
const prev = emaRef.current;
const dist = Math.hypot(target.x - prev.x, target.y - prev.y);

let a = clamp(smoothing, 0.25, 0.98);
if (dist > 6) a = Math.max(0.35, a - 0.35);
else if (dist > 3) a = Math.max(0.4, a - 0.22);
else if (dist > 1.5) a = Math.max(0.5, a - 0.12);
else if (dist < 0.35) a = Math.min(0.98, a + 0.06);

const next = {
  x: a * prev.x + (1 - a) * target.x,
  y: a * prev.y + (1 - a) * target.y,
};
          emaRef.current = next;

          // FPS estimation
          fpsRef.current.frames += 1;
          const dt = nowMs - fpsRef.current.t;
          if (dt > 500) {
            fpsRef.current.fps = Math.round((fpsRef.current.frames * 1000) / dt);
            fpsRef.current.frames = 0;
            fpsRef.current.t = nowMs;
          }

          setState(prevState => ({
            ...prevState,
            cursor: next,
            isTracking: true,
            yawPitchRoll: ypr,
            fps: fpsRef.current.fps,
          }));
        } else {
          setState(prevState => ({ ...prevState, isTracking: false, yawPitchRoll: null }));
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, sensitivity, smoothing, invertX, invertY]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastVideoTimeRef.current = -1;

    try {
      landmarkerRef.current?.close?.();
    } catch {
      // ignore
    }
    landmarkerRef.current = null;

    setState(prev => ({ ...prev, isTracking: false, yawPitchRoll: null, fps: 0 }));
  }, []);

  useEffect(() => {
    if (isActive) start();
    else stop();
    return () => stop();
  }, [isActive, start, stop]);

  return { ...state, calibrate, resetCalibration };
}
