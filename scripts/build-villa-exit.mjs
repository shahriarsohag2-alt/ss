import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const patioDesktop = path.join(root, "public/assets/scrub/d/patio-return.mp4");
const outDesktop = path.join(root, "public/assets/scrub/d/villa-exit.mp4");
const outMobile = path.join(root, "public/assets/scrub/m/villa-exit.mp4");
const outPoster = path.join(root, "public/assets/aistudio/villa-exit_82d6f102.jpg");

const netlifyDesktop = path.join(root, "netlify/assets/scrub/d/villa-exit.mp4");
const netlifyMobile = path.join(root, "netlify/assets/scrub/m/villa-exit.mp4");
const netlifyPoster = path.join(root, "netlify/assets/aistudio/villa-exit_82d6f102.jpg");

const backupSrc = "/tmp/villa_exit_orig_d.mp4";
if (!fs.existsSync(backupSrc)) {
  fs.copyFileSync(outDesktop, backupSrc);
}

const tmpDir = "/tmp/villa_exit_build";
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

function runFfmpeg(args, label) {
  console.log(`Running: ${label}...`);
  execFileSync("ffmpeg", ["-y", "-v", "warning", ...args], {
    stdio: "inherit",
  });
}

// 1. Prepare crisp living-room interior from patio-return (t = 2.85s -> 3.26s: pure living room, zero sliding glass frame)
// Slowed smoothly to span 3.50s (84 frames @ 24fps) with gentle depth motion & recessed architectural lighting
const interiorPatchMov = path.join(tmpDir, "patio_interior_patch.mov");
runFfmpeg(
  [
    "-ss",
    "2.85",
    "-to",
    "3.26",
    "-i",
    patioDesktop,
    "-filter_complex",
    [
      // Crop centered square-ish living room view (sofa + white coffee table + white door + fridge + mustard chairs + spots)
      "[0:v]crop=1140:1080:430:0,scale=640:606:flags=lanczos,setpts=8.6*(PTS-STARTPTS),minterpolate=fps=24:mi_mode=blend,trim=end_frame=84,setpts=PTS-STARTPTS",
      // Match golden-hour architectural warmth & add recessed top ceiling shadow + soft perimeter feather so it sits deep inside the doorway
      "eq=brightness=-0.07:contrast=1.04:saturation=0.90:gamma=0.95,format=rgba",
      "geq=r='r(X,Y)*min(1, 0.70 + 0.30*(Y/105.0))':g='g(X,Y)*min(1, 0.68 + 0.32*(Y/105.0))':b='b(X,Y)*min(1, 0.64 + 0.36*(Y/105.0))':a='255*min(1, min(X/10.0, min((W-X)/10.0, min(Y/10.0, (H-Y)/10.0))))'[out]",
    ].join(","),
    "-map",
    "[out]",
    "-c:v",
    "png",
    "-pix_fmt",
    "rgba",
    interiorPatchMov,
  ],
  "Extract & grade patio-return interior for villa-exit doorway"
);

// 2. Composite patio-return interior directly inside villa-exit's open architectural doorway (0.00s -> 3.10s)
// Exact tracked opening in 1920x1080 (with generous +8px side overlap behind door jamb & curtain edge):
//   t=0.0s: x1=758, y1=169, w=536, h=515
//   t=3.0s: x1=912, y1=260, w=314, h=296
const x1Expr = "758 + 51.3*t";
const y1Expr = "169 + 30.3*t";
const wExpr = "2*trunc(max(220, (536 - 74.0*t))/2)";
const hExpr = "2*trunc(max(216, (515 - 73.0*t))/2)";

const desktopFull = path.join(tmpDir, "villa_exit_d_full.mp4");
runFfmpeg(
  [
    "-i",
    backupSrc,
    "-i",
    interiorPatchMov,
    "-filter_complex",
    [
      "[1:v]split=2[p_rgb][p_a]",
      `[p_rgb]format=rgb24,scale=w='${wExpr}':h='${hExpr}':eval=frame:flags=lanczos[ps_rgb]`,
      `[p_a]alphaextract,format=gray,scale=w='${wExpr}':h='${hExpr}':eval=frame:flags=bilinear,format=gray[ps_a]`,
      "[ps_rgb][ps_a]alphamerge,fade=t=out:st=2.15:d=0.75:alpha=1[door_patch]",
      `[0:v][door_patch]overlay=x='${x1Expr}':y='${y1Expr}':eof_action=pass[out]`,
    ].join(";"),
    "-map",
    "[out]",
    "-c:v",
    "libx264",
    "-crf",
    "19",
    "-preset",
    "medium",
    "-g",
    "2",
    "-keyint_min",
    "1",
    "-bf",
    "0",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    desktopFull,
  ],
  "Composite patio-return interior into villa-exit doorway (desktop 1080p)"
);

fs.copyFileSync(desktopFull, outDesktop);
fs.copyFileSync(desktopFull, netlifyDesktop);

// 3. Downscale cleanly to mobile 1280x720 with scrub-ready intra cadence
runFfmpeg(
  [
    "-i",
    outDesktop,
    "-vf",
    "scale=1280:720:flags=lanczos",
    "-c:v",
    "libx264",
    "-crf",
    "21",
    "-preset",
    "medium",
    "-g",
    "2",
    "-keyint_min",
    "1",
    "-bf",
    "0",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outMobile,
  ],
  "Encode mobile villa-exit scrub video (720p)"
);

fs.copyFileSync(outMobile, netlifyMobile);

// 4. Refresh villa-exit poster from frame 0
runFfmpeg(
  ["-ss", "0.0", "-i", outDesktop, "-frames:v", "1", "-q:v", "3", outPoster],
  "Extract updated villa-exit poster"
);
fs.copyFileSync(outPoster, netlifyPoster);

// 5. Verification sheet for villa-exit (first 4 seconds + full pull-back)
const vframesDir = path.join(root, ".vframes");
fs.mkdirSync(vframesDir, { recursive: true });
runFfmpeg(
  [
    "-ss",
    "0",
    "-to",
    "4.0",
    "-i",
    outDesktop,
    "-vf",
    "fps=2,scale=384:-1,tile=4x2",
    "-frames:v",
    "1",
    path.join(vframesDir, "verify_villa_exit.jpg"),
  ],
  "Generate villa-exit verification sheet"
);

console.log("Done building seamless villa-exit with patio-return interior!");
