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
const pick = a => a[Math.floor(Math.random() * a.length)];
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^(de|het|een|a|the) /, "");
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let p = Array.from({length: n + 1}, (_, i) => i);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
const same = (a, b) => { a = norm(a); b = norm(b); return a === b || (b.length >= 5 && lev(a, b) <= 1); };
const txt = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const COLORS = ["#ff5a5f", "#3a6ff7", "#2ec4b6", "#f39c12", "#9b5de5", "#00a86b", "#e84393", "#14213d", "#8d6e63", "#ff7f11", "#0096c7", "#6a994e"];
const av = (p, cls = "") => `<span class="av ${cls}" style="background:${esc(p.color)}" title="${esc(p.name)}">${esc((p.name || "?").trim().charAt(0).toUpperCase())}</span>`;
const SHAPES = [
  '<svg viewBox="0 0 40 40"><path d="M20 4 37 34H3z" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M20 2 38 20 20 38 2 20z" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="4" fill="#fff"/></svg>'];
/* Spelrondes, in speelvolgorde. min = minimaal aantal spelers, def = standaard aan */
const MODES = {
  quiz:  { t: "Quiz", d: "Kies het goede antwoord op je telefoon. Hoe sneller, hoe meer punten.", min: 1, def: true },
  who:   { t: "Most Likely To", d: "Stem op wie het best bij de stelling past. Kies je hetzelfde als de meerderheid, dan krijg je punten.", min: 2 },
  quip:  { t: "Punchline", d: "Je krijgt twee vragen: schrijf het grappigste antwoord. Daarna strijden de antwoorden in duels en stemt de rest.", min: 3, def: true },
  wave:  { t: "Spectrum", d: "Eén speler ziet waar het doel op de schaal ligt en geeft een hint. De rest schuift zo dicht mogelijk bij het doel.", min: 2, def: true },
  fake:  { t: "The Faker", d: "Iedereen krijgt hetzelfde geheime woord, behalve de Faker. Geef één hintwoord en ontmasker de Faker, of blijf als Faker onder de radar.", min: 3, def: true },
  count: { t: "How Many of Us?", d: "Beantwoord stiekem ja of nee, en raad hoeveel spelers ja zeiden.", min: 2, def: true },
  bluff: { t: "Bluff", d: "Verzin een geloofwaardig nep-antwoord. Daarna zoek je het echte antwoord tussen alle verzinsels. Trapt iemand in jouw bluf, dan scoor jij.", min: 2 },
  split: { t: "Fifty-Fifty", d: "Maak een dilemma af zodat de groep precies in tweeën splitst. Hoe dichter bij 50/50, hoe meer punten.", min: 3 },
  art:   { t: "Art Bluff", d: "Teken je geheime opdracht. Daarna verzint iedereen een nep-titel bij elkaars tekening. Zoek de echte titel.", min: 3 },
  tele:  { t: "Broken Telephone", d: "Schrijf een zin, teken andermans zin, beschrijf andermans tekening… Aan het eind zie je wat ervan geworden is.", min: 3 },
  draw:  { t: "Draw & Guess", d: "Eén speler tekent op zijn telefoon, de rest raadt zo snel mogelijk wat het is.", min: 2, def: true }
};
function toast(msg, ms = 2600) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

