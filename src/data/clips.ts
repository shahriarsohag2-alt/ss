export interface CueCta {
  label: string;
  href: string;
}

export interface CueConfig {
  id: string;
  align: "left" | "right" | "center";
  from: number;
  to: number;
  topClass: string;
  titleLines: string[];
  isH1?: boolean;
  line: string;
  cta?: CueCta;
}

export interface ClipConfig {
  id: string;
  file: string;
  videoSrc: string;
  mobileVideoSrc: string;
  posterSrc: string;
  label: string;
  scroll: number;
  heightClass: string;
  pace: number[];
  enter?: "fade" | "slide" | "pan-left" | "door" | "turn" | "cut";
  endMove?: "left" | "door" | "right-door" | "turn-enter" | "garden-exit";
  cues: CueConfig[];
}

export const CLIPS: ClipConfig[] = [
  {
    id: "approach",
    file: "villa-approach",
    videoSrc: "/assets/scrub/d/villa-approach.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/villa-approach.mp4?v=3",
    posterSrc: "/assets/aistudio/villa-approach_2e9b5fb2.jpg?v=3",
    label: "The approach",
    scroll: 240,
    heightClass: "h-[240svh]",
    pace: [
      0.0, 0.079, 0.145, 0.206, 0.262, 0.315, 0.368, 0.421, 0.476, 0.53,
      0.582, 0.631, 0.682, 0.73, 0.775, 0.828, 0.867, 0.895, 0.922, 0.952, 1.0,
    ],
    cues: [
      {
        id: "approach-hero",
        align: "center",
        from: -1,
        to: 0.13,
        topClass: "top-[33%]",
        titleLines: ["Altura"],
        isH1: true,
        line: "One coastal residence, walked in a single take. Scroll to enter.",
        cta: {
          label: "Book a viewing",
          href: "#viewings-enquiry",
        },
      },
      {
        id: "approach-pool",
        align: "left",
        from: 0.3,
        to: 0.56,
        topClass: "top-[58%]",
        titleLines: ["The pool", "terrace"],
        line: "An infinity edge suspended directly above the bay.",
      },
      {
        id: "approach-doors",
        align: "right",
        from: 0.72,
        to: 0.93,
        topClass: "top-[26%]",
        titleLines: ["The front", "doors"],
        line: "Tall timber pivot doors opening straight toward the sea.",
      },
    ],
  },
  {
    id: "wellness",
    file: "wellness-stair",
    videoSrc: "/assets/scrub/d/wellness-stair.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/wellness-stair.mp4?v=3",
    posterSrc: "/assets/aistudio/wellness-stair_61438d95.jpg?v=3",
    label: "Gym, stair and sea suite",
    scroll: 320,
    heightClass: "h-[320svh]",
    pace: [
      0.0, 0.048, 0.101, 0.154, 0.205, 0.257, 0.308, 0.362, 0.409, 0.458,
      0.507, 0.557, 0.618, 0.707, 0.812, 0.859, 0.885, 0.912, 0.938, 0.961, 1.0,
    ],
    cues: [
      {
        id: "wellness-gym",
        align: "right",
        from: 0.12,
        to: 0.32,
        topClass: "top-[54%]",
        titleLines: ["The gym"],
        line: "Glass-walled and stone-lined, lit for training at any hour.",
      },
      {
        id: "wellness-stair",
        align: "left",
        from: 0.4,
        to: 0.64,
        topClass: "top-[24%]",
        titleLines: ["The lit", "stair"],
        line: "Floating marble treads illuminated softly from beneath.",
      },
      {
        id: "wellness-suite",
        align: "right",
        from: 0.74,
        to: 0.94,
        topClass: "top-[22%]",
        titleLines: ["The sea", "suite"],
        line: "A quiet bedroom framed to face the last light over the horizon.",
      },
    ],
  },
  {
    id: "suite",
    file: "suite-staging",
    videoSrc: "/assets/scrub/d/suite-staging.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/suite-staging.mp4?v=3",
    posterSrc: "/assets/aistudio/suite-staging_0fed0c83.jpg?v=3",
    label: "Principal suite",
    scroll: 210,
    heightClass: "h-[210svh]",
    pace: [
      0.0, 0.064, 0.114, 0.18, 0.26, 0.338, 0.413, 0.476, 0.535, 0.606, 0.679,
      0.712, 0.739, 0.766, 0.793, 0.821, 0.848, 0.875, 0.902, 0.932, 1.0,
    ],
    cues: [
      {
        id: "suite-principal",
        align: "left",
        from: 0.16,
        to: 0.9,
        topClass: "top-[22%]",
        titleLines: ["Principal", "suite"],
        line: "An empty architectural volume, furnished piece by piece as you scroll.",
      },
    ],
  },
  {
    id: "lounge",
    file: "garden-suite",
    videoSrc: "/assets/scrub/d/garden-suite.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/garden-suite.mp4?v=3",
    posterSrc: "/assets/aistudio/garden-suite_poster.jpg?v=3",
    label: "Garden suite",
    scroll: 220,
    heightClass: "h-[220svh]",
    enter: "slide",
    pace: [
      0.0, 0.035, 0.08, 0.13, 0.185, 0.245, 0.305, 0.365, 0.425, 0.485, 0.545,
      0.605, 0.665, 0.725, 0.785, 0.84, 0.89, 0.935, 0.968, 0.988, 1.0,
    ],
    cues: [
      {
        id: "lounge-seating",
        align: "right",
        from: 0.2,
        to: 0.48,
        topClass: "top-[22%]",
        titleLines: ["Garden", "suite"],
        line: "Deep sage plaster, shuttered bay light, and a quiet architectural shell.",
      },
      {
        id: "lounge-salon",
        align: "left",
        from: 0.56,
        to: 0.88,
        topClass: "top-[58%]",
        titleLines: ["Dressed", "to stay"],
        line: "Bed, linen, timber side tables, and greenery falling into place.",
      },
    ],
  },
  {
    id: "chalet",
    file: "estate-walk",
    videoSrc: "/assets/scrub/d/estate-walk.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/estate-walk.mp4?v=3",
    posterSrc: "/assets/aistudio/estate-walk_poster.jpg?v=3",
    label: "Kitchen, games room and bar",
    scroll: 320,
    heightClass: "h-[320svh]",
    enter: "slide",
    pace: [
      0.0, 0.045, 0.09, 0.135, 0.18, 0.225, 0.275, 0.325, 0.375, 0.425, 0.475,
      0.53, 0.585, 0.64, 0.695, 0.75, 0.805, 0.86, 0.912, 0.96, 1.0,
    ],
    cues: [
      {
        id: "chalet-timber",
        align: "left",
        from: 0.06,
        to: 0.28,
        topClass: "top-[24%]",
        titleLines: ["The sunlit", "kitchen"],
        line: "A curved timber island beneath arched windows and recessed ceiling light.",
      },
      {
        id: "chalet-table",
        align: "right",
        from: 0.36,
        to: 0.62,
        topClass: "top-[22%]",
        titleLines: ["The games", "room"],
        line: "Past the bronze guest suite into a striped billiard room and walnut bar.",
      },
      {
        id: "chalet-doors",
        align: "left",
        from: 0.7,
        to: 0.92,
        topClass: "top-[24%]",
        titleLines: ["Garden", "doors"],
        line: "Past the curved walnut bar toward triple French doors opening onto the lawn.",
      },
    ],
  },
  {
    id: "exterior",
    file: "exterior-orbit",
    videoSrc: "/assets/scrub/d/exterior-orbit.mp4?v=5",
    mobileVideoSrc: "/assets/scrub/m/exterior-orbit.mp4?v=5",
    posterSrc: "/assets/aistudio/exterior-orbit_poster.jpg?v=5",
    label: "Exterior orbit",
    scroll: 310,
    heightClass: "h-[310svh]",
    enter: "cut",
    pace: [
      0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6,
      0.65, 0.7, 0.75, 0.8, 0.86, 0.915, 0.96, 1.0,
    ],
    cues: [
      {
        id: "exterior-facade",
        align: "left",
        from: 0.26,
        to: 0.56,
        topClass: "top-[24%]",
        titleLines: ["The exterior", "volume"],
        line: "Rising over the lawn before sweeping smoothly around the two-story facade.",
      },
      {
        id: "exterior-entry",
        align: "right",
        from: 0.68,
        to: 0.86,
        topClass: "top-[24%]",
        titleLines: ["Pergola", "entrance"],
        line: "Glass sliders part above the terrace deck, opening directly back inside.",
      },
    ],
  },
  {
    id: "terrace",
    file: "terrace-pergola",
    videoSrc: "/assets/scrub/d/terrace-pergola.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/terrace-pergola.mp4?v=3",
    posterSrc: "/assets/aistudio/terrace-pergola_poster.jpg?v=3",
    label: "Pergola terrace and interior",
    scroll: 260,
    heightClass: "h-[260svh]",
    enter: "cut",
    pace: [
      0.372, 0.405, 0.438, 0.471, 0.504, 0.537, 0.57, 0.603, 0.636, 0.67,
      0.704, 0.738, 0.772, 0.806, 0.84, 0.874, 0.908, 0.94, 0.968, 0.988, 1.0,
    ],
    cues: [
      {
        id: "terrace-interior",
        align: "right",
        from: 0.06,
        to: 0.36,
        topClass: "top-[24%]",
        titleLines: ["Open-plan", "living"],
        line: "Inside through the sliders to the kitchen bar, lounge, and sunlit suite.",
      },
      {
        id: "terrace-pergola",
        align: "left",
        from: 0.62,
        to: 0.92,
        topClass: "top-[24%]",
        titleLines: ["The pergola", "terrace"],
        line: "Slatted timber shade, woven seating, and sunlit coastal palms.",
      },
    ],
  },
  {
    id: "patio",
    file: "patio-return",
    videoSrc: "/assets/scrub/d/patio-return.mp4?v=3",
    mobileVideoSrc: "/assets/scrub/m/patio-return.mp4?v=3",
    posterSrc: "/assets/aistudio/patio-return_poster.jpg?v=3",
    label: "Garden room to courtyard",
    scroll: 280,
    heightClass: "h-[280svh]",
    enter: "cut",
    pace: [
      0.0, 0.01, 0.024, 0.041, 0.063, 0.099, 0.143, 0.19, 0.238, 0.289, 0.341,
      0.393, 0.444, 0.496, 0.547, 0.595, 0.642, 0.686, 0.726, 0.761, 0.793,
    ],
    cues: [
      {
        id: "patio-living",
        align: "right",
        from: 0.14,
        to: 0.44,
        topClass: "top-[24%]",
        titleLines: ["Back through", "the hall"],
        line: "Passing the bedroom and warm lounge in one unhurried reverse glide.",
      },
      {
        id: "patio-deck",
        align: "left",
        from: 0.6,
        to: 0.9,
        topClass: "top-[24%]",
        titleLines: ["Out to", "the deck"],
        line: "Stepping through glass sliders back onto the private timber terrace.",
      },
    ],
  },
  {
    id: "exit",
    file: "villa-exit",
    videoSrc: "/assets/scrub/d/villa-exit.mp4?v=5",
    mobileVideoSrc: "/assets/scrub/m/villa-exit.mp4?v=5",
    posterSrc: "/assets/aistudio/villa-exit_82d6f102.jpg?v=5",
    label: "Back out to the coast",
    scroll: 210,
    heightClass: "h-[210svh]",
    enter: "cut",
    pace: [
      0.0, 0.059, 0.115, 0.167, 0.216, 0.258, 0.298, 0.343, 0.387, 0.432,
      0.478, 0.525, 0.574, 0.622, 0.669, 0.716, 0.764, 0.816, 0.87, 0.93, 1.0,
    ],
    cues: [
      {
        id: "exit-viewings",
        align: "center",
        from: 0.2,
        to: 0.5,
        topClass: "top-[30%]",
        titleLines: ["Come and", "see it"],
        line: "Private viewings are arranged daily by appointment.",
        cta: {
          label: "Request a viewing",
          href: "#viewings-enquiry",
        },
      },
    ],
  },
];
