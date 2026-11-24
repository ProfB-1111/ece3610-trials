/* ECE 3610 Final Course Trials — site configuration
 * Edit this file only; all three pages read from it. */
window.TRIALS_CONFIG = {
  // Paste your Apps Script Web App URL here (ends in /exec).
  // Leave empty to run in DEMO mode (sample data stored in this browser only).
  API_URL: "https://script.google.com/macros/s/AKfycbxjTuYedjWk8zEHTiQ0_8q7q8svi38W9hcOQkmnkj4MW80yLM39ZvR2vW0g9PWaBs-bIQ/exec",

  COURSE: "ECE 3610",
  TITLE: "Final Course Trials",
  SUBTITLE: "University of Utah Asia Campus",
  // Korean versions (leaderboard only). Any "..._KO" / "label_ko" value is shown when the page is in Korean.
  TITLE_KO: "최종 코스 트라이얼",
  SUBTITLE_KO: "유타대학교 아시아캠퍼스",

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

  // LIVE STREAM SCHEDULE — enter times in Korea time (+09:00). Viewers see them
  // converted to their own time zone. The video box shows this schedule (with a
  // countdown) until STREAM_LEAD_MIN before a session, shows the stream until
  // STREAM_TAIL_MIN after it, and after the last session shows the recording.
  // youtubeId: that day's stream (each scheduled YouTube stream has its own ID);
  //            leave "" to use YOUTUBE_ID above.
  // Testing outside these times: add ?live=1 to the page URL to force the stream.
  STREAM_SCHEDULE: [
    { label: "Day 1", label_ko: "1일차", start: "2026-12-01T09:00:00+09:00", end: "2026-12-01T10:20:00+09:00", youtubeId: "" },
    { label: "Day 2", label_ko: "2일차", start: "2026-12-03T09:00:00+09:00", end: "2026-12-03T10:20:00+09:00", youtubeId: "" }
  ],
  STREAM_LEAD_MIN: 15,
  STREAM_TAIL_MIN: 30,

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
                   label: "From the team", label_ko: "팀 한마디" },
    interesting: { ask: "Something you found interesting about the course",
                   hint: "A topic, lab, or moment that stood out, and why.",
                   label: "Most interesting", label_ko: "가장 흥미로웠던 점" },
    learned:     { ask: "Something you learned, or a challenge you overcame",
                   hint: "What was hard, and how did your team get past it?",
                   label: "Challenge overcome", label_ko: "극복한 도전" }
  },

  // Shown at the bottom of the leaderboard page. Set to "" to hide.
  // Banner under the video box. Set to "" to hide. Hidden automatically after the last session.
  IN_PERSON_MESSAGE: "Prefer to watch in person? Come be part of the action in Room U507!",
  IN_PERSON_MESSAGE_KO: "직접 보고 싶으신가요? U507호에서 현장의 열기를 함께 느껴 보세요!",

  CONSENT_DISCLAIMER:
    "All names and photos of people shown on this page are displayed with the consent of the individuals involved.",
  CONSENT_DISCLAIMER_KO:
    "이 페이지에 표시된 모든 이름과 인물 사진은 당사자의 동의를 받아 게시되었습니다.",

  // Consent statement each person listed by name on a team card agrees to.
  NAME_CONSENT_STATEMENT:
    "I agree that my name may be displayed publicly on my team's card on the ECE 3610 Final Course Trials website and live stream.",

  // Consent statement each person shown in a team's training videos agrees to.
  VIDEO_CONSENT_STATEMENT:
    "I appear in these training videos, and I agree that they may be displayed publicly on the ECE 3610 Final Course Trials website and live stream.",

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
      ["EC", "Extra-credit position"],
      ["★", "Completed with the odometry bonus"]
    ]
  },

  // Korean "How It Works" (leaderboard + rules page in Korean). Same structure as above.
  HOW_IT_WORKS_KO: {
    intro: "각 팀은 자율주행 로봇을 직접 설계하고, 제작하고, 프로그래밍했습니다. 주행이 시작되면 원격 조종은 할 수 없습니다. 단 하나의 제스처로 세 가지 과제의 순서가 정해지고, 로봇은 스스로 모든 과제를 마친 뒤 HOME으로 돌아와야 합니다.",

    image: { src: "assets/course.jpg",
             alt: "위에서 본 코스 사진: 아래 가운데에 HOME, 왼쪽에 길고 구불구불한 선, 오른쪽에 양동이로 이어지는 선, 가운데에 색 표식으로 이어지는 짧은 직선",
             caption: "위에서 본 코스. 모든 주행은 HOME에서 시작해 HOME에서 끝납니다." },

    missionTitle: "미션",
    gestureLabel: "제스처",
    sequenceIntro: "팀은 로봇에게 0 또는 1, 단 하나의 제스처를 보여 주고, 이 제스처가 과제 순서를 정합니다. 색상 인식은 항상 마지막입니다.",
    sequences: [
      { gesture: "0", order: ["line", "wall", "color"] },
      { gesture: "1", order: ["wall", "line", "color"] }
    ],

    tasksTitle: "세 가지 과제",
    tasks: {
      line:  { num: 1, name: "라인 따라가기", color: "#FFC000",
               text: "로봇은 HOME에서 출발해 길고 구불구불한 검은 선을 끝까지 따라간 뒤, 방향을 돌려 같은 선을 따라 HOME으로 돌아옵니다." },
      wall:  { num: 2, name: "벽 따라가기", color: "#ED7D31",
               text: "로봇은 검은 선을 따라 양동이까지 간 다음, 초음파 센서로 양동이 벽과 일정한 거리를 유지하며 한 바퀴 돈 뒤, 다시 선을 따라 HOME으로 돌아옵니다." },
      color: { num: 3, name: "색상 인식", color: "#4472C4",
               text: "로봇은 HOME에서 짧은 직선을 따라가 끝에 있는 표식의 색을 읽습니다. 빨간색이면 오른쪽으로, 파란색이면 왼쪽으로 180° 회전한 뒤 선을 따라 HOME으로 돌아옵니다." }
    },

    bonus: { title: "보너스 도전: 오도메트리",
             text: "팀은 추가 학점을 위해 오도메트리에 도전할 수도 있습니다. 오도메트리는 로봇이 자기 바퀴의 움직임을 측정해 스스로의 위치를 추적하는 기술입니다." },

    rulesTitle: "주행과 점수",
    steps: [
      { title: "주행", text: "각 팀은 최대 3번의 기록 주행을 합니다. 주행 시간은 출발부터 마지막 과제를 마치고 HOME에 돌아올 때까지입니다." },
      { title: "점수", text: "팀 순위는 가장 좋은 단일 주행 기록으로 정해집니다. 평균 기록은 참고용으로 표시됩니다." },
      { title: "DNF", text: "로봇이 과제를 완료하지 못하거나, 코스를 벗어나거나, 팀원이 로봇을 만지면 그 주행은 DNF(미완주)가 됩니다." },
      { title: "추가 점수", text: "최종 순위표의 상위 3팀은 추가 점수를 받습니다." }
    ],
    glossary: [
      ["최고", "가장 빠른 완주 기록"],
      ["평균", "완주 기록의 평균"],
      ["DNF", "미완주"],
      ["EC", "추가 점수 순위"],
      ["★", "오도메트리 보너스를 포함해 완주"]
    ]
  }
};
