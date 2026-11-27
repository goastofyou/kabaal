/* Kabaal — partygame. Eén scherm is de host, telefoons zijn de controllers.
   Verbinding: Supabase Realtime broadcast (of ?local=1 voor testen in één browser). */
{
const SB_URL = "https://ingwzsesybxzskhqgujo.supabase.co";
const SB_KEY = "sb_publishable_3_8_8z2tGdwYJXiLh4AIXg_3XSc6yvE";
const Q = new URLSearchParams(location.search);
const LOCAL = Q.has("local");
const D = window.KABAAL_DATA;
const app = document.getElementById("app");
const connEl = document.getElementById("conn");

/* ---------- helpers ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickN = (a, n) => shuffle(a).slice(0, n);
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^(de|het|een|a|the) /, "");
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let p = Array.from({length: n + 1}, (_, i) => i);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
const same = (a, b) => { a = norm(a); b = norm(b); return a === b || (b.length >= 5 && lev(a, b) <= 1); };
const COLORS = ["#ff5a5f", "#3a6ff7", "#2ec4b6", "#f39c12", "#9b5de5", "#00a86b", "#e84393", "#14213d", "#8d6e63", "#ff7f11", "#0096c7", "#6a994e"];
const av = (p, cls = "") => `<span class="av ${cls}" style="background:${esc(p.color)}" title="${esc(p.name)}">${esc((p.name || "?").trim().charAt(0).toUpperCase())}</span>`;
const SHAPES = [
  '<svg viewBox="0 0 40 40"><path d="M20 4 37 34H3z" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M20 2 38 20 20 38 2 20z" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="4" fill="#fff"/></svg>'];
const TITLES = {
  quiz: ["Quiz", "Kies het goede antwoord op je telefoon. Hoe sneller, hoe meer punten."],
  who: ["Wie van ons…?", "Stem op wie het best bij de stelling past. Kies je hetzelfde als de meerderheid, dan krijg je punten."],
  bluff: ["Bluf", "Verzin een geloofwaardig nep-antwoord. Daarna zoek je het echte antwoord tussen alle verzinsels. Trapt iemand in jouw bluf, dan scoor jij."],
  draw: ["Tekenen & raden", "Eén speler tekent op zijn telefoon, de rest raadt zo snel mogelijk wat het is."]
};
function toast(msg, ms = 2600) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

/* ---------- verbinding ---------- */
async function connect(code, onMsg) {
  if (LOCAL) {
    const bc = new BroadcastChannel("kabaal-" + code);
    bc.onmessage = e => onMsg(e.data.t, e.data.d);
    return { send: (t, d) => bc.postMessage({t, d}) };
  }
  const sb = window.supabase.createClient(SB_URL, SB_KEY, { realtime: { params: { eventsPerSecond: 40 } } });
  const ch = sb.channel("kabaal-" + code, { config: { broadcast: { self: false, ack: false } } });
  ch.on("broadcast", { event: "m" }, ({ payload }) => payload && onMsg(payload.t, payload.d));
  await new Promise((res, rej) => {
    let ok = false;
    const to = setTimeout(() => { if (!ok) rej(new Error("timeout")); }, 12000);
    ch.subscribe(s => {
      if (s === "SUBSCRIBED") { ok = true; clearTimeout(to); connEl.classList.add("hide"); res(); }
      else if (ok && (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED")) connEl.classList.remove("hide");
    });
  });
  return { send: (t, d) => ch.send({ type: "broadcast", event: "m", payload: { t, d } }) };
}
const joinUrl = code => { const base = location.origin + location.pathname.replace(/index\.html$/, ""); return base + "?c=" + code + (LOCAL ? "&local=1" : ""); };

/* =====================================================================
   START
   ===================================================================== */
function startScreen() {
  const pre = (Q.get("c") || "").toUpperCase().slice(0, 4);
  app.innerHTML = `<div class="start"><div class="box">
    <div><span class="logo">Kabaal!</span></div>
    <div class="tag">De partygame waarbij je telefoon de controller is.</div>
    <form id="jf" class="card" style="padding:20px;display:grid;gap:12px">
      <h2 style="font-size:28px">Meedoen</h2>
      <input id="jc" class="field codeIn" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" value="${esc(pre)}" aria-label="Kamercode">
      <input id="jn" class="field" maxlength="14" placeholder="Jouw naam" autocomplete="nickname" value="${esc(store.get("kabaal:name") || "")}" aria-label="Jouw naam">
      <button class="btn co" type="submit">Doe mee</button>
    </form>
    <div class="or">of</div>
    <button id="hb" class="btn ghost" type="button">Start een spel op dit scherm</button>
    <div class="muted" style="font-size:15px">Zet het spel op een laptop of tv, en laat iedereen meedoen met zijn telefoon.</div>
  </div></div>`;
  const jc = document.getElementById("jc"), jn = document.getElementById("jn");
  (pre ? jn : jc).focus();
  jc.addEventListener("input", () => { jc.value = jc.value.toUpperCase().replace(/[^A-Z]/g, ""); });
  document.getElementById("jf").addEventListener("submit", e => {
    e.preventDefault();
    const code = jc.value.trim(), name = jn.value.trim();
    if (code.length !== 4) { toast("Vul de code van 4 letters in die op het grote scherm staat."); jc.focus(); return; }
    if (!name) { toast("Vul je naam in."); jn.focus(); return; }
    store.set("kabaal:name", name);
    startPhone(code, name);
  });
  document.getElementById("hb").addEventListener("click", startHost);
}

/* =====================================================================
   HOST
   ===================================================================== */
const H = { players: {}, order: [], phase: "lobby", plan: [], ri: -1, qi: -1, endsAt: 0, dur: 0, ans: {}, gain: {}, rgain: {},
  rounds: { quiz: true, who: true, bluff: true, draw: true }, strokes: [], smap: {}, feed: [], guessed: {}, t: null, next: null };
const key = () => H.phase + ":" + H.ri + ":" + H.qi;
const R = () => H.plan[H.ri];
const IT = () => R() && R().items[H.qi];
const active = () => H.order.filter(id => Date.now() - H.players[id].seen < 20000);

async function startHost() {
  const L = "BCDFGHJKLMNPRSTVWXZ";
  H.code = Array.from({length: 4}, () => L[Math.floor(Math.random() * L.length)]).join("");
  app.innerHTML = `<div class="start"><div class="box"><span class="logo">Kabaal!</span><div class="tag">Spel klaarzetten…</div></div></div>`;
  try { H.net = await connect(H.code, hostMsg); }
  catch (e) { app.innerHTML = `<div class="start"><div class="box card" style="padding:24px"><h2>Geen verbinding</h2><p>Kan de spelserver niet bereiken. Check je internet en probeer het opnieuw.</p><button class="btn" onclick="location.reload()">Opnieuw</button></div></div>`; return; }
  setInterval(pub, 2000);
  setInterval(() => { if (H.phase === "lobby") liveLobby(); }, 3000);
  window.addEventListener("beforeunload", e => { if (H.phase !== "lobby" && H.phase !== "end") { e.preventDefault(); e.returnValue = ""; } });
  renderHost(); pub(); requestAnimationFrame(tick);
}

let pubT = null;
function pubSoon() { if (!pubT) pubT = setTimeout(() => { pubT = null; pub(); }, 60); }
function pub() {
  if (!H.net) return;
  const it = IT(), ph = H.phase, x = {};
  if (ph === "quiz" || ph === "quiz_r") { x.q = it.q; x.opts = it.opts; if (ph === "quiz_r") x.c = it.c; }
  if (ph === "who" || ph === "who_r") { x.q = it.q; if (ph === "who_r") x.win = H.win; }
  if (ph.startsWith("bluff")) { x.q = it.q; if (ph !== "bluff_w") x.opts = it.opts.map(o => ({ t: o.text, by: o.by })); if (ph === "bluff_r") x.real = it.real; }
  if (ph === "draw" || ph === "draw_r") { x.drawer = it.drawer; x.word = it.word; }
  if (ph === "intro") { x.type = R().type; }
  const done = ph === "draw" ? Object.keys(H.guessed) : Object.keys(H.ans);
  H.net.send("s", { k: key(), ph, left: H.endsAt ? Math.max(0, H.endsAt - Date.now()) : 0, dur: H.dur,
    rt: R() ? R().type : null, pl: H.order.map(id => { const p = H.players[id]; return [id, p.name, p.color, p.score]; }),
    done, g: H.gain, it: x });
}

function hostMsg(t, d) {
  if (!d || typeof d !== "object") return;
  const id = String(d.id || "").slice(0, 40); if (!id) return;
  const p = H.players[id];
  if (t === "join") {
    const name = String(d.name || "").trim().slice(0, 14) || "Speler";
    if (!p) {
      const used = H.order.map(i => H.players[i].color);
      H.players[id] = { id, name, color: COLORS.find(c => !used.includes(c)) || COLORS[H.order.length % COLORS.length], score: 0, seen: Date.now() };
      H.order.push(id);
    } else { p.name = name; p.seen = Date.now(); }
    live(); pubSoon(); return;
  }
  if (!p) return;
  p.seen = Date.now();
  if (t === "ping") return;
  if (t === "ans" && d.k === key()) { onAnswer(id, d.v); return; }
  if (t === "d" && H.phase === "draw" && IT().drawer === id) { addStroke(d); return; }
  if (t === "clr" && H.phase === "draw" && IT().drawer === id) { H.strokes = []; H.smap = {}; redraw(); return; }
  if (t === "g" && H.phase === "draw" && d.k === key()) onGuess(id, String(d.v || "").slice(0, 40));
}

function setPhase(phase, ms, next) {
  clearTimeout(H.t); H.t = null;
  H.phase = phase; H.dur = ms || 0; H.endsAt = ms ? Date.now() + ms : 0; H.next = next || null;
  if (ms && next) H.t = setTimeout(() => { H.t = null; next(); }, ms);
  renderHost(); pub();
}
function skip() { if (H.next) { const n = H.next; clearTimeout(H.t); H.t = null; H.next = null; n(); } }
function early() { if (H.next && H.endsAt - Date.now() > 900) { clearTimeout(H.t); const n = H.next; H.endsAt = Date.now() + 800; H.next = null; H.t = setTimeout(n, 800); pubSoon(); } }

function buildPlan() {
  const plan = [], ids = shuffle(active());
  if (H.rounds.quiz) plan.push({ type: "quiz", items: pickN(D.quiz, 5).map(a => { const opts = shuffle(a.slice(1, 5)); return { q: a[0], opts, c: opts.indexOf(a[1]) }; }) });
  if (H.rounds.who) plan.push({ type: "who", items: pickN(D.who, 4).map(q => ({ q })) });
  if (H.rounds.bluff) plan.push({ type: "bluff", items: pickN(D.bluff, 3).map(a => ({ q: a[0], real: a[1], alt: a.slice(2) })) });
  if (H.rounds.draw) { const words = shuffle(D.draw); plan.push({ type: "draw", items: ids.slice(0, 6).map((id, i) => ({ drawer: id, word: words[i] })) }); }
  return plan;
}
function startGame() {
  if (active().length < 2) { toast("Je hebt minstens 2 spelers nodig."); return; }
  if (!Object.values(H.rounds).some(Boolean)) { toast("Kies minstens één spelronde."); return; }
  H.order.forEach(id => H.players[id].score = 0);
  H.plan = buildPlan(); H.ri = -1; nextRound();
}
function nextRound() {
  H.ri++; H.qi = -1; H.rgain = {};
  if (H.ri >= H.plan.length) return setPhase("end", 0, null);
  setPhase("intro", 6000, nextItem);
}
function nextItem() {
  H.qi++; H.ans = {}; H.gain = {}; H.win = [];
  const r = R();
  if (H.qi >= r.items.length) return setPhase("scores", 9000, nextRound);
  const it = IT();
  if (r.type === "quiz") setPhase("quiz", 20000, revealQuiz);
  if (r.type === "who") setPhase("who", 20000, revealWho);
  if (r.type === "bluff") setPhase("bluff_w", 50000, bluffVote);
  if (r.type === "draw") {
    if (!H.players[it.drawer] || !active().includes(it.drawer)) return nextItem();
    H.strokes = []; H.smap = {}; H.feed = []; H.guessed = {};
    setPhase("draw", 80000, () => setPhase("draw_r", 6000, nextItem));
  }
}
function give(id, pts) { if (!H.players[id] || !pts) return; H.players[id].score += pts; H.gain[id] = (H.gain[id] || 0) + pts; H.rgain[id] = (H.rgain[id] || 0) + pts; }

function onAnswer(id, v) {
  const ph = H.phase, it = IT();
  if (ph === "quiz") { if (H.ans[id] || !(v >= 0 && v < 4)) return; H.ans[id] = { i: v | 0, t: Date.now() }; }
  else if (ph === "who") { if (H.ans[id] || !H.players[v]) return; H.ans[id] = v; }
  else if (ph === "bluff_w") {
    const f = String(v || "").trim().slice(0, 40); if (!f) return;
    if (same(f, it.real)) { H.net.send("nope", { id }); return; }
    H.ans[id] = f;
  }
  else if (ph === "bluff_v") { const o = it.opts[v]; if (H.ans[id] !== undefined || !o || o.by.includes(id)) return; H.ans[id] = v | 0; }
  else return;
  live(); pubSoon();
  if (active().every(i => H.ans[i] !== undefined)) early();
}
function revealQuiz() {
  const it = IT(), start = H.endsAt - H.dur;
  for (const [id, a] of Object.entries(H.ans)) if (a.i === it.c) give(id, 500 + Math.round(500 * Math.max(0, 1 - (a.t - start) / H.dur)));
  setPhase("quiz_r", 7000, nextItem);
}
function revealWho() {
  const cnt = {}; Object.values(H.ans).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
  const max = Math.max(0, ...Object.values(cnt));
  H.win = max ? Object.keys(cnt).filter(k => cnt[k] === max) : [];
  for (const [id, t] of Object.entries(H.ans)) if (H.win.includes(t)) give(id, 250);
  setPhase("who_r", 8000, nextItem);
}
function bluffVote() {
  const it = IT(), m = new Map();
  for (const [id, f] of Object.entries(H.ans)) { const k = norm(f); if (!m.has(k)) m.set(k, { text: f, by: [] }); m.get(k).by.push(id); }
  let opts = [...m.values()];
  for (const a of it.alt) if (opts.length < 2 && !opts.some(o => same(o.text, a))) opts.push({ text: a, by: [], house: true });
  opts.push({ text: it.real, by: [], real: true });
  it.opts = shuffle(opts); H.ans = {};
  setPhase("bluff_v", 30000, revealBluff);
}
function revealBluff() {
  const it = IT();
  for (const [id, v] of Object.entries(H.ans)) { const o = it.opts[v]; if (!o) continue; if (o.real) give(id, 500); else o.by.forEach(a => a !== id && give(a, 250)); }
  setPhase("bluff_r", 12000, nextItem);
}
function onGuess(id, v) {
  const it = IT(); if (id === it.drawer || H.guessed[id] || !v.trim()) return;
  const name = H.players[id].name;
  if (same(v, it.word)) {
    const pts = 100 + Math.round(400 * Math.max(0, (H.endsAt - Date.now()) / H.dur));
    H.guessed[id] = pts; give(id, pts); give(it.drawer, 100);
    H.feed.unshift({ hit: true, txt: name + " heeft het geraden!" });
    H.net.send("hit", { id, pts });
  } else H.feed.unshift({ txt: name + ": " + v });
  H.feed = H.feed.slice(0, 9); live(); pubSoon();
  const others = active().filter(i => i !== it.drawer);
  if (others.length && others.every(i => H.guessed[i])) early();
}

/* tekening op het grote scherm */
function addStroke(d) {
  const sid = String(d.s || ""), pts = Array.isArray(d.p) ? d.p.slice(0, 400).map(Number) : [];
  if (!sid || pts.length < 2) return;
  let s = H.smap[sid];
  if (!s) { s = H.smap[sid] = { c: /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : "#14213d", w: Math.min(0.06, Math.max(0.004, +d.w || 0.012)), p: [] }; H.strokes.push(s); }
  const from = s.p.length;
  s.p.push(...pts);
  drawStroke(s, Math.max(0, from - 2));
}
function cvCtx() {
  const cv = document.getElementById("hcv"); if (!cv) return null;
  const W = cv.clientWidth, Hh = cv.clientHeight, dpr = devicePixelRatio || 1;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = c.lineJoin = "round"; return { c, W, H: Hh };
}
function drawStroke(s, from, ctx) {
  ctx = ctx || cvCtx(); if (!ctx) return;
  const { c, W } = ctx, h = ctx.H, p = s.p;
  c.strokeStyle = s.c; c.fillStyle = s.c; c.lineWidth = s.w * W;
  if (p.length === 2) { c.beginPath(); c.arc(p[0] * W, p[1] * h, s.w * W / 2, 0, 7); c.fill(); return; }
  c.beginPath(); c.moveTo(p[from] * W, p[from + 1] * h);
  for (let i = from + 2; i < p.length; i += 2) c.lineTo(p[i] * W, p[i + 1] * h);
  c.stroke();
}
function redraw() { const ctx = cvCtx(); if (!ctx) return; ctx.c.clearRect(0, 0, ctx.W, ctx.H); H.strokes.forEach(s => drawStroke(s, 0, ctx)); }
addEventListener("resize", () => { if (H.phase === "draw") redraw(); });

/* host-weergave */
function timerHtml() { return `<div class="timer" aria-label="Resterende tijd"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#14213d" stroke-width="8"/><circle id="ring" cx="50" cy="50" r="44" fill="none" stroke="#ff5a5f" stroke-width="8" stroke-dasharray="276.5" stroke-linecap="round"/></svg><b id="tnum"></b></div>`; }
function tick() {
  const ends = H.net ? H.endsAt : P.endsAt, dur = H.net ? H.dur : P.dur;
  const ring = document.getElementById("ring"), num = document.getElementById("tnum");
  if (ends && dur) {
    const left = Math.max(0, ends - Date.now());
    if (ring) ring.style.strokeDashoffset = 276.5 * (1 - left / dur);
    if (num) num.textContent = Math.ceil(left / 1000);
  } else if (num) num.textContent = "";
  requestAnimationFrame(tick);
}
const P_ = id => H.players[id] || { name: "?", color: "#999" };
function statusHtml() {
  const done = H.phase === "draw" ? H.guessed : H.ans;
  const list = H.phase === "draw" ? active().filter(i => i !== IT().drawer) : active();
  return list.map(id => av(H.players[id], done[id] !== undefined ? "ok" : "")).join("");
}
function rlabel() { const r = R(); return `<div class="rlabel">${esc(TITLES[r.type][0])} · ${H.qi + 1} van ${r.items.length}</div>`; }
function live() {
  if (H.phase === "lobby") return liveLobby();
  const st = document.getElementById("status"); if (st) st.innerHTML = statusHtml();
  const fd = document.getElementById("feed"); if (fd) fd.innerHTML = H.feed.map(f => `<div class="${f.hit ? "hit" : ""}">${esc(f.txt)}</div>`).join("") || `<div class="muted">Nog geen gokjes…</div>`;
}
function liveLobby() {
  const el = document.getElementById("players"); if (!el) return;
  const act = active();
  el.innerHTML = H.order.length ? H.order.map(id => `<span class="chip ${act.includes(id) ? "" : "off"}">${av(H.players[id])}${esc(H.players[id].name)}</span>`).join("") : `<div class="muted" style="font-size:20px">Nog niemand… Scan de QR-code of ga naar de link.</div>`;
  const n = document.getElementById("pcount"); if (n) n.textContent = act.length === 1 ? "1 speler" : act.length + " spelers";
  const sb = document.getElementById("startb"); if (sb) sb.disabled = act.length < 2;
}
function qrSvg(text) { try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { return ""; } }
function board(showGain) {
  const ids = H.order.slice().sort((a, b) => H.players[b].score - H.players[a].score);
  return `<div class="board">${ids.map((id, i) => { const p = H.players[id], g = H.rgain[id];
    return `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * 90}ms"><span class="pos">${i + 1}</span>${av(p)}<span>${esc(p.name)}</span><span>${showGain && g ? `<span class="gain">+${g}</span>` : ""}<span class="pts">${p.score}</span></span></div>`; }).join("")}</div>`;
}
function renderHost() {
  const ph = H.phase, it = IT();
  let stage = "";
  if (ph === "lobby") {
    const url = joinUrl(H.code);
    stage = `<div class="lobby">
      <div class="card joinCard"><div class="qr">${qrSvg(url)}</div><div style="display:grid;gap:10px">
        <div class="muted" style="font-size:20px">Pak je telefoon en ga naar</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div>
        <div class="muted" style="font-size:20px">met code</div><div class="bigcode">${esc(H.code)}</div></div></div>
      <div style="display:grid;gap:18px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="font-size:clamp(30px,3vw,46px)">Wie doet er mee?</h2><span class="pill" id="pcount"></span></div>
        <div class="players" id="players"></div>
        <div><h3 style="font-size:24px">Spelrondes</h3><div class="rounds">${Object.keys(TITLES).map(k => `<label class="rt"><input type="checkbox" data-r="${k}" ${H.rounds[k] ? "checked" : ""}>${esc(TITLES[k][0])}</label>`).join("")}</div></div>
      </div></div>`;
  } else if (ph === "intro") {
    const r = R();
    stage = `<div class="qwrap intro"><div class="rlabel">Ronde ${H.ri + 1} van ${H.plan.length}</div><div class="disp">${esc(TITLES[r.type][0])}</div><p>${esc(TITLES[r.type][1])}</p></div>`;
  } else if (ph === "quiz" || ph === "quiz_r") {
    const rev = ph === "quiz_r", cnt = [0, 0, 0, 0]; if (rev) Object.values(H.ans).forEach(a => cnt[a.i]++);
    stage = `<div class="qwrap">${rlabel()}<h1 class="qtext">${esc(it.q)}</h1>
      <div class="opts">${it.opts.map((o, i) => `<div class="opt o${i} ${rev && i !== it.c ? "dim" : ""}">${SHAPES[i]}<span>${esc(o)}</span>${rev ? `<span class="n">${cnt[i]}</span>` : ""}</div>`).join("")}</div>
      ${rev ? gainsLine() : `<div style="display:flex;gap:24px;align-items:center">${timerHtml()}<div class="status" id="status"></div></div>`}</div>`;
  } else if (ph === "who" || ph === "who_r") {
    if (ph === "who") stage = `<div class="qwrap">${rlabel()}<h1 class="qtext">${esc(it.q)}</h1><div class="muted" style="font-size:22px">Stem op je telefoon. Niemand ziet wat jij kiest.</div><div style="display:flex;gap:24px;align-items:center">${timerHtml()}<div class="status" id="status"></div></div></div>`;
    else {
      const cnt = {}; Object.values(H.ans).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
      const max = Math.max(1, ...Object.values(cnt));
      const ids = H.order.filter(id => cnt[id]).sort((a, b) => cnt[b] - cnt[a]);
      stage = `<div class="qwrap">${rlabel()}<h1 class="qtext" style="font-size:clamp(28px,3.4vw,54px)">${esc(it.q)}</h1>
        <div class="bars">${ids.length ? ids.map(id => `<div class="bar ${H.win.includes(id) ? "win" : ""}">${av(P_(id))}<div class="tr"><div class="fl" data-w="${cnt[id] / max * 100}"></div></div><span>${esc(P_(id).name)} · ${cnt[id]}</span></div>`).join("") : `<div class="muted">Niemand heeft gestemd…</div>`}</div>
        ${H.win.length ? `<div style="font-size:24px;font-weight:900">${H.win.length > 1 ? "Gedeelde winst!" : "Het is " + esc(P_(H.win[0]).name) + "!"} Wie dat ook koos: +250</div>` : ""}</div>`;
    }
  } else if (ph === "bluff_w") {
    stage = `<div class="qwrap">${rlabel()}<h1 class="qtext">${esc(it.q).replace("___", `<span style="color:var(--co)">_____</span>`)}</h1><div class="muted" style="font-size:22px">Typ een nep-antwoord op je telefoon dat zo echt mogelijk klinkt.</div><div style="display:flex;gap:24px;align-items:center">${timerHtml()}<div class="status" id="status"></div></div></div>`;
  } else if (ph === "bluff_v" || ph === "bluff_r") {
    const rev = ph === "bluff_r", votes = {};
    if (rev) Object.entries(H.ans).forEach(([id, v]) => (votes[v] = votes[v] || []).push(id));
    stage = `<div class="qwrap">${rlabel()}<h1 class="qtext" style="font-size:clamp(28px,3.4vw,54px)">${esc(it.q)}</h1>
      <div class="bopts">${it.opts.map((o, i) => `<div class="bopt ${rev && o.real ? "real" : ""}"><span>${esc(o.text)}</span>${rev ? `<small>${o.real ? "Het echte antwoord!" : o.by.length ? "Bluf van " + o.by.map(b => esc(P_(b).name)).join(" & ") : "Bluf van Kabaal"}</small><span class="voters">${(votes[i] || []).map(v => av(P_(v))).join("")}</span>` : ""}</div>`).join("")}</div>
      ${rev ? gainsLine() : `<div style="display:flex;gap:24px;align-items:center">${timerHtml()}<div class="status" id="status"></div></div>`}</div>`;
  } else if (ph === "draw" || ph === "draw_r") {
    const dr = P_(it.drawer);
    stage = `<div class="qwrap">${rlabel()}<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center">${av(dr)}<h2 style="font-size:clamp(26px,2.6vw,42px)">${esc(dr.name)} tekent${ph === "draw_r" ? "… het was" : ""}</h2>${ph === "draw_r" ? `<span class="hint" style="color:var(--co)">${esc(it.word)}</span>` : `<span class="hint">${esc(it.word.replace(/\S/g, "_"))}</span>`}</div>
      <div class="drawWrap"><canvas id="hcv" class="cv"></canvas><div style="display:grid;gap:14px">${ph === "draw" ? `<div style="display:flex;gap:16px;align-items:center">${timerHtml()}<div class="status" id="status"></div></div>` : gainsLine()}<div class="feed" id="feed"></div></div></div></div>`;
  } else if (ph === "scores") {
    stage = `<div class="qwrap"><div class="rlabel">Tussenstand</div><h1 class="qtext">${H.ri + 1 < H.plan.length ? "Na ronde " + (H.ri + 1) : "Bijna klaar…"}</h1>${board(true)}</div>`;
  } else if (ph === "end") {
    const ids = H.order.slice().sort((a, b) => H.players[b].score - H.players[a].score), top = [ids[1], ids[0], ids[2]];
    const hgt = [150, 220, 110];
    stage = `<div class="qwrap"><div class="rlabel">Einde</div><h1 class="qtext">${esc(P_(ids[0]).name)} wint Kabaal!</h1>
      <div class="podium">${top.map((id, i) => id ? `<div class="pod">${av(P_(id))}<span>${esc(P_(id).name)}</span><span>${P_(id).score}</span><div class="blk" style="height:${hgt[i]}px">${[2, 1, 3][i]}</div></div>` : "").join("")}</div></div>`;
  }
  const r = R(), inGame = ph !== "lobby" && ph !== "end";
  app.innerHTML = `<div class="host">
    <div class="hbar"><span class="logo">Kabaal!</span><div style="display:flex;gap:10px;flex-wrap:wrap"><span class="pill">Code ${esc(H.code)}</span>${inGame && r ? `<span class="pill">Ronde ${H.ri + 1}/${H.plan.length}</span>` : ""}</div></div>
    <div class="hstage">${stage}</div>
    <div class="hfoot">${ph === "lobby" ? `<span class="muted">Tip: 3 tot 8 spelers is het leukst.</span><button class="btn co" id="startb">Start het spel</button>`
      : ph === "end" ? `<button class="btn co" id="again">Nog een keer</button>`
      : `<button class="btn ghost" id="skipb">Overslaan</button>`}</div></div>`;
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.addEventListener("click", f); };
  on("startb", startGame); on("skipb", skip);
  on("again", () => { H.plan = []; H.ri = -1; H.qi = -1; H.order.forEach(id => H.players[id].score = 0); setPhase("lobby", 0, null); });
  app.querySelectorAll("[data-r]").forEach(c => c.addEventListener("change", () => { H.rounds[c.dataset.r] = c.checked; }));
  live();
  requestAnimationFrame(() => app.querySelectorAll(".fl[data-w]").forEach(f => f.style.width = f.dataset.w + "%"));
  if (ph === "draw" || ph === "draw_r") requestAnimationFrame(redraw);
}
function gainsLine() {
  const ids = Object.keys(H.gain).filter(id => H.gain[id] > 0).sort((a, b) => H.gain[b] - H.gain[a]);
  return `<div class="gains">${ids.length ? ids.map(id => `<span class="chip" style="font-size:18px">${av(P_(id))}+${H.gain[id]}</span>`).join("") : `<span class="muted" style="font-size:20px">Niemand scoorde deze keer.</span>`}</div>`;
}

/* =====================================================================
   TELEFOON
   ===================================================================== */
const P = { st: null, k: null, endsAt: 0, dur: 0, sent: {}, fake: "" };
async function startPhone(code, name) {
  P.code = code; P.name = name;
  P.id = store.get("kabaal:id") || (Math.random().toString(36).slice(2) + Date.now().toString(36));
  store.set("kabaal:id", P.id);
  app.innerHTML = `<div class="start"><div class="box"><span class="logo">Kabaal!</span><div class="tag">Verbinden met ${esc(code)}…</div></div></div>`;
  try { P.net = await connect(code, phoneMsg); }
  catch (e) { toast("Geen verbinding met de spelserver. Check je internet."); return startScreen(); }
  const hello = () => P.net.send("join", { id: P.id, name: P.name });
  hello();
  setInterval(() => { if (!P.st || !P.st.pl.some(p => p[0] === P.id)) hello(); else P.net.send("ping", { id: P.id }); }, 4000);
  setTimeout(() => { if (!P.st) app.innerHTML = `<div class="start"><div class="box card" style="padding:24px;display:grid;gap:12px"><h2>Geen spel gevonden</h2><p>Er staat geen spel open met code <b>${esc(code)}</b>. Klopt de code op het grote scherm?</p><button class="btn" onclick="location.href=location.pathname${LOCAL ? "+'?local=1'" : ""}">Andere code</button></div></div>`; }, 7000);
  try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
  requestAnimationFrame(tick);
}
const me = () => { const p = P.st && P.st.pl.find(x => x[0] === P.id); return p ? { id: p[0], name: p[1], color: p[2], score: p[3] } : { name: P.name, color: "#999", score: 0 }; };
const pl = id => { const p = P.st.pl.find(x => x[0] === id); return p ? { id, name: p[1], color: p[2], score: p[3] } : { id, name: "?", color: "#999", score: 0 }; };

function phoneMsg(t, d) {
  if (t === "s") {
    const fresh = !P.st || d.k !== P.k;
    const wasIn = P.st && P.st.pl.some(p => p[0] === P.id);
    P.st = d;
    const le = Date.now() + d.left;
    if (fresh || Math.abs(le - P.endsAt) > 1200) P.endsAt = d.left ? le : 0;
    P.dur = d.dur;
    if (fresh) { if (P.k && P.k.split(":")[0] === "bluff_w" && d.ph !== "bluff_w") P.fake = ""; P.k = d.k; renderPhone(); }
    else { updPhone(); if (!wasIn && P.st.pl.some(p => p[0] === P.id)) renderPhone(); }
  }
  if (t === "nope" && d.id === P.id) { delete P.sent[P.k]; toast("Haha, dat is toevallig het échte antwoord! Verzin iets anders.", 3500); renderPhone(); }
  if (t === "hit" && d.id === P.id) { P.sent[P.k] = "hit"; P.hitPts = d.pts; renderPhone(); }
}
function send(v) { P.sent[P.k] = true; P.net.send("ans", { id: P.id, k: P.k, v }); renderPhone(); }
function updPhone() {
  const sc = document.getElementById("psc"); if (sc) sc.textContent = me().score;
  const st = P.st, list = document.getElementById("plist");
  if (list && st.ph === "lobby") list.innerHTML = st.pl.map(p => `<span class="chip" style="font-size:16px">${av({ name: p[1], color: p[2] })}${esc(p[1])}</span>`).join("");
}
const wait = (h, sub) => `<div class="pmsg"><h2>${h}</h2>${sub ? `<div class="muted">${sub}</div>` : ""}</div>`;
function gainMsg() { const g = P.st.g[P.id]; return g ? `<div class="pmsg flash"><h2 style="color:#1b8a7f">+${g} punten!</h2></div>` : `<div class="pmsg"><h2>Geen punten deze keer</h2><div class="muted">Volgende keer beter!</div></div>`; }
function renderPhone() {
  const st = P.st; if (!st) return;
  const m = me(), it = st.it, ph = st.ph, sent = P.sent[P.k];
  const joined = st.pl.some(p => p[0] === P.id);
  let body = "";
  if (!joined) body = wait("Even geduld…", "Je wordt aangemeld.");
  else if (ph === "lobby") body = `<div class="pmsg"><h2>Je zit erin, ${esc(m.name)}!</h2><div class="muted">Kijk naar het grote scherm. Het spel begint zodra de host op start drukt.</div><div class="players" id="plist" style="justify-content:center;min-height:0"></div></div>`;
  else if (ph === "intro") body = `<div class="pmsg"><div class="rlabel">Nieuwe ronde</div><h2 style="font-size:40px">${esc(TITLES[it.type][0])}</h2><div style="font-weight:700">${esc(TITLES[it.type][1])}</div></div>`;
  else if (ph === "quiz") body = sent ? wait("Antwoord staat vast!", "Wachten op de rest…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="popts">${it.opts.map((o, i) => `<button class="opt o${i}" data-a="${i}">${SHAPES[i]}<span>${esc(o)}</span></button>`).join("")}</div>`;
  else if (ph === "quiz_r") body = `<div class="pmsg"><div class="muted">Het goede antwoord was</div><h2>${esc(it.opts[it.c])}</h2></div>${gainMsg()}`;
  else if (ph === "who") body = sent ? wait("Stem uitgebracht!", "Benieuwd wat de rest vindt…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="popts">${st.pl.map(p => `<button class="pick" data-a="${esc(p[0])}">${av({ name: p[1], color: p[2] })}${esc(p[1])}${p[0] === P.id ? " (jij)" : ""}</button>`).join("")}</div>`;
  else if (ph === "who_r") body = `<div class="pmsg"><h2>${it.win && it.win.length ? (it.win.includes(P.id) ? "Dat ben jij!" : esc(pl(it.win[0]).name) + (it.win.length > 1 ? " & co" : "")) : "Niemand gestemd"}</h2><div class="muted">Kijk naar het scherm voor de uitslag.</div></div>${gainMsg()}`;
  else if (ph === "bluff_w") body = sent ? wait("Bluf ingeleverd!", "Hopelijk trapt iemand erin…") :
    `<div class="pq disp">${esc(it.q)}</div><form id="bf" style="display:grid;gap:12px"><input id="bi" class="field" maxlength="40" placeholder="Jouw nep-antwoord" autocomplete="off" value="${esc(P.fake)}"><button class="btn co">Verstuur bluf</button></form>`;
  else if (ph === "bluff_v") body = sent ? wait("Gekozen!", "Wachten op de rest…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="muted">Welk antwoord is écht?</div><div class="popts">${it.opts.map((o, i) => o.by.includes(P.id) ? "" : `<button class="bopt" data-a="${i}">${esc(o.t)}</button>`).join("")}</div>`;
  else if (ph === "bluff_r") body = `<div class="pmsg"><div class="muted">Het echte antwoord was</div><h2>${esc(it.real)}</h2></div>${gainMsg()}`;
  else if (ph === "draw") {
    if (it.drawer === P.id) body = `<div class="muted" style="text-align:center;font-weight:800">Teken dit, zonder letters of cijfers:</div><div class="word">${esc(it.word)}</div>
      <canvas id="pcv" class="cv"></canvas><div class="tools">${["#14213d", "#ff5a5f", "#3a6ff7", "#2ec4b6", "#f39c12", "#ffffff"].map((c, i) => `<button class="sw ${c === (P.col || "#14213d") ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="${c === "#ffffff" ? "Gum" : "Kleur"}"></button>`).join("")}<button class="btn ghost" id="thick" style="padding:8px 14px;min-height:44px">${P.thick ? "Dun" : "Dik"}</button><button class="btn ghost" id="clr" style="padding:8px 14px;min-height:44px;margin-left:auto">Wissen</button></div>`;
    else if (sent === "hit") body = `<div class="pmsg flash"><h2 style="color:#1b8a7f">Geraden! +${P.hitPts || ""}</h2><div class="muted">Kijk hoe de rest nog zit te puzzelen.</div></div>`;
    else body = `<div class="pmsg" style="padding:10px"><h2 style="font-size:28px">${esc(pl(it.drawer).name)} tekent…</h2><div class="muted">Kijk naar het grote scherm en raad wat het is!</div><div class="hint" style="font-size:28px">${esc(it.word.replace(/\S/g, "_ ").trim())}</div></div>
      <form id="gf" style="display:grid;gap:12px"><input id="gi" class="field" maxlength="40" placeholder="Wat is het?" autocomplete="off" autocapitalize="off"><button class="btn co">Raad</button></form>`;
  }
  else if (ph === "draw_r") body = `<div class="pmsg"><div class="muted">Het woord was</div><h2>${esc(it.word)}</h2></div>${gainMsg()}`;
  else if (ph === "scores" || ph === "end") {
    const sorted = st.pl.slice().sort((a, b) => b[3] - a[3]), pos = sorted.findIndex(p => p[0] === P.id) + 1;
    body = `<div class="pmsg"><div class="muted">${ph === "end" ? "Eindstand" : "Tussenstand"}</div><h2 style="font-size:64px">#${pos}</h2><div style="font-weight:900;font-size:22px">${m.score} punten</div>${ph === "end" ? `<div class="muted">${pos === 1 ? "Kampioen! Gefeliciteerd!" : "Nog een potje? De host kan opnieuw starten."}</div>` : ""}</div>`;
  }
  const timed = ["quiz", "who", "bluff_w", "bluff_v", "draw"].includes(ph);
  app.innerHTML = `<div class="phone"><div class="ptop">${av(m)}<span>${esc(m.name)}</span>${timed ? `<span class="tm" id="tnum"></span>` : ""}<span class="sc" id="psc">${m.score}</span></div><div class="pbody">${body}</div></div>`;
  updPhone();
  app.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.a; send(ph === "who" ? v : +v);
  }));
  const bf = document.getElementById("bf");
  if (bf) { const bi = document.getElementById("bi"); bi.addEventListener("input", () => P.fake = bi.value);
    bf.addEventListener("submit", e => { e.preventDefault(); const v = bi.value.trim(); if (!v) return; P.fake = v; send(v); }); }
  const gf = document.getElementById("gf");
  if (gf) { const gi = document.getElementById("gi"); gf.addEventListener("submit", e => { e.preventDefault(); const v = gi.value.trim(); if (!v) return;
    P.net.send("g", { id: P.id, k: P.k, v }); gi.value = ""; gi.focus(); gi.placeholder = "Nee, \"" + v.slice(0, 16) + "\" is het niet… probeer opnieuw"; }); }
  if (document.getElementById("pcv")) setupPad();
}

/* tekenblok op de telefoon */
function setupPad() {
  const cv = document.getElementById("pcv"), dpr = devicePixelRatio || 1;
  const W = cv.clientWidth, Hh = cv.clientHeight; cv.width = W * dpr; cv.height = Hh * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr); c.lineCap = c.lineJoin = "round";
  let cur = null, q = [], n = 0, last = null;
  const col = () => P.col || "#14213d", wid = () => (P.col === "#ffffff" ? 0.05 : P.thick ? 0.03 : 0.012);
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000) / 1000, Math.round((e.clientY - r.top) / r.height * 1000) / 1000]; };
  const flush = () => { if (cur && q.length) { P.net.send("d", { id: P.id, s: cur, c: col(), w: wid(), p: q }); q = []; } };
  const iv = setInterval(() => { if (!document.getElementById("pcv")) return clearInterval(iv); flush(); }, 70);
  cv.addEventListener("pointerdown", e => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = P.id + "-" + Date.now().toString(36) + (n++);
    const p = pt(e); last = p; q.push(...p);
    c.fillStyle = col(); c.beginPath(); c.arc(p[0] * W, p[1] * Hh, wid() * W / 2, 0, 7); c.fill();
  });
  cv.addEventListener("pointermove", e => {
    if (!cur) return; e.preventDefault(); const p = pt(e);
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.004) return;
    c.strokeStyle = col(); c.lineWidth = wid() * W; c.beginPath(); c.moveTo(last[0] * W, last[1] * Hh); c.lineTo(p[0] * W, p[1] * Hh); c.stroke();
    last = p; q.push(...p);
  });
  const end = () => { if (!cur) return; flush(); cur = null; };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  app.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { P.col = b.dataset.c; app.querySelectorAll("[data-c]").forEach(x => x.classList.toggle("on", x === b)); }));
  document.getElementById("thick").addEventListener("click", e => { P.thick = !P.thick; e.target.textContent = P.thick ? "Dun" : "Dik"; });
  document.getElementById("clr").addEventListener("click", () => { c.clearRect(0, 0, W, Hh); P.net.send("clr", { id: P.id }); });
}

/* ---------- start ---------- */
if (LOCAL) window.__kabaal = { H, P };
if (Q.get("host") !== null) startHost(); else startScreen();
}
