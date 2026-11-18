import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Circle,
  Download,
  EyeOff,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Square,
  Video,
  X,
} from "lucide-react";
import { CLIPS } from "../data/clips";

export interface AlturaDesktopBridge {
  scrollToTop: () => void;
  scrollToChapter: (id: string) => void;
  setDragGain: (gain: number) => void;
  startAutoWalk: (durationSec?: number) => void;
  stopAutoWalk: () => void;
  getStatus: () => {
    scrollProgress: number;
    activeChapter: string;
    readyClips: number;
    totalClips: number;
    scrollHeight: number;
    scrollY: number;
    isAutoWalking: boolean;
  };
}

declare global {
  interface Window {
    __alturaDesktop?: AlturaDesktopBridge;
  }
}

interface DesktopRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AspectPreset = "16:9" | "16:10";

const ASPECT_DIMENSIONS: Record<
  AspectPreset,
  { w: number; h: number; recW: number; recH: number }
> = {
  "16:9": { w: 1440, h: 810, recW: 1280, recH: 720 },
  "16:10": { w: 1440, h: 900, recW: 1280, recH: 800 },
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pickSupportedMimeType(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", ext: "webm" };
  }
  const candidates: Array<{ mimeType: string; ext: string }> = [
    { mimeType: "video/mp4;codecs=avc1.42E01E", ext: "mp4" },
    { mimeType: "video/mp4", ext: "mp4" },
    { mimeType: "video/webm;codecs=vp9", ext: "webm" },
    { mimeType: "video/webm;codecs=vp8", ext: "webm" },
    { mimeType: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: "", ext: "webm" };
}

function parseObjectPosition(objPos: string): [number, number] {
  const parts = (objPos || "50% 50%").trim().split(/\s+/);
  const parseAxis = (val: string | undefined, fallback: number): number => {
    if (!val) return fallback;
    if (val === "left" || val === "top") return 0;
    if (val === "right" || val === "bottom") return 1;
    if (val === "center") return 0.5;
    if (val.endsWith("%")) {
      return Math.max(0, Math.min(1, (parseFloat(val) || 0) / 100));
    }
    return fallback;
  };
  return [parseAxis(parts[0], 0.5), parseAxis(parts[1], 0.5)];
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  posX = 0.5,
  posY = 0.5
) {
  if (srcW <= 0 || srcH <= 0) return;
  const scale = Math.max(destW / srcW, destH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  const dx = (destW - dw) * posX;
  const dy = (destH - dh) * posY;
  ctx.drawImage(source, dx, dy, dw, dh);
}

function parseTranslateAndScale(transformStr: string): {
  txPct: number;
  txPx: number;
  tyPx: number;
  scale: number;
  rotYDeg: number;
} {
  let txPct = 0;
  let txPx = 0;
  let tyPx = 0;
  let scale = 1;
  let rotYDeg = 0;

  const tMatch = transformStr.match(
    /translate3d\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/
  );
  if (tMatch) {
    const xRaw = tMatch[1].trim();
    const yRaw = tMatch[2].trim();
    if (xRaw.endsWith("%")) txPct = parseFloat(xRaw) || 0;
    else txPx = parseFloat(xRaw) || 0;
    tyPx = parseFloat(yRaw) || 0;
  }

  const sMatch = transformStr.match(/scale\(\s*([^)]+)\)/);
  if (sMatch) {
    scale = parseFloat(sMatch[1]) || 1;
  }

  const rMatch = transformStr.match(/rotateY\(\s*([^d)]+)deg\)/);
  if (rMatch) {
    rotYDeg = parseFloat(rMatch[1]) || 0;
  }

  return { txPct, txPx, tyPx, scale, rotYDeg };
}

