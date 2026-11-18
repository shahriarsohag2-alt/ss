import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const srcVideo = path.join(
  root,
  "public/assets/aistudio/2026-11-18_18_30_27_0fc9ce2f.MP4"
);
const estateDesktop = path.join(root, "public/assets/scrub/d/estate-walk.mp4");
const estateMobile = path.join(root, "public/assets/scrub/m/estate-walk.mp4");
const terraceDesktop = path.join(
  root,
  "public/assets/scrub/d/terrace-pergola.mp4"
);
const terraceMobile = path.join(
  root,
  "public/assets/scrub/m/terrace-pergola.mp4"
);

const outDesktop = path.join(
  root,
  "public/assets/scrub/d/exterior-orbit.mp4"
);
const outMobile = path.join(
  root,
  "public/assets/scrub/m/exterior-orbit.mp4"
);
const outPoster = path.join(
  root,
  "public/assets/aistudio/exterior-orbit_poster.jpg"
);

const netlifyDesktop = path.join(
  root,
  "netlify/assets/scrub/d/exterior-orbit.mp4"
);
const netlifyMobile = path.join(
  root,
  "netlify/assets/scrub/m/exterior-orbit.mp4"
);
const netlifyPoster = path.join(
  root,
  "netlify/assets/aistudio/exterior-orbit_poster.jpg"
);

const tmpDir = "/tmp/exterior_build";
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

function runFfmpeg(args, label) {
  console.log(`Running: ${label}...`);
  execFileSync("ffmpeg", ["-y", "-v", "warning", ...args], {
    stdio: "inherit",
  });
}

// =========================================================================
// 1. Extract final open-lawn frames from estate-walk (t=5.00s) for seamless cut
// =========================================================================
const estateEndDesktopPng = path.join(tmpDir, "estate_end_d.png");
const estateEndMobilePng = path.join(tmpDir, "estate_end_m.png");

runFfmpeg(
  ["-ss", "5.00", "-i", estateDesktop, "-frames:v", "1", estateEndDesktopPng],
  "Extract desktop estate-walk final lawn frame"
);

runFfmpeg(
  [
    "-ss",
    "5.00",
    "-i",
    estateMobile,
    "-vf",
    "crop=408:720:436:0,scale=720:1280:flags=lanczos",
    "-frames:v",
    "1",
    estateEndMobilePng,
  ],
  "Extract mobile estate-walk final lawn frame"
);

// =========================================================================
// 2. Settled facade RGBA layers for Part B sliding-glass-door interior reveal
// =========================================================================
const settledPng = path.join(tmpDir, "settled_1080x1920.png");
runFfmpeg(
  ["-ss", "4.96", "-i", srcVideo, "-frames:v", "1", settledPng],
  "Extract settled facade frame"
);

const facadeWallPng = path.join(tmpDir, "facade_wall.png");
const doorLeftPng = path.join(tmpDir, "door_left.png");
const doorRightPng = path.join(tmpDir, "door_right.png");

runFfmpeg(
  [
    "-i",
    settledPng,
    "-vf",
    "format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(between(X,409,545)*between(Y,823,979),0,255)'",
    "-frames:v",
    "1",
    facadeWallPng,
  ],
  "Create facade wall cutout"
);

runFfmpeg(
  [
    "-i",
    settledPng,
    "-vf",
    "crop=69:158:408:822,format=rgba,colorchannelmixer=aa=0.88",
    "-frames:v",
    "1",
    doorLeftPng,
  ],
  "Extract left glass door leaf"
);

runFfmpeg(
  [
    "-i",
    settledPng,
    "-vf",
    "crop=69:158:477:822,format=rgba,colorchannelmixer=aa=0.88",
    "-frames:v",
    "1",
    doorRightPng,
  ],
  "Extract right glass door leaf"
);

// =========================================================================
// 3. Prepare interior reveal from terrace-pergola (1.38s -> 1.88s)
// =========================================================================
const interiorDesktop = path.join(tmpDir, "interior_d.mp4");
const interiorMobile = path.join(tmpDir, "interior_m.mp4");

runFfmpeg(
  [
    "-ss",
    "1.38",
    "-to",
    "1.88",
    "-i",
    terraceDesktop,
    "-vf",
    "setpts=2.416*(PTS-STARTPTS),minterpolate=fps=24:mi_mode=blend,trim=end_frame=29,setpts=PTS-STARTPTS",
    "-c:v",
    "libx264",
    "-crf",
    "16",
    "-pix_fmt",
    "yuv420p",
    interiorDesktop,
  ],
  "Prepare desktop interior reveal"
);