/* tekeningen: opschonen en tekenen op een canvas */
function cleanStrokes(v) {
  if (!Array.isArray(v)) return [];
  const out = []; let n = 0;
  for (const s of v.slice(0, 400)) {
    if (!s || !Array.isArray(s.p)) continue;
    let p = s.p.slice(0, 3000).map(x => Math.min(1, Math.max(0, +x || 0)));
    if (p.length % 2) p = p.slice(0, -1);
    if (p.length < 2) continue;
    n += p.length; if (n > 16000) break;
    out.push({ c: /^#[0-9a-f]{6}$/i.test(s.c) ? s.c : "#14213d", w: Math.min(0.06, Math.max(0.004, +s.w || 0.012)), p });
  }
  return out;
}
function ctxFor(cv) {
  if (!cv) return null;
  const W = cv.clientWidth, Hh = cv.clientHeight, dpr = devicePixelRatio || 1;
  if (!W || !Hh) return null;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = c.lineJoin = "round"; return { c, W, H: Hh };
}
function drawStroke(s, from, ctx) {
  if (!ctx) return;
  const { c, W } = ctx, h = ctx.H, p = s.p;
  c.strokeStyle = s.c; c.fillStyle = s.c; c.lineWidth = s.w * W;
  if (p.length === 2) { c.beginPath(); c.arc(p[0] * W, p[1] * h, s.w * W / 2, 0, 7); c.fill(); return; }
  c.beginPath(); c.moveTo(p[from] * W, p[from + 1] * h);
  for (let i = from + 2; i < p.length; i += 2) c.lineTo(p[i] * W, p[i + 1] * h);
  c.stroke();
}
function paint(cv, strokes) { const ctx = ctxFor(cv); if (!ctx) return; ctx.c.clearRect(0, 0, ctx.W, ctx.H); (strokes || []).forEach(s => drawStroke(s, 0, ctx)); }
/* canvassen met data-pi worden na het renderen beschilderd */
let PAINT = [];
const paintSlot = strokes => { PAINT.push(strokes); return `<canvas class="cv" data-pi="${PAINT.length - 1}"></canvas>`; };
function flushPaint() { const list = PAINT; requestAnimationFrame(() => app.querySelectorAll("canvas[data-pi]").forEach(cv => paint(cv, list[+cv.dataset.pi]))); }

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
  rounds: Object.fromEntries(Object.keys(MODES).map(k => [k, !!MODES[k].def])), strokes: [], smap: {}, feed: [], guessed: {}, t: null, next: null };
const key = () => H.phase + ":" + H.ri + ":" + H.qi;
const R = () => H.plan[H.ri];
const IT = () => R() && R().items[H.qi];
const active = () => H.order.filter(id => Date.now() - H.players[id].seen < 20000);
const P_ = id => H.players[id] || { name: "?", color: "#999" };

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

/* wie moet er in deze fase iets doen? */
function elig() {
  const a = active(), ph = H.phase, it = IT() || {};
  if (ph === "quip_v") return a.filter(i => !it.by.includes(i));
  if (ph === "wave_c") return a.filter(i => i === it.psy);
  if (ph === "wave_g") return a.filter(i => i !== it.psy);
  if (ph === "art_w" || ph === "art_v") return a.filter(i => i !== it.artist);
  if (ph === "split_v") return a.filter(i => i !== it.by);
  if (ph === "tele_s") return a.filter(i => R().ids.includes(i));
  if (ph === "draw") return a.filter(i => i !== it.drawer);
  return a;
}
const doneMap = () => H.phase === "draw" ? H.guessed : H.ans;

let pubT = null;
function pubSoon() { if (!pubT) pubT = setTimeout(() => { pubT = null; pub(); }, 60); }
function pub() {
  if (!H.net) return;
  const it = IT() || {}, r = R(), ph = H.phase, x = {};
  if (ph === "quiz" || ph === "quiz_r") { x.q = it.q; x.opts = it.opts; if (ph === "quiz_r") x.c = it.c; }
  if (ph === "who" || ph === "who_r") { x.q = it.q; if (ph === "who_r") x.win = H.win; }
  if (ph.startsWith("bluff")) { x.q = it.q; if (ph !== "bluff_w") x.opts = it.opts.map(o => ({ t: o.text, by: o.by })); if (ph === "bluff_r") x.real = it.real; }
  if (ph === "draw" || ph === "draw_r") { x.drawer = it.drawer; x.word = it.word; }
  if (ph === "intro") x.type = r.type;
  if (ph === "quip_w") { x.qs = r.qs; x.as = r.as; }
  if (ph === "quip_v" || ph === "quip_r") { x.q = it.q; x.a = it.a; x.by = it.by; }
  if (ph.startsWith("wave")) { x.l = it.l; x.r = it.r; x.psy = it.psy; x.clue = it.clue; if (ph !== "wave_g") x.tgt = it.tgt; }
  if (ph.startsWith("fake")) { x.cat = it.cat; x.fk = it.fk; x.word = it.word; if (ph === "fake_v") x.hints = Object.entries(it.hints || {}); }
  if (ph.startsWith("count")) { x.q = it.q; if (ph === "count_r") { x.yes = it.yes; x.tot = it.tot; } }
  if (ph === "split_w") x.pr = r.pr;
  if (ph === "split_v" || ph === "split_r") { x.text = it.text; x.by = it.by; }
  if (ph === "art_d") x.pr = r.pr;
  if (ph.startsWith("art_") && ph !== "art_d") { x.artist = it.artist; if (ph !== "art_w") x.opts = it.opts.map(o => ({ t: o.text, by: o.by })); if (ph === "art_r") x.real = it.real; }
  if (ph === "tele_s") { x.step = it.step; x.L = r.L; }
  H.net.send("s", { k: key(), ph, left: H.endsAt ? Math.max(0, H.endsAt - Date.now()) : 0, dur: H.dur,
    rt: r ? r.type : null, pl: H.order.map(id => { const p = H.players[id]; return [id, p.name, p.color, p.score]; }),
    done: Object.keys(doneMap()), el: elig(), g: H.gain, it: x });
}

function hostMsg(t, d) {
  if (!d || typeof d !== "object") return;
  const id = String(d.id || "").slice(0, 40); if (!id) return;
  const p = H.players[id];
  if (t === "join") {
    const name = txt(d.name, 14) || "Speler";
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
  if (t === "need" && d.k === key() && H.phase === "tele_s") { sendTask(id); return; }
  if (t === "d" && H.phase === "draw" && IT().drawer === id) { addStroke(d); return; }
  if (t === "clr" && H.phase === "draw" && IT().drawer === id) { H.strokes = []; H.smap = {}; redraw(); return; }
  if (t === "g" && H.phase === "draw" && d.k === key()) onGuess(id, txt(d.v, 40));
}

function setPhase(phase, ms, next) {
  clearTimeout(H.t); H.t = null;
  H.phase = phase; H.dur = ms || 0; H.endsAt = ms ? Date.now() + ms : 0; H.next = next || null;
  if (ms && next) H.t = setTimeout(() => { H.t = null; next(); }, ms);
  renderHost(); pub();
}
function skip() { if (H.next) { const n = H.next; clearTimeout(H.t); H.t = null; H.next = null; n(); } }
function early() { if (H.next && H.endsAt - Date.now() > 900) { clearTimeout(H.t); const n = H.next; H.endsAt = Date.now() + 800; H.next = null; H.t = setTimeout(n, 800); pubSoon(); } }
const allIn = () => { const e = elig(), m = doneMap(); return e.length > 0 && e.every(i => m[i] !== undefined); };

function buildPlan() {
  const plan = [], ids = shuffle(active()), n = ids.length, skipped = [];
  for (const k of Object.keys(MODES)) {
    if (!H.rounds[k]) continue;
    if (n < MODES[k].min) { skipped.push(MODES[k].t); continue; }
    if (k === "quiz") plan.push({ type: k, items: pickN(D.quiz, 5).map(a => { const opts = shuffle(a.slice(1, 5)); return { q: a[0], opts, c: opts.indexOf(a[1]) }; }) });
    if (k === "who") plan.push({ type: k, items: pickN(D.who, 4).map(q => ({ q })) });
    if (k === "bluff") plan.push({ type: k, items: pickN(D.bluff, 3).map(a => ({ q: a[0], real: a[1], alt: a.slice(2) })) });
    if (k === "draw") { const words = shuffle(D.draw); plan.push({ type: k, items: ids.slice(0, 6).map((id, i) => ({ drawer: id, word: words[i] })) }); }
    if (k === "quip") {
      const qs = pickN(D.quip, n), as = {}; ids.forEach(id => as[id] = []);
      const items = qs.map((q, i) => { const by = [ids[i], ids[(i + 1) % n]]; by.forEach(b => as[b].push(i)); return { q, by, pi: i }; });
      plan.push({ type: k, qs, as, answers: qs.map(() => ({})), items: [{ write: true }, ...shuffle(items)] });
    }
    if (k === "wave") { const sp = pickN(D.wave, 4); plan.push({ type: k, items: ids.slice(0, Math.min(4, n)).map((psy, i) => ({ psy, l: sp[i][0], r: sp[i][1], tgt: 8 + Math.round(Math.random() * 84) })) }); }
    if (k === "fake") plan.push({ type: k, items: pickN(D.fake, 2).map(([cat, word]) => ({ cat, word, fk: pick(ids) })) });
    if (k === "count") plan.push({ type: k, items: pickN(D.count, 4).map(q => ({ q })) });
    if (k === "split") { const ds = shuffle(D.split), pr = {}; ids.forEach((id, i) => pr[id] = ds[i % ds.length]); plan.push({ type: k, pr, items: [{ write: true }] }); }
    if (k === "art") { const ps = shuffle(D.art), pr = {}; ids.forEach((id, i) => pr[id] = ps[i % ps.length]); plan.push({ type: k, pr, items: [{ draw: true }] }); }
    if (k === "tele") {
      const L = Math.min(Math.max(n, 3), 6);
      plan.push({ type: k, ids: ids.slice(), L, chains: ids.map(() => []), items: [...Array.from({ length: L }, (_, s) => ({ step: s })), ...ids.map((_, c) => ({ show: c }))] });
    }
  }
  if (skipped.length) toast("Overgeslagen (te weinig spelers): " + skipped.join(", "), 4500);
  return plan;
}
function startGame() {
  if (active().length < 2) { toast("Je hebt minstens 2 spelers nodig."); return; }
  if (!Object.values(H.rounds).some(Boolean)) { toast("Kies minstens één spelronde."); return; }
  H.order.forEach(id => H.players[id].score = 0);
  H.plan = buildPlan(); H.ri = -1;
  if (!H.plan.length) { toast("Geen van de gekozen rondes kan met zo weinig spelers."); return; }
  nextRound();
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
  const it = IT(), t = r.type;
  if (t === "quiz") return setPhase("quiz", 20000, revealQuiz);
  if (t === "who") return setPhase("who", 20000, revealWho);
  if (t === "bluff") return setPhase("bluff_w", 50000, bluffVote);
  if (t === "draw") {
    if (!H.players[it.drawer] || !active().includes(it.drawer)) return nextItem();
    H.strokes = []; H.smap = {}; H.feed = []; H.guessed = {};
    return setPhase("draw", 80000, () => setPhase("draw_r", 6000, nextItem));
  }
  if (t === "quip") {
    if (it.write) return setPhase("quip_w", 80000, nextItem);
    const a = r.answers[it.pi]; it.a = it.by.map(id => a[id] || "(geen antwoord)");
    return setPhase("quip_v", 20000, revealQuip);
  }
  if (t === "wave") {
    if (!active().includes(it.psy)) return nextItem();
    return setPhase("wave_c", 45000, () => { if (!it.clue) it.clue = "(geen hint)"; H.ans = {}; setPhase("wave_g", 25000, revealWave); });
  }
  if (t === "fake") {
    if (!active().includes(it.fk)) it.fk = pick(active());
    return setPhase("fake_h", 45000, () => { it.hints = { ...H.ans }; H.ans = {}; setPhase("fake_v", 35000, revealFake); });
  }
  if (t === "count") return setPhase("count_a", 25000, revealCount);
  if (t === "split") {
    if (it.write) return setPhase("split_w", 50000, () => {
      shuffle(Object.entries(H.ans)).forEach(([id, a]) => r.items.push({ by: id, text: r.pr[id].replace("___", a) }));
      nextItem();
    });
    return setPhase("split_v", 15000, revealSplit);
  }
  if (t === "art") {
    if (it.draw) return setPhase("art_d", 80000, () => {
      shuffle(Object.entries(H.ans)).forEach(([id, s]) => { if (s.length) r.items.push({ artist: id, strokes: s, real: r.pr[id] }); });
      nextItem();
    });
    return setPhase("art_w", 40000, artVote);
  }
  if (t === "tele") {
    if (it.step !== undefined) {
      const kind = it.step % 2 ? "d" : "t";
      setPhase("tele_s", kind === "d" ? 75000 : it.step ? 40000 : 45000, () => {
        r.ids.forEach((id, pi) => { const c = chainOf(pi, it.step); if (!r.chains[c][it.step]) r.chains[c][it.step] = { by: id, kind, v: kind === "t" ? "(niks ingevuld)" : [] }; });
        nextItem();
      });
      r.ids.forEach(id => sendTask(id));
      return;
    }
    return setPhase("tele_r", 4000 + 2600 * r.L, nextItem);
  }
}
const chainOf = (pi, step) => { const n = R().ids.length; return ((pi - step) % n + n) % n; };
function sendTask(id) {
  const r = R(), it = IT(), pi = r.ids.indexOf(id);
  if (pi < 0) { H.net.send("task", { id, k: key(), none: true }); return; }
  const c = chainOf(pi, it.step), prev = it.step ? r.chains[c][it.step - 1] : null;
  H.net.send("task", { id, k: key(), kind: it.step % 2 ? "d" : "t", prev: prev ? prev.v : null });
}
function give(id, pts) { if (!H.players[id] || !pts) return; H.players[id].score += pts; H.gain[id] = (H.gain[id] || 0) + pts; H.rgain[id] = (H.rgain[id] || 0) + pts; }

function onAnswer(id, v) {
  const ph = H.phase, it = IT(), r = R(), el = elig();
  if (!el.includes(id) || (H.ans[id] !== undefined && ph !== "quip_w")) return;
  if (ph === "quiz") { if (!(v >= 0 && v < 4)) return; H.ans[id] = { i: v | 0, t: Date.now() }; }
  else if (ph === "who") { if (!H.players[v]) return; H.ans[id] = v; }
  else if (ph === "bluff_w" || ph === "art_w") {
    const f = txt(v, 40); if (!f) return;
    if (same(f, it.real)) { H.net.send("nope", { id }); return; }
    H.ans[id] = f;
  }
  else if (ph === "bluff_v" || ph === "art_v") { const o = it.opts[v]; if (!o || o.by.includes(id)) return; H.ans[id] = v | 0; }
  else if (ph === "quip_w") {
    if (!v || typeof v !== "object") return;
    for (const pi of r.as[id] || []) { const a = txt(v[pi], 60); if (a) r.answers[pi][id] = a; }
    if ((r.as[id] || []).every(pi => r.answers[pi][id])) H.ans[id] = 1;
  }
  else if (ph === "quip_v") { if (v !== 0 && v !== 1) return; H.ans[id] = v; }
  else if (ph === "wave_c") { const c = txt(v, 30); if (!c) return; it.clue = c; H.ans[id] = 1; }
  else if (ph === "wave_g") { const n = Math.round(+v); if (!(n >= 0 && n <= 100)) return; H.ans[id] = n; }
  else if (ph === "fake_h") { const h = txt(v, 24); if (!h) return; H.ans[id] = h; }
  else if (ph === "fake_v") { if (!H.players[v] || v === id) return; H.ans[id] = v; }
  else if (ph === "count_a") { if (!v || typeof v !== "object") return; const g = Math.round(+v.g); if (!(g >= 0 && g <= 20)) return; H.ans[id] = { y: v.y ? 1 : 0, g }; }
  else if (ph === "split_w") { const a = txt(v, 60); if (!a) return; H.ans[id] = a; }
  else if (ph === "split_v") { H.ans[id] = v ? 1 : 0; }
  else if (ph === "art_d") { H.ans[id] = cleanStrokes(v); }
  else if (ph === "tele_s") {
    const pi = r.ids.indexOf(id), c = chainOf(pi, it.step), kind = it.step % 2 ? "d" : "t";
    const val = kind === "t" ? txt(v, 80) : cleanStrokes(v);
    if (kind === "t" && !val) return;
    r.chains[c][it.step] = { by: id, kind, v: val }; H.ans[id] = 1;
  }
  else return;
  live(); pubSoon();
  if (allIn()) early();
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
function makeOpts(it, fakes, alts) {
  const m = new Map();
  for (const [id, f] of Object.entries(fakes)) { const k = norm(f); if (!m.has(k)) m.set(k, { text: f, by: [] }); m.get(k).by.push(id); }
  const opts = [...m.values()];
  for (const a of alts) if (opts.length < 2 && !opts.some(o => same(o.text, a)) && !same(a, it.real)) opts.push({ text: a, by: [], house: true });
  opts.push({ text: it.real, by: [], real: true });
  return shuffle(opts);
}
function bluffVote() { const it = IT(); it.opts = makeOpts(it, H.ans, it.alt); H.ans = {}; setPhase("bluff_v", 30000, revealBluff); }
function revealBluff() {
  const it = IT();
  for (const [id, v] of Object.entries(H.ans)) { const o = it.opts[v]; if (!o) continue; if (o.real) give(id, 500); else o.by.forEach(a => a !== id && give(a, 250)); }
  setPhase("bluff_r", 12000, nextItem);
}
function artVote() { const it = IT(); it.opts = makeOpts(it, H.ans, pickN(D.art.filter(a => a !== it.real), 2)); H.ans = {}; setPhase("art_v", 25000, revealArt); }
function revealArt() {
  const it = IT();
  for (const [id, v] of Object.entries(H.ans)) { const o = it.opts[v]; if (!o) continue; if (o.real) { give(id, 500); give(it.artist, 250); } else o.by.forEach(a => a !== id && give(a, 250)); }
  setPhase("art_r", 11000, nextItem);
}
function revealQuip() {
  const it = IT(), votes = [[], []];
  for (const [id, v] of Object.entries(H.ans)) votes[v].push(id);
  const tot = votes[0].length + votes[1].length;
  it.votes = votes; it.lol = -1;
  [0, 1].forEach(i => { give(it.by[i], votes[i].length * 100); if (votes[i].length > votes[1 - i].length) give(it.by[i], 100); if (tot > 1 && votes[i].length === tot) { give(it.by[i], 250); it.lol = i; } });
  setPhase("quip_r", 8000, nextItem);
}
function wavePts(d) { return d <= 5 ? 400 : d <= 12 ? 250 : d <= 20 ? 100 : 0; }
function revealWave() {
  const it = IT(), g = Object.entries(H.ans); let sum = 0;
  g.forEach(([id, v]) => { const p = wavePts(Math.abs(v - it.tgt)); sum += p; give(id, p); });
  if (g.length) give(it.psy, Math.round(sum / g.length * 0.75));
  it.guesses = g;
  setPhase("wave_r", 9000, nextItem);
}
function revealFake() {
  const it = IT(), cnt = {};
  Object.values(H.ans).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
  const max = Math.max(0, ...Object.values(cnt));
  it.caught = max > 0 && cnt[it.fk] === max; it.votes = { ...H.ans };
  for (const [id, t] of Object.entries(H.ans)) if (t === it.fk && id !== it.fk) give(id, 300);
  if (!it.caught) give(it.fk, 600);
  setPhase("fake_r", 10000, nextItem);
}
function revealCount() {
  const it = IT(), a = Object.entries(H.ans);
  it.yes = a.filter(([, x]) => x.y).length; it.tot = a.length; it.guesses = a.map(([id, x]) => [id, x.g]);
  a.forEach(([id, x]) => { const d = Math.abs(x.g - it.yes); give(id, d === 0 ? 400 : d === 1 ? 150 : 0); });
  setPhase("count_r", 8000, nextItem);
}
function revealSplit() {
  const it = IT(), v = Object.values(H.ans);
  it.yes = v.filter(x => x).length; it.no = v.length - it.yes;
  if (v.length) give(it.by, Math.round(600 * (1 - Math.abs(it.yes - it.no) / v.length)));
  setPhase("split_r", 7000, nextItem);
}
function onGuess(id, v) {
  const it = IT(); if (id === it.drawer || H.guessed[id] || !v) return;
  const name = H.players[id].name;
  if (same(v, it.word)) {
    const pts = 100 + Math.round(400 * Math.max(0, (H.endsAt - Date.now()) / H.dur));
    H.guessed[id] = pts; give(id, pts); give(it.drawer, 100);
    H.feed.unshift({ hit: true, txt: name + " heeft het geraden!" });
    H.net.send("hit", { id, pts });
  } else H.feed.unshift({ txt: name + ": " + v });
  H.feed = H.feed.slice(0, 9); live(); pubSoon();
  if (allIn()) early();
}

/* live tekening (Tekenen & raden) */
function addStroke(d) {
  const sid = String(d.s || ""), pts = cleanStrokes([{ c: d.c, w: d.w, p: Array.isArray(d.p) ? d.p.slice(0, 400) : [] }])[0];
  if (!sid || !pts) return;
  let s = H.smap[sid];
  if (!s) { s = H.smap[sid] = { c: pts.c, w: pts.w, p: [] }; H.strokes.push(s); }
  const from = s.p.length;
  s.p.push(...pts.p);
  drawStroke(s, Math.max(0, from - 2), ctxFor(document.getElementById("hcv")));
}
function redraw() { paint(document.getElementById("hcv"), H.strokes); }
addEventListener("resize", () => { if (H.phase === "draw") redraw(); });

/* host-weergave */
function timerHtml() { return `<div class="timer" aria-label="Resterende tijd"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#14213d" stroke-width="8"/><circle id="ring" cx="50" cy="50" r="44" fill="none" stroke="#ff5a5f" stroke-width="8" stroke-dasharray="276.5" stroke-linecap="round"/></svg><b id="tnum"></b></div>`; }
const waitRow = () => `<div style="display:flex;gap:24px;align-items:center">${timerHtml()}<div class="status" id="status"></div></div>`;
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
function statusHtml() { const done = doneMap(); return elig().map(id => av(H.players[id], done[id] !== undefined ? "ok" : "")).join(""); }
function rlabel() {
  const r = R(), it = IT(), list = r.items.filter(x => !x.write && !x.draw && x.step === undefined), i = list.indexOf(it);
  return `<div class="rlabel">${esc(MODES[r.type].t)}${i >= 0 ? ` · ${i + 1} van ${list.length}` : ""}</div>`;
}
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
  app.querySelectorAll(".rt").forEach(l => l.classList.toggle("few", act.length > 0 && act.length < MODES[l.dataset.m].min));
}
function qrSvg(text) { try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { return ""; } }
function board(showGain) {
  const ids = H.order.slice().sort((a, b) => H.players[b].score - H.players[a].score);
  return `<div class="board">${ids.map((id, i) => { const p = H.players[id], g = H.rgain[id];
    return `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * 90}ms"><span class="pos">${i + 1}</span>${av(p)}<span>${esc(p.name)}</span><span>${showGain && g ? `<span class="gain">+${g}</span>` : ""}<span class="pts">${p.score}</span></span></div>`; }).join("")}</div>`;
}
function gainsLine() {
  const ids = Object.keys(H.gain).filter(id => H.gain[id] > 0).sort((a, b) => H.gain[b] - H.gain[a]);
  return `<div class="gains">${ids.length ? ids.map(id => `<span class="chip" style="font-size:18px">${av(P_(id))}+${H.gain[id]}</span>`).join("") : `<span class="muted" style="font-size:20px">Niemand scoorde deze keer.</span>`}</div>`;
}
function specHtml(l, r, o = {}) {
  const band = (w, cls) => `<div class="band ${cls}" style="left:${o.tgt - w / 2}%;width:${w}%"></div>`;
  return `<div class="specw"><div class="spec">${o.tgt !== undefined ? band(40, "b1") + band(24, "b2") + band(10, "b3") : ""}
    ${(o.marks || []).map(([id, v]) => `<div class="mark" style="left:${v}%">${av(P_(id))}</div>`).join("")}</div>
    <div class="ends"><span>${esc(l)}</span><span>${esc(r)}</span></div></div>`;
}
const bigQ = (t, small) => `<h1 class="qtext"${small ? ' style="font-size:clamp(28px,3.4vw,54px)"' : ""}>${t}</h1>`;
function renderHost() {
  const ph = H.phase, it = IT() || {}, r = R();
  PAINT = [];
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
        <div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><h3 style="font-size:24px">Spelrondes</h3><button class="lnk" id="allr" type="button">Alles aan/uit</button></div>
        <div class="rounds">${Object.keys(MODES).map(k => `<label class="rt" data-m="${k}"><input type="checkbox" data-r="${k}" ${H.rounds[k] ? "checked" : ""}><span>${esc(MODES[k].t)}${MODES[k].min > 2 ? `<small>vanaf ${MODES[k].min} spelers</small>` : ""}</span></label>`).join("")}</div></div>
      </div></div>`;
  } else if (ph === "intro") {
    stage = `<div class="qwrap intro"><div class="rlabel">Ronde ${H.ri + 1} van ${H.plan.length}</div><div class="disp">${esc(MODES[r.type].t)}</div><p>${esc(MODES[r.type].d)}</p></div>`;
  } else if (ph === "quiz" || ph === "quiz_r") {
    const rev = ph === "quiz_r", cnt = [0, 0, 0, 0]; if (rev) Object.values(H.ans).forEach(a => cnt[a.i]++);
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q))}
      <div class="opts">${it.opts.map((o, i) => `<div class="opt o${i} ${rev && i !== it.c ? "dim" : ""}">${SHAPES[i]}<span>${esc(o)}</span>${rev ? `<span class="n">${cnt[i]}</span>` : ""}</div>`).join("")}</div>
      ${rev ? gainsLine() : waitRow()}</div>`;
  } else if (ph === "who") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q))}<div class="muted big">Stem op je telefoon. Niemand ziet wat jij kiest.</div>${waitRow()}</div>`;
  } else if (ph === "who_r") {
    const cnt = {}; Object.values(H.ans).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
    const max = Math.max(1, ...Object.values(cnt)), ids = H.order.filter(id => cnt[id]).sort((a, b) => cnt[b] - cnt[a]);
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q), 1)}
      <div class="bars">${ids.length ? ids.map(id => `<div class="bar ${H.win.includes(id) ? "win" : ""}">${av(P_(id))}<div class="tr"><div class="fl" data-w="${cnt[id] / max * 100}"></div></div><span>${esc(P_(id).name)} · ${cnt[id]}</span></div>`).join("") : `<div class="muted">Niemand heeft gestemd…</div>`}</div>
      ${H.win.length ? `<div class="big b">${H.win.length > 1 ? "Gedeelde winst!" : "Het is " + esc(P_(H.win[0]).name) + "!"} Wie dat ook koos: +250</div>` : ""}</div>`;
  } else if (ph === "bluff_w") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q).replace("___", `<span style="color:var(--co)">_____</span>`))}<div class="muted big">Typ een nep-antwoord op je telefoon dat zo echt mogelijk klinkt.</div>${waitRow()}</div>`;
  } else if (ph === "bluff_v" || ph === "bluff_r" || ph === "art_v" || ph === "art_r") {
    const rev = ph.endsWith("_r"), votes = {}, art = ph.startsWith("art");
    if (rev) Object.entries(H.ans).forEach(([id, v]) => (votes[v] = votes[v] || []).push(id));
    stage = `<div class="qwrap">${rlabel()}${art ? `<div class="artbox s2">${paintSlot(it.strokes)}</div>` : bigQ(esc(it.q), 1)}
      <div class="bopts">${it.opts.map((o, i) => `<div class="bopt ${rev && o.real ? "real" : ""}"><span>${esc(o.text)}</span>${rev ? `<small>${o.real ? (art ? "De echte opdracht van " + esc(P_(it.artist).name) + "!" : "Het echte antwoord!") : o.by.length ? "Bluf van " + o.by.map(b => esc(P_(b).name)).join(" & ") : "Bluf van Kabaal"}</small><span class="voters">${(votes[i] || []).map(v => av(P_(v))).join("")}</span>` : ""}</div>`).join("")}</div>
      ${rev ? gainsLine() : waitRow()}</div>`;
  } else if (ph === "draw" || ph === "draw_r") {
    const dr = P_(it.drawer);
    stage = `<div class="qwrap">${rlabel()}<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center">${av(dr)}<h2 style="font-size:clamp(26px,2.6vw,42px)">${esc(dr.name)} tekent${ph === "draw_r" ? "… het was" : ""}</h2>${ph === "draw_r" ? `<span class="hint" style="color:var(--co)">${esc(it.word)}</span>` : `<span class="hint">${esc(it.word.replace(/\S/g, "_"))}</span>`}</div>
      <div class="drawWrap"><canvas id="hcv" class="cv"></canvas><div style="display:grid;gap:14px">${ph === "draw" ? waitRow() : gainsLine()}<div class="feed" id="feed"></div></div></div></div>`;
  } else if (ph === "quip_w") {
    stage = `<div class="qwrap">${rlabel()}${bigQ("Iedereen krijgt twee vragen")}<div class="muted big">Schrijf op je telefoon het grappigste antwoord. Straks strijden de antwoorden in duels.</div>${waitRow()}</div>`;
  } else if (ph === "quip_v" || ph === "quip_r") {
    const rev = ph === "quip_r", tot = rev ? it.votes[0].length + it.votes[1].length : 0;
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q) + "…", 1)}
      <div class="duel">${[0, 1].map(i => `<div class="qcard ${rev && it.votes[i].length > it.votes[1 - i].length ? "win" : ""}"><div class="qa">${esc(it.a[i])}</div>${rev ? `<div class="qby">${av(P_(it.by[i]))}${esc(P_(it.by[i]).name)} · ${tot ? Math.round(it.votes[i].length / tot * 100) : 0}%</div><span class="voters">${it.votes[i].map(v => av(P_(v))).join("")}</span>${it.lol === i ? `<div class="stamp">PUNCHLINE!</div>` : ""}` : ""}</div>${i === 0 ? '<div class="vs">VS</div>' : ""}`).join("")}</div>
      ${rev ? gainsLine() : waitRow()}</div>`;
  } else if (ph === "wave_c" || ph === "wave_g" || ph === "wave_r") {
    const ps = P_(it.psy);
    const head = ph === "wave_c" ? `<div class="psy">${av(ps)}<h2>${esc(ps.name)} ziet het doel en bedenkt een hint…</h2></div>` : `<div class="psy">${av(ps)}<span class="muted big">Hint van ${esc(ps.name)}:</span></div><div class="clue">${esc(it.clue)}</div>`;
    stage = `<div class="qwrap">${rlabel()}${head}${specHtml(it.l, it.r, ph === "wave_r" ? { tgt: it.tgt, marks: it.guesses } : {})}
      ${ph === "wave_r" ? gainsLine() : `${ph === "wave_g" ? '<div class="muted big">Schuif op je telefoon naar waar jij denkt dat het doel ligt.</div>' : ""}${waitRow()}`}</div>`;
  } else if (ph === "fake_h") {
    stage = `<div class="qwrap">${rlabel()}${bigQ("Categorie: " + esc(it.cat))}<div class="muted big">Iedereen ziet het geheime woord op zijn telefoon, behalve de Faker. Typ één hintwoord dat erbij past. Niet te duidelijk, want dan weet de Faker het ook!</div>${waitRow()}</div>`;
  } else if (ph === "fake_v" || ph === "fake_r") {
    const rev = ph === "fake_r", votes = {};
    if (rev) Object.entries(it.votes).forEach(([id, t]) => (votes[t] = votes[t] || []).push(id));
    const ids = H.order.filter(id => it.hints[id] !== undefined || id === it.fk);
    stage = `<div class="qwrap">${rlabel()}${rev ? bigQ(it.caught ? `Ontmaskerd! ${esc(P_(it.fk).name)} was de Faker` : `${esc(P_(it.fk).name)} was de Faker en kwam ermee weg!`, 1) + `<div class="big b">Het woord was: <span style="color:var(--co)">${esc(it.word)}</span></div>` : bigQ("Wie is de Faker?", 1)}
      <div class="hints">${ids.map(id => `<div class="hcard ${rev && id === it.fk ? "fk" : ""}">${av(P_(id))}<b>${esc(P_(id).name)}</b><span class="hw">${esc(it.hints[id] ?? "…")}</span>${rev ? `<span class="voters">${(votes[id] || []).map(v => av(P_(v))).join("")}</span>` : ""}</div>`).join("")}</div>
      ${rev ? gainsLine() : waitRow()}</div>`;
  } else if (ph === "count_a" || ph === "count_r") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q), ph === "count_r")}
      ${ph === "count_a" ? `<div class="muted big">Beantwoord stiekem ja of nee, en raad hoeveel van jullie ja zeggen.</div>${waitRow()}`
        : `<div class="bignum"><b>${it.yes}</b><span>van de ${it.tot} zei ja</span></div><div class="gains">${it.guesses.map(([id, g]) => `<span class="chip ${g === it.yes ? "hitc" : ""}" style="font-size:18px">${av(P_(id))}gok: ${g}</span>`).join("")}</div>${gainsLine()}`}</div>`;
  } else if (ph === "split_w") {
    stage = `<div class="qwrap">${rlabel()}${bigQ("Maak je dilemma af")}<div class="muted big">Iedereen krijgt een dilemma op zijn telefoon. Vul het zo in dat de groep precies in tweeën splitst.</div>${waitRow()}</div>`;
  } else if (ph === "split_v" || ph === "split_r") {
    const tot = (it.yes || 0) + (it.no || 0), yp = tot ? Math.round(it.yes / tot * 100) : 50;
    stage = `<div class="qwrap">${rlabel()}<div class="psy">${av(P_(it.by))}<span class="muted big">${esc(P_(it.by).name)} vraagt:</span></div>${bigQ(esc(it.text), 1)}<div class="big b">Zou jij het doen?</div>
      ${ph === "split_v" ? waitRow() : `<div class="splitbar"><div class="sy" style="flex:${Math.max(it.yes, 0.0001)}">Ja · ${it.yes}</div><div class="sn" style="flex:${Math.max(it.no, 0.0001)}">Nee · ${it.no}</div></div><div class="big b">${yp}% ja</div>${gainsLine()}`}</div>`;
  } else if (ph === "art_d") {
    stage = `<div class="qwrap">${rlabel()}${bigQ("Iedereen tekent zijn geheime opdracht")}<div class="muted big">Kijk op je telefoon wat je moet tekenen. Druk op Klaar als je tekening af is.</div>${waitRow()}</div>`;
  } else if (ph === "art_w") {
    stage = `<div class="qwrap">${rlabel()}<div class="psy">${av(P_(it.artist))}<span class="muted big">Kunstwerk van ${esc(P_(it.artist).name)}</span></div><div class="artbox s3">${paintSlot(it.strokes)}</div><div class="muted big">Wat stelt dit voor? Verzin op je telefoon een titel die echt klinkt.</div>${waitRow()}</div>`;
  } else if (ph === "tele_s") {
    const kind = it.step % 2 ? "Tekenen" : it.step ? "Beschrijven" : "Schrijven";
    stage = `<div class="qwrap">${rlabel()}<div class="rlabel" style="background:var(--co);color:#fff">Stap ${it.step + 1} van ${r.L}</div>${bigQ(kind + "!")}<div class="muted big">${it.step === 0 ? "Schrijf een gekke zin op je telefoon." : it.step % 2 ? "Teken de zin die je op je telefoon krijgt." : "Beschrijf de tekening die je op je telefoon ziet."}</div>${waitRow()}</div>`;
  } else if (ph === "tele_r") {
    const ch = r.chains[it.show] || [];
    stage = `<div class="qwrap">${rlabel()}${bigQ("Het verhaal van " + esc(P_(r.ids[it.show]).name), 1)}
      <div class="chain">${ch.map((e, i) => `<div class="step" style="animation-delay:${i * 2.6}s">${e.kind === "t" ? `<div class="stxt">${esc(e.v)}</div>` : paintSlot(e.v)}<div class="sby">${av(P_(e.by))}${esc(P_(e.by).name)}</div></div>`).join("")}</div></div>`;
  } else if (ph === "scores") {
    stage = `<div class="qwrap"><div class="rlabel">Tussenstand</div>${bigQ(H.ri + 1 < H.plan.length ? "Na ronde " + (H.ri + 1) : "Bijna klaar…")}${board(true)}</div>`;
  } else if (ph === "end") {
    const ids = H.order.slice().sort((a, b) => H.players[b].score - H.players[a].score), top = [ids[1], ids[0], ids[2]];
    const hgt = [150, 220, 110];
    stage = `<div class="qwrap"><div class="rlabel">Einde</div>${bigQ(esc(P_(ids[0]).name) + " wint Kabaal!")}
      <div class="podium">${top.map((id, i) => id ? `<div class="pod">${av(P_(id))}<span>${esc(P_(id).name)}</span><span>${P_(id).score}</span><div class="blk" style="height:${hgt[i]}px">${[2, 1, 3][i]}</div></div>` : "").join("")}</div></div>`;
  }
  const inGame = ph !== "lobby" && ph !== "end";
  app.innerHTML = `<div class="host">
    <div class="hbar"><span class="logo">Kabaal!</span><div style="display:flex;gap:10px;flex-wrap:wrap"><span class="pill">Code ${esc(H.code)}</span>${inGame && r ? `<span class="pill">Ronde ${H.ri + 1}/${H.plan.length}</span>` : ""}</div></div>
    <div class="hstage">${stage}</div>
    <div class="hfoot">${ph === "lobby" ? `<span class="muted">Tip: 3 tot 8 spelers is het leukst.</span><button class="btn co" id="startb">Start het spel</button>`
      : ph === "end" ? `<button class="btn co" id="again">Nog een keer</button>`
      : `<button class="btn ghost" id="skipb">Overslaan</button>`}</div></div>`;
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.addEventListener("click", f); };
  on("startb", startGame); on("skipb", skip);
  on("again", () => { H.plan = []; H.ri = -1; H.qi = -1; H.order.forEach(id => H.players[id].score = 0); setPhase("lobby", 0, null); });
  on("allr", () => { const v = !Object.values(H.rounds).every(Boolean); Object.keys(H.rounds).forEach(k => H.rounds[k] = v); app.querySelectorAll("[data-r]").forEach(c => c.checked = v); });
  app.querySelectorAll("[data-r]").forEach(c => c.addEventListener("change", () => { H.rounds[c.dataset.r] = c.checked; }));
  live();
  requestAnimationFrame(() => app.querySelectorAll(".fl[data-w]").forEach(f => f.style.width = f.dataset.w + "%"));
  if (ph === "draw" || ph === "draw_r") requestAnimationFrame(redraw);
  flushPaint();
}

/* =====================================================================
   TELEFOON
   ===================================================================== */
const P = { st: null, k: null, endsAt: 0, dur: 0, sent: {}, fake: "", task: null, pad: [], padK: null };
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
  if (!d) return;
  if (t === "s") {
    const fresh = !P.st || d.k !== P.k;
    const wasIn = P.st && P.st.pl.some(p => p[0] === P.id);
    P.st = d;
    const le = Date.now() + d.left;
    if (fresh || Math.abs(le - P.endsAt) > 1200) P.endsAt = d.left ? le : 0;
    P.dur = d.dur;
    if (fresh) { if (P.k && P.k.split(":")[0] === "bluff_w" && d.ph !== "bluff_w") P.fake = ""; P.k = d.k; P.cy = undefined; renderPhone(); }
    else { updPhone(); if (!wasIn && P.st.pl.some(p => p[0] === P.id)) renderPhone(); }
  }
  if (t === "nope" && d.id === P.id) { delete P.sent[P.k]; toast("Haha, dat is toevallig het échte antwoord! Verzin iets anders.", 3500); renderPhone(); }
  if (t === "hit" && d.id === P.id) { P.sent[P.k] = "hit"; P.hitPts = d.pts; renderPhone(); }
  if (t === "task" && d.id === P.id) { P.task = d; if (d.k === P.k) renderPhone(); }
}
function send(v) { P.sent[P.k] = true; P.net.send("ans", { id: P.id, k: P.k, v }); renderPhone(); }
function updPhone() {
  const sc = document.getElementById("psc"); if (sc) sc.textContent = me().score;
  const st = P.st, list = document.getElementById("plist");
  if (list && st.ph === "lobby") list.innerHTML = st.pl.map(p => `<span class="chip" style="font-size:16px">${av({ name: p[1], color: p[2] })}${esc(p[1])}</span>`).join("");
}
const wait = (h, sub) => `<div class="pmsg"><h2>${h}</h2>${sub ? `<div class="muted">${sub}</div>` : ""}</div>`;
const look = wait("Kijk naar het scherm!", "");
function gainMsg() { const g = P.st.g[P.id]; return g ? `<div class="pmsg flash"><h2 style="color:#1b8a7f">+${g} punten!</h2></div>` : `<div class="pmsg"><h2>Geen punten deze keer</h2><div class="muted">Volgende keer beter!</div></div>`; }
const inputForm = (id, ph, btn, val = "", max = 40) => `<form id="${id}" class="pform"><input class="field" maxlength="${max}" placeholder="${esc(ph)}" autocomplete="off" value="${esc(val)}"><button class="btn co">${btn}</button></form>`;
const padHtml = (btn) => `<canvas id="pcv" class="cv"></canvas><div class="tools">${["#14213d", "#ff5a5f", "#3a6ff7", "#2ec4b6", "#f39c12", "#ffffff"].map(c => `<button class="sw ${c === (P.col || "#14213d") ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="${c === "#ffffff" ? "Gum" : "Kleur"}"></button>`).join("")}<button class="btn ghost sm" id="thick">${P.thick ? "Dun" : "Dik"}</button><button class="btn ghost sm" id="clr" style="margin-left:auto">Wissen</button></div>${btn ? `<button class="btn co" id="padok">${btn}</button>` : ""}`;

function renderPhone() {
  const st = P.st; if (!st) return;
  const m = me(), it = st.it, ph = st.ph, sent = P.sent[P.k];
  const joined = st.pl.some(p => p[0] === P.id), mine = st.el.includes(P.id);
  PAINT = [];
  let body = "";
  if (!joined) body = wait("Even geduld…", "Je wordt aangemeld.");
  else if (ph === "lobby") body = `<div class="pmsg"><h2>Je zit erin, ${esc(m.name)}!</h2><div class="muted">Kijk naar het grote scherm. Het spel begint zodra de host op start drukt.</div><div class="players" id="plist" style="justify-content:center;min-height:0"></div></div>`;
  else if (ph === "intro") body = `<div class="pmsg"><div class="rlabel">Nieuwe ronde</div><h2 style="font-size:40px">${esc(MODES[it.type].t)}</h2><div style="font-weight:700">${esc(MODES[it.type].d)}</div></div>`;
  else if (ph === "quiz") body = sent ? wait("Antwoord staat vast!", "Wachten op de rest…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="popts">${it.opts.map((o, i) => `<button class="opt o${i}" data-a="${i}">${SHAPES[i]}<span>${esc(o)}</span></button>`).join("")}</div>`;
  else if (ph === "quiz_r") body = `<div class="pmsg"><div class="muted">Het goede antwoord was</div><h2>${esc(it.opts[it.c])}</h2></div>${gainMsg()}`;
  else if (ph === "who") body = sent ? wait("Stem uitgebracht!", "Benieuwd wat de rest vindt…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="popts">${st.pl.map(p => `<button class="pick" data-a="${esc(p[0])}">${av({ name: p[1], color: p[2] })}${esc(p[1])}${p[0] === P.id ? " (jij)" : ""}</button>`).join("")}</div>`;
  else if (ph === "who_r") body = `<div class="pmsg"><h2>${it.win && it.win.length ? (it.win.includes(P.id) ? "Dat ben jij!" : esc(pl(it.win[0]).name) + (it.win.length > 1 ? " & co" : "")) : "Niemand gestemd"}</h2><div class="muted">Kijk naar het scherm voor de uitslag.</div></div>${gainMsg()}`;
  else if (ph === "bluff_w") body = sent ? wait("Bluf ingeleverd!", "Hopelijk trapt iemand erin…") : `<div class="pq disp">${esc(it.q)}</div>${inputForm("tf", "Jouw nep-antwoord", "Verstuur bluf", P.fake)}`;
  else if (ph === "bluff_v" || ph === "art_v") body = !mine ? wait("Dit is jouw kunstwerk!", "De rest zoekt de echte titel…") : sent ? wait("Gekozen!", "Wachten op de rest…") :
    `${ph === "bluff_v" ? `<div class="pq disp">${esc(it.q)}</div>` : ""}<div class="muted">Welk antwoord is écht?</div><div class="popts">${it.opts.map((o, i) => o.by.includes(P.id) ? "" : `<button class="bopt" data-a="${i}">${esc(o.t)}</button>`).join("")}</div>`;
  else if (ph === "bluff_r" || ph === "art_r") body = `<div class="pmsg"><div class="muted">${ph === "art_r" ? "De echte opdracht was" : "Het echte antwoord was"}</div><h2>${esc(it.real)}</h2></div>${gainMsg()}`;
  else if (ph === "draw") {
    if (it.drawer === P.id) body = `<div class="muted c">Teken dit, zonder letters of cijfers:</div><div class="word">${esc(it.word)}</div>${padHtml("")}`;
    else if (sent === "hit") body = `<div class="pmsg flash"><h2 style="color:#1b8a7f">Geraden! +${P.hitPts || ""}</h2><div class="muted">Kijk hoe de rest nog zit te puzzelen.</div></div>`;
    else body = `<div class="pmsg" style="padding:10px"><h2 style="font-size:28px">${esc(pl(it.drawer).name)} tekent…</h2><div class="muted">Kijk naar het grote scherm en raad wat het is!</div><div class="hint" style="font-size:28px">${esc(it.word.replace(/\S/g, "_ ").trim())}</div></div>
      <form id="gf" class="pform"><input class="field" maxlength="40" placeholder="Wat is het?" autocomplete="off" autocapitalize="off"><button class="btn co">Raad</button></form>`;
  }
  else if (ph === "draw_r") body = `<div class="pmsg"><div class="muted">Het woord was</div><h2>${esc(it.word)}</h2></div>${gainMsg()}`;
  else if (ph === "quip_w") {
    const qs = (it.as[P.id] || []);
    body = !qs.length ? wait("Even wachten", "Je doet de volgende ronde weer mee.") : sent ? wait("Ingeleverd!", "Benieuwd wie er het hardst gaat lachen…") :
      `<div class="muted c">Schrijf het grappigste antwoord</div><form id="qf" class="pform">${qs.map(pi => `<label class="ql"><span class="disp">${esc(it.qs[pi])}…</span><input class="field" data-pi="${pi}" maxlength="60" autocomplete="off" placeholder="Jouw antwoord"></label>`).join("")}<button class="btn co">Inleveren</button></form>`;
  }
  else if (ph === "quip_v") body = !mine ? wait("Jouw antwoord staat in dit duel!", "Duimen maar…") : sent ? wait("Gestemd!", "") :
    `<div class="pq disp">${esc(it.q)}…</div><div class="muted">Welk antwoord is grappiger?</div><div class="popts">${it.a.map((a, i) => `<button class="bopt" data-a="${i}">${esc(a)}</button>`).join("")}</div>`;
  else if (ph === "quip_r" || ph === "wave_r" || ph === "fake_r" || ph === "count_r" || ph === "split_r") body = (ph === "fake_r" ? `<div class="pmsg"><div class="muted">De Faker was</div><h2>${it.fk === P.id ? "jij!" : esc(pl(it.fk).name)}</h2></div>` : look) + gainMsg();
  else if (ph === "wave_c") body = it.psy !== P.id ? wait(esc(pl(it.psy).name) + " bedenkt een hint…", "Zo meteen ben jij aan zet.") : sent ? wait("Hint verstuurd!", "Kijk wie er op jouw golflengte zit.") :
    `<div class="muted c">Alleen jij ziet waar het doel ligt. Geef een hint die precies op die plek op de schaal hoort.</div>${phoneSpec(it.l, it.r, it.tgt)}${inputForm("tf", "Jouw hint (één woord of begrip)", "Verstuur hint", "", 30)}`;
  else if (ph === "wave_g") body = !mine ? wait("De rest raadt nu…", "Hopelijk snappen ze je hint!") : sent ? wait("Staat vast!", "") :
    `<div class="muted c">Hint van ${esc(pl(it.psy).name)}:</div><div class="word">${esc(it.clue)}</div>${phoneSpec(it.l, it.r)}<button class="btn co" id="wok">Hier!</button>`;
  else if (ph === "fake_h") body = sent ? wait("Hint verstuurd!", "Straks: wie is de Faker?") : (it.fk === P.id
    ? `<div class="pmsg fk"><h2>Jij bent de Faker!</h2><div>Je kent het woord niet. Categorie: <b>${esc(it.cat)}</b>. Verzin een hint die niet opvalt.</div></div>`
    : `<div class="muted c">Het geheime woord is</div><div class="word">${esc(it.word)}</div><div class="muted c">Categorie: ${esc(it.cat)}</div>`) + inputForm("tf", "Eén hintwoord", "Verstuur", "", 24);
  else if (ph === "fake_v") body = sent ? wait("Gestemd!", "") :
    `<div class="pq disp">Wie is de Faker?</div><div class="popts">${it.hints.filter(([id]) => id !== P.id).map(([id, h]) => `<button class="pick" data-a="${esc(id)}">${av(pl(id))}<span>${esc(pl(id).name)} <span class="muted">· ${esc(h)}</span></span></button>`).join("")}</div>`;
  else if (ph === "count_a") {
    const n = st.el.length;
    body = sent ? wait("Ingeleverd!", "") : `<div class="pq disp">${esc(it.q)}</div><div class="yn"><button class="ynb ${P.cy === 1 ? "on" : ""}" data-y="1">Ja</button><button class="ynb ${P.cy === 0 ? "on" : ""}" data-y="0">Nee</button></div>
      ${P.cy === undefined ? `<div class="muted c">Kies eerst ja of nee.</div>` : `<div class="muted c">Hoeveel van de ${n} spelers zeggen ja?</div><div class="nums">${Array.from({ length: n + 1 }, (_, i) => `<button class="num" data-g="${i}">${i}</button>`).join("")}</div>`}`;
  }
  else if (ph === "split_w") body = sent ? wait("Ingeleverd!", "Zou de groep splitsen?") : `<div class="muted c">Maak af, zodat de helft ja en de helft nee zegt:</div><div class="pq disp">${esc((it.pr[P.id] || "").replace("___", "…"))}</div>${inputForm("tf", "…maar", "Inleveren", "", 60)}`;
  else if (ph === "split_v") body = !mine ? wait("Dit is jouw dilemma!", "Hopelijk splitst de groep precies in tweeën.") : sent ? wait("Gestemd!", "") :
    `<div class="pq disp">${esc(it.text)}</div><div class="muted c">Zou jij het doen?</div><div class="yn"><button class="ynb" data-a="1">Ja</button><button class="ynb" data-a="0">Nee</button></div>`;
  else if (ph === "art_d") body = sent ? wait("Kunstwerk ingeleverd!", "Wachten op de andere kunstenaars…") : `<div class="muted c">Teken, zonder letters:</div><div class="word sm">${esc(it.pr[P.id] || "iets moois")}</div>${padHtml("Klaar")}`;
  else if (ph === "art_w") body = !mine ? wait("Dit is jouw kunstwerk!", "De rest verzint nu nep-titels…") : sent ? wait("Titel ingeleverd!", "") :
    `<div class="muted c">Kijk naar de tekening op het scherm. Verzin een titel die echt klinkt:</div>${inputForm("tf", "bijv. een hond die stiekem snoept", "Verstuur", "", 40)}`;
  else if (ph === "tele_s") {
    const tk = P.task && P.task.k === P.k ? P.task : null;
    if (!tk) { P.net.send("need", { id: P.id, k: P.k }); body = wait("Even laden…", ""); }
    else if (tk.none) body = wait("Even wachten", "Je doet de volgende ronde weer mee.");
    else if (sent) body = wait("Doorgegeven!", "Wachten op de rest…");
    else if (tk.kind === "d") body = `<div class="muted c">Teken deze zin:</div><div class="word sm">${esc(tk.prev || "(niks ingevuld)")}</div>${padHtml("Klaar")}`;
    else if (tk.prev === null) body = `<div class="pq disp">Schrijf een gekke zin</div>${inputForm("tf", D.tele[Math.floor(Math.random() * D.tele.length)], "Doorgeven", "", 80)}`;
    else body = `<div class="muted c">Wat zie je? Beschrijf deze tekening in één zin:</div><div class="artbox sm">${paintSlot(tk.prev)}</div>${inputForm("tf", "Ik zie…", "Doorgeven", "", 80)}`;
  }
  else if (ph === "tele_r") body = wait("Kijk naar het scherm!", "Zo is jullie verhaal veranderd…");
  else if (ph === "scores" || ph === "end") {
    const sorted = st.pl.slice().sort((a, b) => b[3] - a[3]), pos = sorted.findIndex(p => p[0] === P.id) + 1;
    body = `<div class="pmsg"><div class="muted">${ph === "end" ? "Eindstand" : "Tussenstand"}</div><h2 style="font-size:64px">#${pos}</h2><div style="font-weight:900;font-size:22px">${m.score} punten</div>${ph === "end" ? `<div class="muted">${pos === 1 ? "Kampioen! Gefeliciteerd!" : "Nog een potje? De host kan opnieuw starten."}</div>` : ""}</div>`;
  }
  const timed = st.left > 0 && !["intro", "scores"].includes(ph) && !ph.endsWith("_r");
  app.innerHTML = `<div class="phone"><div class="ptop">${av(m)}<span>${esc(m.name)}</span>${timed ? `<span class="tm" id="tnum"></span>` : ""}<span class="sc" id="psc">${m.score}</span></div><div class="pbody">${body}</div></div>`;
  updPhone(); flushPaint();
  app.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => { const v = b.dataset.a; send(ph === "who" || ph === "fake_v" ? v : +v); }));
  app.querySelectorAll("[data-y]").forEach(b => b.addEventListener("click", () => { P.cy = +b.dataset.y; renderPhone(); }));
  app.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => send({ y: P.cy, g: +b.dataset.g })));
  const tf = document.getElementById("tf");
  if (tf) { const inp = tf.querySelector("input"); if (ph === "bluff_w") inp.addEventListener("input", () => P.fake = inp.value);
    tf.addEventListener("submit", e => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; if (ph === "bluff_w") P.fake = v; send(v); }); }
  const qf = document.getElementById("qf");
  if (qf) qf.addEventListener("submit", e => { e.preventDefault(); const v = {}; let ok = true;
    qf.querySelectorAll("input").forEach(i => { if (!i.value.trim()) ok = false; v[i.dataset.pi] = i.value.trim(); });
    if (!ok) { toast("Vul beide antwoorden in."); return; } send(v); });
  const gf = document.getElementById("gf");
  if (gf) { const gi = gf.querySelector("input"); gf.addEventListener("submit", e => { e.preventDefault(); const v = gi.value.trim(); if (!v) return;
    P.net.send("g", { id: P.id, k: P.k, v }); gi.value = ""; gi.focus(); gi.placeholder = "Nee, \"" + v.slice(0, 16) + "\" is het niet… probeer opnieuw"; }); }
  const wok = document.getElementById("wok");
  if (wok) { const sl = document.getElementById("wsl"); wok.addEventListener("click", () => send(+sl.value)); }
  if (document.getElementById("pcv")) setupPad(ph === "draw");
}
function phoneSpec(l, r, tgt) {
  return `<div class="pspec">${tgt !== undefined ? `<div class="band b1" style="left:${tgt - 20}%;width:40%"></div><div class="band b2" style="left:${tgt - 12}%;width:24%"></div><div class="band b3" style="left:${tgt - 5}%;width:10%"></div>` : `<input type="range" id="wsl" min="0" max="100" value="50" aria-label="Jouw gok op de schaal">`}</div><div class="ends"><span>${esc(l)}</span><span>${esc(r)}</span></div>`;
}

