"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import * as THREE from "three";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  Code2,
  Cpu,
  Mail,
  Network,
  Send,
  ShieldCheck,
  Sigma,
  Terminal as TerminalIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"] });

/* ---------------------------- Editable content ---------------------------- */
const NAME = "Bektemur Bektemirov";
const ROLE = "Full-Stack Developer & Security Enthusiast";
const LINKS = {
  github: "https://github.com/",
  telegram: "https://t.me/",
  email: "mailto:hello@example.com",
};
const PROJECTS = [
  {
    title: "Django Blog Engine",
    text: "Full-stack blog with accounts, a post editor, comments, and an admin dashboard.",
    stack: ["Django", "SQLite", "HTML", "CSS"],
    color: "176,38,255",
  },
  {
    title: "Task Orbit",
    text: "Fast task manager with filters, drag ordering, and offline-first saving.",
    stack: ["JavaScript", "CSS", "localStorage"],
    color: "0,243,255",
  },
  {
    title: "Neon Portfolio",
    text: "This site: a 3D, terminal-driven portfolio built on the Next.js App Router.",
    stack: ["Next.js", "Three.js", "Framer Motion"],
    color: "16,245,160",
  },
  {
    title: "Sec Notebook",
    text: "Notes and Bash scripts from my network-inspection and Linux practice labs.",
    stack: ["Bash", "BlackArch", "Networking"],
    color: "0,243,255",
  },
];
const COMMANDS = ["help", "whoami", "about", "skills", "projects", "matrix", "sudo", "clear"];

/* --------------------------------- Styles --------------------------------- */
const CSS = `
.glitch{position:relative}
.glitch::before,.glitch::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none}
.glitch::before{color:#00f3ff;transform:translate(3px,0);animation:gl1 3.2s infinite steps(1)}
.glitch::after{color:#b026ff;transform:translate(-3px,0);animation:gl2 2.7s infinite steps(1)}
@keyframes gl1{0%,86%,100%{clip-path:inset(0 0 100% 0)}88%{clip-path:inset(8% 0 62% 0)}93%{clip-path:inset(45% 0 30% 0)}97%{clip-path:inset(75% 0 4% 0)}}
@keyframes gl2{0%,80%,100%{clip-path:inset(100% 0 0 0)}83%{clip-path:inset(60% 0 12% 0)}90%{clip-path:inset(20% 0 55% 0)}95%{clip-path:inset(2% 0 85% 0)}}
.caret{animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.glitch::before,.glitch::after{display:none}.caret{animation:none}}
`;

/* ------------------------- Three.js particle network ----------------------- */
function ThreeBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
    camera.position.z = 45;
    const group = new THREE.Group();
    scene.add(group);

    const COUNT = 1000;
    const NODES = 120;
    const MAXSEG = 400;
    const base = new Float32Array(COUNT * 3);
    const pos = new Float32Array(COUNT * 3);
    const off = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const palette = [0x00f3ff, 0xb026ff, 0x10f5a0].map((h) => new THREE.Color(h));
    for (let i = 0; i < COUNT; i++) {
      const k = i * 3;
      base[k] = (Math.random() - 0.5) * 140;
      base[k + 1] = (Math.random() - 0.5) * 80;
      base[k + 2] = (Math.random() - 0.5) * 60;
      const c = palette[Math.floor(Math.random() * 3)];
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
    }
    pos.set(base);

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pointsGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Points(pointsGeo, pointsMat));

    const linePos = new Float32Array(MAXSEG * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", onResize);

    const RADIUS = 11;
    let raf = 0;
    const frame = (now: number) => {
      const t = now * 0.001;
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const wx = mouse.x * halfH * camera.aspect;
      const wy = mouse.y * halfH;
      const drift = still ? 0 : 1;

      for (let i = 0; i < COUNT; i++) {
        const k = i * 3;
        const px = base[k] + Math.sin(t * 0.4 + i) * 0.9 * drift + off[k];
        const py = base[k + 1] + Math.cos(t * 0.35 + i * 1.3) * 0.9 * drift + off[k + 1];
        let tx = 0;
        let ty = 0;
        if (!still) {
          const dx = px - wx;
          const dy = py - wy;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (d < RADIUS) {
            const push = ((RADIUS - d) / RADIUS) * 8;
            tx = (dx / d) * push;
            ty = (dy / d) * push;
          }
        }
        off[k] += (tx - off[k]) * 0.08;
        off[k + 1] += (ty - off[k + 1]) * 0.08;
        pos[k] = px;
        pos[k + 1] = py;
        pos[k + 2] = base[k + 2];
      }

      let seg = 0;
      for (let i = 0; i < NODES && seg < MAXSEG; i++) {
        for (let j = i + 1; j < NODES && seg < MAXSEG; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < 256) {
            linePos.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], seg * 6);
            seg++;
          }
        }
      }
      lineGeo.setDrawRange(0, seg * 2);
      lineGeo.attributes.position.needsUpdate = true;
      pointsGeo.attributes.position.needsUpdate = true;

      group.rotation.x += (-mouse.y * 0.12 - group.rotation.x) * 0.04;
      group.rotation.y += (mouse.x * 0.2 - group.rotation.y) * 0.04;
      renderer.render(scene, camera);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      pointsGeo.dispose();
      pointsMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 h-full w-full" />;
}