function parsePolygon(clipPath: string): Array<[number, number]> | null {
  if (!clipPath || clipPath === "none") return null;
  const inner = clipPath.match(/polygon\(([^)]+)\)/);
  if (!inner) return null;
  const pts: Array<[number, number]> = [];
  for (const part of inner[1].split(",")) {
    const coords = part.trim().split(/\s+/);
    if (coords.length >= 2) {
      pts.push([parseFloat(coords[0]) || 0, parseFloat(coords[1]) || 0]);
    }
  }
  return pts.length >= 3 ? pts : null;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCompositeFrame(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  dw: number,
  dh: number,
  iframeDoc: Document,
  posterMap: Record<string, HTMLImageElement>
) {
  const s = cw / dw;

  // 1. Base ink background
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, cw, ch);

  // 2. Visible backdrop stills and video layers sorted by z-index
  type LayerItem =
    | { kind: "still"; el: HTMLImageElement; z: number }
    | { kind: "video"; el: HTMLVideoElement; z: number };

  const stillNodes = Array.from(
    iframeDoc.querySelectorAll<HTMLImageElement>(".film img.backdrop-still")
  );
  const videoNodes = Array.from(
    iframeDoc.querySelectorAll<HTMLVideoElement>(".film video")
  );

  const visibleLayers: LayerItem[] = [];
  stillNodes.forEach((img, idx) => {
    const inlineVis = img.style.visibility;
    const isVisible = inlineVis === "visible" || (!inlineVis && idx === 0);
    if (isVisible) {
      visibleLayers.push({
        kind: "still",
        el: img,
        z: parseInt(img.style.zIndex || String(idx + 1), 10) || idx + 1,
      });
    }
  });
  videoNodes.forEach((v, idx) => {
    if (v.style.visibility === "visible") {
      visibleLayers.push({
        kind: "video",
        el: v,
        z: parseInt(v.style.zIndex || String(idx + 10), 10) || idx + 10,
      });
    }
  });
  visibleLayers.sort((a, b) => a.z - b.z);

  for (const layer of visibleLayers) {
    const el = layer.el;
    const opacity = el.style.opacity ? parseFloat(el.style.opacity) : 1;
    if (opacity <= 0.001) continue;

    const { txPct, txPx, tyPx, scale, rotYDeg } = parseTranslateAndScale(
      el.style.transform || ""
    );
    const [posX, posY] = parseObjectPosition(el.style.objectPosition || "50% 50%");

    const originParts = (el.style.transformOrigin || "50% 50%").split(/\s+/);
    let ox = cw * 0.5;
    let oy = ch * 0.5;
    if (originParts[0]?.endsWith("px")) ox = parseFloat(originParts[0]) * s;
    if (originParts[1]?.endsWith("px")) oy = parseFloat(originParts[1]) * s;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    if (txPct !== 0 || txPx !== 0 || tyPx !== 0) {
      ctx.translate((txPct / 100) * cw + txPx * s, tyPx * s);
    }
    if (scale !== 1 || rotYDeg !== 0) {
      ctx.translate(ox, oy);
      if (rotYDeg !== 0) {
        ctx.scale(Math.max(0.05, Math.cos((rotYDeg * Math.PI) / 180)), 1);
      }
      if (scale !== 1) {
        ctx.scale(scale, scale);
      }
      ctx.translate(-ox, -oy);
    }

    if (layer.kind === "video") {
      const v = layer.el;
      const file = v.dataset.file || "";
      if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
        drawImageCover(ctx, v, v.videoWidth, v.videoHeight, cw, ch, posX, posY);
      } else {
        const posterImg = posterMap[file];
        if (posterImg && posterImg.complete && posterImg.naturalWidth > 0) {
          drawImageCover(
            ctx,
            posterImg,
            posterImg.naturalWidth,
            posterImg.naturalHeight,
            cw,
            ch,
            posX,
            posY
          );
        }
      }
    } else {
      const img = layer.el;
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        drawImageCover(
          ctx,
          img,
          img.naturalWidth,
          img.naturalHeight,
          cw,
          ch,
          posX,
          posY
        );
      }
    }
    ctx.restore();
  }

  // 3. Glass Door Portal (kitchen -> chalet transition)
  const portalRoot = iframeDoc.querySelector<HTMLElement>(".glass-portal");
  if (portalRoot && portalRoot.style.display === "block") {
    const chaletLayer =
      portalRoot.querySelector<HTMLElement>(".glass-portal-reveal");
    const chaletImg =
      portalRoot.querySelector<HTMLImageElement>(".glass-portal-chalet");
    const frameEl =
      portalRoot.querySelector<HTMLElement>(".glass-portal-frame");
    const leafEl =
      portalRoot.querySelector<HTMLElement>(".glass-portal-leaf");

    if (chaletLayer && chaletImg) {
      const portalOpacity = chaletLayer.style.opacity
        ? parseFloat(chaletLayer.style.opacity)
        : 1;
      const pts = parsePolygon(chaletLayer.style.clipPath || "");
      const imgTransform = parseTranslateAndScale(
        chaletImg.style.transform || ""
      );

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, portalOpacity));
      if (pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * s, pts[0][1] * s);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * s, pts[i][1] * s);
        }
        ctx.closePath();
        ctx.clip();
      }

      ctx.translate(cw * 0.5 + imgTransform.txPx * s, ch * 0.5 + imgTransform.tyPx * s);
      ctx.scale(imgTransform.scale, imgTransform.scale);
      ctx.translate(-cw * 0.5, -ch * 0.5);

      const srcImg =
        chaletImg.complete && chaletImg.naturalWidth > 0
          ? chaletImg
          : posterMap["chalet-living"];
      if (srcImg && srcImg.complete && srcImg.naturalWidth > 0) {
        drawImageCover(
          ctx,
          srcImg,
          srcImg.naturalWidth,
          srcImg.naturalHeight,
          cw,
          ch
        );
      }
      ctx.restore();
    }

    if (frameEl && frameEl.style.visibility === "visible") {
      const fW = (parseFloat(frameEl.style.width) || 0) * s;
      const fH = (parseFloat(frameEl.style.height) || 0) * s;
      const fOp = frameEl.style.opacity ? parseFloat(frameEl.style.opacity) : 1;
      const fTr = parseTranslateAndScale(frameEl.style.transform || "");
      const fOriginParts = (frameEl.style.transformOrigin || "0px 0px").split(
        /\s+/
      );
      const fox = (parseFloat(fOriginParts[0]) || 0) * s;
      const foy = (parseFloat(fOriginParts[1]) || 0) * s;

      if (fW > 0 && fH > 0 && fOp > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, fOp));
        ctx.translate(fTr.txPx * s, fTr.tyPx * s);
        ctx.translate(fox, foy);
        ctx.scale(fTr.scale, fTr.scale);
        ctx.translate(-fox, -foy);

        // Walnut jamb path
        ctx.strokeStyle = "#49311e";
        ctx.lineWidth = Math.max(3, 6 * s);
        ctx.beginPath();
        ctx.moveTo(0, fH * 0.972);
        ctx.lineTo(0, fH * 0.159);
        ctx.lineTo(fW * 0.259, fH * 0.159);
        ctx.lineTo(fW * 0.259, fH * 0.037);
        ctx.lineTo(fW, 0);
        ctx.lineTo(fW, fH);
        ctx.stroke();

        // Swinging leaf
        if (leafEl) {
          const leafOp = leafEl.style.opacity
            ? parseFloat(leafEl.style.opacity)
            : 1;
          const angleMatch = (leafEl.style.transform || "").match(
            /rotateY\(([^d]+)deg\)/
          );
          const angleDeg = angleMatch ? parseFloat(angleMatch[1]) : 0;
          const cosA = Math.cos((angleDeg * Math.PI) / 180);

          if (leafOp > 0.01 && cosA > 0.02) {
            ctx.save();
            ctx.globalAlpha *= Math.max(0, Math.min(1, leafOp));
            ctx.scale(cosA, 1);
            ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
            ctx.beginPath();
            ctx.moveTo(0, fH * 0.159);
            ctx.lineTo(fW * 0.259, fH * 0.159);
            ctx.lineTo(fW * 0.259, fH * 0.037);
            ctx.lineTo(fW, 0);
            ctx.lineTo(fW, fH);
            ctx.lineTo(0, fH * 0.972);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#523723";
            ctx.lineWidth = Math.max(2, 4 * s);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      }
    }
  }

  // 4. Contrast shades
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, cw, ch);
  const grad = ctx.createLinearGradient(0, 0, 0, ch);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.38)");
  grad.addColorStop(0.48, "rgba(0, 0, 0, 0)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.34)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // 5. Visible Cues
  const cues = Array.from(iframeDoc.querySelectorAll<HTMLElement>(".cue"));
  for (const cue of cues) {
    if (cue.style.visibility !== "visible") continue;
    const opacity = cue.style.opacity ? parseFloat(cue.style.opacity) : 1;
    if (opacity <= 0.01) continue;

    const align = cue.classList.contains("right")
      ? "right"
      : cue.classList.contains("center")
      ? "center"
      : "left";

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.textAlign = align;
    ctx.textBaseline = "top";

    const heading = cue.querySelector<HTMLElement>("h1, h2");
    if (heading) {
      const hRect = heading.getBoundingClientRect();
      const hStyle = iframeDoc.defaultView?.getComputedStyle(heading);
      const fontSize = (parseFloat(hStyle?.fontSize || "96") || 96) * s;
      const lineHeight = fontSize * 0.92;
      const rawHtml = heading.innerHTML;
      const lines = rawHtml
        .split(/<br\s*\/?>/i)
        .map((part) => part.replace(/<[^>]+>/g, "").trim().toUpperCase())
        .filter(Boolean);

      const xPos =
        align === "right"
          ? hRect.right * s
          : align === "center"
          ? (hRect.left + hRect.width * 0.5) * s
          : hRect.left * s;

      ctx.font = `700 ${fontSize.toFixed(1)}px "Barlow Condensed", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = 24 * s;
      ctx.shadowOffsetY = 2 * s;

      lines.forEach((line, idx) => {
        ctx.fillText(line, xPos, hRect.top * s + idx * lineHeight);
      });
    }

    const copyEl = cue.querySelector<HTMLElement>(".copy.line");
    if (copyEl) {
      const cRect = copyEl.getBoundingClientRect();
      const cStyle = iframeDoc.defaultView?.getComputedStyle(copyEl);
      const cSize = (parseFloat(cStyle?.fontSize || "15") || 15) * s;
      ctx.font = `500 ${cSize.toFixed(1)}px "DM Sans", sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
      ctx.shadowBlur = 14 * s;
      ctx.shadowOffsetY = 1 * s;

      const wrapped = wrapLines(
        ctx,
        copyEl.textContent || "",
        Math.max(120, cRect.width * s + 6)
      );
      const xPos =
        align === "right"
          ? cRect.right * s
          : align === "center"
          ? (cRect.left + cRect.width * 0.5) * s
          : cRect.left * s;

      wrapped.forEach((line, idx) => {
        ctx.fillText(line, xPos, cRect.top * s + idx * (cSize * 1.45));
      });
    }

    const ctaEl = cue.querySelector<HTMLElement>(".cue-cta");
    if (ctaEl) {
      const bRect = ctaEl.getBoundingClientRect();
      const bx = bRect.left * s;
      const by = bRect.top * s;
      const bw = bRect.width * s;
      const bh = bRect.height * s;

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(11, 11, 12, 0.36)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = Math.max(1, s);
      ctx.strokeRect(bx, by, bw, bh);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 ${(13 * s).toFixed(1)}px "DM Sans", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        (ctaEl.textContent || "").trim().toUpperCase(),
        bx + bw * 0.5,
        by + bh * 0.5
      );
    }

    ctx.restore();
  }

  // 6. Viewings section when scrolled into view
  const band = iframeDoc.querySelector<HTMLElement>(".viewings-band");
  if (band) {
    const bRect = band.getBoundingClientRect();
    if (bRect.top < dh && bRect.bottom > 0) {
      ctx.save();
      const topY = bRect.top * s;
      const hBand = bRect.height * s;
      const vGrad = ctx.createLinearGradient(0, topY, 0, topY + hBand);
      vGrad.addColorStop(0, "rgba(11, 11, 12, 0)");
      vGrad.addColorStop(0.18, "rgba(11, 11, 12, 0.56)");
      vGrad.addColorStop(1, "rgba(11, 11, 12, 0.76)");
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, Math.max(0, topY), cw, hBand);

      const viewingsHeading = band.querySelector<HTMLElement>("h2.display");
      if (viewingsHeading) {
        const vhRect = viewingsHeading.getBoundingClientRect();
        const vhStyle = iframeDoc.defaultView?.getComputedStyle(viewingsHeading);
        const fSize = (parseFloat(vhStyle?.fontSize || "96") || 96) * s;
        ctx.font = `700 ${fSize.toFixed(1)}px "Barlow Condensed", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const lines = viewingsHeading.innerHTML
          .split(/<br\s*\/?>/i)
          .map((p) => p.replace(/<[^>]+>/g, "").trim().toUpperCase());
        lines.forEach((l, i) => {
          ctx.fillText(l, vhRect.left * s, vhRect.top * s + i * fSize * 0.92);
        });
      }

      const viewingsCopy = band.querySelector<HTMLElement>(".viewings .line");
      if (viewingsCopy) {
        const vcRect = viewingsCopy.getBoundingClientRect();
        const cSize = 15 * s;
        ctx.font = `500 ${cSize.toFixed(1)}px "DM Sans", sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const wrapped = wrapLines(
          ctx,
          viewingsCopy.textContent || "",
          Math.max(120, vcRect.width * s + 6)
        );
        wrapped.forEach((l, i) => {
          ctx.fillText(l, vcRect.left * s, vcRect.top * s + i * cSize * 1.45);
        });
      }

      const dlRows = Array.from(band.querySelectorAll<HTMLElement>("dl > div"));
      for (const row of dlRows) {
        const dt = row.querySelector<HTMLElement>("dt");
        const dd = row.querySelector<HTMLElement>("dd");
        if (dt) {
          const dtRect = dt.getBoundingClientRect();
          ctx.font = `500 ${(12 * s).toFixed(1)}px "DM Sans", sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(
            (dt.textContent || "").trim().toUpperCase(),
            dtRect.left * s,
            dtRect.top * s
          );
        }
        if (dd) {
          const ddRect = dd.getBoundingClientRect();
          ctx.font = `500 ${(15 * s).toFixed(1)}px "DM Sans", sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText((dd.textContent || "").trim(), ddRect.left * s, ddRect.top * s);
        }
      }

      const formInputs = Array.from(
        band.querySelectorAll<HTMLInputElement>("input")
      );
      for (const input of formInputs) {
        const iRect = input.getBoundingClientRect();
        const label = input.closest("label");
        if (label) {
          const lRect = label.getBoundingClientRect();
          const labelText = label.childNodes[0]?.textContent?.trim() || "";
          ctx.font = `500 ${(13 * s).toFixed(1)}px "DM Sans", sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(labelText, lRect.left * s, lRect.top * s);
        }
        if (input.value) {
          ctx.font = `400 ${(17 * s).toFixed(1)}px "DM Sans", sans-serif`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(
            input.value,
            iRect.left * s,
            (iRect.top + iRect.height * 0.5) * s
          );
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = Math.max(1, s);
        ctx.beginPath();
        ctx.moveTo(iRect.left * s, iRect.bottom * s);
        ctx.lineTo(iRect.right * s, iRect.bottom * s);
        ctx.stroke();
      }

      const submitBtn = band.querySelector<HTMLElement>("button[type='submit']");
      if (submitBtn) {
        const sbRect = submitBtn.getBoundingClientRect();
        ctx.fillStyle = "rgba(11, 11, 12, 0.36)";
        ctx.fillRect(sbRect.left * s, sbRect.top * s, sbRect.width * s, sbRect.height * s);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.strokeRect(sbRect.left * s, sbRect.top * s, sbRect.width * s, sbRect.height * s);
        ctx.font = `500 ${(13 * s).toFixed(1)}px "DM Sans", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          (submitBtn.textContent || "").trim().toUpperCase(),
          (sbRect.left + sbRect.width * 0.5) * s,
          (sbRect.top + sbRect.height * 0.5) * s
        );
      }

      const noteEl = band.querySelector<HTMLElement>(".note");
      if (noteEl && noteEl.textContent?.trim()) {
        const nRect = noteEl.getBoundingClientRect();
        const nSize = 15 * s;
        ctx.font = `500 ${nSize.toFixed(1)}px "DM Sans", sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const wrappedNote = wrapLines(
          ctx,
          noteEl.textContent,
          Math.max(120, nRect.width * s + 6)
        );
        wrappedNote.forEach((l, i) => {
          ctx.fillText(l, nRect.left * s, nRect.top * s + i * nSize * 1.45);
        });
      }

      const footerEl = band.querySelector<HTMLElement>(".site-footer");
      if (footerEl) {
        const footerItems = Array.from(
          footerEl.querySelectorAll<HTMLElement>("p, a")
        );
        ctx.font = `500 ${(13 * s).toFixed(1)}px "DM Sans", sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        for (const item of footerItems) {
          const fr = item.getBoundingClientRect();
          if (fr.width > 0 && fr.top < dh) {
            ctx.fillText((item.textContent || "").trim(), fr.left * s, fr.top * s);
          }
        }
      }

      ctx.restore();
    }
  }

  // 7. Top Navbar
  const nav = iframeDoc.querySelector<HTMLElement>("header.nav");
  if (nav) {
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 14 * s;
    ctx.shadowOffsetY = 1 * s;

    const mark = nav.querySelector<HTMLElement>(".mark");
    if (mark) {
      const mRect = mark.getBoundingClientRect();
      const emblem = mark.querySelector<SVGSVGElement>(".mark-emblem");
      let textStartX = mRect.left * s;
      if (emblem) {
        const eRect = emblem.getBoundingClientRect();
        const ex = eRect.left * s;
        const ey = eRect.top * s;
        const ew = eRect.width * s;
        const eh = eRect.height * s;
        const sx = ew / 28;
        const sy = eh / 24;
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineCap = "square";
        ctx.lineJoin = "miter";
        ctx.lineWidth = Math.max(1.5, 2.1 * sx);
        ctx.beginPath();
        ctx.moveTo(ex + 2 * sx, ey + 21 * sy);
        ctx.lineTo(ex + 11.5 * sx, ey + 3.5 * sy);
        ctx.lineTo(ex + 21 * sx, ey + 21 * sy);
        ctx.stroke();

        ctx.globalAlpha = 0.82;
        ctx.lineWidth = Math.max(1.2, 1.6 * sx);
        ctx.beginPath();
        ctx.moveTo(ex + 11.5 * sx, ey + 3.5 * sy);
        ctx.lineTo(ex + 26 * sx, ey + 11.5 * sy);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(1.3, 1.75 * sx);
        ctx.beginPath();
        ctx.moveTo(ex + 6.2 * sx, ey + 15.5 * sy);
        ctx.lineTo(ex + 25.5 * sx, ey + 15.5 * sy);
        ctx.stroke();

        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(1, 1.25 * sx);
        ctx.beginPath();
        ctx.moveTo(ex + 2 * sx, ey + 21 * sy);
        ctx.lineTo(ex + 26 * sx, ey + 21 * sy);
        ctx.stroke();
        ctx.restore();
        textStartX = (eRect.right + 10) * s;
      }
      ctx.font = `700 ${(24 * s).toFixed(1)}px "Barlow Condensed", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(
        "ALTURA",
        textStartX,
        (mRect.top + mRect.height * 0.5) * s
      );
    }

    const navContainer = nav.querySelector<HTMLElement>("nav");
    if (navContainer) {
      const nr = navContainer.getBoundingClientRect();
      if (nr.width > 0 && nr.height > 0) {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(11, 11, 12, 0.42)";
        ctx.fillRect(nr.left * s, nr.top * s, nr.width * s, nr.height * s);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = Math.max(1, s);
        ctx.strokeRect(nr.left * s, nr.top * s, nr.width * s, nr.height * s);
        ctx.restore();
      }
    }

    const navLinks = Array.from(nav.querySelectorAll<HTMLElement>("nav a"));
    ctx.font = `500 ${(12 * s).toFixed(1)}px "DM Sans", sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const a of navLinks) {
      const r = a.getBoundingClientRect();
      if (r.width > 0) {
        ctx.fillText(
          (a.textContent || "").trim().toUpperCase(),
          (r.left + r.width * 0.5) * s,
          (r.top + r.height * 0.5) * s
        );
      }
    }

    const actionLink = nav.querySelector<HTMLElement>(".nav-action");
    if (actionLink) {
      const r = actionLink.getBoundingClientRect();
      const bx = r.left * s;
      const by = r.top * s;
      const bw = r.width * s;
      const bh = r.height * s;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(11, 11, 12, 0.36)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = Math.max(1, s);
      ctx.strokeRect(bx, by, bw, bh);

      ctx.font = `500 ${(13 * s).toFixed(1)}px "DM Sans", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        (actionLink.textContent || "").trim().toUpperCase(),
        bx + bw * 0.5,
        by + bh * 0.5
      );
    }
    ctx.restore();
  }

  // 8. Bottom 2px scroll progress bar
  const bar = iframeDoc.querySelector<HTMLElement>(".progress span");
  if (bar) {
    const scaleMatch = (bar.style.transform || "").match(/scaleX\(([^)]+)\)/);
    const ratio = scaleMatch ? parseFloat(scaleMatch[1]) || 0 : 0;
    if (ratio > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(0, ch - Math.max(2, 2 * s), cw * Math.min(1, ratio), Math.max(2, 2 * s));
    }
  }
}

export function DesktopRecorderModal({
  isOpen,
  onClose,
}: DesktopRecorderModalProps) {
  const [aspect, setAspect] = useState<AspectPreset>("16:9");
  const [dragGain, setDragGain] = useState<number>(1.8);
  const [cleanView, setCleanView] = useState(false);
  const [showCleanHint, setShowCleanHint] = useState(false);

  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState({
    scrollProgress: 0,
    activeChapter: "The approach",
    readyClips: 0,
    totalClips: CLIPS.length,
    isAutoWalking: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordSource, setRecordSource] = useState<"canvas" | "tab" | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedSize, setRecordedSize] = useState(0);
  const [recordedExt, setRecordedExt] = useState("webm");
  const [recordError, setRecordError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordRafRef = useRef<number>(0);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const posterMapRef = useRef<Record<string, HTMLImageElement>>({});
  const lastTapRef = useRef<number>(0);

  const dims = ASPECT_DIMENSIONS[aspect];
  const canTabCapture =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function";

  // Preload poster images for instant composite fallback
  useEffect(() => {
    for (const clip of CLIPS) {
      if (!posterMapRef.current[clip.file]) {
        const img = new Image();
        img.src = clip.posterSrc;
        posterMapRef.current[clip.file] = img;
      }
    }
  }, []);

  // Measure available stage area and scale 1440px desktop viewport proportionally
  useEffect(() => {
    if (!isOpen) return;
    const el = stageRef.current;
    if (!el) return;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      const pad = cleanView ? 0 : 16;
      const availW = Math.max(200, rect.width - pad * 2);
      const availH = Math.max(160, rect.height - pad * 2);
      setScale(Math.min(availW / dims.w, availH / dims.h));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    window.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [isOpen, dims.w, dims.h, cleanView]);

  // Sync hand-scroll sensitivity with iframe
  useEffect(() => {
    if (!isOpen) return;
    iframeRef.current?.contentWindow?.__alturaDesktop?.setDragGain(dragGain);
  }, [isOpen, dragGain]);

  // Poll desktop iframe status for chapter & clip readiness
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => {
      const bridge = iframeRef.current?.contentWindow?.__alturaDesktop;
      if (bridge) {
        const next = bridge.getStatus();
        setStatus((prev) =>
          prev.scrollProgress === next.scrollProgress &&
          prev.activeChapter === next.activeChapter &&
          prev.readyClips === next.readyClips &&
          prev.isAutoWalking === next.isAutoWalking
            ? prev
            : {
                scrollProgress: next.scrollProgress,
                activeChapter: next.activeChapter,
                readyClips: next.readyClips,
                totalClips: next.totalClips,
                isAutoWalking: next.isAutoWalking,
              }
        );
      }
    }, 180);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  // Recording elapsed timer
  useEffect(() => {
    if (!isRecording) {
      setElapsedSec(0);
      return;
    }
    const start = Date.now();
    const t = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => window.clearInterval(t);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    cancelAnimationFrame(recordRafRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
  }, []);

  // Cleanup object URLs & active recordings when closing
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setCleanView(false);
    }
  }, [isOpen, stopRecording]);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (cleanView) {
          setCleanView(false);
        } else if (recordedUrl) {
          setRecordedUrl(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, cleanView, recordedUrl, onClose]);

  const startCanvasRecording = useCallback(() => {
    setRecordError(null);
    const iframeDoc = iframeRef.current?.contentDocument;
    if (!iframeDoc) {
      setRecordError("Desktop preview is still loading. Try again in a moment.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setRecordError(
        "Built-in video recording is not supported in this browser. Use Clean View with your device screen recorder."
      );
      return;
    }

    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }

    const canvas = document.createElement("canvas");
    canvas.width = dims.recW;
    canvas.height = dims.recH;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setRecordError("Could not initialize video capture canvas.");
      return;
    }

    const { mimeType, ext } = pickSupportedMimeType();
    setRecordedExt(ext);
    chunksRef.current = [];

    try {
      const stream = canvas.captureStream(30);
      const options: MediaRecorderOptions = { videoBitsPerSecond: 6_000_000 };
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        cancelAnimationFrame(recordRafRef.current);
        stream.getTracks().forEach((t) => t.stop());
        const finalType = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: finalType });
        setRecordedSize(blob.size);
        setRecordedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setRecordSource(null);
      };

      const renderLoop = () => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          drawCompositeFrame(
            ctx,
            canvas.width,
            canvas.height,
            dims.w,
            dims.h,
            doc,
            posterMapRef.current
          );
        }
        recordRafRef.current = requestAnimationFrame(renderLoop);
      };

      // Paint initial frame before starting MediaRecorder
      drawCompositeFrame(
        ctx,
        canvas.width,
        canvas.height,
        dims.w,
        dims.h,
        iframeDoc,
        posterMapRef.current
      );

      recorder.start(250);
      setIsRecording(true);
      setRecordSource("canvas");
      recordRafRef.current = requestAnimationFrame(renderLoop);
    } catch (err) {
      setRecordError(
        err instanceof Error
          ? err.message
          : "Could not start recording. Try Clean View with your OS screen recorder."
      );
    }
  }, [dims.h, dims.recH, dims.recW, dims.w, recordedUrl]);

  const startTabCapture = useCallback(async () => {
    setRecordError(null);
    if (!canTabCapture) return;
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 60 } },
        audio: false,
      });
      displayStreamRef.current = stream;
      const { mimeType, ext } = pickSupportedMimeType();
      setRecordedExt(ext);
      chunksRef.current = [];

      const options: MediaRecorderOptions = { videoBitsPerSecond: 8_000_000 };
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
        const finalType = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: finalType });
        setRecordedSize(blob.size);
        setRecordedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setRecordSource(null);
        setCleanView(false);
      };

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorder.state !== "inactive") recorder.stop();
      });

      setCleanView(true);
      setShowCleanHint(true);
      window.setTimeout(() => setShowCleanHint(false), 2600);
      recorder.start(250);
      setIsRecording(true);
      setRecordSource("tab");
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") return;
      setRecordError(
        err instanceof Error ? err.message : "Screen capture was cancelled."
      );
    }
  }, [canTabCapture, recordedUrl]);

  const handleEnterCleanView = () => {
    setCleanView(true);
    setShowCleanHint(true);
    window.setTimeout(() => setShowCleanHint(false), 2600);
  };

  const handleDownloadVideo = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `altura-desktop-walkthrough.${recordedExt}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleResetTop = () => {
    iframeRef.current?.contentWindow?.__alturaDesktop?.scrollToTop();
  };

  const handleToggleAutoWalk = () => {
    const bridge = iframeRef.current?.contentWindow?.__alturaDesktop;
    if (!bridge) return;
    if (status.isAutoWalking) {
      bridge.stopAutoWalk();
    } else {
      bridge.startAutoWalk(42);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#070709] text-white"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Desktop Mode Hand-Scroll Recording Studio"
    >
      {/* Top Studio Bar (hidden during Clean View) */}
      {!cleanView && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-[#0e0e11] px-3 py-2.5 sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <Monitor className="w-4 h-4 text-white/80" />
              <span className="font-semibold tracking-tight text-sm text-white">
                Desktop Mode
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-white/55 tabular-nums whitespace-nowrap">
              <span>
                {dims.w}×{dims.h}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[180px]">{status.activeChapter}</span>
              <span aria-hidden="true">·</span>
              <span>{Math.round(status.scrollProgress * 100)}%</span>
              {status.readyClips < status.totalClips && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Preloading {status.readyClips}/{status.totalClips}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Aspect Ratio Selector */}
            <div
              className="flex items-center border border-white/15 rounded-[2px] bg-black/40 p-0.5"
              role="group"
              aria-label="Desktop aspect ratio"
            >
              {(["16:9", "16:10"] as AspectPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAspect(preset)}
                  disabled={isRecording}
                  className={`px-2 py-1 text-xs font-medium rounded-[1px] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 ${
                    aspect === preset
                      ? "bg-white/20 text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Hand-Scroll Speed */}
            <div
              className="flex items-center border border-white/15 rounded-[2px] bg-black/40 p-0.5"
              role="group"
              aria-label="Hand scroll speed"
            >
              {[1, 1.8, 2.8].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDragGain(g)}
                  title="Hand-scroll drag speed"
                  className={`px-2 py-1 text-xs font-medium tabular-nums rounded-[1px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    dragGain === g
                      ? "bg-white/20 text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {g}×
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleToggleAutoWalk}
              title={
                status.isAutoWalking
                  ? "Pause guided walkthrough"
                  : "Auto-scroll smooth single-take walkthrough"
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-[2px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                status.isAutoWalking
                  ? "border-white bg-white/15 text-white"
                  : "border-white/20 text-white/85 hover:bg-white/10"
              }`}
            >
              {status.isAutoWalking ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{status.isAutoWalking ? "Pause" : "Auto Walk"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetTop}
              title="Reset scroll to top"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-white/20 rounded-[2px] text-white/85 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Top</span>
            </button>

            <button
              type="button"
              onClick={handleEnterCleanView}
              title="Hide controls for OS screen recording (iPhone / QuickTime)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-white/20 rounded-[2px] text-white/85 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Clean View</span>
            </button>

            {canTabCapture && !isRecording && (
              <button
                type="button"
                onClick={startTabCapture}
                title="Capture live browser screen natively"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-white/20 rounded-[2px] text-white/85 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Capture Screen</span>
              </button>
            )}

            {!isRecording ? (
              <button
                type="button"
                onClick={startCanvasRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-[#0b0b0c] rounded-[2px] hover:bg-white/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Circle className="w-3 h-3 fill-[#dc2626] text-[#dc2626]" />
                <span>Record</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#dc2626] text-white rounded-[2px] hover:bg-[#b91c1c] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop {formatDuration(elapsedSec)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Desktop Mode"
              className="inline-flex items-center justify-center w-8 h-8 border border-white/20 rounded-[2px] text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {recordError && !cleanView && (
        <div className="bg-red-950/85 border-b border-red-500/40 px-4 py-2 text-xs text-red-200 flex items-center justify-between gap-3">
          <span>{recordError}</span>
          <button
            type="button"
            onClick={() => setRecordError(null)}
            className="text-red-200 hover:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scaled 1440px Desktop Viewport Stage */}
      <div
        ref={stageRef}
        onClick={() => {
          if (!cleanView) return;
          const now = Date.now();
          if (now - lastTapRef.current < 320) {
            setCleanView(false);
          }
          lastTapRef.current = now;
        }}
        className="relative flex-1 min-h-0 flex items-center justify-center bg-[#050506] overflow-hidden"
      >
        <div
          className={`relative overflow-hidden bg-[#0b0b0c] ${
            cleanView
              ? ""
              : "border border-white/15 shadow-2xl rounded-[2px]"
          }`}
          style={{
            width: `${Math.round(dims.w * scale)}px`,
            height: `${Math.round(dims.h * scale)}px`,
          }}
        >
          <iframe
            ref={iframeRef}
            title="Altura Desktop Viewport"
            src="/?desktopMode=1&clean=1"
            onLoad={() => {
              iframeRef.current?.contentWindow?.__alturaDesktop?.setDragGain(
                dragGain
              );
            }}
            style={{
              width: `${dims.w}px`,
              height: `${dims.h}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="border-0 block bg-[#0b0b0c]"
          />
        </div>

        {/* Brief instruction toast when entering Clean View */}
        {cleanView && showCleanHint && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 bg-[#0b0b0c]/85 border border-white/20 rounded-[2px] text-xs text-white/90 whitespace-nowrap">
            Hand-scroll to record · Double-tap or press Esc to show controls
          </div>
        )}

        {/* Discrete tap target in Clean View top-right to exit if needed */}
        {cleanView && !isRecording && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCleanView(false);
            }}
            aria-label="Exit Clean View"
            className="absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center rounded-[2px] bg-black/25 text-white/40 hover:bg-black/75 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Mobile bottom hand-scroll helper caption */}
        {!cleanView && !recordedUrl && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0b0b0c]/75 border border-white/10 rounded-[2px] text-[11px] text-white/65 whitespace-nowrap">
            {isRecording
              ? recordSource === "canvas"
                ? "Recording live desktop composite — drag or scroll through the residence"
                : "Recording screen — hand-scroll through the residence"
              : "Drag, swipe, or scroll inside frame · Tap Record or Clean View"}
          </div>
        )}

        {/* Recorded Video Review Overlay */}
        {recordedUrl && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#070709]/92 backdrop-blur-md p-4">
            <div className="w-full max-w-3xl border border-white/15 bg-[#0e0e11] rounded-[2px] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-semibold text-white truncate">
                    Desktop Recording Ready
                  </span>
                  <span className="text-xs text-white/55 tabular-nums whitespace-nowrap">
                    {dims.recW}×{dims.recH} · {formatBytes(recordedSize)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(recordedUrl);
                    setRecordedUrl(null);
                  }}
                  aria-label="Close recording preview"
                  className="inline-flex items-center justify-center w-8 h-8 border border-white/20 rounded-[2px] text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-black flex items-center justify-center p-3">
                <video
                  src={recordedUrl}
                  controls
                  playsInline
                  autoPlay
                  loop
                  className="max-h-[60vh] w-full object-contain bg-black"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/15 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(recordedUrl);
                    setRecordedUrl(null);
                    handleResetTop();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-white/25 rounded-[2px] text-white/90 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Record Another Take
                </button>
                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-[#0b0b0c] rounded-[2px] hover:bg-white/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .{recordedExt}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