/* tekenblok op de telefoon. live = elke streep direct naar het scherm (Tekenen & raden) */
function setupPad(live) {
  const cv = document.getElementById("pcv"), dpr = devicePixelRatio || 1;
  const W = cv.clientWidth, Hh = cv.clientHeight; cv.width = W * dpr; cv.height = Hh * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr); c.lineCap = c.lineJoin = "round";
  if (P.padK !== P.k) { P.pad = []; P.padK = P.k; }
  P.pad.forEach(s => drawStroke(s, 0, { c, W, H: Hh }));
  let cur = null, q = [], n = 0, last = null;
  const col = () => P.col || "#14213d", wid = () => (P.col === "#ffffff" ? 0.05 : P.thick ? 0.03 : 0.012);
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000) / 1000, Math.round((e.clientY - r.top) / r.height * 1000) / 1000]; };
  const flush = () => { if (live && cur && q.length) { P.net.send("d", { id: P.id, s: cur.id, c: cur.c, w: cur.w, p: q }); q = []; } };
  const iv = setInterval(() => { if (!document.getElementById("pcv")) return clearInterval(iv); flush(); }, 70);
  cv.addEventListener("pointerdown", e => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const p = pt(e); last = p;
    cur = { id: P.id + "-" + Date.now().toString(36) + (n++), c: col(), w: wid(), p: [...p] }; P.pad.push(cur); q.push(...p);
    c.fillStyle = cur.c; c.beginPath(); c.arc(p[0] * W, p[1] * Hh, cur.w * W / 2, 0, 7); c.fill();
  });
  cv.addEventListener("pointermove", e => {
    if (!cur) return; e.preventDefault(); const p = pt(e);
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.004) return;
    c.strokeStyle = cur.c; c.lineWidth = cur.w * W; c.beginPath(); c.moveTo(last[0] * W, last[1] * Hh); c.lineTo(p[0] * W, p[1] * Hh); c.stroke();
    last = p; q.push(...p); cur.p.push(...p);
  });
  const end = () => { if (!cur) return; flush(); cur = null; };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  app.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { P.col = b.dataset.c; app.querySelectorAll("[data-c]").forEach(x => x.classList.toggle("on", x === b)); }));
  document.getElementById("thick").addEventListener("click", e => { P.thick = !P.thick; e.target.textContent = P.thick ? "Dun" : "Dik"; });
  document.getElementById("clr").addEventListener("click", () => { c.clearRect(0, 0, W, Hh); P.pad = []; if (live) P.net.send("clr", { id: P.id }); });
  const ok = document.getElementById("padok");
  if (ok) ok.addEventListener("click", () => { if (!P.pad.length) { toast("Teken eerst iets!"); return; } send(P.pad.map(s => ({ c: s.c, w: s.w, p: s.p }))); });
}

/* ---------- start ---------- */
if (LOCAL) window.__kabaal = { H, P };
if (Q.get("host") !== null) startHost(); else startScreen();
}
