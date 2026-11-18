import React, { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { Download, Eye, Monitor } from "lucide-react";
import { CLIPS, type ClipConfig } from "./data/clips";
import { DesktopRecorderModal } from "./components/DesktopRecorderModal";
import { FilmBackdrop } from "./components/FilmBackdrop";
import { HtmlStudioModal } from "./components/HtmlStudioModal";
import { Navbar } from "./components/Navbar";
import { ViewingForm } from "./components/ViewingForm";

interface MeasuredCue {
  el: HTMLDivElement;
  from: number;
  to: number;
}

interface MeasuredSpan {
  top: number;
  bottom: number;
  cues: MeasuredCue[];
}

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number): number => v * v * (3 - 2 * v);

function paced(clip: ClipConfig, p: number): number {
  const t = clip.pace;
  const x = clamp(p) * (t.length - 1);
  const i = Math.min(t.length - 2, Math.floor(x));
  return t[i] + (t[i + 1] - t[i]) * (x - i);
}

type StyledEl = HTMLElement & { _seen?: Record<string, string> };

function put(
  el: StyledEl | null,
  prop:
    | "display"
    | "visibility"
    | "opacity"
    | "transform"
    | "transformOrigin"
    | "objectPosition"
    | "zIndex"
    | "clipPath"
    | "width"
    | "height",
  value: string
) {
  if (!el) return;
  const seen = el._seen ?? (el._seen = {});
  if (seen[prop] !== value) {
    seen[prop] = value;
    el.style[prop] = value;
  }
}

