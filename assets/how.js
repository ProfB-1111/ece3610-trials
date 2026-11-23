/* Renders "How It Works" from config.HOW_IT_WORKS.
 *   renderHowItWorks(el)                    full version (rules.html, leaderboard popup)
 *   renderHowItWorks(el, { compact: true }) leaderboard rotation card (photo + task order)
 */
window.renderHowItWorks = function (el, opts = {}) {
  const C = window.TRIALS_CONFIG, ko = window.I18N && window.I18N.lang === "ko";
  const H = (ko && C.HOW_IT_WORKS_KO) || C.HOW_IT_WORKS || {};
  const esc = window.Trials.esc;
  const T = H.tasks || {};

  const chip = k => {
    const t = T[k] || { name: k, num: "", color: "#888" };
    return `<span class="tchip" style="--c:${esc(t.color)}"><b>#${esc(t.num)}</b>${esc(t.name)}</span>`;
  };
  const seqs = (H.sequences || []).map(q => `
    <div class="seq">
      <span class="gest">${esc(H.gestureLabel || "Gesture")} <b>${esc(q.gesture)}</b></span>
      ${q.order.map(k => `<span class="arr">→</span>${chip(k)}`).join("")}
      <span class="arr">→</span><span class="home">HOME</span>
    </div>`).join("");
  const fig = H.image ? `<figure class="how-fig"><img src="${esc(H.image.src)}" alt="${esc(H.image.alt || "")}" loading="lazy">
      ${H.image.caption ? `<figcaption>${esc(H.image.caption)}</figcaption>` : ""}</figure>` : "";

  if (opts.compact) {
    el.innerHTML = `<div class="how-compact">
      ${fig}
      <div>
        ${H.sequenceIntro ? `<p class="how-intro">${esc(H.sequenceIntro)}</p>` : ""}
        <div class="seqs">${seqs}</div>
      </div></div>`;
    return;
  }

  const tasks = Object.keys(T).map(k => `
    <div class="task" style="--c:${esc(T[k].color)}">
      <div class="tnum">#${esc(T[k].num)}</div>
      <div><b>${esc(T[k].name)}</b><p>${esc(T[k].text)}</p></div>
    </div>`).join("");

  el.innerHTML = `
    ${H.intro ? `<p class="how-intro">${esc(H.intro)}</p>` : ""}
    ${fig}
    ${seqs ? `<h3 class="how-h">${esc(H.missionTitle || "The mission")}</h3>
      ${H.sequenceIntro ? `<p class="how-intro">${esc(H.sequenceIntro)}</p>` : ""}<div class="seqs">${seqs}</div>` : ""}
    ${tasks ? `<h3 class="how-h">${esc(H.tasksTitle || "The three tasks")}</h3><div class="tasks">${tasks}</div>` : ""}
    ${H.bonus ? `<div class="bonus"><b>★ ${esc(H.bonus.title)}</b><p>${esc(H.bonus.text)}</p></div>` : ""}
    ${(H.steps || []).length ? `<h3 class="how-h">${esc(H.rulesTitle || "Rules")}</h3>
      <ol class="how-steps">${H.steps.map(s => `<li><div><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div></li>`).join("")}</ol>` : ""}
    ${(H.glossary || []).length ? `<div class="how-gloss">${H.glossary.map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join("")}</div>` : ""}`;
};
