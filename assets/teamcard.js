/* Team card — shared by the leaderboard (spotlight + popup) and the submission preview.
 *   teamCard(t, { full, stack, preview })
 *     full    : show all text (no line clamping) — used in popups
 *     stack   : single-column layout for narrow spaces
 *     preview : show example text for empty fields (submission page)
 */
window.TEXT_FIELDS = ["comment", "interesting", "learned"];

window.teamCard = function (t, opts = {}) {
  const { CFG, esc, fmtTime, initials, hue } = window.Trials;
  const P = CFG.CARD_PROMPTS || {};
  const runs = t.runs || [];

  const h = hue(t.team || "?");
  const photo = t.photo
    ? `<div class="avatar tc-ph" style="background-image:url('${esc(t.photo)}')"></div>`
    : `<div class="avatar tc-ph" style="background:linear-gradient(135deg,hsl(${h},45%,30%),hsl(${(h + 50) % 360},50%,14%))">${esc(initials(t.team || "?"))}</div>`;

  const n = Math.max(CFG.RUNS_PER_TEAM, runs.length);
  const bestId = t.best != null ? runs.find(r => r.status === "OK" && r.time === t.best)?.id : null;
  const runRows = Array.from({ length: n }, (_, i) => {
    const r = runs[i];
    if (!r) return `<div class="pend"><span>Run ${i + 1}</span><span>—</span></div>`;
    if (r.status !== "OK") return `<div class="dnf"><span>Run ${i + 1}</span><span>${esc(r.status)}</span></div>`;
    const b = r.id === bestId;
    return `<div class="${b ? "best" : ""}"><span>Run ${i + 1}${b ? " · best" : ""}</span><span>${fmtTime(r.time)}</span></div>`;
  }).join("");

  const qa = window.TEXT_FIELDS.map(k => {
    const txt = String(t[k] || "").trim();
    if (!txt && !opts.preview) return "";
    const p = P[k] || { label: k };
    return `<div class="qa ${txt ? "" : "ph"}"><span>${esc(p.label)}</span><p>${esc(txt || p.hint || "")}</p></div>`;
  }).join("");

  return `<div class="tcard ${opts.full ? "full" : ""} ${opts.stack ? "stack" : ""}">
    <div class="tc-left">
      ${photo}
      <div class="tc-stats">
        <div class="${t.ec ? "ec" : ""}"><span>Rank</span><b>${t.rank ?? "—"}</b></div>
        <div><span>Best</span><b>${fmtTime(t.best)}</b></div>
        <div><span>Avg</span><b>${fmtTime(t.avg)}</b></div>
      </div>
      <div class="tc-runs">${runRows}</div>
    </div>
    <div class="tc-right">
      <h3>${esc(t.team || "Your team name")}</h3>
      ${t.robot ? `<div class="tc-robot">${esc(t.robot)}</div>` : ""}
      ${t.members ? `<div class="tc-members">${esc(t.members)}</div>` : ""}
      <div class="tc-qa">${qa || `<p class="muted" style="margin:0">No comments submitted yet.</p>`}</div>
    </div>
  </div>`;
};