runFfmpeg(
  [
    "-ss",
    "1.38",
    "-to",
    "1.88",
    "-i",
    terraceMobile,
    "-vf",
    "crop=408:720:436:0,scale=720:1280:flags=lanczos,setpts=2.416*(PTS-STARTPTS),minterpolate=fps=24:mi_mode=blend,trim=end_frame=29,setpts=PTS-STARTPTS",
    "-c:v",
    "libx264",
    "-crf",
    "16",
    "-pix_fmt",
    "yuv420p",
    interiorMobile,
  ],
  "Prepare mobile interior reveal"
);

// =========================================================================
// 4. Animate sliding glass doors on facade (29 frames = 1.208s)
// =========================================================================
const facadeOpenVideo = path.join(tmpDir, "facade_open.mov");
const slideExpr = "min(1,max(0,(t-0.06)/0.66))";
runFfmpeg(
  [
    "-loop",
    "1",
    "-t",
    "1.208",
    "-r",
    "24",
    "-i",
    facadeWallPng,
    "-loop",
    "1",
    "-t",
    "1.208",
    "-r",
    "24",
    "-i",
    doorLeftPng,
    "-loop",
    "1",
    "-t",
    "1.208",
    "-r",
    "24",
    "-i",
    doorRightPng,
    "-filter_complex",
    [
      "color=c=black@0.0:s=1080x1920:r=24:d=1.208,format=rgba[bg]",
      `[bg][1:v]overlay=x='408 - 66*(${slideExpr})*(${slideExpr})*(3-2*(${slideExpr}))':y=822:shortest=1[with_l]`,
      `[with_l][2:v]overlay=x='477 + 66*(${slideExpr})*(${slideExpr})*(3-2*(${slideExpr}))':y=822:shortest=1[with_lr]`,
      "[with_lr][0:v]overlay=0:0:shortest=1[out]",
    ].join(";"),
    "-map",
    "[out]",
    "-c:v",
    "png",
    "-pix_fmt",
    "rgba",
    facadeOpenVideo,
  ],
  "Animate sliding glass doors on facade"
);

// =========================================================================
// 5. MOBILE BUILD (720x1280 @ 24fps)
//    Stage A (0.00s -> 4.708s, 113 frames):
//      - 0.00s -> 0.85s (frames 0..20): Drone flies out over lawn and tilts smoothly skyward into treetops & clouds (zero blur)
//      - 0.80s -> 1.10s: Seamless 7-frame sky blend inside color-matched pure clouds while turning right
//      - 0.85s -> 1.75s (frames 20..42): Drone tilts smoothly downward from clouds onto cantilevered timber roof & full orbiting house
//      - 1.75s -> 4.708s (frames 42..112): Unbroken crisp 360° exterior orbit returning to upper pergola sliders
// =========================================================================
const mAscU = "min(1,on/22.0)";
const mAscE = `(${mAscU})*(${mAscU})*(3-2*(${mAscU}))`;
// Zoom into upper sky (avoiding goalpost on left; pure sunlit sky & treetops) and subtly match cloud tone
const mAscZ = `1.0 + 1.85*(${mAscE})`;
const mAscX = `(iw - iw/zoom)*(0.50 + 0.16*(${mAscE}))`;
const mAscY = `(ih - ih/zoom)*(0.50 - 0.50*(${mAscE}))`;
const mSkyFade = "min(1,max(0,(t-0.35)/0.50))";

// Sky-to-house tilt down for srcVideo on mobile (t_out = 0.80s .. 1.75s -> on 19..42)
// At frame <= 19, zoom=3.6 anchored at y=0 (1920/3.6 = 533px, almost pure clouds above roof!), then eases to zoom=1.0 y=0.5 by frame 42
const mTiltU = "min(1,max(0,(on-19.0)/23.0))";
const mTiltE = `(${mTiltU})*(${mTiltU})*(3-2*(${mTiltU}))`;
const mOrbZ = `1.0 + 2.85*(1 - ${mTiltE})*(1 - ${mTiltE})`;
const mOrbX = `(iw - iw/zoom)*(0.50 - 0.12*(1 - ${mTiltE}))`;
const mOrbY = `(ih - ih/zoom)*(0.50*(${mTiltE}))`;

