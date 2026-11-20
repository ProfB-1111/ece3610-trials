/* Renders the "How It Works" content from config into an element. */
window.renderHowItWorks = function (el) {
  const H = window.TRIALS_CONFIG.HOW_IT_WORKS || {};
  const esc = window.Trials.esc;
  el.innerHTML = `
    ${H.intro ? `<p class="how-intro">${esc(H.intro)}</p>` : ""}
    <ol class="how-steps">${(H.steps || []).map(s => `<li><div><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div></li>`).join("")}</ol>
    ${(H.glossary || []).length ? `<div class="how-gloss">${H.glossary.map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join("")}</div>` : ""}`;
};
