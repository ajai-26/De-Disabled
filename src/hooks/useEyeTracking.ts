import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface GazePosition {
  x: number;
  y: number;
}

interface FaceLandmark {
  x: number;
  y: number;
}

interface EyeTrackingState {
  gazePosition: GazePosition;
  isTracking: boolean;
  faceLandmarks: FaceLandmark[];
  leftEyeCenter: GazePosition | null;
  rightEyeCenter: GazePosition | null;
  irisPositions: { left: GazePosition | null; right: GazePosition | null };
}

// MediaPipe FaceMesh landmark indices for eyes
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LEFT_IRIS_INDICES = [468, 469, 470, 471, 472];
const RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477];

export const useEyeTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isActive: boolean
) => {
  const [state, setState] = useState<EyeTrackingState>({
    gazePosition: { x: 50, y: 50 },
    isTracking: false,
    faceLandmarks: [],
    leftEyeCenter: null,
    rightEyeCenter: null,
    irisPositions: { left: null, right: null },
  });

  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate eye center from landmarks
  const calculateEyeCenter = useCallback((landmarks: any[], indices: number[]): GazePosition => {
    let sumX = 0, sumY = 0;
    indices.forEach(idx => {
      sumX += landmarks[idx].x;
      sumY += landmarks[idx].y;
    });
    return {
      x: (sumX / indices.length) * 100,
      y: (sumY / indices.length) * 100,
    };
  }, []);

  // Calculate iris center
  const calculateIrisCenter = useCallback((landmarks: any[], indices: number[]): GazePosition | null => {
    if (!landmarks[indices[0]]) return null;
    let sumX = 0, sumY = 0;
    indices.forEach(idx => {
      if (landmarks[idx]) {
        sumX += landmarks[idx].x;
        sumY += landmarks[idx].y;
      }
    });
    return {
      x: (sumX / indices.length) * 100,
      y: (sumY / indices.length) * 100,
    };
  }, []);

  // Calculate gaze direction based on iris position relative to eye center
  const calculateGazePosition = useCallback((
    leftEyeCenter: GazePosition,
    rightEyeCenter: GazePosition,
    leftIris: GazePosition | null,
    rightIris: GazePosition | null
  ): GazePosition => {
    if (!leftIris || !rightIris) {
      return { x: 50, y: 50 };
    }

    // Calculate offset of iris from eye center for both eyes
    const leftOffsetX = leftIris.x - leftEyeCenter.x;
    const leftOffsetY = leftIris.y - leftEyeCenter.y;
    const rightOffsetX = rightIris.x - rightEyeCenter.x;
    const rightOffsetY = rightIris.y - rightEyeCenter.y;

    // Average the offsets
    const avgOffsetX = (leftOffsetX + rightOffsetX) / 2;
    const avgOffsetY = (leftOffsetY + rightOffsetY) / 2;

    // Map iris offset to screen position (amplify the movement)
    // Negative X because camera is mirrored
    const gazeX = 50 - avgOffsetX * 15;
    const gazeY = 50 + avgOffsetY * 20;

    // Clamp to valid range
    return {
      x: Math.max(5, Math.min(95, gazeX)),
      y: Math.max(10, Math.min(90, gazeY)),
    };
  }, []);

  // Process FaceMesh results
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Extract face landmarks for visualization
      const faceLandmarks: FaceLandmark[] = landmarks.map(lm => ({
        x: lm.x * 100,
        y: lm.y * 100,
      }));

      // Calculate eye centers
      const leftEyeCenter = calculateEyeCenter(landmarks, LEFT_EYE_INDICES);
      const rightEyeCenter = calculateEyeCenter(landmarks, RIGHT_EYE_INDICES);

      // Calculate iris centers
      const leftIris = calculateIrisCenter(landmarks, LEFT_IRIS_INDICES);
      const rightIris = calculateIrisCenter(landmarks, RIGHT_IRIS_INDICES);

      // Calculate gaze position
      const gazePosition = calculateGazePosition(leftEyeCenter, rightEyeCenter, leftIris, rightIris);

      // Draw face mesh on canvas
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      // Draw eye contours
      ctx.strokeStyle = 'hsl(186, 100%, 50%)';
      ctx.lineWidth = 1;
      
      // Left eye
      ctx.beginPath();
      LEFT_EYE_INDICES.forEach((idx, i) => {
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();

      // Right eye
      ctx.beginPath();
      RIGHT_EYE_INDICES.forEach((idx, i) => {
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();

      // Draw iris points
      ctx.fillStyle = 'hsl(186, 100%, 60%)';
      [...LEFT_IRIS_INDICES, ...RIGHT_IRIS_INDICES].forEach(idx => {
        if (landmarks[idx]) {
          const x = landmarks[idx].x * canvas.width;
          const y = landmarks[idx].y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw face mesh points (subset for performance)
      ctx.fillStyle = 'hsla(186, 100%, 50%, 0.3)';
      [10, 152, 234, 454, 21, 251, 389, 356, 70, 63, 105, 66, 107, 336, 296, 334, 293, 300].forEach(idx => {
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      setState({
        gazePosition,
        isTracking: true,
        faceLandmarks: faceLandmarks.filter((_, i) => i % 10 === 0), // Reduce for performance
        leftEyeCenter,
        rightEyeCenter,
        irisPositions: { left: leftIris, right: rightIris },
      });
    } else {
      setState(prev => ({
        ...prev,
        isTracking: false,
        faceLandmarks: [],
        leftEyeCenter: null,
        rightEyeCenter: null,
        irisPositions: { left: null, right: null },
      }));
    }
  }, [canvasRef, videoRef, calculateEyeCenter, calculateIrisCenter, calculateGazePosition]);

  // Initialize FaceMesh
  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const initFaceMesh = async () => {
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true, // Enable iris tracking
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      // Start camera
      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        
        cameraRef.current = camera;
        await camera.start();
      }
    };

    initFaceMesh();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onResults, videoRef]);

  return state;
};
