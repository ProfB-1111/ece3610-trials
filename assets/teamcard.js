/* Team card — shared by the leaderboard (spotlight + popup) and the submission preview.
 *   teamCard(t, { full, stack, preview })
 *     full    : show all text (no line clamping) — used in popups
 *     stack   : single-column layout for narrow spaces
 *     preview : show example text for empty fields (submission page)
 */
window.TEXT_FIELDS = ["comment", "interesting", "learned"];

window.teamCard = function (t, opts = {}) {
  const { CFG, esc, fmtTime, initials, hue, completed } = window.Trials;
  const P = CFG.CARD_PROMPTS || {};
  const I = window.I18N, tr = (k, en, v) => (I ? I.t(k, v) : en);   // English unless the page loaded i18n.js
  const runs = t.runs || [];

  const h = hue(t.team || "?");
  const photo = t.photo
    ? `<div class="avatar tc-ph" style="background-image:url('${esc(t.photo)}')"></div>`
    : `<div class="avatar tc-ph" style="background:linear-gradient(135deg,hsl(${h},45%,30%),hsl(${(h + 50) % 360},50%,14%))">${esc(initials(t.team || "?"))}</div>`;

  const n = Math.max(CFG.RUNS_PER_TEAM, runs.length);
  const bestId = t.best != null ? runs.find(r => completed(r) && r.time === t.best)?.id : null;
  const runRows = Array.from({ length: n }, (_, i) => {
    const r = runs[i];
    const run = tr("runN", `Run ${i + 1}`, { n: i + 1 });
    if (!r) return `<div class="pend"><span>${run}</span><span>—</span></div>`;
    if (!completed(r)) return `<div class="dnf"><span>${run}</span><span>${esc(r.status)}</span></div>`;
    const b = r.id === bestId;
    const odo = r.status === "ODO" ? ` <span class="odo" title="${esc(tr("odoLong", "Completed with the odometry bonus"))}">★ ${esc(tr("odo", "Odometry"))}</span>` : "";
    return `<div class="${b ? "best" : ""}"><span>${run}${b ? " · " + tr("bestMark", "best") : ""}${odo}</span><span>${fmtTime(r.time)}</span></div>`;
  }).join("");

  const qa = window.TEXT_FIELDS.map(k => {
    const txt = String(t[k] || "").trim();
    if (!txt && !opts.preview) return "";
    const p = P[k] || { label: k };
    const label = (I && I.lang === "ko" && p.label_ko) || p.label;
    return `<div class="qa ${txt ? "" : "ph"}"><span>${esc(label)}</span><p>${esc(txt || p.hint || "")}</p></div>`;
  }).join("");

  // Training videos: playable buttons on the full card, a single chip on the compact one.
  const vlist = t.videos || [];
  const vids = !vlist.length ? "" : (opts.full || opts.stack)
    ? `<div class="tc-videos"><span>${esc(tr("videos", "Training videos"))}</span><div>${vlist.map((v, i) =>
        `<button class="vbtn" type="button" data-video="${esc(v.fileId)}" data-vteam="${esc(t.team)}">▶ ${esc(tr("videoN", "Video " + (i + 1), { n: i + 1 }))}</button>`).join("")}</div></div>`
    : `<div class="tc-vchip">▶ ${esc(tr(vlist.length === 1 ? "videosCount1" : "videosCount", vlist.length + " training video" + (vlist.length > 1 ? "s" : ""), { n: vlist.length }))}</div>`;

  return `<div class="tcard ${opts.full ? "full" : ""} ${opts.stack ? "stack" : ""}">
    <div class="tc-left">
      ${photo}
      <div class="tc-stats">
        <div class="${t.ec ? "ec" : ""}"><span>${tr("rank", "Rank")}</span><b>${t.rank ?? "—"}</b></div>
        <div><span>${tr("best", "Best")}</span><b>${fmtTime(t.best)}</b></div>
        <div><span>${tr("avg", "Avg")}</span><b>${fmtTime(t.avg)}</b></div>
      </div>
      <div class="tc-runs">${runRows}</div>
    </div>
    <div class="tc-right">
      <h3>${esc(t.team || "Your team name")}</h3>
      ${t.robot ? `<div class="tc-robot">${esc(t.robot)}</div>` : ""}
      ${t.members ? `<div class="tc-members">${esc(t.members)}</div>` : ""}
      <div class="tc-qa">${qa || `<p class="muted" style="margin:0">${tr("noComments", "No comments submitted yet.")}</p>`}</div>
      ${vids}
    </div>
  </div>`;
};
