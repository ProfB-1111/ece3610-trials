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
    intro: "Every team designed, built and programmed an autonomous robot. Once a run starts there is no remote control: a single gesture tells the robot which order to do its three tasks in, and it must complete all of them on its own and finish back at HOME.",

    image: { src: "assets/course.jpg",
             alt: "Overhead photo of the course: HOME at the bottom center, a long winding line to the left, a line to a bucket on the right, and a short straight line to a colored marker",
             caption: "The course from above. Every run starts and ends at HOME." },

    sequenceIntro: "The team gives its robot one gesture, a 0 or a 1, which sets the order of the tasks. Color sensing always comes last.",
    sequences: [
      { gesture: "0", order: ["line", "wall", "color"] },
      { gesture: "1", order: ["wall", "line", "color"] }
    ],

    // num/color match the annotated course photo
    tasks: {
      line:  { num: 1, name: "Line following", color: "#FFC000",
               text: "From HOME, the robot follows the long, winding black line all the way to its end, turns around, and follows the same line back to HOME." },
      wall:  { num: 2, name: "Wall following", color: "#ED7D31",
               text: "The robot follows the black line out to the bucket, then drives all the way around it, using its ultrasonic sensors to hold a steady distance from the bucket's wall, before following the line back to HOME." },
      color: { num: 3, name: "Color sensing", color: "#4472C4",
               text: "The robot follows the short straight line from HOME and reads the color of the marker at its end. It turns 180° in the direction the color calls for, right for red and left for blue, then follows the line back to HOME." }
    },

    bonus: { title: "Bonus challenge: odometry",
             text: "Teams can also attempt odometry for extra course credit: tracking the robot's position from measurements of its own wheel motion." },

    rulesTitle: "Runs and scoring",
    steps: [
      { title: "The runs", text: "Each team gets up to 3 timed runs. A run is timed from the start until the robot is back at HOME after its final task." },
      { title: "Scoring", text: "A team's best single run determines its rank. Average time is shown for reference." },
      { title: "DNF", text: "A run is a DNF (did not finish) if the robot can't complete a task, leaves the course, or is touched by a team member." },
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
