import React from "react";
import { CLIPS } from "../data/clips";

interface FilmBackdropProps {
  stillRefs: React.MutableRefObject<Record<string, HTMLImageElement | null>>;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  progressBarRef: React.RefObject<HTMLSpanElement | null>;
  onVideoMetadata?: (file: string, video: HTMLVideoElement) => void;
  onVideoReady?: (file: string, video: HTMLVideoElement) => void;
  onVideoSeeked?: (file: string, video: HTMLVideoElement) => void;
  onVideoError?: (file: string, video: HTMLVideoElement) => void;
}

export function FilmBackdrop({
  stillRefs,
  videoRefs,
  progressBarRef,
  onVideoMetadata,
  onVideoReady,
  onVideoSeeked,
  onVideoError,
}: FilmBackdropProps) {
  return (
    <>
      <div className="film" aria-hidden="true">
        {CLIPS.map((clip) => (
          <img
            key={`still-${clip.file}`}
            ref={(el) => {
              stillRefs.current[clip.file] = el;
            }}
            src={clip.posterSrc}
            alt=""
            className="backdrop-still"
            loading="eager"
            decoding="async"
          />
        ))}
        {CLIPS.map((clip, index) => (
          <video
            key={clip.file}
            ref={(el) => {
              videoRefs.current[clip.file] = el;
            }}
            data-file={clip.file}
            muted
            playsInline
            preload={index === 0 ? "auto" : "none"}
            disablePictureInPicture
            onLoadedMetadata={(e) => {
              onVideoMetadata?.(clip.file, e.currentTarget);
            }}
            onLoadedData={(e) => {
              onVideoReady?.(clip.file, e.currentTarget);
            }}
            onCanPlay={(e) => {
              onVideoReady?.(clip.file, e.currentTarget);
            }}
            onSeeked={(e) => {
              onVideoSeeked?.(clip.file, e.currentTarget);
            }}
            onError={(e) => {
              onVideoError?.(clip.file, e.currentTarget);
            }}
          />
        ))}
        <div className="shade" />
        <div className="shade ends" />
      </div>
      <div className="progress" aria-hidden="true">
        <span ref={progressBarRef} />
      </div>
    </>
  );
}