export default function App() {
  const stillRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
  const cueRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const progressBarRef = useRef<HTMLSpanElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const loadedFilesRef = useRef<Record<string, boolean>>({});
  const videoReadyRef = useRef<Record<string, boolean>>({});
  const videoFailedRef = useRef<Record<string, boolean>>({});
  const timeRef = useRef<Record<string, number>>({});
  const desiredTimeRef = useRef<Record<string, number>>({});
  const seekStartedAtRef = useRef<Record<string, number>>({});
  const nextPrefetchIdxRef = useRef<number>(3);
  const prefetchFallbackRef = useRef<number>(0);
  const spansRef = useRef<MeasuredSpan[]>([]);
  const pageHeightRef = useRef<number>(0);

  const [studioOpen, setStudioOpen] = useState(false);
  const [desktopStudioOpen, setDesktopStudioOpen] = useState(false);
  const [standaloneHtml, setStandaloneHtml] = useState<string | null>(null);
  const [standaloneLoading, setStandaloneLoading] = useState(false);
  const [standaloneError, setStandaloneError] = useState<string | null>(null);

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const isDesktopForcedRef = useRef<boolean>(
    searchParams?.get("desktopMode") === "1"
  );
  const isCleanStageRef = useRef<boolean>(searchParams?.get("clean") === "1");
  const dragGainRef = useRef<number>(
    Number(searchParams?.get("dragGain")) || 1.8
  );
  const activeChapterRef = useRef<string>(CLIPS[0].label);
  const scrollProgressRef = useRef<number>(0);

  const loadStandaloneHtml = useCallback(async (): Promise<string | null> => {
    if (standaloneHtml) return standaloneHtml;
    setStandaloneLoading(true);
    setStandaloneError(null);
    try {
      const res = await fetch("/altura-index.html", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load index.html (${res.status})`);
      }
      const text = await res.text();
      setStandaloneHtml(text);
      return text;
    } catch (err) {
      setStandaloneError(
        err instanceof Error ? err.message : "Could not load standalone index.html."
      );
      return null;
    } finally {
      setStandaloneLoading(false);
    }
  }, [standaloneHtml]);

  const triggerDownload = useCallback((content: string, filename = "index.html") => {
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const handleQuickDownload = useCallback(async () => {
    const content = await loadStandaloneHtml();
    if (content) {
      triggerDownload(content, "index.html");
    } else {
      setStudioOpen(true);
    }
  }, [loadStandaloneHtml, triggerDownload]);

  const handleOpenStudio = useCallback(() => {
    setStudioOpen(true);
    void loadStandaloneHtml();
  }, [loadStandaloneHtml]);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (studioOpen || desktopStudioOpen) {
      lenisRef.current.stop();
    } else {
      lenisRef.current.start();
    }
  }, [studioOpen, desktopStudioOpen]);

  const isMobileRef = useRef<boolean>(
    typeof window !== "undefined" &&
      !isDesktopForcedRef.current &&
      window.matchMedia("(max-width: 768px), (pointer: coarse)").matches
  );

  const fetchFile = useCallback((file: string) => {
    if (loadedFilesRef.current[file] || videoFailedRef.current[file]) return;
    const clip = CLIPS.find((c) => c.file === file);
    const v = videoRefs.current[file];
    if (!clip || !v) return;
    loadedFilesRef.current[file] = true;
    v.preload = "auto";
    v.src = isMobileRef.current ? clip.mobileVideoSrc : clip.videoSrc;
    v.load();
  }, []);

  const pumpPrefetchQueue = useCallback(() => {
    window.clearTimeout(prefetchFallbackRef.current);
    while (nextPrefetchIdxRef.current < CLIPS.length) {
      const nextClip = CLIPS[nextPrefetchIdxRef.current];
      nextPrefetchIdxRef.current++;
      if (!loadedFilesRef.current[nextClip.file] && !videoFailedRef.current[nextClip.file]) {
        fetchFile(nextClip.file);
        prefetchFallbackRef.current = window.setTimeout(pumpPrefetchQueue, 500);
        return;
      }
    }
  }, [fetchFile]);

  const handleVideoMetadata = useCallback(
    (file: string, video: HTMLVideoElement) => {
      const t = desiredTimeRef.current[file] ?? timeRef.current[file] ?? 0;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const maxT = Math.max(0, video.duration - 0.02);
        const clampedTime = Math.min(Math.max(0, t), maxT);
        if (!video.seeking && Math.abs(clampedTime - video.currentTime) > 0.02) {
          timeRef.current[file] = clampedTime;
          seekStartedAtRef.current[file] = performance.now();
          video.currentTime = clampedTime;
        }
      }
    },
    []
  );

  const handleVideoReady = useCallback(
    (file: string, video: HTMLVideoElement) => {
      if (video.readyState >= 2) {
        videoReadyRef.current[file] = true;
        const want = desiredTimeRef.current[file];
        if (
          typeof want === "number" &&
          Number.isFinite(video.duration) &&
          video.duration > 0
        ) {
          const maxT = Math.max(0, video.duration - 0.02);
          const target = Math.min(Math.max(0, want), maxT);
          if (!video.seeking && Math.abs(target - video.currentTime) > 0.022) {
            timeRef.current[file] = target;
            seekStartedAtRef.current[file] = performance.now();
            video.currentTime = target;
          }
        }
      }
      if (!isDesktopForcedRef.current && nextPrefetchIdxRef.current < CLIPS.length) {
        const lastQueued = CLIPS[Math.max(0, nextPrefetchIdxRef.current - 1)];
        if (
          file === lastQueued.file ||
          file === CLIPS[0].file ||
          file === CLIPS[1].file ||
          file === CLIPS[2].file
        ) {
          pumpPrefetchQueue();
        }
      }
    },
    [pumpPrefetchQueue]
  );

  const handleVideoSeeked = useCallback((file: string, video: HTMLVideoElement) => {
    delete seekStartedAtRef.current[file];
    const want = desiredTimeRef.current[file];
    if (
      typeof want === "number" &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      const maxT = Math.max(0, video.duration - 0.02);
      const target = Math.min(Math.max(0, want), maxT);
      if (!video.seeking && Math.abs(target - video.currentTime) > 0.022) {
        timeRef.current[file] = target;
        seekStartedAtRef.current[file] = performance.now();
        video.currentTime = target;
      }
    }
  }, []);

  const handleVideoError = useCallback(
    (file: string) => {
      videoFailedRef.current[file] = true;
      if (!isDesktopForcedRef.current && nextPrefetchIdxRef.current < CLIPS.length) {
        pumpPrefetchQueue();
      }
    },
    [pumpPrefetchQueue]
  );

  const handleNavigate = useCallback(
    (hash: string) => {
      if (hash === "#top") {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      const id = hash.replace(/^#/, "");
      const clipIndex =
        id === "viewings-enquiry"
          ? CLIPS.length - 1
          : CLIPS.findIndex((c) => c.id === id);
      if (clipIndex >= 0) {
        fetchFile(CLIPS[clipIndex].file);
        if (clipIndex > 0) fetchFile(CLIPS[clipIndex - 1].file);
        if (clipIndex < CLIPS.length - 1) fetchFile(CLIPS[clipIndex + 1].file);
      }

      if (lenisRef.current) {
        lenisRef.current.scrollTo(hash);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [fetchFile]
  );

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const last = CLIPS.length - 1;

    fetchFile(CLIPS[0].file);
    fetchFile(CLIPS[1].file);
    fetchFile(CLIPS[2].file);

    // Prefetch remaining clips sequentially so active clips keep full network priority on published links
    if (isDesktopForcedRef.current) {
      for (let idx = 3; idx < CLIPS.length; idx++) {
        fetchFile(CLIPS[idx].file);
      }
    } else {
      prefetchFallbackRef.current = window.setTimeout(pumpPrefetchQueue, 500);
    }

    const measure = () => {
      const scrollTop = window.scrollY;
      spansRef.current = CLIPS.map((clip) => {
        const el = chapterRefs.current[clip.id];
        if (!el) {
          return { top: 0, bottom: 0, cues: [] };
        }
        const rect = el.getBoundingClientRect();
        const cues: MeasuredCue[] = [];
        for (const cue of clip.cues) {
          const qEl = cueRefs.current[cue.id];
          if (qEl) {
            cues.push({ el: qEl, from: cue.from, to: cue.to });
          }
        }
        return {
          top: rect.top + scrollTop,
          bottom: rect.bottom + scrollTop,
          cues,
        };
      });
      pageHeightRef.current = document.documentElement.scrollHeight;
    };

    const drawCues = (cues: MeasuredCue[], progress: number) => {
      for (let n = 0; n < cues.length; n++) {
        const c = cues[n];
        const fade = Math.min(0.07, (c.to - c.from) / 3);
        const arrive = c.from < 0 ? 1 : ease(clamp((progress - c.from) / fade));
        const leave = ease(clamp((c.to - progress) / fade));
        const a = arrive * leave;

        if (a <= 0.001) {
          put(c.el, "visibility", "hidden");
          continue;
        }
        put(c.el, "visibility", "visible");
        put(c.el, "opacity", a.toFixed(3));
        const drift = calm ? 0 : (1 - arrive) * 26 - (1 - leave) * 26;
        put(c.el, "transform", `translate3d(0,${drift.toFixed(1)}px,0)`);
      }
    };

    let lenis: Lenis | null = null;
    if (!calm) {
      lenis = new Lenis({
        lerp: 0.085,
        wheelMultiplier: 0.95,
        syncTouch: false,
        anchors: false,
      });
      lenisRef.current = lenis;
    }

    let prev = 0;
    const frame = (now: number) => {
      const dt = prev ? Math.min(100, now - prev) : 16;
      prev = now;

      const vh = window.innerHeight || 1;
      const scrollTop = lenis ? lenis.scroll : window.scrollY;
      const line = scrollTop + vh * 0.5;
      const join = vh * 0.06;
      const glide = vh * 0.8;
      const fadeLen = vh * 0.55;
      const doorLen = vh * 0.48;
      const turnLen = vh * 0.78;
      const k = 1 - Math.exp(-(dt / 1000) * 28);
      const spans = spansRef.current;
      const pageHeight = pageHeightRef.current;
      const used: Record<string, boolean> = {};

      for (let i = 0; i <= last; i++) {
        const clip = CLIPS[i];
        const span = spans[i];
        if (!span) continue;

        const slideIn = i > 0 && clip.enter === "slide";
        const slideOut = i < last && CLIPS[i + 1].enter === "slide";
        const panLeftIn = i > 0 && clip.enter === "pan-left";
        const panLeftOut = i < last && CLIPS[i + 1].enter === "pan-left";
        const doorIn = i > 0 && clip.enter === "door";
        const doorOut = i < last && CLIPS[i + 1].enter === "door";
        const turnIn = i > 0 && clip.enter === "turn";
        const turnOut = i < last && CLIPS[i + 1].enter === "turn";
        const moveIn = slideIn || panLeftIn;
        const moveOut = slideOut || panLeftOut;
        const fadeIn = i > 0 && clip.enter === "fade";
        const fadeOut = i < last && CLIPS[i + 1].enter === "fade";
        const cutIn = i > 0 && clip.enter === "cut";
        const cutOut = i < last && CLIPS[i + 1].enter === "cut";

        const start =
          i === 0
            ? vh * 0.5
            : moveIn || cutIn
            ? spans[i - 1].bottom
            : turnIn
            ? spans[i - 1].bottom - turnLen
            : doorIn
            ? spans[i - 1].bottom - doorLen
            : fadeIn
            ? spans[i - 1].bottom - fadeLen
            : spans[i - 1].bottom - join;

        const end =
          i === last
            ? pageHeight - vh * 0.5
            : moveOut
            ? span.bottom - glide
            : fadeOut || cutOut || doorOut || turnOut
            ? span.bottom
            : span.bottom - join;

        const denom = Math.max(1, end - start);
        const progress = (line - start) / denom;
        const shownFrom = moveIn ? start - glide : start;
        const shownTo =
          i === last
            ? end
            : moveOut
            ? end + glide
            : fadeOut || doorOut || turnOut
            ? end + 1
            : cutOut
            ? end
            : end + join;

        if (line > start - vh * 4.5 && line < end + vh * 4.5) {
          fetchFile(clip.file);
          if (i < last) {
            fetchFile(CLIPS[i + 1].file);
          }
        }

        drawCues(span.cues, progress);

        if (
          (i > 0 && line <= shownFrom) ||
          line > shownTo + (i === last ? 1 : 0) ||
          used[clip.file]
        ) {
          continue;
        }

        if (i < last) {
          fetchFile(CLIPS[i + 1].file);
        }

        const v = videoRefs.current[clip.file];
        const still = stillRefs.current[clip.file];
        if (!v && !still) continue;
        used[clip.file] = true;

        const hasDuration = Boolean(v && Number.isFinite(v.duration) && v.duration > 0);
        const useVideo = Boolean(
          v &&
            !videoFailedRef.current[clip.file] &&
            hasDuration &&
            (videoReadyRef.current[clip.file] || v.readyState >= 2)
        );

        if (v && hasDuration) {
          const maxTime = Math.max(0, v.duration - 0.02);
          const want = Math.min(paced(clip, clamp(progress)) * v.duration, maxTime);
          desiredTimeRef.current[clip.file] = want;
          const from = timeRef.current[clip.file];
          const t =
            from === undefined || Math.abs(want - from) > 1.2
              ? want
              : from + (want - from) * k;
          const seekStuck =
            v.seeking &&
            seekStartedAtRef.current[clip.file] !== undefined &&
            now - seekStartedAtRef.current[clip.file] > 350;
          if ((!v.seeking || seekStuck) && v.readyState >= 1) {
            timeRef.current[clip.file] = t;
            if (Math.abs(t - v.currentTime) > 0.022 || seekStuck) {
              seekStartedAtRef.current[clip.file] = now;
              v.currentTime = t;
            }
          } else if (from === undefined) {
            timeRef.current[clip.file] = want;
          }
        }

        let x = 0;
        let txPx = 0;
        let tyPx = 0;
        let rotY = 0;
        let opacity = 1;
        if (slideIn) {
          x = (1 - ease(clamp((line - shownFrom) / glide))) * 100;
        } else if (panLeftIn) {
          x = -(1 - ease(clamp((line - shownFrom) / glide))) * 100;
        } else if (turnIn) {
          const turnT = ease(clamp((line - start) / turnLen));
          opacity = turnT;
        } else if (doorIn) {
          const stepT = ease(clamp((line - start) / doorLen));
          opacity = stepT;
        } else if (fadeIn) {
          opacity = ease(clamp((line - start) / fadeLen));
        } else if (i > 0 && !cutIn) {
          opacity = ease(clamp((line - start) / join));
        }
        if (slideOut) {
          x -= ease(clamp((line - end) / glide)) * 100;
        } else if (panLeftOut) {
          x += ease(clamp((line - end) / glide)) * 100;
        }
        if (calm && (moveIn || moveOut)) {
          opacity = moveIn ? ease(clamp((line - shownFrom) / glide)) : 1;
          x = 0;
        }

        let panScale = 1;
        let originStr = "50% 50%";
        let objPos = "50% 50%";
        if (!calm && clip.endMove === "door") {
          const vw = window.innerWidth || 1;
          const panT = ease(clamp((progress - 0.62) / 0.2));
          const zoomT = ease(clamp((progress - 0.78) / 0.22));
          const posX = 50 - 50 * panT;
          objPos = `${posX.toFixed(1)}% 50%`;

          const vidScale = Math.max(vw / 1280, vh / 960);
          const rw = 1280 * vidScale;
          const rh = 960 * vidScale;
          const ox = (vw - rw) * (posX / 100);
          const oy = (vh - rh) * 0.5;
          const doorX = ox + 0.085 * rw;
          const doorY = oy + 0.44 * rh;

          panScale = 1 + 0.18 * panT + 3.02 * zoomT;
          txPx = Math.min(
            doorX * (panScale - 1),
            Math.max(0, (vw * 0.5 - doorX) * zoomT)
          );
          const maxShiftUp = -(vh - doorY) * (panScale - 1);
          const maxShiftDown = doorY * (panScale - 1);
          tyPx = Math.max(
            maxShiftUp,
            Math.min(maxShiftDown, (vh * 0.5 - doorY) * zoomT)
          );
          originStr = `${doorX.toFixed(1)}px ${doorY.toFixed(1)}px`;
        } else if (!calm && clip.endMove === "right-door") {
          const vw = window.innerWidth || 1;
          const panT = ease(clamp((progress - 0.6) / 0.2));
          const zoomT = ease(clamp((progress - 0.78) / 0.22));
          const posX = 50 + 50 * panT;
          objPos = `${posX.toFixed(1)}% 50%`;

          const vidScale = Math.max(vw / 1280, vh / 720);
          const rw = 1280 * vidScale;
          const rh = 720 * vidScale;
          const ox = (vw - rw) * (posX / 100);
          const oy = (vh - rh) * 0.5;
          const doorX = ox + 0.925 * rw;
          const doorY = oy + 0.5 * rh;

          panScale = 1 + 0.2 * panT + 3.0 * zoomT;
          txPx = Math.max(
            -(vw - doorX) * (panScale - 1),
            Math.min(0, (vw * 0.5 - doorX) * zoomT)
          );
          const maxShiftUp = -(vh - doorY) * (panScale - 1);
          const maxShiftDown = doorY * (panScale - 1);
          tyPx = Math.max(
            maxShiftUp,
            Math.min(maxShiftDown, (vh * 0.5 - doorY) * zoomT)
          );
          originStr = `${doorX.toFixed(1)}px ${doorY.toFixed(1)}px`;
        } else if (!calm && clip.endMove === "turn-enter") {
          const turnStart = end - turnLen;
          if (line > turnStart) {
            const turnT = ease(clamp((line - turnStart) / turnLen));
            panScale = 1 + 0.24 * turnT;
            x = -3.5 * turnT;
            rotY = -15 * turnT;
          }
        } else if (!calm && clip.endMove === "garden-exit") {
          const pushT = ease(clamp((progress - 0.74) / 0.26));
          if (pushT > 0) {
            panScale = 1 + 0.42 * pushT;
            originStr = "42% 52%";
          }
        } else if (!calm && turnIn) {
          if (line < start + turnLen) {
            const turnT = ease(clamp((line - start) / turnLen));
            panScale = 1.24 - 0.24 * turnT;
            x = 3.5 * (1 - turnT);
            rotY = 15 * (1 - turnT);
          }
        } else if (!calm && doorIn) {
          const stepT = ease(clamp((line - start) / doorLen));
          panScale = 1.16 - 0.16 * stepT;
        } else if (!calm && clip.endMove === "left") {
          const panT = ease(clamp((progress - 0.68) / 0.32));
          panScale = 1 + 0.24 * panT;
          originStr = `0px ${(vh * 0.52).toFixed(1)}px`;
          objPos = `${(50 - 46 * panT).toFixed(1)}% 50%`;
        }

        activeChapterRef.current = clip.label;
        const transformStr =
          txPx !== 0 || tyPx !== 0
            ? `translate3d(${txPx.toFixed(1)}px,${tyPx.toFixed(1)}px,0) scale(${panScale.toFixed(4)})`
            : rotY !== 0
            ? `perspective(1400px) translate3d(${x.toFixed(3)}%,0,0) rotateY(${rotY.toFixed(2)}deg) scale(${panScale.toFixed(4)})`
            : panScale !== 1
            ? `translate3d(${x.toFixed(3)}%,0,0) scale(${panScale.toFixed(4)})`
            : `translate3d(${x.toFixed(3)}%,0,0)`;

        if (still) {
          put(still, "zIndex", String(i + 1));
          put(still, "opacity", opacity.toFixed(3));
          put(still, "visibility", "visible");
          put(still, "objectPosition", objPos);
          put(still, "transformOrigin", originStr);
          put(still, "transform", transformStr);
        }

        if (v) {
          if (useVideo) {
            put(v, "zIndex", String(i + 10));
            put(v, "opacity", opacity.toFixed(3));
            put(v, "visibility", "visible");
            put(v, "objectPosition", objPos);
            put(v, "transformOrigin", originStr);
            put(v, "transform", transformStr);
          } else {
            put(v, "visibility", "hidden");
          }
        }
      }

      for (const clip of CLIPS) {
        if (!used[clip.file]) {
          put(videoRefs.current[clip.file], "visibility", "hidden");
          put(stillRefs.current[clip.file], "visibility", "hidden");
        }
      }

      const scrollLimit = Math.max(1, pageHeight - vh);
      const scrollRatio = clamp(scrollTop / scrollLimit);
      scrollProgressRef.current = scrollRatio;
      put(
        progressBarRef.current,
        "transform",
        `scaleX(${scrollRatio.toFixed(4)})`
      );
    };

    let rafId = 0;
    const loop = (now: number) => {
      if (lenis) lenis.raf(now);
      frame(now);
      rafId = requestAnimationFrame(loop);
    };

    measure();
    frame(performance.now());
    rafId = requestAnimationFrame(loop);

    const onResize = () => {
      measure();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }

    const unlockedFiles: Record<string, boolean> = {};
    let unlockedCount = 0;
    const unlockTouchSeek = () => {
      for (const clip of CLIPS) {
        const v = videoRefs.current[clip.file];
        if (v && v.src && !unlockedFiles[clip.file]) {
          unlockedFiles[clip.file] = true;
          v.play()
            .then(() => {
              v.pause();
              unlockedCount++;
              const want = desiredTimeRef.current[clip.file];
              if (
                typeof want === "number" &&
                Number.isFinite(v.duration) &&
                v.duration > 0
              ) {
                const maxT = Math.max(0, v.duration - 0.02);
                const clamped = Math.min(Math.max(0, want), maxT);
                if (Math.abs(clamped - v.currentTime) > 0.022) {
                  v.currentTime = clamped;
                }
              }
              if (unlockedCount >= CLIPS.length) {
                window.removeEventListener("touchstart", unlockTouchSeek);
                window.removeEventListener("touchend", unlockTouchSeek);
                window.removeEventListener("mousedown", unlockTouchSeek);
              }
            })
            .catch(() => {
              unlockedFiles[clip.file] = false;
            });
        }
      }
    };
    window.addEventListener("touchstart", unlockTouchSeek, {
      passive: true,
    });
    window.addEventListener("touchend", unlockTouchSeek, {
      passive: true,
    });
    window.addEventListener("mousedown", unlockTouchSeek, { passive: true });

    let desktopCleanup: (() => void) | undefined;
    if (isDesktopForcedRef.current) {
      document.documentElement.classList.add("desktop-forced");

      let dragging = false;
      let lastY = 0;
      let totalMove = 0;
      let velocity = 0;
      let lastTime = 0;
      let momentumRaf = 0;
      let autoWalkRaf = 0;
      let autoWalking = false;
      let suppressClickUntil = 0;
      let targetScrollY = window.scrollY;

      const applyScroll = (nextY: number) => {
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        targetScrollY = Math.max(0, Math.min(maxScroll, nextY));
        if (lenis) {
          lenis.scrollTo(targetScrollY, { immediate: true });
        } else {
          window.scrollTo(0, targetScrollY);
        }
      };

      const stopAutoWalk = () => {
        autoWalking = false;
        cancelAnimationFrame(autoWalkRaf);
      };

      const startAutoWalk = (durationSec = 42) => {
        cancelAnimationFrame(momentumRaf);
        stopAutoWalk();
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        if (maxScroll <= 0) return;
        if (window.scrollY >= maxScroll - 4) {
          applyScroll(0);
        }
        autoWalking = true;
        let prevT = performance.now();
        const speedPxPerMs = maxScroll / (Math.max(8, durationSec) * 1000);
        const step = (now: number) => {
          if (!autoWalking) return;
          const dt = Math.min(48, now - prevT);
          prevT = now;
          const next = window.scrollY + speedPxPerMs * dt * Math.max(0.5, dragGainRef.current / 1.8);
          if (next >= maxScroll) {
            applyScroll(maxScroll);
            autoWalking = false;
            return;
          }
          applyScroll(next);
          autoWalkRaf = requestAnimationFrame(step);
        };
        autoWalkRaf = requestAnimationFrame(step);
      };

      const startMomentum = () => {
        cancelAnimationFrame(momentumRaf);
        let prevT = performance.now();
        const step = (now: number) => {
          const dt = Math.min(32, now - prevT);
          prevT = now;
          if (Math.abs(velocity) < 0.04) {
            velocity = 0;
            return;
          }
          applyScroll(window.scrollY + velocity * dt);
          velocity *= Math.pow(0.94, dt / 16);
          momentumRaf = requestAnimationFrame(step);
        };
        momentumRaf = requestAnimationFrame(step);
      };

      const isFormTarget = (target: EventTarget | null) => {
        const el = target as HTMLElement | null;
        return Boolean(
          el?.closest("input, textarea, select, option")
        );
      };

      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1 || isFormTarget(e.target)) return;
        stopAutoWalk();
        cancelAnimationFrame(momentumRaf);
        dragging = true;
        lastY = e.touches[0].clientY;
        lastTime = performance.now();
        totalMove = 0;
        velocity = 0;
        targetScrollY = window.scrollY;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!dragging || e.touches.length !== 1) return;
        e.preventDefault();
        const y = e.touches[0].clientY;
        const now = performance.now();
        const dy = (lastY - y) * dragGainRef.current;
        totalMove += Math.abs(lastY - y);
        const dt = Math.max(4, now - lastTime);
        velocity = dy / dt;
        lastY = y;
        lastTime = now;
        applyScroll(targetScrollY + dy);
      };

      const onTouchEnd = () => {
        if (!dragging) return;
        dragging = false;
        if (totalMove > 6) {
          suppressClickUntil = performance.now() + 260;
          startMomentum();
        }
      };

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0 || isFormTarget(e.target)) return;
        stopAutoWalk();
        cancelAnimationFrame(momentumRaf);
        dragging = true;
        lastY = e.clientY;
        lastTime = performance.now();
        totalMove = 0;
        velocity = 0;
        targetScrollY = window.scrollY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        const y = e.clientY;
        const now = performance.now();
        const dy = (lastY - y) * dragGainRef.current;
        totalMove += Math.abs(lastY - y);
        const dt = Math.max(4, now - lastTime);
        velocity = dy / dt;
        lastY = y;
        lastTime = now;
        applyScroll(targetScrollY + dy);
      };

      const onMouseUp = () => {
        if (!dragging) return;
        dragging = false;
        if (totalMove > 6) {
          suppressClickUntil = performance.now() + 260;
          startMomentum();
        }
      };

      const onWheelCancelAutoWalk = () => {
        if (autoWalking) stopAutoWalk();
      };

      const onClickCapture = (e: MouseEvent) => {
        if (performance.now() < suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("wheel", onWheelCancelAutoWalk, { passive: true });
      window.addEventListener("click", onClickCapture, true);

      window.__alturaDesktop = {
        scrollToTop: () => {
          stopAutoWalk();
          cancelAnimationFrame(momentumRaf);
          velocity = 0;
          handleNavigate("#top");
        },
        scrollToChapter: (id: string) => {
          stopAutoWalk();
          cancelAnimationFrame(momentumRaf);
          velocity = 0;
          handleNavigate(id.startsWith("#") ? id : `#${id}`);
        },
        setDragGain: (gain: number) => {
          if (Number.isFinite(gain) && gain > 0) {
            dragGainRef.current = gain;
          }
        },
        startAutoWalk,
        stopAutoWalk,
        getStatus: () => {
          let readyClips = 0;
          for (const clip of CLIPS) {
            const v = videoRefs.current[clip.file];
            if (v && v.readyState >= 2) readyClips++;
          }
          return {
            scrollProgress: scrollProgressRef.current,
            activeChapter: activeChapterRef.current,
            readyClips,
            totalClips: CLIPS.length,
            scrollHeight: document.documentElement.scrollHeight,
            scrollY: window.scrollY,
            isAutoWalking: autoWalking,
          };
        },
      };

      desktopCleanup = () => {
        stopAutoWalk();
        cancelAnimationFrame(momentumRaf);
        document.documentElement.classList.remove("desktop-forced");
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("wheel", onWheelCancelAutoWalk);
        window.removeEventListener("click", onClickCapture, true);
        delete window.__alturaDesktop;
      };
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(prefetchFallbackRef.current);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", measure);
      window.removeEventListener("touchstart", unlockTouchSeek);
      window.removeEventListener("touchend", unlockTouchSeek);
      window.removeEventListener("mousedown", unlockTouchSeek);
      desktopCleanup?.();
      if (lenis) {
        lenis.destroy();
        lenisRef.current = null;
      }
    };
  }, [fetchFile, handleNavigate, pumpPrefetchQueue]);

  return (
    <>
      <FilmBackdrop
        stillRefs={stillRefs}
        videoRefs={videoRefs}
        progressBarRef={progressBarRef}
        onVideoMetadata={handleVideoMetadata}
        onVideoReady={handleVideoReady}
        onVideoSeeked={handleVideoSeeked}
        onVideoError={handleVideoError}
      />

      <Navbar onNavigate={handleNavigate} />

      <main id="top">
        {CLIPS.map((clip, clipIdx) => (
          <section
            key={clip.id}
            id={clip.id}
            className="chapter"
            ref={(el) => {
              chapterRefs.current[clip.id] = el;
            }}
          >
            <div className={clip.heightClass}>
              <div className="screen">
                {clip.cues.map((cue, cueIdx) => {
                  const initiallyHidden = !(clipIdx === 0 && cueIdx === 0);
                  return (
                    <div
                      key={cue.id}
                      ref={(el) => {
                        cueRefs.current[cue.id] = el;
                      }}
                      className={`cue ${cue.align} ${cue.topClass} ${
                        initiallyHidden ? "invisible" : ""
                      }`}
                    >
                      {cue.isH1 ? (
                        <h1 className="display">
                          {cue.titleLines.map((line, i) => (
                            <React.Fragment key={line}>
                              {i > 0 && <br />}
                              {line}
                            </React.Fragment>
                          ))}
                        </h1>
                      ) : (
                        <h2 className="display">
                          {cue.titleLines.map((line, i) => (
                            <React.Fragment key={line}>
                              {i > 0 && <br />}
                              {line}
                            </React.Fragment>
                          ))}
                        </h2>
                      )}
                      <p className="copy line">{cue.line}</p>
                      {cue.cta && (
                        <a
                          href={cue.cta.href}
                          className="cta-btn cue-cta"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate(cue.cta!.href);
                          }}
                        >
                          {cue.cta.label}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {clip.id === "exit" && (
              <ViewingForm
                onBackToTop={() => handleNavigate("#top")}
                extraFooterClearance={
                  !isCleanStageRef.current && !isDesktopForcedRef.current
                }
              />
            )}
          </section>
        ))}
      </main>

      {!isCleanStageRef.current && !isDesktopForcedRef.current && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-wrap justify-end items-center gap-2 max-w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => setDesktopStudioOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 sm:px-3.5 py-2 border border-white/45 rounded-[2px] bg-[#0b0b0c]/80 backdrop-blur-md text-white text-xs font-medium tracking-[0.06em] uppercase whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-white hover:text-[#0b0b0c] hover:border-white"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="sm:hidden">Desktop Record</span>
            <span className="hidden sm:inline">Desktop Screen Record</span>
          </button>
          <button
            type="button"
            onClick={handleOpenStudio}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 sm:px-3.5 py-2 border border-white/35 rounded-[2px] bg-[#0b0b0c]/75 backdrop-blur-md text-white text-xs font-medium tracking-[0.06em] uppercase whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-white hover:text-[#0b0b0c] hover:border-white"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="sm:hidden">Preview</span>
            <span className="hidden sm:inline">Preview HTML</span>
          </button>
          <button
            type="button"
            onClick={handleQuickDownload}
            disabled={standaloneLoading}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 sm:px-4 py-2 border border-white rounded-[2px] bg-white text-[#0b0b0c] text-xs font-semibold tracking-[0.06em] uppercase whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-white/90 disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="sm:hidden">
              {standaloneLoading ? "..." : "HTML"}
            </span>
            <span className="hidden sm:inline">
              {standaloneLoading ? "Preparing..." : "Download index.html"}
            </span>
          </button>
        </div>
      )}

      <DesktopRecorderModal
        isOpen={desktopStudioOpen}
        onClose={() => setDesktopStudioOpen(false)}
      />

      <HtmlStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        htmlContent={standaloneHtml}
        isLoading={standaloneLoading}
        error={standaloneError}
        onDownload={triggerDownload}
      />
    </>
  );
}
