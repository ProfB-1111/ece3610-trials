/* ECE 3610 Final Course Trials — site configuration
 * Edit this file only; all three pages read from it. */
window.TRIALS_CONFIG = {
  // Paste your Apps Script Web App URL here (ends in /exec).
  // Leave empty to run in DEMO mode (sample data stored in this browser only).
  API_URL: "https://script.google.com/macros/s/AKfycbyW5l5jwicQwMPH8lp30bn6IulVMaeRKnPfjXfIYUxwrWZur5FE8RUxLI11UGw5qgLhOw/exec",

  COURSE: "ECE 3610",
  TITLE: "Final Course Trials",
  SUBTITLE: "University of Utah Asia Campus",

  // School logos, shown on a white plate in the header of every page.
  // Files live in assets/logos/. "height" is in px (optional, default 40).
  LOGOS: [
    { src: "assets/logos/uu-asia.svg",       alt: "The University of Utah Asia Campus", height: 64 },
    { src: "assets/logos/uac-namdaemun.svg", alt: "UAC Namdaemun icon",                 height: 40 },
    { src: "assets/logos/u-ece.png",         alt: "Electrical and Computer Engineering", height: 44 }
  ],

  RUNS_PER_TEAM: 3,        // shown as "Run 2 / 3"; admin warns past this
  EXTRA_CREDIT_SPOTS: 3,   // top N teams highlighted
  POLL_MS: 4000,           // how often the leaderboard refreshes (ms)
  POLL_FAST_MS: 1500,      // refresh rate while a team is on course (ms)
  SPOTLIGHT_MS: 12000,     // time per card in idle rotation (ms)

  // ---- Live video -------------------------------------------------------
  // YouTube video ID of your scheduled (unlisted) live stream.
  // From https://www.youtube.com/watch?v=AbC123xyz  ->  YOUTUBE_ID: "AbC123xyz"
  YOUTUBE_ID: "",

  // STREAM DELAY (ms): how far the YouTube video runs behind real life.
  // The timer, results and celebrations on the page are held back by this
  // amount so they match what viewers see on the video.
  //   Too early (timer stops before the robot finishes on video)  -> increase
  //   Too late  (timer keeps running after the robot finishes)     -> decrease
  // Quick test without editing: add ?delay=6000 to the page URL.
  STREAM_DELAY_MS: 4000,

  // Camera mode: "youtube" (uses YOUTUBE_ID), "embed" (any iframe URL in EMBED_URL),
  //              "local" (webcam on this computer, no delay), or "none".
  CAMERA_MODE: "youtube",
  EMBED_URL: "",
  LIVE_LINK: "",           // optional extra "Watch live" link; defaults to the YouTube page

  // Team card text fields: "ask" = question on the submission form,
  // "hint" = example text in the box, "label" = heading on the team card.
  CARD_PROMPTS: {
    comment:     { ask: "General comment",
                   hint: "About your robot, your design, your team, or the class.",
                   label: "From the team" },
    interesting: { ask: "Something you found interesting about the course",
                   hint: "A topic, lab, or moment that stood out, and why.",
                   label: "Most interesting" },
    learned:     { ask: "Something you learned, or a challenge you overcame",
                   hint: "What was hard, and how did your team get past it?",
                   label: "Challenge overcome" }
  },

  // Shown at the bottom of the leaderboard page. Set to "" to hide.
  CONSENT_DISCLAIMER:
    "All names and photos of people shown on this page are displayed with the consent of the individuals involved.",

  // Consent statement each person listed by name on a team card agrees to.
  NAME_CONSENT_STATEMENT:
    "I agree that my name may be displayed publicly on my team's card on the ECE 3610 Final Course Trials website and live stream.",

  // Consent statement each person in a team photo agrees to (submission page).
  // Consent records are stored privately in the "Consents" sheet, never published.
  PHOTO_CONSENT_STATEMENT:
    "I am shown in this photo, and I agree that it may be displayed publicly on the ECE 3610 Final Course Trials website and live stream.",

  // "How It Works" — shown via button, in the idle rotation, and on rules.html
  HOW_IT_WORKS: {
    intro: "Student teams designed, built and programmed autonomous robots to complete the course as fast as possible — no remote control allowed.",
    steps: [
      { title: "The course", text: "Robots start in the start box and must navigate the course to the finish zone on their own." },
      { title: "The runs", text: "Each team gets up to 3 timed runs. The clock starts when the robot leaves the start box and stops when it reaches the finish." },
      { title: "Scoring", text: "A team's best single run determines its rank. Average time is shown for reference." },
      { title: "DNF", text: "A run is a DNF (did not finish) if the robot leaves the course, gets stuck, or is touched by a team member." },
      { title: "Extra credit", text: "The top 3 teams on the final leaderboard earn extra credit." }
    ],
    glossary: [
      ["BEST", "Fastest completed run"],
      ["AVG", "Average of completed runs"],
      ["DNF", "Did not finish"],
      ["EC", "Extra-credit position"]
    ]
  }
};
