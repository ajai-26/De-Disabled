import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, BookOpen, BookOpenText, Brain, HeartHandshake, MessageSquare, Play, Plus, RefreshCcw, Sparkles, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RewardState = { stars: number; streak: number; lastDay: string };

const todayKey = () => new Date().toISOString().slice(0, 10);

const EMOJI: Record<string, string> = {
  Happy: "😀",
  Sad: "😢",
  Angry: "😠",
  Calm: "😌",
  Excited: "🤩",
  Surprised: "😲",
  Sleepy: "😴",
  Scared: "😨",
  Silly: "🤪",
};

const NUMBER_EMOJI: Record<string, string> = {
  One: "1️⃣",
  Two: "2️⃣",
  Three: "3️⃣",
  Four: "4️⃣",
  Five: "5️⃣",
};

const SAFETY_EMOJI: Record<string, string> = {
  Stop: "🛑",
  Help: "🆘",
  Water: "💧",
  Rest: "😴",
  Yes: "✅",
  No: "❌",
};

function LearnVisual({ tab, label }: { tab: string; label: string }) {
  if (tab === "Shapes") {
    if (label === "Circle") {
      return <div className="h-10 w-10 rounded-full border border-primary/40 bg-primary/15" />;
    }
    if (label === "Square") {
      return <div className="h-10 w-10 rounded-xl border border-primary/40 bg-primary/15" />;
    }
    if (label === "Triangle") {
      return (
        <div
          className="h-0 w-0"
          style={{
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderBottom: "36px solid rgba(99, 102, 241, 0.25)",
          }}
        />
      );
    }
    if (label === "Star") return <div className="text-3xl leading-none">⭐</div>;
    if (label === "Heart") return <div className="text-3xl leading-none">❤️</div>;
  }

  if (tab === "Numbers" && NUMBER_EMOJI[label]) {
    return <div className="text-3xl leading-none">{NUMBER_EMOJI[label]}</div>;
  }

  if (tab === "Safety" && SAFETY_EMOJI[label]) {
    return <div className="text-3xl leading-none">{SAFETY_EMOJI[label]}</div>;
  }

  return <div className="text-3xl leading-none">✨</div>;
}

function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

