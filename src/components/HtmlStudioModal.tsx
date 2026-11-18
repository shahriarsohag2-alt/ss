import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Monitor,
  RotateCcw,
  Smartphone,
  Upload,
  X,
} from "lucide-react";

interface HtmlStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string | null;
  isLoading: boolean;
  error: string | null;
  onDownload: (content: string, filename: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function HtmlStudioModal({
  isOpen,
  onClose,
  htmlContent,
  isLoading,
  error,
  onDownload,
}: HtmlStudioModalProps) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [uploadedHtml, setUploadedHtml] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [desktopScale, setDesktopScale] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const activeHtml = uploadedHtml ?? htmlContent ?? "";
  const activeName = uploadedName ?? "index.html";
  const byteSize = activeHtml ? new Blob([activeHtml]).size : 0;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || viewMode !== "preview" || viewport !== "desktop") {
      setDesktopScale(null);
      return;
    }
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(200, rect.width - 32);
      const availH = Math.max(200, rect.height - 32);
      if (availW < 1200) {
        setDesktopScale(Math.min(availW / 1440, availH / 900));
      } else {
        setDesktopScale(null);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isOpen, viewMode, viewport]);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm") && file.type !== "text/html") {
      setUploadError("Please select an .html or .htm file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedHtml(reader.result);
        setUploadedName(file.name);
        setViewMode("preview");
      }
    };
    reader.onerror = () => {
      setUploadError("Could not read the selected HTML file.");
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!activeHtml) return;
    try {
      await navigator.clipboard.writeText(activeHtml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setUploadError("Clipboard copy was blocked by the browser.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0b0b0c]/95 backdrop-blur-md text-white"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="HTML Preview and Export"
    >
      {/* Top Studio Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-[#111114] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold tracking-tight text-sm text-white truncate">
            {activeName}
          </span>
          {byteSize > 0 && (
            <span className="text-xs text-white/55 tabular-nums whitespace-nowrap">
              {formatBytes(byteSize)} · {uploadedHtml ? "Uploaded" : "Self-contained"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preview / Code Switcher */}
          <div className="flex items-center border border-white/15 rounded-[2px] bg-black/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[1px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === "preview"
                  ? "bg-white text-[#0b0b0c]"
                  : "text-white/75 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[1px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === "code"
                  ? "bg-white text-[#0b0b0c]"
                  : "text-white/75 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
          </div>

          {/* Desktop / Mobile Switcher */}
          {viewMode === "preview" && (
            <div className="flex items-center border border-white/15 rounded-[2px] bg-black/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                title="Desktop viewport"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[1px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewport === "desktop"
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                title="Mobile viewport"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[1px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewport === "mobile"
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>
            </div>
          )}

          {/* Upload HTML to preview */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/25 rounded-[2px] text-white/90 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload HTML
          </button>

          {uploadedHtml && (
            <button
              type="button"
              onClick={() => {
                setUploadedHtml(null);
                setUploadedName(null);
                setUploadError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/25 rounded-[2px] text-white/80 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!activeHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/25 rounded-[2px] text-white/90 hover:bg-white/10 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          <a
            href="/altura-index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/25 rounded-[2px] text-white/90 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Browser Preview
          </a>

          <button
            type="button"
            onClick={() => activeHtml && onDownload(activeHtml, activeName)}
            disabled={!activeHtml}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white text-[#0b0b0c] rounded-[2px] hover:bg-white/90 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download {activeName}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close HTML preview"
            className="inline-flex items-center justify-center w-8 h-8 border border-white/20 rounded-[2px] text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-6 py-2 text-xs text-red-200 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-200/80 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Preview / Code Stage */}
      <div
        ref={stageRef}
        className="relative flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 bg-[#08080a]"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isLoading && !activeHtml ? (
          <div className="text-sm text-white/70">Preparing standalone index.html...</div>
        ) : error && !activeHtml ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : viewMode === "preview" ? (
          viewport === "desktop" && desktopScale !== null ? (
            <div
              className="relative bg-[#0b0b0c] border border-white/15 overflow-hidden rounded-[2px] shadow-2xl"
              style={{
                width: `${Math.round(1440 * desktopScale)}px`,
                height: `${Math.round(900 * desktopScale)}px`,
              }}
            >
              <iframe
                key={`${activeName}-${byteSize}-${uploadedHtml ? "up" : "built"}`}
                title="Standalone index.html preview"
                {...(uploadedHtml
                  ? { srcDoc: activeHtml, sandbox: "allow-scripts allow-forms" }
                  : { src: "/altura-index.html" })}
                style={{
                  width: "1440px",
                  height: "900px",
                  transform: `scale(${desktopScale})`,
                  transformOrigin: "top left",
                }}
                className="border-0 block bg-[#0b0b0c]"
              />
            </div>
          ) : (
            <div
              className={`relative bg-[#0b0b0c] border border-white/15 overflow-hidden transition-all duration-200 ${
                viewport === "mobile"
                  ? "w-[390px] max-w-full h-[min(844px,100%)] rounded-2xl shadow-2xl"
                  : "w-full h-full rounded-[2px]"
              }`}
            >
              <iframe
                key={`${activeName}-${byteSize}-${uploadedHtml ? "up" : "built"}`}
                title="Standalone index.html preview"
                {...(uploadedHtml
                  ? { srcDoc: activeHtml, sandbox: "allow-scripts allow-forms" }
                  : { src: "/altura-index.html" })}
                className="w-full h-full border-0 block bg-[#0b0b0c]"
              />
            </div>
          )
        ) : (
          <div className="w-full h-full border border-white/15 rounded-[2px] bg-[#0e0e11] overflow-hidden flex flex-col">
            <textarea
              readOnly
              value={activeHtml}
              spellCheck={false}
              aria-label="HTML source code"
              className="w-full h-full resize-none bg-transparent p-4 text-xs leading-relaxed font-mono text-white/85 outline-none"
            />
          </div>
        )}

        {isDragging && (
          <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-[2px] border border-dashed border-white/60 bg-[#0b0b0c]/85 backdrop-blur-sm">
            <p className="text-sm font-medium text-white">
              Drop your index.html file here to preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