const mobilePartA = path.join(tmpDir, "mobile_partA.mp4");
runFfmpeg(
  [
    "-loop",
    "1",
    "-t",
    "1.125",
    "-r",
    "24",
    "-i",
    estateEndMobilePng,
    "-ss",
    "1.30",
    "-to",
    "4.96",
    "-i",
    srcVideo,
    "-filter_complex",
    [
      // Part 1: Lawn fly-out & skyward arc (frames 0..26 = 1.125s), crisp 0 blur, cloud brightness matched gently at end
      `[0:v]format=rgb24,zoompan=z='${mAscZ}':x='${mAscX}':y='${mAscY}':d=1:fps=24:s=720x1280,eq=brightness='-0.09*(${mSkyFade})':saturation='1 - 0.10*(${mSkyFade})':eval=frame,trim=end_frame=27,setpts=PTS-STARTPTS[m_lawn_sky]`,
      // Part 2: Building orbit starting at t=1.30s padded 19 frames (0.792s) at start so sky-to-roof tilt begins cleanly right as clouds blend
      "[1:v]fps=24,crop=1008:1792:36:0,tpad=start_duration=0.792:start_mode=clone,trim=end_frame=107,setpts=PTS-STARTPTS[m_src_pad]",
      `[m_src_pad]zoompan=z='${mOrbZ}':x='${mOrbX}':y='${mOrbY}':d=1:fps=24:s=720x1280,trim=end_frame=107,setpts=PTS-STARTPTS[m_orb_tilt]`,
      // Smooth 7-frame (0.29s) sky dissolve purely inside open clouds (offset = 0.792s)
      "[m_lawn_sky][m_orb_tilt]xfade=transition=fade:duration=0.292:offset=0.792,trim=end_frame=107,setpts=PTS-STARTPTS[out]",
    ].join(";"),
    "-map",
    "[out]",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    mobilePartA,
  ],
  "Build mobile Part A (crisp drone sky-arc + 360 orbit)"
);

// Mobile Part B (sliding glass doors open + push into Screenshot 2)
const mIntU = "min(1,t/1.15)";
const mZpZ = "1 + 9.5*min(1,on/25.2)*min(1,on/25.2)";
const mZpCU = "min(1,on/16.8)";
const mZpX = `max(0,min(iw-iw/zoom, iw*(0.5 + (0.4375-0.5)*${mZpCU}) - (iw/zoom)/2))`;
const mZpY = `max(0,min(ih-ih/zoom, ih*(0.5 + (0.5022-0.5)*${mZpCU}) - (ih/zoom)/2))`;

const mobilePartB = path.join(tmpDir, "mobile_partB.mp4");
runFfmpeg(
  [
    "-i",
    interiorMobile,
    "-i",
    facadeOpenVideo,
    "-filter_complex",
    [
      `[0:v]scale=w='720*(1.0 + 0.09*${mIntU})':h='1280*(1.0 + 0.09*${mIntU})':eval=frame:flags=lanczos,crop=720:1280:(iw-720)/2:(ih-1280)/2[int_z]`,
      "[1:v]crop=1008:1792:36:0,split=2[m_rgb_in][m_a_in]",
      `[m_rgb_in]format=rgb24,zoompan=z='${mZpZ}':x='${mZpX}':y='${mZpY}':d=1:fps=24:s=720x1280[m_rgb]`,
      `[m_a_in]alphaextract,format=gray,zoompan=z='${mZpZ}':x='${mZpX}':y='${mZpY}':d=1:fps=24:s=720x1280,format=gray[m_a]`,
      "[m_rgb][m_a]alphamerge,fade=t=out:st=0.90:d=0.18:alpha=1[fac_z]",
      "[int_z][fac_z]overlay=0:0:shortest=1,trim=end_frame=29,setpts=PTS-STARTPTS[out]",
    ].join(";"),
    "-map",
    "[out]",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    mobilePartB,
  ],
  "Build mobile Part B (doors open + enter Screenshot 2)"
);

