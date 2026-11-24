/* Leaderboard language support (English / 한국어).
 * Language: ?lang=ko|en in the URL > the viewer's last choice > browser language (Korean -> ko) > English.
 * Text you normally edit (title, How It Works, card headings, schedule labels,
 * disclaimer) lives in config.js as KEY / KEY_KO pairs; everything else is here.
 */
(function () {
  const STR = {
    en: {
      langBtn: "한국어", langTitle: "한국어로 보기", viewLeaderboard: "View leaderboard →",
      connecting: "Connecting", live: "Live", demo: "Demo data", reconnecting: "Reconnecting",
      how: "How it works", watchLive: "● Watch live", openYT: "▶ Open on YouTube",
      leaderboard: "Leaderboard", rankedBy: "Ranked by best single run", topEC: "Top {n} earn extra credit",
      thTeam: "Team", thRuns: "Runs", thBest: "Best", thAvg: "Avg",
      medal1: "1ST", medal2: "2ND", medal3: "3RD", medalN: "{n}TH",
      ec: "EXTRA CREDIT", openSpot: "Open spot", avgX: "AVG {t}", runsX: "{n}/{m} RUNS",
      awaitingFirst: "Awaiting first run", noTeams: "No teams yet.",
      tagNext: "UP NEXT", tagReady: "AT START LINE", tagRunning: "ON COURSE", tagStopped: "FINISHED",
      tagDone: "RUN COMPLETE", tagDoneStatus: "RUN {n} · {s}",
      lblReady: "At the start line", lblRunning: "On course", lblStopped: "Finished",
      lblDone: "Run {n} complete", lblDoneAny: "Run complete", lblDoneStatus: "Run {n} · {s}",
      runOf: "Run {n} / {m}", upNext: "Up next", standby: "Standby", waiting: "Waiting for next team",
      spotlight: "Team spotlight", clickCard: "Click to read the full team card",
      latestRuns: "Latest runs", noRuns: "No runs yet", runN: "Run {n}",
      newLeader: "New leader!", podium: "Podium!", movesTo: "{team} moves to #{r}",
      schedTitle: "Live stream schedule", ended: "Ended", liveNow: "● Live now",
      koreaTime: "Korea", tzNote: "Times shown in your time zone{tz}.", session: "Session {n}",
      trialsEnded: "The live trials have ended. Thanks for watching!", startsSoon: "Live stream starts soon",
      replay: "▶ Replay", recLive: "Live", liveStream: "Live stream", liveTimer: "Live timer",
      camOffline: "Camera offline", camBlocked: "Camera permission blocked", noCam: "No camera available",
      enableCam: "Enable camera", camera: "Camera {n}",
      // team card
      rank: "Rank", best: "Best", avg: "Avg", bestMark: "best", noComments: "No comments submitted yet.",
      odo: "Odometry", odoLong: "Completed with the odometry bonus",
      videos: "Training videos", videoN: "Video {n}", videosCount: "{n} training videos", videosCount1: "1 training video", backToCard: "← Back to team card"
    },
    ko: {
      langBtn: "English", langTitle: "View in English", viewLeaderboard: "순위표 보기 →",
      connecting: "연결 중", live: "실시간", demo: "데모 데이터", reconnecting: "재연결 중",
      how: "경기 방식", watchLive: "● 라이브 보기", openYT: "▶ YouTube에서 보기",
      leaderboard: "순위표", rankedBy: "최고 단일 주행 기록 기준", topEC: "상위 {n}팀 추가 점수",
      thTeam: "팀", thRuns: "주행", thBest: "최고", thAvg: "평균",
      medal1: "1위", medal2: "2위", medal3: "3위", medalN: "{n}위",
      ec: "추가 점수", openSpot: "빈 자리", avgX: "평균 {t}", runsX: "주행 {n}/{m}",
      awaitingFirst: "첫 주행 대기 중", noTeams: "아직 등록된 팀이 없습니다.",
      tagNext: "다음 차례", tagReady: "출발 대기", tagRunning: "주행 중", tagStopped: "주행 종료",
      tagDone: "주행 완료", tagDoneStatus: "{n}차 · {s}",
      lblReady: "출발선 대기 중", lblRunning: "코스 주행 중", lblStopped: "주행 종료",
      lblDone: "{n}차 주행 완료", lblDoneAny: "주행 완료", lblDoneStatus: "{n}차 주행 · {s}",
      runOf: "{n}차 주행 / 총 {m}회", upNext: "다음 차례", standby: "대기", waiting: "다음 팀을 기다리는 중",
      spotlight: "팀 소개", clickCard: "클릭하면 팀 카드 전체를 볼 수 있습니다",
      latestRuns: "최근 주행", noRuns: "아직 주행 기록이 없습니다", runN: "{n}차",
      newLeader: "새로운 1위!", podium: "시상대 진입!", movesTo: "{team}, {r}위 진입",
      schedTitle: "라이브 방송 일정", ended: "종료", liveNow: "● 방송 중",
      koreaTime: "한국 시간", tzNote: "현재 계신 지역의 시간으로 표시됩니다{tz}.", session: "{n}일차",
      trialsEnded: "라이브 트라이얼이 종료되었습니다. 시청해 주셔서 감사합니다!", startsSoon: "라이브 방송이 곧 시작됩니다",
      replay: "▶ 다시보기", recLive: "라이브", liveStream: "라이브 방송", liveTimer: "실시간 타이머",
      camOffline: "카메라 꺼짐", camBlocked: "카메라 권한이 차단되었습니다", noCam: "사용 가능한 카메라가 없습니다",
      enableCam: "카메라 켜기", camera: "카메라 {n}",
      rank: "순위", best: "최고", avg: "평균", bestMark: "최고", noComments: "아직 등록된 소개가 없습니다.",
      odo: "오도메트리", odoLong: "오도메트리 보너스를 포함해 완주",
      videos: "훈련 영상", videoN: "영상 {n}", videosCount: "훈련 영상 {n}개", videosCount1: "훈련 영상 1개", backToCard: "← 팀 카드로 돌아가기"
    }
  };
  const KEY = "ece3610_lang";
  const q = new URLSearchParams(location.search).get("lang");
  let saved = null; try { saved = localStorage.getItem(KEY); } catch (_) {}
  const browser = ((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
  let lang = STR[q] ? q : STR[saved] ? saved : browser.startsWith("ko") ? "ko" : "en";

  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : ""));
  const I18N = {
    get lang() { return lang; },
    get locale() { return lang === "ko" ? "ko-KR" : "en-US"; },
    t: (key, v) => fill((STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key, v),
    /** config value in the current language: obj[key + "_KO"] / obj[key + "_ko"] when Korean */
    cfg(obj, key) {
      if (!obj) return undefined;
      const ko = lang === "ko" ? (obj[key + "_KO"] ?? obj[key + "_ko"]) : undefined;
      return ko ?? obj[key];
    },
    until(ms) {
      const m = Math.max(1, Math.round(ms / 60e3)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60;
      if (lang === "ko") return d ? `${d}일${h ? ` ${h}시간` : ""} 후` : h ? `${h}시간 ${mm}분 후` : `${mm}분 후`;
      return d ? `in ${d} day${d > 1 ? "s" : ""}${h ? `, ${h} h` : ""}` : h ? `in ${h} h ${mm} min` : `in ${mm} min`;
    },
    set(l) {
      if (!STR[l]) return;
      lang = l;
      try { localStorage.setItem(KEY, l); } catch (_) {}
      const u = new URL(location.href);          // keep a shared ?lang= link from overriding the choice
      if (u.searchParams.has("lang")) { u.searchParams.set("lang", l); history.replaceState(null, "", u); }
      document.documentElement.lang = l;
    }
  };
  document.documentElement.lang = lang;
  window.I18N = I18N;
  window.t = I18N.t;
})();