const WelfareHub = () => {
  const navigate = useNavigate();

  const [reward, setReward] = useState<RewardState>(() => {
    const raw = localStorage.getItem("welfare_reward_v1");
    return raw ? JSON.parse(raw) : { stars: 0, streak: 0, lastDay: "" };
  });

  const grantStar = (n = 1) => {
    setReward(prev => {
      const day = todayKey();
      const streak = prev.lastDay === day ? prev.streak : prev.lastDay ? prev.streak + 1 : 1;
      const next = { stars: prev.stars + n, streak, lastDay: day };
      localStorage.setItem("welfare_reward_v1", JSON.stringify(next));
      return next;
    });
  };

  // --------- Learning Cards ----------
  const learnSets = useMemo(
    () => ({
      Numbers: [
        { label: "One", say: "One" },
        { label: "Two", say: "Two" },
        { label: "Three", say: "Three" },
        { label: "Four", say: "Four" },
        { label: "Five", say: "Five" },
      ],
      Shapes: [
        { label: "Circle", say: "Circle" },
        { label: "Square", say: "Square" },
        { label: "Triangle", say: "Triangle" },
        { label: "Star", say: "Star" },
        { label: "Heart", say: "Heart" },
      ],
      Safety: [
        { label: "Stop", say: "Stop. Please wait." },
        { label: "Help", say: "Help me, please." },
        { label: "Water", say: "I want water." },
        { label: "Rest", say: "I need a break." },
        { label: "Yes", say: "Yes." },
        { label: "No", say: "No." },
      ],
    }),
    []
  );
  const [learnTab, setLearnTab] = useState<keyof typeof learnSets>("Numbers");

  // --------- Emotion Match ----------
  const emotionRounds = useMemo(
    () => [
      { prompt: "Happy", options: ["Happy", "Sad", "Angry"], answer: "Happy" },
      { prompt: "Sad", options: ["Excited", "Sad", "Surprised"], answer: "Sad" },
      { prompt: "Angry", options: ["Angry", "Sleepy", "Calm"], answer: "Angry" },
      { prompt: "Calm", options: ["Calm", "Scared", "Silly"], answer: "Calm" },
    ],
    []
  );
  const [roundIdx, setRoundIdx] = useState(0);
  const [roundMsg, setRoundMsg] = useState<string | null>(null);

  const currentRound = emotionRounds[roundIdx % emotionRounds.length];

  const pickEmotion = (opt: string) => {
    if (opt === currentRound.answer) {
      setRoundMsg("✅ Correct! Great job.");
      speak("Correct. Great job.");
      grantStar(2);
      setTimeout(() => setRoundIdx(i => i + 1), 450);
    } else {
      setRoundMsg("Try again 🙂");
      speak("Try again.");
    }
    setTimeout(() => setRoundMsg(null), 1200);
  };

  // --------- Routine Builder ----------
  type Step = { id: string; title: string; done: boolean };
  const [steps, setSteps] = useState<Step[]>(() => {
    const raw = localStorage.getItem("welfare_routine_v1");
    return raw ? JSON.parse(raw) : [
      { id: "1", title: "Brush teeth", done: false },
      { id: "2", title: "Drink water", done: false },
      { id: "3", title: "Pack bag", done: false },
    ];
  });
  const [newStep, setNewStep] = useState("");

  useEffect(() => {
    localStorage.setItem("welfare_routine_v1", JSON.stringify(steps));
  }, [steps]);

  const toggleStep = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
    grantStar(1);
  };

  const moveStep = (id: string, dir: -1 | 1) => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(j, 0, item);
      return copy;
    });
  };

  const addStep = () => {
    const t = newStep.trim();
    if (!t) return;
    setSteps(prev => [...prev, { id: crypto.randomUUID(), title: t, done: false }]);
    setNewStep("");
    speak(t);
    grantStar(1);
  };

  const resetRoutine = () => {
    setSteps([
      { id: crypto.randomUUID(), title: "Wash hands", done: false },
      { id: crypto.randomUUID(), title: "Eat breakfast", done: false },
      { id: crypto.randomUUID(), title: "Take medicine", done: false },
    ]);
  };

  // --------- AAC Talk Board ----------
  const [customPhrase, setCustomPhrase] = useState("");
  const [phrases, setPhrases] = useState<string[]>(() => {
    const raw = localStorage.getItem("welfare_aac_v1");
    return raw ? JSON.parse(raw) : [
      "Hello",
      "Thank you",
      "I need help",
      "I am hungry",
      "I am thirsty",
      "I want to go outside",
      "Please stop",
      "I feel pain",
    ];
  });

  useEffect(() => {
    localStorage.setItem("welfare_aac_v1", JSON.stringify(phrases));
  }, [phrases]);

  const addPhrase = () => {
    const t = customPhrase.trim();
    if (!t) return;
    setPhrases(prev => [t, ...prev].slice(0, 24));
    setCustomPhrase("");
    speak(t);
    grantStar(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight">CareSync Welfare Hub</div>
              <div className="text-xs text-muted-foreground">
                Interactive learning • Routine coaching • Communication support
              </div>
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
            <Button variant="outline" onClick={() => navigate("/media")}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Media player
            </Button>

            <div className="hidden sm:flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2">
              <Award className="h-4 w-4 text-primary" />
              <div className="text-xs">
                <div className="font-medium tabular-nums">{reward.stars} Stars</div>
                <div className="text-muted-foreground tabular-nums">Streak: {reward.streak}</div>
              </div>
            </div>

            <Button variant="outline" onClick={() => navigate("/vote")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Voting Portal
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold tracking-tight">A novelty-first welfare experience</div>
              <div className="text-sm text-muted-foreground">
                Designed for mentally challenged and physically disabled users: big targets, voice prompts,
                short actions, and gentle rewards.
              </div>
            </div>

            <Button variant="secondary" onClick={() => speak("Welcome to CareSync. Choose an activity to begin.")}>
              <Play className="mr-2 h-4 w-4" />
              Read aloud
            </Button>
          </div>

          <Tabs defaultValue="learn" className="mt-5">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="learn" className="gap-2">
                <BookOpen className="h-4 w-4" /> Learn
              </TabsTrigger>
              <TabsTrigger value="emotion" className="gap-2">
                <Brain className="h-4 w-4" /> Emotions
              </TabsTrigger>
              <TabsTrigger value="routine" className="gap-2">
                <HeartHandshake className="h-4 w-4" /> Routine
              </TabsTrigger>
              <TabsTrigger value="talk" className="gap-2">
                <MessageSquare className="h-4 w-4" /> TalkBoard
              </TabsTrigger>
            </TabsList>

            {/* Learn */}
            <TabsContent value="learn" className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Tap a card</div>
                  <div className="text-sm text-muted-foreground">
                    Each tap speaks the word and grants a star.
                  </div>
                </div>

                <div className="flex gap-2">
                  {(Object.keys(learnSets) as Array<keyof typeof learnSets>).map(k => (
                    <button
                      key={k}
                      onClick={() => setLearnTab(k)}
                      className={[
                        "rounded-lg border px-3 py-2 text-xs",
                        learnTab === k ? "bg-primary/10 border-primary/30" : "bg-muted/20"
                      ].join(" ")}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {learnSets[learnTab].map((c, idx) => (
                  <Card
                    key={idx}
                    className="rounded-2xl border bg-background p-5 shadow-sm transition hover:border-primary/30"
                  >
                    <button
                      className="flex w-full flex-col items-start gap-2"
                      onClick={() => {
                        speak(c.say);
                        grantStar(1);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <LearnVisual tab={learnTab} label={c.label} />
                        <div>
                          <div className="text-base font-semibold">{c.label}</div>
                          <div className="text-sm text-muted-foreground">Tap to hear</div>
                        </div>
                      </div>
                    </button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Emotion Match */}
            <TabsContent value="emotion" className="mt-4">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="text-sm font-semibold">Emotion Match</div>
                <div className="text-sm text-muted-foreground">
                  Pick the emotion that matches the prompt. Great for social learning.
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
                <Card className="rounded-2xl border bg-background p-6 shadow-sm">
                  <div className="text-xs text-muted-foreground">Prompt</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {currentRound.prompt} {EMOJI[currentRound.prompt] ?? ""}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {currentRound.options.map(opt => (
                      <Button
                        key={opt}
                        size="lg"
                        className="h-16 rounded-2xl text-base"
                        variant="outline"
                        onClick={() => pickEmotion(opt)}
                      >
                        {opt} {EMOJI[opt] ?? ""}
                      </Button>
                    ))}
                  </div>

                  {roundMsg && (
                    <div className="mt-4 rounded-xl border bg-primary/10 p-3 text-sm">
                      {roundMsg}
                    </div>
                  )}
                </Card>

                <Card className="rounded-2xl border bg-background p-6 shadow-sm">
                  <div className="text-sm font-semibold">Caregiver tip</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Ask the learner to act the emotion with their face and body. You can mirror it together.
                    Reinforce with one small reward after each correct choice.
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-4 w-full rounded-2xl"
                    onClick={() => speak(`The prompt is ${currentRound.prompt}. Choose the matching emotion.`)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Read prompt
                  </Button>
                </Card>
              </div>
            </TabsContent>

            {/* Routine Builder */}
            <TabsContent value="routine" className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/20 p-4">
                <div>
                  <div className="text-sm font-semibold">Visual Routine Coach</div>
                  <div className="text-sm text-muted-foreground">
                    Check off steps (stars) and keep a gentle daily streak.
                  </div>
                </div>
                <Button variant="outline" onClick={resetRoutine}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  New template
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                {steps.map((s, idx) => (
                  <Card
                    key={s.id}
                    className={[
                      "rounded-2xl border bg-background p-4 shadow-sm",
                      s.done ? "border-primary/30 bg-primary/5" : ""
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => toggleStep(s.id)}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={[
                            "h-6 w-6 rounded-full border",
                            s.done ? "bg-primary/20 border-primary/40" : "bg-muted/20"
                          ].join(" ")}
                        />
                        <div>
                          <div className="text-sm font-semibold">{s.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Step {idx + 1} • Tap to {s.done ? "uncheck" : "check"}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => moveStep(s.id, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => moveStep(s.id, 1)}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => speak(s.title)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Speak
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border bg-background p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={newStep}
                    onChange={e => setNewStep(e.target.value)}
                    placeholder="Add a new step…"
                    className="h-12 rounded-2xl"
                  />
                  <Button className="h-12 rounded-2xl" onClick={addStep}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Tip: Keep steps short and concrete (e.g., “Drink water”).
                </div>
              </div>
            </TabsContent>

            {/* TalkBoard */}
            <TabsContent value="talk" className="mt-4">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="text-sm font-semibold">AAC TalkBoard</div>
                <div className="text-sm text-muted-foreground">
                  Tap phrases to speak them. Add a custom phrase for personal needs.
                </div>
              </div>

              <div className="mt-4 rounded-2xl border bg-background p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={customPhrase}
                    onChange={e => setCustomPhrase(e.target.value)}
                    placeholder="Add a custom phrase…"
                    className="h-12 rounded-2xl"
                  />
                  <Button className="h-12 rounded-2xl" onClick={addPhrase}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Examples: “I need the washroom”, “Please call my caregiver”, “I feel anxious”.
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {phrases.map((p, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-20 rounded-2xl text-base"
                    onClick={() => {
                      speak(p);
                      grantStar(1);
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border bg-primary/10 p-4">
                <div className="text-sm font-semibold">Novelty: “Repeat-Assist”</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Each phrase tap increases confidence and builds a measurable daily “communication streak”.
                  Progress is stored locally on the device (no accounts required).
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="text-sm font-semibold">Accessibility-first UI</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Large buttons, low cognitive load, consistent layouts, and audio prompts.
            </div>
          </Card>
          <Card className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="text-sm font-semibold">Offline-by-default</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Works without internet for learning, routines, and TalkBoard (voice depends on OS voices).
            </div>
          </Card>
          <Card className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="text-sm font-semibold">Caregiver-ready</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Clear activities, quick templates, and local progress tracking for review.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WelfareHub;