runFfmpeg(
  [
    "-i",
    mobilePartA,
    "-i",
    mobilePartB,
    "-filter_complex",
    "[0:v][1:v]concat=n=2:v=1:a=0[v]",
    "-map",
    "[v]",
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
  "Concat & encode mobile scrub video"
);

// =========================================================================
// 6. DESKTOP BUILD (1920x1080 @ 24fps)
// =========================================================================
const featherMaskPng = path.join(tmpDir, "feather_1080x1080.png");
runFfmpeg(
  [
    "-f",
    "lavfi",
    "-i",
    "color=c=white:s=1080x1080:d=1",
    "-vf",
    "format=gray,geq=lum='if(lt(X,150), 255*X/150, if(gt(X,930), 255*(1080-X)/150, 255))'",
    "-frames:v",
    "1",
    featherMaskPng,
  ],
  "Create desktop center feather mask"
);

const dAscU = "min(1,on/22.0)";
const dAscE = `(${dAscU})*(${dAscU})*(3-2*(${dAscU}))`;
// Zoom cleanly toward upper-right open sky (x=0.68, y=0.0) past goalpost & treetops
const dAscZ = `1.0 + 1.95*(${dAscE})`;
const dAscX = `(iw - iw/zoom)*(0.50 + 0.22*(${dAscE}))`;
const dAscY = `(ih - ih/zoom)*(0.50 - 0.50*(${dAscE}))`;
const dSkyFade = "min(1,max(0,(t-0.35)/0.50))";

// Desktop vertical sky-to-roof tilt using full 1080x1920 vertical headroom (zero blend ghosting, exact 1:1 pixel aspect!):
// Composite feathered 1080x1920 tower onto blurred 1920x1920 ambient canvas, then scale + crop cleanly from y=0 pure sky down to y=420 house!
const dTiltU = "min(1,max(0,(t-0.792)/0.96))";
const dTiltE = `(${dTiltU})*(${dTiltU})*(3-2*(${dTiltU}))`;
const dCropZ = `1.0 + 0.85*(1 - ${dTiltE})*(1 - ${dTiltE})`;

const featherVertPng = path.join(tmpDir, "feather_1080x1920.png");
runFfmpeg(
  [
    "-f",
    "lavfi",
    "-i",
    "color=c=white:s=1080x1920:d=1",
    "-vf",
    "format=gray,geq=lum='if(lt(X,150), 255*X/150, if(gt(X,930), 255*(1080-X)/150, 255))'",
    "-frames:v",
    "1",
    featherVertPng,
  ],
  "Create desktop vertical feather mask"
);

const desktopPartA = path.join(tmpDir, "desktop_partA.mp4");
runFfmpeg(
  [
    "-loop",
    "1",
    "-t",
    "1.125",
    "-r",
    "24",
    "-i",
    estateEndDesktopPng,
    "-ss",
    "1.30",
    "-to",
    "4.96",
    "-i",
    srcVideo,
    "-loop",
    "1",
    "-t",
    "4.50",
    "-r",
    "24",
    "-i",
    featherVertPng,
    "-filter_complex",
    [
      // Part 1: Lawn fly-out & skyward arc (27 frames = 1.125s), crisp 0 blur
      `[0:v]format=rgb24,zoompan=z='${dAscZ}':x='${dAscX}':y='${dAscY}':d=1:fps=24:s=1920x1080,eq=brightness='-0.09*(${dSkyFade})':saturation='1 - 0.10*(${dSkyFade})':eval=frame,trim=end_frame=27,setpts=PTS-STARTPTS[d_lawn_sky]`,
      // Part 2: Building orbit padded 19 frames (0.792s) at start as full 1920x1920 tower (pure sky y=0..460, house y=460..1460)
      "[1:v]fps=24,tpad=start_duration=0.792:start_mode=clone,trim=end_frame=107,setpts=PTS-STARTPTS,split=2[s_sky_wide][s_main]",
      "[s_sky_wide]scale=1920:1920:flags=bilinear,gblur=sigma=45,eq=brightness=-0.10[d_bg1920]",
      "[s_main]format=rgba[fg_v]",
      "[fg_v][2:v]alphamerge[fg_vm]",
      "[d_bg1920][fg_vm]overlay=(W-w)/2:0:shortest=1,format=rgb24[d_tower]",
      // Razor-sharp dynamic tilt-down from y=0 clouds (1.85x zoom inside sharp center column) -> y=420 centered house (1.0x)
      `[d_tower]scale=w='2*trunc(960*(${dCropZ}))':h='2*trunc(960*(${dCropZ}))':eval=frame:flags=lanczos,crop=1920:1080:(iw-1920)/2:'420.0*(${dCropZ})*(${dTiltE})',trim=end_frame=107,setpts=PTS-STARTPTS[d_orb_tilt]`,
      // Seamless 7-frame cloud blend purely inside open sky (offset = 0.792s)
      "[d_lawn_sky][d_orb_tilt]xfade=transition=fade:duration=0.292:offset=0.792,trim=end_frame=107,setpts=PTS-STARTPTS[out]",
    ].join(";"),
    "-map",
    "[out]",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    desktopPartA,
  ],
  "Build desktop Part A (crisp drone sky-arc + 360 orbit)"
);

// Desktop Part B (sliding glass doors open + enter Screenshot 2)
const dIntU = "min(1,t/1.15)";
const dZpZ = "1 + 13.5*min(1,on/25.2)*min(1,on/25.2)";
const dZpCU = "min(1,on/16.8)";
const dZpX = `max(0,min(iw-iw/zoom, iw*(0.5 + (0.4672-0.5)*${dZpCU}) - (iw/zoom)/2))`;
const dZpY = `max(0,min(ih-ih/zoom, ih*(0.5 + (0.4444-0.5)*${dZpCU}) - (ih/zoom)/2))`;

const desktopPartB = path.join(tmpDir, "desktop_partB.mp4");
runFfmpeg(
  [
    "-i",
    interiorDesktop,
    "-i",
    facadeOpenVideo,
    "-loop",
    "1",
    "-i",
    featherMaskPng,
    "-filter_complex",
    [
      `[0:v]scale=w='1920*(1.0 + 0.09*${dIntU})':h='1080*(1.0 + 0.09*${dIntU})':eval=frame:flags=lanczos,crop=1920:1080:(iw-1920)/2:(ih-1080)/2[int_z]`,
      "[1:v]split=2[f_bg][f_fg]",
      "[f_bg]crop=1080:608:0:656,scale=1920:1080:flags=bilinear,gblur=sigma=45,eq=brightness=-0.12,format=rgb24[dbg_rgb]",
      "[f_fg]crop=1080:1080:0:420,format=rgba,split=3[fg_for_rgb][fg_for_mul][fg_for_pad]",
      "[fg_for_mul]alphaextract,format=gray[fg_a]",
      "[fg_a][2:v]blend=all_mode=multiply:shortest=1[fg_mul_a]",
      "[fg_for_rgb][fg_mul_a]alphamerge[fg_feathered]",
      "[dbg_rgb][fg_feathered]overlay=(W-w)/2:0:shortest=1,format=rgb24[fac_rgb_in]",
      "[fg_for_pad]alphaextract,format=gray,pad=1920:1080:420:0:white[fac_a_in]",
      `[fac_rgb_in]zoompan=z='${dZpZ}':x='${dZpX}':y='${dZpY}':d=1:fps=24:s=1920x1080[fac_rgb]`,
      `[fac_a_in]zoompan=z='${dZpZ}':x='${dZpX}':y='${dZpY}':d=1:fps=24:s=1920x1080,format=gray[fac_a]`,
      "[fac_rgb][fac_a]alphamerge,fade=t=out:st=0.88:d=0.18:alpha=1[fac_z]",
      "[int_z][fac_z]overlay=0:0:shortest=1,trim=end_frame=29,setpts=PTS-STARTPTS[out]",
    ].join(";"),
    "-map",
    "[out]",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    desktopPartB,
  ],
  "Build desktop Part B (doors open + enter Screenshot 2)"
);

runFfmpeg(
  [
    "-i",
    desktopPartA,
    "-i",
    desktopPartB,
    "-filter_complex",
    "[0:v][1:v]concat=n=2:v=1:a=0[v]",
    "-map",
    "[v]",
    "-c:v",
    "libx264",
    "-crf",
    "20",
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
    outDesktop,
  ],
  "Concat & encode desktop scrub video"
);

// =========================================================================
// 7. Extract poster matching frame 0 (estate-walk exit lawn) so still->video never flashes
// =========================================================================
runFfmpeg(
  ["-ss", "0.0", "-i", outDesktop, "-frames:v", "1", "-q:v", "3", outPoster],
  "Extract exterior-orbit poster"
);

// Mirror to netlify/assets/
fs.copyFileSync(outDesktop, netlifyDesktop);
fs.copyFileSync(outMobile, netlifyMobile);
fs.copyFileSync(outPoster, netlifyPoster);

// Generate visual verification sheets
const vframesDir = path.join(root, ".vframes");
fs.mkdirSync(vframesDir, { recursive: true });
runFfmpeg(
  [
    "-i",
    outDesktop,
    "-vf",
    "fps=3,scale=384:-1,tile=5x4",
    "-frames:v",
    "1",
    path.join(vframesDir, "verify_desktop.jpg"),
  ],
  "Generate desktop verification sheet"
);
runFfmpeg(
  [
    "-i",
    outMobile,
    "-vf",
    "fps=3,scale=216:-1,tile=5x4",
    "-frames:v",
    "1",
    path.join(vframesDir, "verify_mobile.jpg"),
  ],
  "Generate mobile verification sheet"
);

console.log("Done building seamless drone-turn exterior-orbit videos!");
