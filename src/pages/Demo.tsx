import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Mic, 
  MicOff, 
  ArrowLeft, 
  Camera, 
  CameraOff,
  CheckCircle,
  Circle,
  Volume2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEyeTracking } from "@/hooks/useEyeTracking";

interface Candidate {
  id: number;
  name: string;
  party: string;
  color: string;
}

const candidates: Candidate[] = [
  { id: 1, name: "Alice Johnson", party: "Progressive Party", color: "hsl(186, 100%, 50%)" },
  { id: 2, name: "Bob Williams", party: "Unity Alliance", color: "hsl(175, 84%, 40%)" },
  { id: 3, name: "Carol Martinez", party: "Future Forward", color: "hsl(280, 70%, 50%)" },
];

const Demo = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<"visual" | "audio">("visual");
  const [isListening, setIsListening] = useState(false);
  const [focusedCandidate, setFocusedCandidate] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [spokenText, setSpokenText] = useState("");
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);

  // Real eye tracking with MediaPipe FaceMesh
  const eyeTracking = useEyeTracking(
    videoRef,
    canvasRef,
    cameraActive && mode === "visual" && eyeTrackingEnabled
  );

  const gazePosition = eyeTracking.gazePosition;

  // Start camera (simplified - MediaPipe handles camera via useEyeTracking)
  const startCamera = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }
      
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraError(null);
        // Enable eye tracking after camera starts
        setEyeTrackingEnabled(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    setEyeTrackingEnabled(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  // Eye tracking is now handled by the useEyeTracking hook with real MediaPipe FaceMesh

  // Determine which candidate is being looked at
  useEffect(() => {
    if (mode !== "visual" || selectedCandidate !== null) return;

    const candidateZones = [
      { id: 1, minX: 5, maxX: 35, minY: 35, maxY: 75 },
      { id: 2, minX: 35, maxX: 65, minY: 35, maxY: 75 },
      { id: 3, minX: 65, maxX: 95, minY: 35, maxY: 75 },
    ];

    const focused = candidateZones.find(zone => 
      gazePosition.x >= zone.minX && 
      gazePosition.x <= zone.maxX &&
      gazePosition.y >= zone.minY &&
      gazePosition.y <= zone.maxY
    );

    setFocusedCandidate(focused?.id || null);
  }, [gazePosition, mode, selectedCandidate]);

  // Dwell time selection
  useEffect(() => {
    if (!focusedCandidate || mode !== "visual" || selectedCandidate !== null) {
      setDwellProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setDwellProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          setSelectedCandidate(focusedCandidate);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [focusedCandidate, mode, selectedCandidate]);

  // Voice recognition simulation
  useEffect(() => {
    if (mode !== "audio" || !isListening) return;

    const commands = [
      "Listening...",
      "Say a candidate number...",
      "Vote for candidate one",
      "Processing voice command...",
    ];

    let index = 0;
    const interval = setInterval(() => {
      setSpokenText(commands[index % commands.length]);
      index++;
      
      if (index === 3 && selectedCandidate === null) {
        setSelectedCandidate(1);
        setIsListening(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mode, isListening, selectedCandidate]);

  // Confirm vote
  const confirmVote = () => {
    setVoteConfirmed(true);
  };

  // Reset demo
  const resetDemo = () => {
    setSelectedCandidate(null);
    setVoteConfirmed(false);
    setDwellProgress(0);
    setFocusedCandidate(null);
    setSpokenText("");
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-effect">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              stopCamera();
              navigate("/");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-foreground">Lumina</span>
            <span className="font-display text-lg font-bold text-gradient">X</span>
            <span className="text-sm text-muted-foreground ml-2">Demo Mode</span>
          </div>

          <div className="flex items-center gap-2">
            {cameraActive ? (
              <div className="flex items-center gap-2 text-accent text-sm">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Camera Active
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <CameraOff className="w-4 h-4" />
                Camera Off
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="container px-4">
          <AnimatePresence mode="wait">
            {voteConfirmed ? (
              /* Vote Confirmation Screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto text-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-8"
                >
                  <CheckCircle className="w-12 h-12 text-accent" />
                </motion.div>
                
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Vote Recorded Successfully!
                </h2>
                
                <p className="text-muted-foreground mb-6">
                  Your encrypted ballot has been stored securely.
                </p>

                <div className="p-6 rounded-xl bg-card border border-border mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Receipt Hash</p>
                  <p className="font-mono text-primary text-sm break-all">
                    {`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
                  </p>
                </div>

                <Button onClick={resetDemo} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Try Again
                </Button>
              </motion.div>
            ) : (
              /* Voting Interface */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
              >
                {/* Mode Toggle */}
                <div className="flex justify-center gap-4 mb-8">
                  <Button
                    variant={mode === "visual" ? "default" : "outline"}
                    onClick={() => setMode("visual")}
                    className={mode === "visual" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visual Mode
                  </Button>
                  <Button
                    variant={mode === "audio" ? "default" : "outline"}
                    onClick={() => setMode("audio")}
                    className={mode === "audio" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Audio Mode
                  </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Camera Feed */}
                  <div className="relative">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-card border border-border relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                      
                      {/* Gaze indicator overlay - only show when tracking */}
                      {cameraActive && mode === "visual" && eyeTracking.isTracking && (
                        <motion.div
                          className="absolute w-10 h-10 pointer-events-none z-10"
                          style={{
                            left: `${gazePosition.x}%`,
                            top: `${gazePosition.y}%`,
                            transform: "translate(-50%, -50%)"
                          }}
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="w-full h-full rounded-full border-2 border-accent bg-accent/20 shadow-lg shadow-accent/30" />
                          <div className="absolute inset-2.5 rounded-full bg-accent" />
                        </motion.div>
                      )}

                      {/* Face not detected warning */}
                      {cameraActive && mode === "visual" && !eyeTracking.isTracking && eyeTrackingEnabled && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-destructive/90 text-destructive-foreground text-sm flex items-center gap-2 z-20">
                          <AlertCircle className="w-4 h-4" />
                          Face not detected - Please face the camera
                        </div>
                      )}

                      {/* Face mesh is drawn on canvas by useEyeTracking hook */}

                      {/* Camera error state */}
                      {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card">
                          <div className="text-center p-8">
                            <CameraOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">{cameraError}</p>
                            <Button onClick={startCamera} variant="outline">
                              <Camera className="w-4 h-4 mr-2" />
                              Retry Camera
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mode-specific info */}
                    <div className="mt-4 p-4 rounded-xl bg-card border border-border">
                      {mode === "visual" ? (
                        <div className="flex items-start gap-3">
                          <Eye className={`w-5 h-5 mt-0.5 ${eyeTracking.isTracking ? 'text-accent' : 'text-muted-foreground'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground">
                                {eyeTracking.isTracking ? 'Eye Tracking Active' : 'Initializing Eye Tracking...'}
                              </p>
                              {eyeTracking.isTracking && (
                                <span className="flex items-center gap-1.5 text-xs text-accent">
                                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                  MediaPipe FaceMesh
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Look at a candidate card for 2 seconds to select. Real iris tracking detects your gaze direction.
                            </p>
                            {eyeTracking.isTracking && eyeTracking.irisPositions.left && (
                              <div className="mt-2 text-xs font-mono text-muted-foreground/70">
                                Gaze: ({gazePosition.x.toFixed(1)}%, {gazePosition.y.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <Volume2 className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Voice Commands</p>
                            <p className="text-sm text-muted-foreground">
                              Say "Vote for [candidate name/number]" to make your selection.
                            </p>
                            {spokenText && (
                              <p className="text-sm text-primary mt-2 font-mono">"{spokenText}"</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Audio mode controls */}
                    {mode === "audio" && (
                      <div className="mt-4">
                        <Button
                          onClick={() => setIsListening(!isListening)}
                          className={`w-full ${isListening ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="w-4 h-4 mr-2" />
                              Stop Listening
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4 mr-2" />
                              Start Voice Command
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Candidate Cards */}
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                      Select Your Candidate
                    </h2>
                    
                    <div className="space-y-4">
                      {candidates.map((candidate) => {
                        const isFocused = focusedCandidate === candidate.id;
                        const isSelected = selectedCandidate === candidate.id;

                        return (
                          <motion.div
                            key={candidate.id}
                            className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                              isSelected 
                                ? 'bg-primary/10 border-primary' 
                                : isFocused 
                                  ? 'bg-card border-primary/50' 
                                  : 'bg-card border-border hover:border-primary/30'
                            }`}
                            onClick={() => !selectedCandidate && setSelectedCandidate(candidate.id)}
                            whileHover={{ scale: selectedCandidate ? 1 : 1.02 }}
                          >
                            {/* Dwell progress */}
                            {isFocused && !isSelected && mode === "visual" && (
                              <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-xl overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  style={{ width: `${dwellProgress}%` }}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              {/* Selection indicator */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-primary' : 'bg-muted'
                              }`}>
                                {isSelected ? (
                                  <CheckCircle className="w-5 h-5 text-primary-foreground" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>

                              {/* Candidate info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">#{candidate.id}</span>
                                  <h3 className="font-display text-lg font-semibold text-foreground">
                                    {candidate.name}
                                  </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">{candidate.party}</p>
                              </div>

                              {/* Party color */}
                              <div 
                                className="w-4 h-12 rounded-full"
                                style={{ backgroundColor: candidate.color }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Confirm button */}
                    {selectedCandidate && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                      >
                        <Button
                          onClick={confirmVote}
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg font-semibold"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Confirm Vote for {candidates.find(c => c.id === selectedCandidate)?.name}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={resetDemo}
                          className="w-full mt-2 text-muted-foreground"
                        >
                          Cancel & Start Over
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Demo;
