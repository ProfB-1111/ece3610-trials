/* Shared data layer: remote (Apps Script) or demo (localStorage). */
(function () {
  const CFG = window.TRIALS_CONFIG;
  const DEMO = !CFG.API_URL;
  const DEMO_KEY = "ece3610_trials_demo_v4";

  // ------------------------------------------------------------ utilities
  // Completed run: "OK", or "ODO" = completed with the odometry bonus (EC). Both rank by time.
  const completed = r => !!r && (r.status === "OK" || r.status === "ODO") && r.time > 0;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function fmtTime(sec, dp = 2) {
    if (sec == null || !isFinite(sec)) return "—";
    const neg = sec < 0; sec = Math.abs(sec);
    const m = Math.floor(sec / 60);
    const s = (sec - m * 60).toFixed(dp).padStart(dp ? dp + 3 : 2, "0");
    return (neg ? "-" : "") + m + ":" + s;
  }

  // "1:23.45", "83.45", "83" -> seconds
  function parseTime(str) {
    str = String(str || "").trim();
    if (!str) return null;
    const p = str.split(":");
    let s;
    if (p.length === 1) s = parseFloat(p[0]);
    else if (p.length === 2) s = parseInt(p[0], 10) * 60 + parseFloat(p[1]);
    else return null;
    return isFinite(s) && s >= 0 ? Math.round(s * 1000) / 1000 : null;
  }

  function initials(name) {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  }

  function hue(name) {
    let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 360; return h;
  }

  /** Standings: rank by best single OK run, tiebreak by average, then name. */
  function standings(data) {
    const byTeam = {};
    data.teams.forEach(t => byTeam[t.team.toLowerCase()] = { ...t, runs: [] });
    const sortedRuns = [...data.runs].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
    sortedRuns.forEach(r => {
      const k = String(r.team).toLowerCase();
      if (!byTeam[k]) byTeam[k] = { team: r.team, robot: "", members: "", comment: "", interesting: "", learned: "", photo: "", runs: [] };
      byTeam[k].runs.push({ ...r, n: byTeam[k].runs.length + 1 });
    });
    (data.videos || []).forEach(v => { const k = String(v.team).toLowerCase(); if (byTeam[k]) (byTeam[k].videos = byTeam[k].videos || []).push(v); });
    const list = Object.values(byTeam).map(t => {
      const ok = t.runs.filter(completed).map(r => r.time);
      const best = ok.length ? Math.min(...ok) : null;
      const avg = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
      return { ...t, best, avg, okCount: ok.length };
    });
    list.sort((a, b) => {
      if (a.best == null && b.best == null) return a.team.localeCompare(b.team);
      if (a.best == null) return 1;
      if (b.best == null) return -1;
      return a.best - b.best || a.avg - b.avg || a.team.localeCompare(b.team);
    });
    list.forEach((t, i) => {
      t.rank = t.best == null ? null : i + 1;
      t.ec = t.rank != null && t.rank <= CFG.EXTRA_CREDIT_SPOTS;
    });
    return list;
  }

  // ------------------------------------------------------------ demo store
  function placeholderPhoto(name) {
    const h = hue(name);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h},55%,28%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},60%,12%)"/></linearGradient></defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <g fill="none" stroke="hsla(${h},80%,75%,.55)" stroke-width="6">
        <rect x="250" y="210" width="300" height="150" rx="18"/>
        <circle cx="310" cy="400" r="48"/><circle cx="490" cy="400" r="48"/>
        <circle cx="350" cy="270" r="14"/><circle cx="450" cy="270" r="14"/>
        <path d="M400 210 V150 M380 150 h40"/>
      </g></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function seedDemo() {
    const names = ["Circuit Breakers", "Torque Tigers", "Ohm Run", "PID Pilots", "Silicon Sprinters", "Volt Vipers", "The Encoders", "Servo Squad"];
    const comments = [
      "We switched to a PD controller the night before and it finally stopped oscillating.",
      "Two motors, one dream, and a lot of hot glue.",
      "Our robot resists going in a straight line, but it is very fast at it.",
      "Tuned Kp, Ki and Kd until it felt right. Then tuned them again.",
      "Lightest chassis in the class — 3D printed in PLA.",
      "Line sensor array plus a lot of late-night debugging.",
      "Every wheel tick counted. Literally.",
      "We learned more from the crashes than the successful runs."
    ];
    const interesting = [
      "Seeing the step response on the scope change as we tuned the gains made control theory click.",
      "How much a little sensor noise can throw off an entire state machine.",
      "Encoders: counting pulses turned out to be the key to driving straight.",
      "",
      "Designing the chassis around the battery instead of the other way around.",
      "Watching other teams solve the same course in completely different ways."
    ];
    const learned = [
      "Our robot overshot every corner. We added derivative gain and slowed the approach, and it finally settled.",
      "The motor driver kept browning out the microcontroller. A separate supply and bulk capacitor fixed it.",
      "",
      "Integer overflow in our timing code made the robot spin randomly after a minute. Took two days to find.",
      "Getting both wheels to match speed. Closed-loop control on each wheel solved it.",
      "Merging everyone's code the night before. Lesson learned: use version control from day one."
    ];
    const teams = names.map((n, i) => ({
      team: n,
      robot: ["Sparky", "Bolt", "Rover-2", "Zippy", "Ferrite", "Viper", "Tick", "Gizmo"][i],
      members: ["Sample Student A, Sample Student B, Sample Student C", "", "", "Sample Student D, Sample Student E", "", "", "", ""][i],
      comment: comments[i], interesting: interesting[i] || "", learned: learned[i] || "",
      photo: placeholderPhoto(n), photos: [{ id: "seed" + i, url: placeholderPhoto(n) }], updated: ""
    }));
    const runs = []; let t = Date.now() - 3600e3;
    const times = { 0: [52.31, 48.77, null], 1: [61.02, 55.4], 2: [null, 49.95, 47.12], 3: [58.66], 4: [45.9, 50.2], 5: [70.1, null] };
    Object.entries(times).forEach(([i, arr]) => arr.forEach(tm => {
      runs.push({ id: crypto.randomUUID(), ts: new Date(t += 90e3).toISOString(), team: names[i],
        time: tm, status: tm == null ? "DNF" : "OK", notes: "" });
    }));
    return { teams, runs, state: { currentTeam: "", nextTeam: "", lastRunId: "", timerState: "idle", timerStartMs: 0, timerElapsedMs: 0, updatedMs: Date.now() } };
  }

  function demoLoad() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const d = seedDemo(); demoSave(d); return d;
  }
  function demoSave(d) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (_) {} }

  function demoAction(body) {
    const d = demoLoad();
    const st = d.state; st.updatedMs = Date.now();
    switch (body.action) {
      case "checkKey": break;
      case "setCurrent":
        Object.assign(st, { currentTeam: body.team || "", timerState: "idle", timerStartMs: 0, timerElapsedMs: 0 });
        if (body.team && (st.nextTeam || "").toLowerCase() === body.team.toLowerCase()) st.nextTeam = "";
        break;
      case "setNext": st.nextTeam = body.team || ""; break;
      case "startTimer": {
        const start = Date.now() - Math.max(0, body.clientNowMs - body.startClientMs);
        Object.assign(st, { timerState: "running", timerStartMs: start, timerElapsedMs: 0, updatedMs: start });
        break;
      }
      case "stopTimer":
        Object.assign(st, { timerState: "stopped", timerElapsedMs: body.elapsedMs,
          updatedMs: st.timerStartMs ? st.timerStartMs + body.elapsedMs : Date.now() });
        break;
      case "resetTimer": Object.assign(st, { timerState: "idle", timerStartMs: 0, timerElapsedMs: 0 }); break;
      case "addRun": {
        const id = crypto.randomUUID();
        d.runs.push({ id, ts: new Date().toISOString(), team: body.team,
          time: body.time === "" || body.time == null ? null : Number(body.time), status: body.status || "OK", notes: body.notes || "" });
        Object.assign(st, { timerState: "done", timerStartMs: 0, timerElapsedMs: 0, lastRunId: id });
        break;
      }
      case "updateRun": {
        const r = d.runs.find(x => x.id === body.id); if (!r) throw new Error("Run not found.");
        Object.assign(r, { time: body.time === "" || body.time == null ? null : Number(body.time), status: body.status, notes: body.notes || "" });
        break;
      }
      case "deleteRun":
        d.runs = d.runs.filter(x => x.id !== body.id);
        if (st.lastRunId === body.id) Object.assign(st, { timerState: "idle", lastRunId: "" });
        break;
      case "videoStart": case "videoSmall": {
        const t = d.teams.find(x => x.team.toLowerCase() === String(body.team || "").trim().toLowerCase());
        if (!t) throw new Error("Submit your team card first, then add videos.");
        if (body.faces !== true && body.faces !== false) throw new Error("Please complete the video check.");
        const cs = body.consents || [];
        if (body.faces && (!cs.length || !cs.every(p => String(p.name || "").trim() && p.confirmed === true)))
          throw new Error("Everyone shown in the videos must confirm.");
        const id = crypto.randomUUID();
        d.pendingVideos = d.pendingVideos || {};
        d.pendingVideos[id] = { team: t.team, name: body.name || "video" };
        demoSave(d);
        if (body.action === "videoStart") return { ok: true, id, uploadUrl: "demo:" + id };
        body = { action: "videoDone", id, fileId: "demo-" + id };   // small path: finish right away
      }
      // falls through
      case "deleteTeam": {
        const key = String(body.team || "").trim().toLowerCase();
        if (!d.teams.some(t => t.team.toLowerCase() === key)) throw new Error("Team not found.");
        const runs = d.runs.filter(r => String(r.team).toLowerCase() === key).length;
        const vids = (d.videos || []).filter(v => String(v.team).toLowerCase() === key).length;
        d.teams = d.teams.filter(t => t.team.toLowerCase() !== key);
        d.runs = d.runs.filter(r => String(r.team).toLowerCase() !== key);
        d.videos = (d.videos || []).filter(v => String(v.team).toLowerCase() !== key);
        d.consents = (d.consents || []).filter(c => String(c.team).toLowerCase() !== key);
        if ((st.currentTeam || "").toLowerCase() === key) Object.assign(st, { currentTeam: "", timerState: "idle", timerStartMs: 0, timerElapsedMs: 0, lastRunId: "" });
        if ((st.nextTeam || "").toLowerCase() === key) st.nextTeam = "";
        demoSave(d);
        return { ok: true, removed: { runs, videos: vids } };
      }
      case "videoRemove": {
        const before = (d.videos || []).length;
        d.videos = (d.videos || []).filter(v => !(v.fileId === body.fileId && v.team.toLowerCase() === String(body.team).trim().toLowerCase()));
        if (d.videos.length === before) throw new Error("Video not found.");
        break;
      }
      case "videoDone": {
        const dd = demoLoad(), p = (dd.pendingVideos || {})[body.id];
        if (!p) throw new Error("Upload not found.");
        dd.videos = (dd.videos || []).concat({ team: p.team, fileId: body.fileId, name: p.name, ts: new Date().toISOString() });
        delete dd.pendingVideos[body.id]; demoSave(dd);
        return { ok: true, fileId: body.fileId };
      }
      case "submit": {
        const name = String(body.team || "").replace(/\s+/g, " ").trim();
        if (name.length < 2 || name.length > 40) throw new Error("Team name must be 2–40 characters.");
        let t = d.teams.find(x => x.team.toLowerCase() === name.toLowerCase());
        if (!t) { t = { team: name, photo: "" }; d.teams.push(t); }
        const mname = n => String(n || "").replace(/[,;]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
        const members = (body.members || []).map(mname).filter(Boolean);
        const prev = String(t.members || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
        members.filter(n => !prev.includes(n.toLowerCase())).forEach(n => {
          const c = (body.nameConsents || []).find(x => mname(x.name).toLowerCase() === n.toLowerCase());
          if (!c || c.confirmed !== true) throw new Error(n + " has not confirmed their name may be shown.");
        });
        t.members = members.join(", ");
        Object.assign(t, { robot: body.robot || "", comment: body.comment || "", interesting: body.interesting || "",
          learned: body.learned || "", updated: new Date().toISOString() });
        {
          const prev = t.photos && t.photos.length ? t.photos : (t.photo ? [{ id: "demo-p0", url: t.photo }] : []);
          const items = Array.isArray(body.photos) ? body.photos : prev.map(p => ({ keep: p.id }));
          if (!items.length) throw new Error("Add at least one photo of your robot.");
          items.forEach((it, k) => {
            if (!it.data) { if (!prev.some(p => p.id === it.keep)) throw new Error("A photo you kept no longer exists."); return; }
            if (it.faces !== true && it.faces !== false) throw new Error(`Photo ${k + 1}: please complete the photo check.`);
            const c = it.consents || [];
            if (it.faces && (!c.length || !c.every(p => String(p.name || "").trim() && p.confirmed === true)))
              throw new Error(`Photo ${k + 1}: everyone shown must confirm.`);
          });
          const out = items.map((it, k) => it.data ? { id: "demo-p" + Date.now() + k, url: it.data } : prev.find(p => p.id === it.keep));
          t.photos = out;
          t.photo = out[Math.min(Math.max(0, Number(body.main) || 0), out.length - 1)].url;
          items.forEach((it, k) => (it.consents || []).forEach((p, i) =>
            (d.consents = d.consents || []).push({ ts: new Date().toISOString(), team: t.team, photo: k + 1, person: i + 1, name: p.name })));
        }
        break;
      }
      default: throw new Error("Unknown action");
    }
    demoSave(d);
    return { ok: true };
  }

  // ------------------------------------------------------------ public API
  async function getData() {
    if (DEMO) {
      const d = demoLoad();
      return { ok: true, videos: [], ...d, serverNow: Date.now(), _recv: Date.now() };
    }
    const t0 = Date.now();
    const res = await fetch(CFG.API_URL + "?action=data&t=" + t0, { cache: "no-store" });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || "Load failed");
    const t1 = Date.now();
    // clock offset (server - local), assuming symmetric latency
    j._offset = j.serverNow - (t0 + t1) / 2;
    return j;
  }

  async function post(action, payload = {}) {
    const body = { action, ...payload };
    if (DEMO) return demoAction(body);
    const res = await fetch(CFG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
      body: JSON.stringify(body)
    });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || "Request failed");
    return j;
  }

  /** The current backend always returns these fields. If they're missing, the website is
   *  talking to an older Apps Script deployment, so a page should warn instead of failing quietly. */
  const MIN_BACKEND = 7;   // must match BACKEND_VERSION in apps-script/Code.gs
  function backendOutdated(d) { return !DEMO && d && (!Array.isArray(d.videos) || (Number(d.version) || 0) < MIN_BACKEND); }
  function warnOutdated(where) {
    if (document.getElementById("outdatedWarn")) return;
    const el = document.createElement("div");
    el.id = "outdatedWarn";
    el.style.cssText = "position:sticky;top:0;z-index:200;background:#7a1d20;color:#fff;padding:12px 20px;font:600 .92rem var(--body);text-align:center;line-height:1.45";
    el.innerHTML = "⚠ The server (Google Apps Script) is out of date, so " + where + " won't work correctly. " +
      "Instructor: paste the latest <code>Code.gs</code> into Apps Script and deploy a new version of the web app that <code>API_URL</code> in config.js points to.";
    document.body.prepend(el);
  }

  function resetDemo() { try { localStorage.removeItem(DEMO_KEY); } catch (_) {} }

  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };

  function renderLogos(el) {
    if (!el) return;
    const L = CFG.LOGOS || [];
    el.innerHTML = L.map(l => `<img src="${esc(l.src)}" alt="${esc(l.alt || "")}" style="--h:${Number(l.height) || 40}px" onerror="this.remove()">`).join("");
    el.hidden = !L.length;
  }

  window.Trials = { CFG, DEMO, completed, backendOutdated, warnOutdated, esc, fmtTime, parseTime, initials, hue, standings, getData, post, resetDemo, store, renderLogos };
})();
