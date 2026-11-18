import fs from "fs";
import path from "path";

const root = process.cwd();
const aistudioDir = path.join(root, "public", "assets", "aistudio");

const IMAGES = {
  "villa-approach": "villa-approach_2e9b5fb2.jpg",
  "wellness-stair": "wellness-stair_61438d95.jpg",
  "suite-staging": "suite-staging_0fed0c83.jpg",
  "garden-suite": "garden-suite_poster.jpg",
  "chalet-living": "chalet-living_poster.jpg",
  "estate-walk": "estate-walk_poster.jpg",
  "exterior-orbit": "exterior-orbit_poster.jpg",
  "terrace-pergola": "terrace-pergola_poster.jpg",
  "patio-return": "patio-return_poster.jpg",
  "villa-exit": "villa-exit_82d6f102.jpg",
};

const dataUri = {};
for (const [key, filename] of Object.entries(IMAGES)) {
  const buf = fs.readFileSync(path.join(aistudioDir, filename));
  dataUri[key] = `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// Extract Lenis inline script from existing netlify/index.html so offline smooth scroll works identically
const existingNetlify = fs.readFileSync(
  path.join(root, "netlify", "index.html"),
  "utf8"
);
const lenisMatch = existingNetlify.match(
  /<!-- Lenis 1\.3\.27 \(MIT, darkroom\.engineering\) -->\s*<script>[\s\S]*?<\/script>/
);
if (!lenisMatch) {
  throw new Error("Could not extract Lenis inline script from netlify/index.html");
}
const lenisScriptTag = lenisMatch[0];

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0b0b0c" />
    <title>Altura — Private Residence</title>
    <meta name="description" content="One coastal residence, walked in a single take." />
    <meta property="og:title" content="Altura — Private Residence" />
    <meta property="og:description" content="One coastal residence, walked in a single take." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link
      rel="icon"
      type="image/svg+xml"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%230b0b0c'/%3E%3Cpath d='M5 25L13.5 7L22 25' fill='none' stroke='%23ffffff' stroke-width='2.4' stroke-linecap='square'/%3E%3Cpath d='M13.5 7L27 14.5' fill='none' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='square' opacity='0.8'/%3E%3Cpath d='M8.5 19.5H27' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='square'/%3E%3C/svg%3E"
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --ink: #0b0b0c;
        --paper: #ffffff;
        --display: "Barlow Condensed", "Arial Narrow", ui-sans-serif, system-ui, -apple-system, sans-serif;
        --body: "DM Sans", ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
        --edge: clamp(18px, 2.5vw, 44px);
        color-scheme: dark;
      }

      * {
        box-sizing: border-box;
      }

      html {
        -webkit-text-size-adjust: 100%;
        background: var(--ink);
        overscroll-behavior-x: none;
      }

      html.lenis,
      html.lenis body {
        height: auto;
      }

      .lenis.lenis-stopped {
        overflow: hidden;
      }

      body {
        margin: 0;
        background: var(--ink);
        color: var(--paper);
        font-family: var(--body);
        overflow-x: clip;
        touch-action: pan-y;
        -webkit-font-smoothing: antialiased;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      p,
      h1,
      h2,
      dl,
      dd {
        margin: 0;
      }

      :focus-visible {
        outline: 1px solid #ffffff;
        outline-offset: 4px;
      }

      .display {
        font-family: var(--display);
        font-weight: 700;
        font-size: clamp(3rem, 7vw, 7.75rem);
        line-height: 0.92;
        letter-spacing: -0.01em;
        text-transform: uppercase;
        text-wrap: balance;
        text-shadow: 0 2px 36px rgb(0 0 0 / 0.55);
      }

      .copy {
        font-family: var(--body);
        font-weight: 500;
        font-size: clamp(0.875rem, 0.96vw, 1rem);
        line-height: 1.45;
        letter-spacing: 0.01em;
        color: rgb(255 255 255 / 0.88);
        text-wrap: balance;
        text-shadow: 0 1px 18px rgb(0 0 0 / 0.72);
      }

      .nav-text {
        font-family: var(--body);
        font-weight: 500;
        font-size: 0.8125rem;
        line-height: 1.4;
        letter-spacing: 0.04em;
        text-shadow: 0 1px 14px rgb(0 0 0 / 0.65);
      }

      .cta-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 11px 24px;
        border: 1px solid rgb(255 255 255 / 0.85);
        border-radius: 2px;
        background: rgb(11 11 12 / 0.36);
        backdrop-filter: blur(8px);
        color: #ffffff;
        font-family: var(--body);
        font-weight: 500;
        font-size: 0.8125rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
        cursor: pointer;
        pointer-events: auto;
        transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }

      .cta-btn:hover {
        background: #ffffff;
        border-color: #ffffff;
        color: var(--ink);
        text-shadow: none;
      }

      /* Film & embedded architectural still backdrop */
      .film {
        position: fixed;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        background: var(--ink);
        pointer-events: none;
      }

      .film img.backdrop-still,
      .film video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        will-change: transform, opacity;
        visibility: hidden;
      }

      .film img.backdrop-still:first-of-type {
        visibility: visible;
      }

      .film .shade {
        position: absolute;
        inset: 0;
        z-index: 25;
        background: rgb(0 0 0 / 0.15);
      }

      .film .shade.ends {
        background: linear-gradient(
          to bottom,
          rgb(0 0 0 / 0.42),
          transparent 48%,
          rgb(0 0 0 / 0.36)
        );
      }

      .progress {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        height: 2px;
        pointer-events: none;
      }

      .progress span {
        display: block;
        width: 100%;
        height: 100%;
        background: rgb(255 255 255 / 0.85);
        transform-origin: left;
        transform: scaleX(0);
      }

      /* Navigation */
      .nav {
        position: fixed;
        inset: 0 0 auto 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        padding: var(--edge) var(--edge) 0;
      }

      .nav .mark {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-family: var(--display);
        font-weight: 700;
        font-size: 1.5rem;
        line-height: 1;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
        flex-shrink: 0;
        text-shadow: 0 1px 18px rgb(0 0 0 / 0.65);
      }

      .nav .mark-emblem {
        width: 24px;
        height: 20px;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 14px rgb(0 0 0 / 0.65));
      }

      .nav nav {
        display: none;
        align-items: center;
        gap: 2px;
        padding: 4px 6px;
        border: 1px solid rgb(255 255 255 / 0.55);
        border-radius: 2px;
        background: rgb(11 11 12 / 0.42);
        backdrop-filter: blur(10px);
      }

      .nav nav a {
        padding: 6px 14px;
        border-radius: 1px;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #ffffff;
        opacity: 0.94;
        transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .nav nav a:hover {
        background: rgb(255 255 255 / 0.14);
        opacity: 1;
      }

      .nav .nav-action {
        min-height: 36px;
        padding: 8px 16px;
        font-size: 0.75rem;
        flex-shrink: 0;
      }

      @media (min-width: 768px) {
        .nav nav {
          display: flex;
        }

        .nav .nav-action {
          min-height: 40px;
          padding: 9px 20px;
          font-size: 0.8125rem;
        }
      }

      /* Chapters and cues */
      .chapter {
        position: relative;
        z-index: 10;
      }

      .screen {
        position: fixed;
        inset: 0;
        z-index: 10;
        overflow: hidden;
        pointer-events: none;
      }

      .cue {
        position: absolute;
        max-width: min(86vw, 38rem);
        will-change: opacity, transform;
      }

      .cue.left {
        left: var(--edge);
        text-align: left;
      }

      .cue.right {
        right: var(--edge);
        text-align: right;
      }

      .cue.center {
        left: var(--edge);
        right: var(--edge);
        margin-inline: auto;
        text-align: center;
      }

      .cue .line {
        margin-top: clamp(10px, 0.95vw, 16px);
        max-width: 28ch;
      }

      .cue.right .line {
        margin-left: auto;
      }

      .cue.center .line {
        margin-inline: auto;
      }

      .cue .cue-cta {
        margin-top: clamp(18px, 1.7vw, 28px);
      }

      /* Viewings section */
      .viewings-band {
        position: relative;
        z-index: 20;
        background: linear-gradient(
          to bottom,
          transparent,
          rgb(11 11 12 / 0.56) 18%,
          rgb(11 11 12 / 0.78)
        );
      }

      .viewings {
        position: relative;
        z-index: 20;
        max-width: 1100px;
        margin: 0 auto;
        min-height: 100svh;
        display: grid;
        align-items: center;
        gap: 48px;
        padding: 112px var(--edge);
      }

      @media (min-width: 768px) {
        .viewings {
          grid-template-columns: 1fr 1fr;
          gap: 80px;
        }
      }

      .viewings .line {
        margin-top: clamp(10px, 1vw, 16px);
        max-width: 30ch;
      }

      .viewings dl {
        margin-top: 36px;
        display: grid;
        gap: 16px;
      }

      .viewings dt {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.6;
      }

      .viewings dd {
        margin-top: 2px;
        overflow-wrap: anywhere;
      }

      .enquiry-form {
        display: grid;
        gap: 28px;
      }

      .enquiry-form label {
        display: block;
        font-family: var(--body);
        font-weight: 500;
        font-size: 0.8125rem;
        letter-spacing: 0.04em;
        color: rgb(255 255 255 / 0.78);
      }

      .enquiry-form input {
        display: block;
        margin-top: 8px;
        width: 100%;
        border: 0;
        border-bottom: 1px solid rgb(255 255 255 / 0.4);
        border-radius: 0;
        background: transparent;
        padding: 8px 0;
        font: 400 17px / 1.45 var(--body);
        letter-spacing: 0;
        text-transform: none;
        color: #ffffff;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .enquiry-form input:focus {
        border-color: #ffffff;
      }

      .enquiry-form button {
        justify-self: start;
      }

      .note {
        min-height: 1.55em;
        color: rgb(255 255 255 / 0.88);
      }

      .site-footer {
        position: relative;
        z-index: 20;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 0 var(--edge) calc(var(--edge) + 6px);
        color: rgb(255 255 255 / 0.72);
      }

      .site-footer a:hover {
        color: #ffffff;
      }
    </style>
  </head>
  <body>
    <div class="film" aria-hidden="true">
      <img class="backdrop-still" data-file="villa-approach" src="${dataUri["villa-approach"]}" alt="" />
      <img class="backdrop-still" data-file="wellness-stair" src="${dataUri["wellness-stair"]}" alt="" />
      <img class="backdrop-still" data-file="suite-staging" src="${dataUri["suite-staging"]}" alt="" />
      <img class="backdrop-still" data-file="garden-suite" src="${dataUri["garden-suite"]}" alt="" />
      <img class="backdrop-still" data-file="estate-walk" src="${dataUri["estate-walk"]}" alt="" />
      <img class="backdrop-still" data-file="exterior-orbit" src="${dataUri["exterior-orbit"]}" alt="" />
      <img class="backdrop-still" data-file="terrace-pergola" src="${dataUri["terrace-pergola"]}" alt="" />
      <img class="backdrop-still" data-file="patio-return" src="${dataUri["patio-return"]}" alt="" />
      <img class="backdrop-still" data-file="villa-exit" src="${dataUri["villa-exit"]}" alt="" />

      <video data-file="villa-approach" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="wellness-stair" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="suite-staging" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="garden-suite" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="estate-walk" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="exterior-orbit" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="terrace-pergola" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="patio-return" muted playsinline preload="none" disablepictureinpicture></video>
      <video data-file="villa-exit" muted playsinline preload="none" disablepictureinpicture></video>

      <div class="shade"></div>
      <div class="shade ends"></div>
    </div>

    <div class="progress" aria-hidden="true"><span id="bar"></span></div>

    <header class="nav">
      <a class="mark" href="#top" aria-label="Altura, back to top">
        <svg class="mark-emblem" viewBox="0 0 28 24" fill="none" aria-hidden="true">
          <path d="M2 21L11.5 3.5L21 21" stroke="currentColor" stroke-width="2.1" stroke-linecap="square" stroke-linejoin="miter" />
          <path d="M11.5 3.5L26 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" opacity="0.82" />
          <path d="M6.2 15.5H25.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" />
          <path d="M2 21H26" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" opacity="0.45" />
        </svg>
        <span class="mark-text">Altura</span>
      </a>
      <nav aria-label="Primary" class="nav-text">
        <a href="#wellness">Residence</a>
        <a href="#suite">Rooms</a>
        <a href="#terrace">Terrace</a>
        <a href="#exit">Viewings</a>
      </nav>
      <a href="#viewings-enquiry" class="cta-btn nav-action">Book viewing</a>
    </header>

    <main id="top">
      <section id="approach" class="chapter">
        <div style="height: 240svh">
          <div class="screen">
            <div class="cue center" data-from="-1" data-to="0.13" style="top: 33%">
              <h1 class="display">Altura</h1>
              <p class="copy line">
                One coastal residence, walked in a single take. Scroll to enter.
              </p>
              <a href="#viewings-enquiry" class="cta-btn cue-cta">Book a viewing</a>
            </div>
            <div class="cue left" data-from="0.3" data-to="0.56" style="top: 58%; visibility: hidden">
              <h2 class="display">The pool<br />terrace</h2>
              <p class="copy line">
                An infinity edge suspended directly above the bay.
              </p>
            </div>
            <div class="cue right" data-from="0.72" data-to="0.93" style="top: 26%; visibility: hidden">
              <h2 class="display">The front<br />doors</h2>
              <p class="copy line">
                Tall timber pivot doors opening straight toward the sea.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="wellness" class="chapter">
        <div style="height: 320svh">
          <div class="screen">
            <div class="cue right" data-from="0.12" data-to="0.32" style="top: 54%; visibility: hidden">
              <h2 class="display">The gym</h2>
              <p class="copy line">
                Glass-walled and stone-lined, lit for training at any hour.
              </p>
            </div>
            <div class="cue left" data-from="0.4" data-to="0.64" style="top: 24%; visibility: hidden">
              <h2 class="display">The lit<br />stair</h2>
              <p class="copy line">
                Floating marble treads illuminated softly from beneath.
              </p>
            </div>
            <div class="cue right" data-from="0.74" data-to="0.94" style="top: 22%; visibility: hidden">
              <h2 class="display">The sea<br />suite</h2>
              <p class="copy line">
                A quiet bedroom framed to face the last light over the horizon.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="suite" class="chapter">
        <div style="height: 210svh">
          <div class="screen">
            <div class="cue left" data-from="0.16" data-to="0.9" style="top: 22%; visibility: hidden">
              <h2 class="display">Principal<br />suite</h2>
              <p class="copy line">
                An empty architectural volume, furnished piece by piece as you scroll.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="lounge" class="chapter">
        <div style="height: 220svh">
          <div class="screen">
            <div class="cue right" data-from="0.2" data-to="0.48" style="top: 22%; visibility: hidden">
              <h2 class="display">Garden<br />suite</h2>
              <p class="copy line">
                Deep sage plaster, shuttered bay light, and a quiet architectural shell.
              </p>
            </div>
            <div class="cue left" data-from="0.56" data-to="0.88" style="top: 58%; visibility: hidden">
              <h2 class="display">Dressed<br />to stay</h2>
              <p class="copy line">
                Bed, linen, timber side tables, and greenery falling into place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="chalet" class="chapter">
        <div style="height: 320svh">
          <div class="screen">
            <div class="cue left" data-from="0.06" data-to="0.28" style="top: 24%; visibility: hidden">
              <h2 class="display">The sunlit<br />kitchen</h2>
              <p class="copy line">
                A curved timber island beneath arched windows and recessed ceiling light.
              </p>
            </div>
            <div class="cue right" data-from="0.36" data-to="0.62" style="top: 22%; visibility: hidden">
              <h2 class="display">The games<br />room</h2>
              <p class="copy line">
                Past the bronze guest suite into a striped billiard room and walnut bar.
              </p>
            </div>
            <div class="cue left" data-from="0.7" data-to="0.92" style="top: 24%; visibility: hidden">
              <h2 class="display">Garden<br />doors</h2>
              <p class="copy line">
                Past the curved walnut bar toward triple French doors opening onto the lawn.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="exterior" class="chapter">
        <div style="height: 310svh">
          <div class="screen">
            <div class="cue left" data-from="0.26" data-to="0.56" style="top: 24%; visibility: hidden">
              <h2 class="display">The exterior<br />volume</h2>
              <p class="copy line">
                Rising over the lawn before sweeping smoothly around the two-story facade.
              </p>
            </div>
            <div class="cue right" data-from="0.68" data-to="0.86" style="top: 24%; visibility: hidden">
              <h2 class="display">Pergola<br />entrance</h2>
              <p class="copy line">
                Glass sliders part above the terrace deck, opening directly back inside.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="terrace" class="chapter">
        <div style="height: 260svh">
          <div class="screen">
            <div class="cue right" data-from="0.06" data-to="0.36" style="top: 24%; visibility: hidden">
              <h2 class="display">Open-plan<br />living</h2>
              <p class="copy line">
                Inside through the sliders to the kitchen bar, lounge, and sunlit suite.
              </p>
            </div>
            <div class="cue left" data-from="0.62" data-to="0.92" style="top: 24%; visibility: hidden">
              <h2 class="display">The pergola<br />terrace</h2>
              <p class="copy line">
                Slatted timber shade, woven seating, and sunlit coastal palms.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="patio" class="chapter">
        <div style="height: 280svh">
          <div class="screen">
            <div class="cue right" data-from="0.14" data-to="0.44" style="top: 24%; visibility: hidden">
              <h2 class="display">Back through<br />the hall</h2>
              <p class="copy line">
                Passing the bedroom and warm lounge in one unhurried reverse glide.
              </p>
            </div>
            <div class="cue left" data-from="0.6" data-to="0.9" style="top: 24%; visibility: hidden">
              <h2 class="display">Out to<br />the deck</h2>
              <p class="copy line">
                Stepping through glass sliders back onto the private timber terrace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="exit" class="chapter">
        <div style="height: 210svh">
          <div class="screen">
            <div class="cue center" data-from="0.2" data-to="0.5" style="top: 30%; visibility: hidden">
              <h2 class="display">Come and<br />see it</h2>
              <p class="copy line">
                Private viewings are arranged daily by appointment.
              </p>
              <a href="#viewings-enquiry" class="cta-btn cue-cta">Request a viewing</a>
            </div>
          </div>
        </div>

        <div class="viewings-band">
          <div class="viewings" id="viewings-enquiry">
            <div>
              <h2 class="display">Book a<br />viewing</h2>
              <p class="copy line">
                Daily, by appointment. Leave your details and an advisor will call
                to arrange a time.
              </p>
              <dl class="copy">
                <div>
                  <dt>Phone</dt>
                  <dd>+41 44 580 24 00</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>viewings@altura-residence.com</dd>
                </div>
              </dl>
            </div>

            <form id="enquiry" class="enquiry-form" novalidate>
              <label for="f-name"
                >Full name<input id="f-name" name="name" autocomplete="name"
              /></label>
              <label for="f-phone"
                >Phone<input id="f-phone" name="phone" type="tel" autocomplete="tel"
              /></label>
              <label for="f-email"
                >Email<input id="f-email" name="email" type="email" autocomplete="email"
              /></label>
              <button class="cta-btn" type="submit">Request a viewing</button>
              <p class="copy note" id="note" role="status" aria-live="polite"></p>
            </form>
          </div>

          <footer class="site-footer nav-text">
            <p>© Altura. Private Residence.</p>
            <a href="#top">Back to top</a>
          </footer>
        </div>
      </section>
    </main>

    ${lenisScriptTag}
    <script>
      (function () {
        "use strict";

        var CLIPS = [
          {
            id: "approach",
            file: "villa-approach",
            videoSrc: "assets/scrub/d/villa-approach.mp4",
            mobileVideoSrc: "assets/scrub/m/villa-approach.mp4",
            pace: [0.0,0.079,0.145,0.206,0.262,0.315,0.368,0.421,0.476,0.53,0.582,0.631,0.682,0.73,0.775,0.828,0.867,0.895,0.922,0.952,1.0],
            driftX: -1.4,
            driftY: -0.8,
          },
          {
            id: "wellness",
            file: "wellness-stair",
            videoSrc: "assets/scrub/d/wellness-stair.mp4",
            mobileVideoSrc: "assets/scrub/m/wellness-stair.mp4",
            pace: [0.0,0.048,0.101,0.154,0.205,0.257,0.308,0.362,0.409,0.458,0.507,0.557,0.618,0.707,0.812,0.859,0.885,0.912,0.938,0.961,1.0],
            driftX: 1.4,
            driftY: -1.2,
          },
          {
            id: "suite",
            file: "suite-staging",
            videoSrc: "assets/scrub/d/suite-staging.mp4",
            mobileVideoSrc: "assets/scrub/m/suite-staging.mp4",
            pace: [0.0,0.064,0.114,0.18,0.26,0.338,0.413,0.476,0.535,0.606,0.679,0.712,0.739,0.766,0.793,0.821,0.848,0.875,0.902,0.932,1.0],
            driftX: -1.1,
            driftY: 0.6,
          },
          {
            id: "lounge",
            file: "garden-suite",
            videoSrc: "assets/scrub/d/garden-suite.mp4",
            mobileVideoSrc: "assets/scrub/m/garden-suite.mp4",
            enter: "slide",
            pace: [0.0,0.035,0.08,0.13,0.185,0.245,0.305,0.365,0.425,0.485,0.545,0.605,0.665,0.725,0.785,0.84,0.89,0.935,0.968,0.988,1.0],
            driftX: 0,
            driftY: 0,
          },
          {
            id: "chalet",
            file: "estate-walk",
            videoSrc: "assets/scrub/d/estate-walk.mp4",
            mobileVideoSrc: "assets/scrub/m/estate-walk.mp4",
            enter: "slide",
            pace: [0.0,0.045,0.09,0.135,0.18,0.225,0.275,0.325,0.375,0.425,0.475,0.53,0.585,0.64,0.695,0.75,0.805,0.86,0.912,0.96,1.0],
            driftX: 0,
            driftY: 0,
          },
          {
            id: "exterior",
            file: "exterior-orbit",
            videoSrc: "assets/scrub/d/exterior-orbit.mp4",
            mobileVideoSrc: "assets/scrub/m/exterior-orbit.mp4",
            enter: "cut",
            pace: [0.0,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.86,0.915,0.96,1.0],
            driftX: 0,
            driftY: 0,
          },
          {
            id: "terrace",
            file: "terrace-pergola",
            videoSrc: "assets/scrub/d/terrace-pergola.mp4",
            mobileVideoSrc: "assets/scrub/m/terrace-pergola.mp4",
            enter: "cut",
            pace: [0.372,0.405,0.438,0.471,0.504,0.537,0.57,0.603,0.636,0.67,0.704,0.738,0.772,0.806,0.84,0.874,0.908,0.94,0.968,0.988,1.0],
            driftX: 0,
            driftY: 0,
          },
          {
            id: "patio",
            file: "patio-return",
            videoSrc: "assets/scrub/d/patio-return.mp4",
            mobileVideoSrc: "assets/scrub/m/patio-return.mp4",
            enter: "cut",
            pace: [0.0,0.01,0.024,0.041,0.063,0.099,0.143,0.19,0.238,0.289,0.341,0.393,0.444,0.496,0.547,0.595,0.642,0.686,0.726,0.761,0.793],
            driftX: 0,
            driftY: 0,
          },
          {
            id: "exit",
            file: "villa-exit",
            videoSrc: "assets/scrub/d/villa-exit.mp4",
            mobileVideoSrc: "assets/scrub/m/villa-exit.mp4",
            enter: "cut",
            pace: [0.0,0.059,0.115,0.167,0.216,0.258,0.298,0.343,0.387,0.432,0.478,0.525,0.574,0.622,0.669,0.716,0.764,0.816,0.87,0.93,1.0],
            driftX: 0,
            driftY: -1.2,
          },
        ];

        var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
        var isMobile = matchMedia("(max-width: 768px), (pointer: coarse)").matches;
        var canFetchRelative =
          location.protocol === "http:" || location.protocol === "https:";
        var FALLBACK_BASE =
          "https://ais-pre-lee6wsct2lxxaqkwrwd5d6-479177360610.asia-southeast1.run.app";

        var clamp = function (v) {
          return v < 0 ? 0 : v > 1 ? 1 : v;
        };
        var ease = function (v) {
          return v * v * (3 - 2 * v);
        };
        function paced(clip, p) {
          var t = clip.pace;
          var x = clamp(p) * (t.length - 1);
          var i = Math.min(t.length - 2, Math.floor(x));
          return t[i] + (t[i + 1] - t[i]) * (x - i);
        }
        function put(el, prop, value) {
          if (!el) return;
          var seen = el._seen || (el._seen = {});
          if (seen[prop] !== value) {
            seen[prop] = value;
            el.style[prop] = value;
          }
        }

        var stills = {};
        document.querySelectorAll(".film img.backdrop-still").forEach(function (img) {
          stills[img.dataset.file] = img;
        });

        var videos = {};
        var loaded = {};
        var triedFallback = {};
        var videoReady = {};
        var videoFailed = {};
        var time = {};
        var desiredTime = {};
        var seekStartedAt = {};
        var clipMap = {};
        CLIPS.forEach(function (c) {
          clipMap[c.file] = c;
        });

        var prefetchIdx = 3;
        var prefetchTimer = 0;
        function pumpPrefetchQueue() {
          clearTimeout(prefetchTimer);
          while (prefetchIdx < CLIPS.length) {
            var nextClip = CLIPS[prefetchIdx];
            prefetchIdx++;
            if (!loaded[nextClip.file] && !videoFailed[nextClip.file]) {
              fetchFile(nextClip.file);
              prefetchTimer = setTimeout(pumpPrefetchQueue, 500);
              return;
            }
          }
        }

        document.querySelectorAll(".film video").forEach(function (v) {
          var file = v.dataset.file;
          videos[file] = v;
          function onReady() {
            if (v.readyState >= 2) {
              videoReady[file] = true;
              var want = desiredTime[file];
              if (typeof want === "number" && Number.isFinite(v.duration) && v.duration > 0) {
                var maxT = Math.max(0, v.duration - 0.02);
                var target = Math.min(Math.max(0, want), maxT);
                if (!v.seeking && Math.abs(target - v.currentTime) > 0.022) {
                  time[file] = target;
                  seekStartedAt[file] = performance.now();
                  v.currentTime = target;
                }
              }
            }
            if (prefetchIdx < CLIPS.length) {
              var lastQueued = CLIPS[Math.max(0, prefetchIdx - 1)];
              if (
                file === lastQueued.file ||
                file === CLIPS[0].file ||
                file === CLIPS[1].file ||
                file === CLIPS[2].file
              ) {
                pumpPrefetchQueue();
              }
            }
          }
          v.addEventListener("loadeddata", onReady);
          v.addEventListener("canplay", onReady);
          v.addEventListener("seeked", function () {
            delete seekStartedAt[file];
            var want = desiredTime[file];
            if (typeof want === "number" && Number.isFinite(v.duration) && v.duration > 0) {
              var maxT = Math.max(0, v.duration - 0.02);
              var target = Math.min(Math.max(0, want), maxT);
              if (!v.seeking && Math.abs(target - v.currentTime) > 0.022) {
                time[file] = target;
                seekStartedAt[file] = performance.now();
                v.currentTime = target;
              }
            }
          });
          v.addEventListener("error", function () {
            var clip = clipMap[file];
            if (clip && !triedFallback[file] && canFetchRelative && location.origin !== FALLBACK_BASE) {
              triedFallback[file] = true;
              var relSrc = (isMobile ? clip.mobileVideoSrc : clip.videoSrc) + "?v=5";
              v.src = FALLBACK_BASE + "/" + relSrc;
              v.load();
              return;
            }
            videoFailed[file] = true;
            pumpPrefetchQueue();
          });
          v.addEventListener("loadedmetadata", function () {
            var t = desiredTime[file] !== undefined ? desiredTime[file] : (time[file] !== undefined ? time[file] : 0);
            if (typeof t === "number" && Number.isFinite(v.duration) && v.duration > 0) {
              var maxT = Math.max(0, v.duration - 0.02);
              var clamped = Math.min(Math.max(0, t), maxT);
              if (!v.seeking && Math.abs(clamped - v.currentTime) > 0.02) {
                time[file] = clamped;
                seekStartedAt[file] = performance.now();
                v.currentTime = clamped;
              }
            }
          });
        });

        function fetchFile(file) {
          if (loaded[file] || videoFailed[file]) return;
          var clip = clipMap[file];
          var v = videos[file];
          if (!clip || !v) return;
          loaded[file] = true;
          v.preload = "auto";
          var relSrc = (isMobile ? clip.mobileVideoSrc : clip.videoSrc) + "?v=5";
          if (canFetchRelative) {
            v.src = relSrc;
          } else {
            triedFallback[file] = true;
            v.src = FALLBACK_BASE + "/" + relSrc;
          }
          v.load();
        }

        fetchFile(CLIPS[0].file);
        fetchFile(CLIPS[1].file);
        fetchFile(CLIPS[2].file);
        prefetchTimer = setTimeout(pumpPrefetchQueue, 500);

        var unlockedFiles = {};
        var unlockedCount = 0;
        function unlockTouchSeek() {
          for (var i = 0; i < CLIPS.length; i++) {
            (function (file) {
              var v = videos[file];
              if (v && v.src && !unlockedFiles[file]) {
                unlockedFiles[file] = true;
                var p = v.play();
                if (p && typeof p.then === "function") {
                  p.then(function () {
                    v.pause();
                    unlockedCount++;
                    var want = desiredTime[file];
                    if (typeof want === "number" && Number.isFinite(v.duration) && v.duration > 0) {
                      var maxT = Math.max(0, v.duration - 0.02);
                      var clamped = Math.min(Math.max(0, want), maxT);
                      if (Math.abs(clamped - v.currentTime) > 0.022) {
                        v.currentTime = clamped;
                      }
                    }
                    if (unlockedCount >= CLIPS.length) {
                      removeEventListener("touchstart", unlockTouchSeek);
                      removeEventListener("touchend", unlockTouchSeek);
                      removeEventListener("mousedown", unlockTouchSeek);
                    }
                  }).catch(function () {
                    unlockedFiles[file] = false;
                  });
                }
              }
            })(CLIPS[i].file);
          }
        }
        addEventListener("touchstart", unlockTouchSeek, { passive: true });
        addEventListener("touchend", unlockTouchSeek, { passive: true });
        addEventListener("mousedown", unlockTouchSeek, { passive: true });

        var spans = [];
        var pageHeight = 0;
        function measure() {
          var st = window.scrollY;
          spans = CLIPS.map(function (c) {
            var el = document.getElementById(c.id);
            if (!el) return { top: 0, bottom: 0, cues: [] };
            var r = el.getBoundingClientRect();
            var cues = Array.prototype.map.call(
              el.querySelectorAll(".cue"),
              function (q) {
                return { el: q, from: +q.dataset.from, to: +q.dataset.to };
              }
            );
            return { top: r.top + st, bottom: r.bottom + st, cues: cues };
          });
          pageHeight = document.documentElement.scrollHeight;
        }

        function drawCues(cues, progress) {
          for (var n = 0; n < cues.length; n++) {
            var c = cues[n];
            var fade = Math.min(0.07, (c.to - c.from) / 3);
            var arrive = c.from < 0 ? 1 : ease(clamp((progress - c.from) / fade));
            var leave = ease(clamp((c.to - progress) / fade));
            var a = arrive * leave;
            if (a <= 0.001) {
              put(c.el, "visibility", "hidden");
              continue;
            }
            put(c.el, "visibility", "visible");
            put(c.el, "opacity", a.toFixed(3));
            var drift = calm ? 0 : (1 - arrive) * 26 - (1 - leave) * 26;
            put(c.el, "transform", "translate3d(0," + drift.toFixed(1) + "px,0)");
          }
        }

        var lenis = null;
        if (!calm && window.Lenis) {
          lenis = new Lenis({
            lerp: 0.085,
            wheelMultiplier: 0.95,
            syncTouch: false,
            anchors: false,
          });
        }

        var bar = document.getElementById("bar");
        var last = CLIPS.length - 1;
        var prev = 0;

        function frame(now) {
          var dt = prev ? Math.min(100, now - prev) : 16;
          prev = now;

          var vh = window.innerHeight || 1;
          var scrollTop = lenis ? lenis.scroll : window.scrollY;
          var line = scrollTop + vh * 0.5;
          var join = vh * 0.06;
          var glide = vh * 0.8;
          var fadeLen = vh * 0.55;
          var doorLen = vh * 0.48;
          var turnLen = vh * 0.78;
          var k = 1 - Math.exp(-(dt / 1000) * 28);
          var used = {};

          for (var i = 0; i <= last; i++) {
            var clip = CLIPS[i];
            var span = spans[i];
            if (!span) continue;

            var slideIn = i > 0 && clip.enter === "slide";
            var slideOut = i < last && CLIPS[i + 1].enter === "slide";
            var panLeftIn = i > 0 && clip.enter === "pan-left";
            var panLeftOut = i < last && CLIPS[i + 1].enter === "pan-left";
            var doorIn = i > 0 && clip.enter === "door";
            var doorOut = i < last && CLIPS[i + 1].enter === "door";
            var turnIn = i > 0 && clip.enter === "turn";
            var turnOut = i < last && CLIPS[i + 1].enter === "turn";
            var moveIn = slideIn || panLeftIn;
            var moveOut = slideOut || panLeftOut;
            var fadeIn = i > 0 && clip.enter === "fade";
            var fadeOut = i < last && CLIPS[i + 1].enter === "fade";
            var cutIn = i > 0 && clip.enter === "cut";
            var cutOut = i < last && CLIPS[i + 1].enter === "cut";

            var start =
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

            var end =
              i === last
                ? pageHeight - vh * 0.5
                : moveOut
                ? span.bottom - glide
                : fadeOut || cutOut || doorOut || turnOut
                ? span.bottom
                : span.bottom - join;

            var denom = Math.max(1, end - start);
            var progress = (line - start) / denom;
            var shownFrom = moveIn ? start - glide : start;
            var shownTo =
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

            var v = videos[clip.file];
            var still = stills[clip.file];
            if (!v && !still) continue;
            used[clip.file] = true;

            var useVideo = Boolean(v && !videoFailed[clip.file] && (videoReady[clip.file] || v.readyState >= 2) && Number.isFinite(v.duration) && v.duration > 0);

            if (v && Number.isFinite(v.duration) && v.duration > 0) {
              var maxTime = Math.max(0, v.duration - 0.02);
              var want = Math.min(paced(clip, clamp(progress)) * v.duration, maxTime);
              desiredTime[clip.file] = want;
              var from = time[clip.file];
              var t =
                from === undefined || Math.abs(want - from) > 1.2
                  ? want
                  : from + (want - from) * k;
              var seekStuck =
                v.seeking &&
                seekStartedAt[clip.file] !== undefined &&
                now - seekStartedAt[clip.file] > 350;
              if ((!v.seeking || seekStuck) && v.readyState >= 1) {
                time[clip.file] = t;
                if (Math.abs(t - v.currentTime) > 0.022 || seekStuck) {
                  seekStartedAt[clip.file] = now;
                  v.currentTime = t;
                }
              } else if (from === undefined) {
                time[clip.file] = want;
              }
            }

            var x = 0;
            var txPx = 0;
            var tyPx = 0;
            var rotY = 0;
            var opacity = 1;
            if (slideIn) {
              x = (1 - ease(clamp((line - shownFrom) / glide))) * 100;
            } else if (panLeftIn) {
              x = -(1 - ease(clamp((line - shownFrom) / glide))) * 100;
            } else if (turnIn) {
              opacity = ease(clamp((line - start) / turnLen));
            } else if (doorIn) {
              opacity = ease(clamp((line - start) / doorLen));
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

            var panScale = 1;
            var originStr = "50% 50%";
            var objPos = "50% 50%";
            if (!calm && clip.endMove === "door") {
              var vw = window.innerWidth || 1;
              var panT = ease(clamp((progress - 0.62) / 0.2));
              var zoomT = ease(clamp((progress - 0.78) / 0.22));
              var posX = 50 - 50 * panT;
              objPos = posX.toFixed(1) + "% 50%";

              var vidScale = Math.max(vw / 1280, vh / 960);
              var rw = 1280 * vidScale;
              var rh = 960 * vidScale;
              var ox = (vw - rw) * (posX / 100);
              var oy = (vh - rh) * 0.5;
              var doorX = ox + 0.085 * rw;
              var doorY = oy + 0.44 * rh;

              panScale = 1 + 0.18 * panT + 3.02 * zoomT;
              txPx = Math.min(
                doorX * (panScale - 1),
                Math.max(0, (vw * 0.5 - doorX) * zoomT)
              );
              var maxShiftUp = -(vh - doorY) * (panScale - 1);
              var maxShiftDown = doorY * (panScale - 1);
              tyPx = Math.max(
                maxShiftUp,
                Math.min(maxShiftDown, (vh * 0.5 - doorY) * zoomT)
              );
              originStr = doorX.toFixed(1) + "px " + doorY.toFixed(1) + "px";
            } else if (!calm && clip.endMove === "right-door") {
              var vw = window.innerWidth || 1;
              var panT = ease(clamp((progress - 0.6) / 0.2));
              var zoomT = ease(clamp((progress - 0.78) / 0.22));
              var posX = 50 + 50 * panT;
              objPos = posX.toFixed(1) + "% 50%";

              var vidScale = Math.max(vw / 1280, vh / 720);
              var rw = 1280 * vidScale;
              var rh = 720 * vidScale;
              var ox = (vw - rw) * (posX / 100);
              var oy = (vh - rh) * 0.5;
              var doorX = ox + 0.925 * rw;
              var doorY = oy + 0.5 * rh;

              panScale = 1 + 0.2 * panT + 3.0 * zoomT;
              txPx = Math.max(
                -(vw - doorX) * (panScale - 1),
                Math.min(0, (vw * 0.5 - doorX) * zoomT)
              );
              var maxShiftUp = -(vh - doorY) * (panScale - 1);
              var maxShiftDown = doorY * (panScale - 1);
              tyPx = Math.max(
                maxShiftUp,
                Math.min(maxShiftDown, (vh * 0.5 - doorY) * zoomT)
              );
              originStr = doorX.toFixed(1) + "px " + doorY.toFixed(1) + "px";
            } else if (!calm && clip.endMove === "turn-enter") {
              var turnStart = end - turnLen;
              if (line > turnStart) {
                var turnT = ease(clamp((line - turnStart) / turnLen));
                panScale = 1 + 0.24 * turnT;
                x = -3.5 * turnT;
                rotY = -15 * turnT;
              }
            } else if (!calm && clip.endMove === "garden-exit") {
              var pushT = ease(clamp((progress - 0.74) / 0.26));
              if (pushT > 0) {
                panScale = 1 + 0.42 * pushT;
                originStr = "42% 52%";
              }
            } else if (!calm && turnIn) {
              if (line < start + turnLen) {
                var turnT = ease(clamp((line - start) / turnLen));
                panScale = 1.24 - 0.24 * turnT;
                x = 3.5 * (1 - turnT);
                rotY = 15 * (1 - turnT);
              }
            } else if (!calm && doorIn) {
              var stepT = ease(clamp((line - start) / doorLen));
              panScale = 1.16 - 0.16 * stepT;
            } else if (!calm && clip.endMove === "left") {
              var panT = ease(clamp((progress - 0.68) / 0.32));
              panScale = 1 + 0.24 * panT;
              originStr = "0px " + (vh * 0.52).toFixed(1) + "px";
              objPos = (50 - 46 * panT).toFixed(1) + "% 50%";
            }

            if (still) {
              put(still, "zIndex", String(i + 1));
              put(still, "opacity", opacity.toFixed(3));
              put(still, "visibility", "visible");
              var cp = clamp(progress);
              var kenScale = calm ? 1 : (1 + cp * 0.085) * panScale;
              var kenX = calm ? 0 : (clip.driftX || 0) * cp;
              var kenY = calm ? 0 : (clip.driftY || 0) * cp;
              put(still, "objectPosition", objPos);
              put(still, "transformOrigin", originStr);
              put(
                still,
                "transform",
                txPx !== 0 || tyPx !== 0
                  ? "translate3d(" + txPx.toFixed(1) + "px," + tyPx.toFixed(1) + "px,0) scale(" + kenScale.toFixed(4) + ")"
                  : rotY !== 0
                  ? "perspective(1400px) translate3d(" + (x + kenX).toFixed(3) + "%," + kenY.toFixed(3) + "%,0) rotateY(" + rotY.toFixed(2) + "deg) scale(" + kenScale.toFixed(4) + ")"
                  : "translate3d(" + (x + kenX).toFixed(3) + "%," + kenY.toFixed(3) + "%,0) scale(" + kenScale.toFixed(4) + ")"
              );
            }

            if (v) {
              if (useVideo) {
                put(v, "zIndex", String(i + 10));
                put(v, "opacity", opacity.toFixed(3));
                put(v, "visibility", "visible");
                put(v, "objectPosition", objPos);
                put(v, "transformOrigin", originStr);
                put(
                  v,
                  "transform",
                  txPx !== 0 || tyPx !== 0
                    ? "translate3d(" + txPx.toFixed(1) + "px," + tyPx.toFixed(1) + "px,0) scale(" + panScale.toFixed(4) + ")"
                    : rotY !== 0
                    ? "perspective(1400px) translate3d(" + x.toFixed(3) + "%,0,0) rotateY(" + rotY.toFixed(2) + "deg) scale(" + panScale.toFixed(4) + ")"
                    : panScale !== 1
                    ? "translate3d(" + x.toFixed(3) + "%,0,0) scale(" + panScale.toFixed(4) + ")"
                    : "translate3d(" + x.toFixed(3) + "%,0,0)"
                );
              } else {
                put(v, "visibility", "hidden");
              }
            }
          }

          for (var f in videos) {
            if (!used[f]) {
              put(videos[f], "visibility", "hidden");
              put(stills[f], "visibility", "hidden");
            }
          }

          put(
            bar,
            "transform",
            "scaleX(" +
              clamp(scrollTop / Math.max(1, pageHeight - vh)).toFixed(4) +
              ")"
          );
        }

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
          anchor.addEventListener("click", function (e) {
            var hash = anchor.getAttribute("href") || "";
            if (!hash) return;
            e.preventDefault();
            if (hash === "#top") {
              if (lenis) {
                lenis.scrollTo(0);
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              return;
            }
            var id = hash.slice(1);
            var idx = id === "viewings-enquiry" ? last : -1;
            if (idx < 0) {
              for (var j = 0; j < CLIPS.length; j++) {
                if (CLIPS[j].id === id) {
                  idx = j;
                  break;
                }
              }
            }
            if (idx >= 0) {
              fetchFile(CLIPS[idx].file);
              if (idx > 0) fetchFile(CLIPS[idx - 1].file);
              if (idx < last) fetchFile(CLIPS[idx + 1].file);
            }
            if (lenis) {
              lenis.scrollTo(hash);
            } else {
              var target = document.getElementById(id);
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }
          });
        });

        function loop(now) {
          if (lenis) lenis.raf(now);
          frame(now);
          requestAnimationFrame(loop);
        }

        measure();
        frame(performance.now());
        requestAnimationFrame(loop);

        if (typeof ResizeObserver === "function") {
          new ResizeObserver(measure).observe(document.documentElement);
        }
        addEventListener("resize", measure, { passive: true });
        addEventListener("load", measure);
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(measure);
        }

        var form = document.getElementById("enquiry");
        var note = document.getElementById("note");
        if (form && note) {
          form.addEventListener("submit", function (e) {
            e.preventDefault();
            var trimmedName = form.elements.name.value.trim();
            var trimmedPhone = form.elements.phone.value.trim();
            var trimmedEmail = form.elements.email.value.trim();

            if (!trimmedName || !trimmedPhone) {
              note.textContent =
                "Add your name and phone number so an advisor can call you.";
              return;
            }
            if (trimmedPhone.replace(/[^0-9+]/g, "").length < 6) {
              note.textContent =
                "Enter a valid phone number so an advisor can reach you.";
              return;
            }
            if (
              trimmedEmail &&
              !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(trimmedEmail)
            ) {
              note.textContent = "Enter a valid email address or leave it blank.";
              return;
            }
            note.textContent =
              "Enquiry received for " +
              trimmedName +
              ". A private advisor will call " +
              trimmedPhone +
              " to confirm your viewing.";
            form.reset();
          });
        }
      })();
    </script>
  </body>
</html>
`;

const publicOut = path.join(root, "public", "altura-index.html");
const netlifyOut = path.join(root, "netlify", "index.html");
fs.writeFileSync(publicOut, html, "utf8");
fs.writeFileSync(netlifyOut, html, "utf8");

console.log(
  "Generated standalone index.html:",
  (Buffer.byteLength(html, "utf8") / 1024 / 1024).toFixed(2),
  "MB"
);