/* --------------------- Full-screen effects (matrix, confetti) -------------- */
type Fx = { kind: "matrix" | "confetti"; id: number } | null;

function FxLayer({ fx, onDone }: { fx: Fx; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!fx || !c || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const w = (c.width = window.innerWidth);
    const h = (c.height = window.innerHeight);
    c.style.opacity = "1";
    ctx.clearRect(0, 0, w, h);
    const t0 = performance.now();
    let raf = 0;
    let timer = 0;
    const finish = () => {
      c.style.opacity = "0";
      timer = window.setTimeout(() => {
        ctx.clearRect(0, 0, w, h);
        onDone();
      }, 700);
    };

    if (fx.kind === "matrix") {
      const size = 16;
      const drops = Array.from({ length: Math.ceil(w / size) }, () => -Math.random() * 40);
      const glyphs = "01<>/{}$#=+*ｱｲｳｴｵｶｷｸ";
      const tick = (now: number) => {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,0.14)";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        ctx.font = `${size}px monospace`;
        drops.forEach((y, i) => {
          ctx.fillStyle = Math.random() > 0.96 ? "#d9fff0" : "#10f5a0";
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, y * size);
          drops[i] = y * size > h && Math.random() > 0.975 ? 0 : y + 1;
        });
        if (now - t0 < 4500) raf = requestAnimationFrame(tick);
        else finish();
      };
      raf = requestAnimationFrame(tick);
    } else {
      const colors = ["#00f3ff", "#b026ff", "#10f5a0", "#ffffff"];
      const bits = Array.from({ length: 160 }, () => ({
        x: w / 2,
        y: h * 0.55,
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 16 - 4,
        s: Math.random() * 7 + 4,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
      const tick = (now: number) => {
        ctx.clearRect(0, 0, w, h);
        bits.forEach((p) => {
          p.vy += 0.35;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.99;
          p.r += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        });
        if (now - t0 < 3200) raf = requestAnimationFrame(tick);
        else finish();
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [fx, onDone]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full transition-opacity duration-700"
    />
  );
}

/* --------------------------------- Helpers -------------------------------- */
function useTypewriter(text: string, speed = 45) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

function useBeep(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(
    (freqs: number[]) => {
      if (!enabled) return;
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = (ctxRef.current ??= new AC());
        freqs.forEach((f, i) => {
          const start = ctx.currentTime + i * 0.09;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.04, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.14);
        });
      } catch {
        /* audio unavailable: ignore */
      }
    },
    [enabled],
  );
}

/* ------------------------------- 3D tilt card ------------------------------ */
function TiltCard({
  children,
  className = "",
  color = "0,243,255",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 200, damping: 20 });
  const sy = useSpring(py, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(sy, [0, 1], [9, -9]);
  const rotateY = useTransform(sx, [0, 1], [-9, 9]);
  const spot = useMotionTemplate`radial-gradient(280px circle at ${mx}px ${my}px, rgba(${color},0.24), transparent 70%)`;

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    mx.set(x);
    my.set(y);
    px.set(x / r.width);
    py.set(y / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-cyan-300/50 hover:shadow-[0_0_50px_-15px_rgba(0,243,255,0.6)] ${className}`}
    >
      <motion.div
        aria-hidden="true"
        style={{ background: spot }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/* --------------------------------- Terminal -------------------------------- */
type Line = { kind: "in" | "out" | "err"; text: string };

function Terminal({ onFx }: { onFx: (kind: "matrix" | "confetti") => void }) {
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "bektemur.sh v2.0 // type 'help' to begin" },
  ]);
  const [value, setValue] = useState("");
  const [sound, setSound] = useState(true);
  const beep = useBeep(sound);
  const history = useRef<string[]>([]);
  const cursor = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  function run(raw: string) {
    const [cmd = "", ...args] = raw.trim().toLowerCase().split(/\s+/);
    const echo: Line = { kind: "in", text: raw };
    const out = (rows: string[], kind: Line["kind"] = "out"): Line[] =>
      rows.map((text) => ({ kind, text }));
    if (!cmd) return setLines((l) => [...l, echo]);
    history.current.push(raw);
    cursor.current = history.current.length;
    beep([660]);

    let res: Line[];
    switch (cmd) {
      case "clear":
        return setLines([]);
      case "help":
        res = out([
          "  whoami     one-line summary",
          "  about      who I am",
          "  skills     what I work with",
          "  projects   things I have built",
          "  matrix     enter the matrix",
          "  sudo       try your luck",
          "  clear      empty the terminal",
        ]);
        break;
      case "whoami":
        res = out([`${NAME}: ${ROLE.toLowerCase()}`]);
        break;
      case "about":
        res = out([
          "Developer from Uzbekistan. I build web apps with HTML, CSS,",
          "JavaScript and Django, and I study how systems get attacked",
          "so I can build them to hold up.",
        ]);
        break;
      case "skills":
        res = out([
          "  full-stack     HTML, CSS, JavaScript, Django",
          "  cybersecurity  BlackArch Linux, network inspection, pentest concepts",
          "  math+systems   logic, algorithms, operating systems",
        ]);
        break;
      case "projects":
        res = out(PROJECTS.map((p) => `  ${p.title.padEnd(20)} ${p.stack.join(", ")}`));
        break;
      case "matrix":
        beep([220, 330, 440, 660]);
        onFx("matrix");
        res = out(["Wake up, guest...", "(effect runs for a few seconds)"]);
        break;
      case "sudo":
        if (args.join(" ") === "hire bektemur") {
          beep([523, 659, 784, 1046]);
          onFx("confetti");
          res = out(["Access granted. Excellent choice."]);
        } else {
          beep([140]);
          res = out(["Permission denied. Hint: sudo hire bektemur"], "err");
        }
        break;
      default:
        beep([140]);
        res = out([`command not found: ${cmd}. Type 'help' for the list.`], "err");
    }
    setLines((l) => [...l, echo, ...res]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(value);
      setValue("");
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = cursor.current + (e.key === "ArrowUp" ? -1 : 1);
      cursor.current = Math.min(history.current.length, Math.max(0, next));
      setValue(history.current[cursor.current] ?? "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const m = COMMANDS.filter((c) => c.startsWith(value.toLowerCase()));
      if (value && m.length === 1) setValue(m[0]);
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`${mono.className} overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#05060f]/85 shadow-[0_0_80px_-20px_rgba(0,243,255,0.5)] backdrop-blur-md`}
    >
      <div className="flex items-center gap-2 border-b border-cyan-300/20 bg-white/[0.03] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#b026ff]/80" />
        <span className="h-3 w-3 rounded-full bg-amber-300/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-3 text-xs text-slate-400">guest@bektemur: ~</span>
        <button
          type="button"
          aria-label={sound ? "Mute terminal sounds" : "Unmute terminal sounds"}
          aria-pressed={sound}
          onClick={(e) => {
            e.stopPropagation();
            setSound((s) => !s);
          }}
          className="ml-auto rounded p-1 text-slate-400 transition hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      <div ref={bodyRef} role="log" aria-live="polite" className="h-72 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed sm:h-80 sm:text-sm">
        {lines.map((l, i) => (
          <div
            key={i}
            className={l.kind === "in" ? "text-slate-100" : l.kind === "err" ? "text-fuchsia-400" : "text-cyan-200/90"}
          >
            {l.kind === "in" && <span className="mr-2 text-emerald-400">$</span>}
            <span className="whitespace-pre-wrap break-words">{l.text}</span>
          </div>
        ))}
        <div className="flex items-center">
          <span className="mr-2 text-emerald-400">$</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Terminal command input"
            placeholder="try: matrix"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-slate-100 caret-emerald-400 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-cyan-300/20 bg-white/[0.02] px-4 py-2.5">
        {COMMANDS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              run(c);
              inputRef.current?.focus();
            }}
            className="rounded border border-cyan-300/25 px-2 py-0.5 text-xs text-cyan-200 transition hover:bg-cyan-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------- Page ---------------------------------- */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function Page() {
  const reduce = useReducedMotion();
  const [fx, setFx] = useState<Fx>(null);
  const clearFx = useCallback(() => setFx(null), []);
  const role = useTypewriter(ROLE);

  const goTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });

  const float = (dur: number, delay = 0) =>
    reduce
      ? {}
      : { animate: { y: [0, -12, 0] }, transition: { duration: dur, delay, repeat: Infinity, ease: "easeInOut" as const } };

  const glass =
    "rounded-2xl border border-cyan-300/20 bg-white/[0.04] p-4 backdrop-blur-md shadow-[0_0_40px_-12px_rgba(0,243,255,0.5)]";
  const icon =
    "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-md transition hover:border-cyan-300/60 hover:text-cyan-300 hover:shadow-[0_0_24px_-6px_rgba(0,243,255,0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400";
  const chip = `${mono.className} rounded border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-cyan-200`;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080914] text-slate-200">
      <style>{CSS}</style>
      <ThreeBackground />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080914_100%)]"
      />
      <FxLayer fx={fx} onDone={clearFx} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        {/* Hero */}
        <section className="grid min-h-[92vh] items-center gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className={`${mono.className} mb-6 inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs text-emerald-300 backdrop-blur-md`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              System Status: Online | Ready for Ops
            </div>

            <h1
              data-text={NAME}
              className={`glitch ${display.className} text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl`}
              style={{ textShadow: "0 0 36px rgba(0,243,255,0.4)" }}
            >
              {NAME}
            </h1>

            <p className={`${mono.className} mt-5 min-h-[2rem] text-lg text-[#00f3ff] sm:text-xl`} aria-label={ROLE}>
              <span aria-hidden="true">
                {role}
                <span className="caret ml-0.5 text-[#b026ff]">_</span>
              </span>
            </p>

            <p className="mt-5 max-w-lg text-slate-400">
              I build web apps with Django and JavaScript, and I study how systems get attacked so they can be built to hold.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => goTo("projects")}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#00f3ff] px-5 font-medium text-[#080914] shadow-[0_0_32px_-4px_rgba(0,243,255,0.8)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                View Projects <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo("playground")}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#b026ff]/60 px-5 font-medium text-purple-200 backdrop-blur-md transition hover:bg-[#b026ff]/15 hover:shadow-[0_0_28px_-6px_rgba(176,38,255,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                <TerminalIcon className="h-4 w-4" /> Open Terminal
              </button>
              <a href={LINKS.github} target="_blank" rel="noreferrer" aria-label="GitHub" className={icon}><GithubIcon className="h-5 w-5" /></a>
              <a href={LINKS.telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className={icon}><Send className="h-5 w-5" /></a>
              <a href={LINKS.email} aria-label="Email" className={icon}><Mail className="h-5 w-5" /></a>
            </div>
          </div>

          <div className="relative hidden flex-col gap-5 lg:flex">
            <motion.div {...float(5)} className={`${glass} ml-10`}>
              <p className={`${mono.className} text-xs text-slate-500`}>stack</p>
              <p className={`${display.className} mt-1 text-lg text-white`}>HTML / CSS / JS / Django</p>
            </motion.div>
            <motion.div {...float(6, 0.8)} className={`${glass} mr-10`}>
              <p className={`${mono.className} text-xs text-slate-500`}>lab</p>
              <p className={`${display.className} mt-1 text-lg text-white`}>BlackArch Linux</p>
            </motion.div>
            <motion.div {...float(5.5, 1.6)} className={`${glass} ml-16`}>
              <p className={`${mono.className} text-xs text-slate-500`}>focus</p>
              <p className={`${display.className} mt-1 text-lg text-white`}>Network inspection, pentest concepts</p>
            </motion.div>
          </div>
        </section>

        {/* Playground */}
        <section id="playground" className="scroll-mt-8 py-16">
          <h2 className={`${display.className} text-3xl font-bold text-white sm:text-4xl`}>Hacker playground</h2>
          <p className="mb-8 mt-2 max-w-xl text-slate-400">
            Type <span className={`${mono.className} text-[#00f3ff]`}>help</span>, or try{" "}
            <span className={`${mono.className} text-emerald-300`}>matrix</span> and{" "}
            <span className={`${mono.className} text-[#b026ff]`}>sudo hire bektemur</span>.
          </p>
          <Terminal onFx={(kind) => setFx({ kind, id: Date.now() })} />
        </section>

        {/* Skills */}
        <section id="skills" className="scroll-mt-8 py-16">
          <h2 className={`${display.className} mb-8 text-3xl font-bold text-white sm:text-4xl`}>Skills</h2>
          <div className="grid gap-5 lg:grid-cols-3">
            <TiltCard className="lg:col-span-2" color="0,243,255">
              <div className="p-6">
                <Code2 className="h-6 w-6 text-[#00f3ff]" />
                <h3 className={`${display.className} mt-3 text-2xl font-bold text-white`}>Full-Stack</h3>
                <p className="mt-2 max-w-md text-sm text-slate-400">
                  Interfaces in HTML, CSS and JavaScript, backed by Django: models, views, authentication, and the admin.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["HTML", "CSS", "JavaScript", "Django"].map((t) => <span key={t} className={chip}>{t}</span>)}
                </div>
              </div>
            </TiltCard>

            <TiltCard color="16,245,160">
              <div className="p-6">
                <Sigma className="h-6 w-6 text-emerald-300" />
                <h3 className={`${display.className} mt-3 text-2xl font-bold text-white`}>Math &amp; Systems</h3>
                <p className="mt-2 text-sm text-slate-400">Logic, algorithms, and how operating systems and networks work underneath.</p>
              </div>
            </TiltCard>

            <TiltCard className="lg:col-span-3" color="176,38,255">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-[#b026ff]" />
                  <h3 className={`${display.className} text-2xl font-bold text-white`}>Cybersecurity</h3>
                </div>
                <div className="mt-5 grid gap-6 sm:grid-cols-3">
                  {[
                    { Icon: Cpu, t: "BlackArch Linux", d: "A security-focused distro I practice on." },
                    { Icon: Network, t: "Network inspection", d: "Reading traffic and mapping what a network exposes." },
                    { Icon: ShieldCheck, t: "Penetration concepts", d: "Recon, exploitation, and reporting, studied in labs I own." },
                  ].map(({ Icon, t, d }) => (
                    <div key={t}>
                      <Icon className="h-5 w-5 text-[#00f3ff]" />
                      <h4 className={`${display.className} mt-2 font-bold text-white`}>{t}</h4>
                      <p className="mt-1 text-sm text-slate-400">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="scroll-mt-8 py-16">
          <h2 className={`${display.className} mb-8 text-3xl font-bold text-white sm:text-4xl`}>Projects</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {PROJECTS.map((p) => (
              <TiltCard key={p.title} color={p.color}>
                <a
                  href={LINKS.github}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`${display.className} text-xl font-bold text-white`}>{p.title}</h3>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-500 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00f3ff]" />
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{p.text}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.stack.map((t) => <span key={t} className={chip}>{t}</span>)}
                  </div>
                </a>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-8 pb-20 pt-16">
          <TiltCard color="176,38,255">
            <div className="p-8 sm:p-12">
              <h2 className={`${display.className} text-3xl font-bold text-white sm:text-4xl`}>Have a project or an internship in mind?</h2>
              <p className="mt-3 max-w-xl text-slate-400">Send me a message. I usually reply within a day.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={LINKS.email} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#b026ff] px-5 font-medium text-white shadow-[0_0_30px_-4px_rgba(176,38,255,0.8)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                  <Mail className="h-4 w-4" /> Send an email
                </a>
                <a href={LINKS.telegram} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 px-5 font-medium text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                  <Send className="h-4 w-4" /> Message on Telegram
                </a>
              </div>
            </div>
          </TiltCard>
          <p className={`${mono.className} mt-10 text-center text-xs text-slate-600`}>
            &copy; {new Date().getFullYear()} {NAME}
          </p>
        </section>
      </div>
    </main>
  );
}