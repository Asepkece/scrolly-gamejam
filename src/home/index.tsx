// Next, React
import { FC, useEffect, useRef, useState } from 'react';
import pkg from '../../../package.json';
import React from 'react';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

const STORAGE_KEY = "tap-hero-save";

type Theme = "neon" | "dark" | "pastel";

const themes: Record<Theme, string> = {
  neon: "from-indigo-600 via-purple-600 to-pink-500",
  dark: "from-neutral-900 via-neutral-800 to-neutral-700",
  pastel: "from-pink-300 via-purple-300 to-blue-300",
};

const characters = [
  { id: 1, name: "Bunny", emoji: "🐰", perk: "big" },
  { id: 2, name: "Cat", emoji: "🐱", perk: "bonus" },
  { id: 3, name: "Alien", emoji: "👽", perk: "random" },
  { id: 4, name: "Robot", emoji: "🤖", perk: "double" },
] as const;

type Character = (typeof characters)[number];

type Status =
  | "menu"
  | "character"
  | "tutorial"
  | "playing"
  | "paused"
  | "levelClear"
  | "over";

type TargetType = "normal" | "bonus" | "trap";

/* ================== COMPONENT ================== */

const GameSandbox: FC = () => {
  /* ---------- STATE ---------- */
  const [status, setStatus] = useState<Status>("menu");
  const [character, setCharacter] = useState<Character>(characters[0]);
  const [theme, setTheme] = useState<Theme>("neon");

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const [targetX, setTargetX] = useState(50);
  const [targetY, setTargetY] = useState(60);
  const [targetType, setTargetType] = useState<TargetType>("normal");

  const [floatText, setFloatText] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  const [flash, setFlash] = useState(false);
  const [hit, setHit] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const maxLevel = 50;
  const scoreToClear = Math.floor(level * 4 + level ** 1.2);

  /* ---------- SOUND ---------- */
  const sounds = useRef({
    tap: new Audio("/sounds/tap.mp3"),
    bonus: new Audio("/sounds/bonus.mp3"),
    trap: new Audio("/sounds/trap.mp3"),
    level: new Audio("/sounds/level.mp3"),
  });

  useEffect(() => {
    Object.values(sounds.current).forEach((s) => (s.volume = 0.4));
  }, []);

  /* ---------- SAVE / LOAD ---------- */
  useEffect(() => {
    const save = localStorage.getItem(STORAGE_KEY);
    if (!save) return;

    const data = JSON.parse(save);
    const c = characters.find((x) => x.id === data.characterId);
    if (c) setCharacter(c);
    if (data.theme) setTheme(data.theme);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bestLevel: level,
        characterId: character.id,
        theme,
      })
    );
  }, [level, character, theme]);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (status !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setStatus("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  /* ---------- AI DIFFICULTY ---------- */
  const accuracy =
    hits + misses === 0 ? 0.5 : hits / (hits + misses);

  useEffect(() => {
    if (status !== "playing") return;

    let speed = Math.max(220, 900 - level * 12);
    if (accuracy > 0.75) speed -= 120;
    if (accuracy < 0.4) speed += 150;
    if (character.perk === "big") speed += 120;

    const trapChance =
      accuracy > 0.8 ? 0.18 : accuracy < 0.4 ? 0.05 : 0.1;

    const mover = setInterval(() => {
      setTargetX(Math.random() * 80 + 10);
      setTargetY(Math.random() * 50 + 25);

      const r = Math.random();
      if (r > 1 - trapChance) setTargetType("trap");
      else if (r > 0.75) setTargetType("bonus");
      else setTargetType("normal");
    }, speed);

    return () => clearInterval(mover);
  }, [status, level, accuracy, character]);

  /* ---------- TAP ---------- */
  const tapTarget = () => {
    if (status !== "playing") return;

    let add = 1;

    if (targetType === "bonus")
      add = character.perk === "bonus" ? 8 : 5;
    if (targetType === "trap") add = -2;

    if (character.perk === "double") add *= 2;
    if (character.perk === "random" && targetType === "trap") {
      if (Math.random() < 0.3) add = 3;
    }

    if (add < 0) {
      sounds.current.trap.play();
      setMisses((m) => m + 1);
    } else {
      sounds.current[add > 1 ? "bonus" : "tap"].play();
      setHits((h) => h + 1);
    }

    setScore((prev) => {
      const next = Math.max(0, prev + add);
      if (next >= scoreToClear) {
        sounds.current.level.play();
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
        setStatus("levelClear");
      }
      return next;
    });

    setFloatText({
      x: targetX,
      y: targetY,
      value: add > 0 ? `+${add}` : `${add}`,
    });

    setHit(true);
    setTimeout(() => setHit(false), 120);
    setTimeout(() => setFloatText(null), 500);

    if ("vibrate" in navigator) navigator.vibrate(10);
  };

  /* ---------- FLOW ---------- */
  const startGame = () => {
    setLevel(1);
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(60);
    setTutorialStep(0);
    setStatus("tutorial");
  };

  const nextLevel = () => {
    if (level >= maxLevel) {
      setStatus("over");
      return;
    }
    setLevel((l) => l + 1);
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(60);
    setStatus("playing");
  };

  const resume = () => {
    setTargetX(Math.random() * 80 + 10);
    setTargetY(Math.random() * 50 + 25);
    setStatus("playing");
  };

  /* ================== UI ================== */

  return (
    <div className="w-full h-screen overflow-y-auto bg-neutral-900 flex justify-center py-10">
      {/* PHONE FRAME */}
      <div className="relative w-[360px] h-[720px] rounded-[2.5rem] bg-black shadow-2xl border-4 border-neutral-800 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20" />

        <div
          className={`relative w-full h-full text-white bg-gradient-to-b ${
            flash ? "from-yellow-400 to-yellow-300" : themes[theme]
          }`}
        >
          {/* MENU */}
          {status === "menu" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="text-3xl font-extrabold mb-2">🎮 TAP HERO</div>
              <div className="flex gap-2 mb-4">
                {(Object.keys(themes) as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      theme === t
                        ? "bg-white text-black"
                        : "bg-black/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStatus("character")}
                className="px-8 py-3 rounded-full bg-white text-purple-700 font-bold"
              >
                Start
              </button>
            </div>
          )}

          {/* CHARACTER */}
          {status === "character" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="mb-4 font-bold">Choose Hero</div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCharacter(c)}
                    className={`w-20 h-20 rounded-2xl text-4xl ${
                      character.id === c.id
                        ? "bg-yellow-300 text-black scale-110"
                        : "bg-white/20"
                    }`}
                  >
                    {c.emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 rounded-full bg-green-400 text-black font-bold"
              >
                Play
              </button>
            </div>
          )}

          {/* TUTORIAL */}
          {status === "tutorial" && (
            <div
              onClick={() =>
                tutorialStep >= 2
                  ? setStatus("playing")
                  : setTutorialStep((s) => s + 1)
              }
              className="absolute inset-0 bg-black/70 flex items-center justify-center text-center px-4 cursor-pointer"
            >
              <div>
                {tutorialStep === 0 && "Tap the emoji to score"}
                {tutorialStep === 1 && "Green = bonus · Red = trap"}
                {tutorialStep === 2 && "Clear the score before time ends"}
                <div className="mt-4 text-xs opacity-60">Tap to continue</div>
              </div>
            </div>
          )}

          {/* HUD */}
          {status === "playing" && (
            <div className="absolute top-6 left-0 right-0 px-4 flex justify-between text-sm font-bold">
              <div>Lv {level}</div>
              <div>{score}/{scoreToClear}</div>
              <div>{timeLeft}s</div>
            </div>
          )}

          {/* GAME */}
          {status === "playing" && (
            <>
              <button
                onClick={tapTarget}
                className={`absolute flex items-center justify-center shadow-xl transition
                ${hit ? "scale-125 rotate-6" : "active:scale-90"}
                ${
                  targetType === "trap"
                    ? "bg-red-400"
                    : targetType === "bonus"
                    ? "bg-green-400"
                    : "bg-white"
                }
                ${
                  character.perk === "big"
                    ? "w-20 h-20"
                    : "w-14 h-14"
                } rounded-full`}
                style={{
                  left: `${targetX}%`,
                  top: `${targetY}%`,
                  transform: "translate(-50%,-50%)",
                }}
              >
                <span className="text-3xl">{character.emoji}</span>
              </button>

              {floatText && (
                <div
                  className="absolute text-xl font-bold animate-bounce pointer-events-none"
                  style={{
                    left: `${floatText.x}%`,
                    top: `${floatText.y - 8}%`,
                  }}
                >
                  {floatText.value}
                </div>
              )}

              <div className="absolute bottom-4 w-full flex justify-center">
                <button
                  onClick={() => setStatus("paused")}
                  className="px-4 py-1 rounded-full bg-black/30 text-xs"
                >
                  Pause
                </button>
              </div>
            </>
          )}

          {/* PAUSE */}
          {status === "paused" && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <button
                onClick={resume}
                className="mb-2 px-6 py-2 bg-green-400 text-black rounded-full"
              >
                Resume
              </button>
              <button
                onClick={() => setStatus("menu")}
                className="px-6 py-2 bg-white text-black rounded-full"
              >
                Quit
              </button>
            </div>
          )}

          {/* LEVEL CLEAR */}
          {status === "levelClear" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-extrabold mb-3">
                🎉 Level {level} Clear!
              </div>
              <button
                onClick={nextLevel}
                className="px-6 py-2 bg-yellow-300 text-black rounded-full"
              >
                Next Level
              </button>
            </div>
          )}

          {/* GAME OVER */}
          {status === "over" && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-extrabold mb-3">
                {level >= maxLevel ? "🏆 YOU WIN!" : "💀 GAME OVER"}
              </div>
              <button
                onClick={() => setStatus("menu")}
                className="px-6 py-2 bg-white text-black rounded-full"
              >
                Back to Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSandbox;
