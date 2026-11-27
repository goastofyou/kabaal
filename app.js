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
/* dieren-avatars: eigen, simpele SVG-diertjes met accessoires */
const ANIMALS = [
  { k: "cat", n: "Kat", c: "#f4a261", e: "tri" }, { k: "dog", n: "Hond", c: "#c68b59", e: "flop" }, { k: "bunny", n: "Konijn", c: "#f3efe6", e: "long" },
  { k: "bear", n: "Beer", c: "#8d6e63", e: "round" }, { k: "fox", n: "Vos", c: "#f77f00", e: "tri", muz: 1 }, { k: "panda", n: "Panda", c: "#ffffff", e: "round", ec: "#14213d", patch: 1 },
  { k: "frog", n: "Kikker", c: "#7bc950", e: "frog" }, { k: "pig", n: "Varken", c: "#f7a1b5", e: "tri", snout: 1 }, { k: "penguin", n: "Pinguïn", c: "#2b2d42", e: "none", face: 1, beak: 1 },
  { k: "owl", n: "Uil", c: "#a1785c", e: "tuft", big: 1, beak: 1 }, { k: "mouse", n: "Muis", c: "#b8b8c8", e: "big" }, { k: "tiger", n: "Tijger", c: "#ff9f1c", e: "round", stripes: 1 }
];
const ACCS = [{ k: "none", n: "Niks" }, { k: "hat", n: "Feesthoed" }, { k: "glasses", n: "Bril" }, { k: "shades", n: "Zonnebril" }, { k: "crown", n: "Kroon" }, { k: "bow", n: "Strik" }];
const ANK = ANIMALS.map(a => a.k), ACK = ACCS.map(a => a.k);
function animalSvg(k, x) {
  const A = ANIMALS.find(a => a.k === k) || ANIMALS[0], c = A.c, I = "#14213d", ec = A.ec || c, st = `stroke="${I}" stroke-width="3"`;
  let s = "";
  if (A.e === "tri") s += `<path d="M20 44 26 8 48 30Z M80 44 74 8 52 30Z" fill="${ec}" ${st} stroke-linejoin="round"/>`;
  if (A.e === "round") s += `<circle cx="25" cy="28" r="12" fill="${ec}" ${st}/><circle cx="75" cy="28" r="12" fill="${ec}" ${st}/>`;
  if (A.e === "big") s += `<circle cx="21" cy="30" r="17" fill="${ec}" ${st}/><circle cx="79" cy="30" r="17" fill="${ec}" ${st}/><circle cx="21" cy="30" r="9" fill="#f7a1b5"/><circle cx="79" cy="30" r="9" fill="#f7a1b5"/>`;
  if (A.e === "long") s += `<ellipse cx="37" cy="16" rx="8" ry="20" fill="${ec}" ${st}/><ellipse cx="63" cy="16" rx="8" ry="20" fill="${ec}" ${st}/><ellipse cx="37" cy="17" rx="3.5" ry="13" fill="#f7a1b5"/><ellipse cx="63" cy="17" rx="3.5" ry="13" fill="#f7a1b5"/>`;
  if (A.e === "tuft") s += `<path d="M24 34 22 14 40 26Z M76 34 78 14 60 26Z" fill="${ec}" ${st} stroke-linejoin="round"/>`;
  if (A.e === "frog") s += `<circle cx="32" cy="30" r="14" fill="${c}" ${st}/><circle cx="68" cy="30" r="14" fill="${c}" ${st}/>`;
  s += `<circle cx="50" cy="56" r="34" fill="${c}" ${st}/>`;
  if (A.e === "flop") s += `<ellipse cx="20" cy="54" rx="10" ry="20" fill="#8a5a36" ${st} transform="rotate(14 20 54)"/><ellipse cx="80" cy="54" rx="10" ry="20" fill="#8a5a36" ${st} transform="rotate(-14 80 54)"/>`;
  if (A.face) s += `<ellipse cx="50" cy="62" rx="24" ry="24" fill="#fff"/>`;
  if (A.muz) s += `<path d="M24 64 Q50 96 76 64 Q62 74 50 70 Q38 74 24 64Z" fill="#fff"/>`;
  if (A.patch) s += `<ellipse cx="38" cy="54" rx="9" ry="11" fill="${I}" transform="rotate(-20 38 54)"/><ellipse cx="62" cy="54" rx="9" ry="11" fill="${I}" transform="rotate(20 62 54)"/>`;
  if (A.stripes) s += `<path d="M42 24 46 34 M50 22 50 34 M58 24 54 34 M18 54 28 56 M82 54 72 56" stroke="${I}" stroke-width="3.5" stroke-linecap="round"/>`;
  const ey = A.e === "frog" ? 30 : 52, ex = A.e === "frog" ? 18 : 12;
  const eye = (cx) => A.big ? `<circle cx="${cx}" cy="${ey}" r="11" fill="#fff" ${st}/><circle cx="${cx}" cy="${ey}" r="5" fill="${I}"/>` : `<circle cx="${cx}" cy="${ey}" r="4.8" fill="${A.patch ? "#fff" : I}"/><circle cx="${cx + 1.6}" cy="${ey - 1.6}" r="1.6" fill="${A.patch ? I : "#fff"}"/>`;
  s += eye(50 - ex) + eye(50 + ex);
  if (A.snout) s += `<ellipse cx="50" cy="66" rx="11" ry="8" fill="#f48fb1" ${st}/><circle cx="46" cy="66" r="2" fill="${I}"/><circle cx="54" cy="66" r="2" fill="${I}"/>`;
  else if (A.beak) s += `<path d="M44 62 56 62 50 72Z" fill="#ffb703" ${st} stroke-linejoin="round"/>`;
  else s += `<path d="M46 62 54 62 50 67Z" fill="${I}"/><path d="M42 70 Q46 74 50 70 Q54 74 58 70" fill="none" stroke="${I}" stroke-width="2.5" stroke-linecap="round"/>`;
  if (!A.face && !A.patch) s += `<circle cx="30" cy="64" r="5" fill="#ff5a5f" opacity=".35"/><circle cx="70" cy="64" r="5" fill="#ff5a5f" opacity=".35"/>`;
  if (x === "hat") s += `<path d="M36 28 50 -2 64 28Z" fill="#ff5a5f" ${st} stroke-linejoin="round"/><path d="M41 18 59 18 M45 9 55 9" stroke="#ffd23f" stroke-width="4"/><circle cx="50" cy="-2" r="5" fill="#ffd23f" ${st}/>`;
  if (x === "glasses") s += `<circle cx="38" cy="${ey}" r="10" fill="none" ${st}/><circle cx="62" cy="${ey}" r="10" fill="none" ${st}/><path d="M48 ${ey} 52 ${ey}" ${st}/>`;
  if (x === "shades") s += `<rect x="25" y="${ey - 8}" width="22" height="15" rx="6" fill="${I}"/><rect x="53" y="${ey - 8}" width="22" height="15" rx="6" fill="${I}"/><path d="M46 ${ey - 3} 54 ${ey - 3}" ${st}/>`;
  if (x === "crown") s += `<path d="M32 26 32 8 41 18 50 4 59 18 68 8 68 26Z" fill="#ffd23f" ${st} stroke-linejoin="round"/>`;
  if (x === "bow") s += `<path d="M62 22 76 12 76 32Z M90 22 76 12 76 32Z" fill="#e84393" ${st} stroke-linejoin="round" transform="translate(-6 0)"/><circle cx="70" cy="22" r="4.5" fill="#e84393" ${st}/>`;
  return `<svg viewBox="0 -6 100 106" aria-hidden="true">${s}</svg>`;
}
const av = (p, cls = "") => ANK.includes(p.a)
  ? `<span class="av an ${cls}" style="background:${esc(p.color)}" title="${esc(p.name)}">${animalSvg(p.a, p.x)}</span>`
  : `<span class="av ${cls}" style="background:${esc(p.color)}" title="${esc(p.name)}">${esc((p.name || "?").trim().charAt(0).toUpperCase())}</span>`;
const PL = p => ({ id: p[0], name: p[1], color: p[2], score: p[3], a: p[4], x: p[5], tm: p[6] });
const TEAMS = [{ n: "Team Rood", c: "#ff5a5f" }, { n: "Team Blauw", c: "#3a6ff7" }, { n: "Team Groen", c: "#2ec4b6" }];
const EMOJI = ["😂", "😮", "🔥", "👏", "💀", "😍"];

/* geluid: alles gesynthetiseerd met Web Audio, geen bestanden nodig */
const SND = {
  ctx: null, on: true, mus: false, mt: null, step: 0, next: 0,
  init() { try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === "suspended") this.ctx.resume(); } catch (e) {} },
  tone(f, d = 0.15, type = "sine", v = 0.2, at = 0, slide = 0) {
    if (!this.on || !this.ctx || this.ctx.state !== "running") return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d = 0.4, v = 0.3, at = 0) {
    if (!this.on || !this.ctx || this.ctx.state !== "running") return;
    const c = this.ctx, b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = v; s.connect(g).connect(c.destination); s.start(c.currentTime + at);
  },
  tick() { this.tone(1200, 0.05, "square", 0.06); },
  pop() { this.tone(500, 0.12, "sine", 0.25, 0, 1100); },
  ding() { this.tone(880, 0.25, "triangle", 0.25); this.tone(1320, 0.4, "triangle", 0.2, 0.12); },
  buzz() { this.tone(140, 0.35, "sawtooth", 0.12); },
  whoosh() { this.tone(200, 0.4, "sine", 0.2, 0, 900); this.noise(0.3, 0.06); },
  go() { this.tone(988, 0.3, "square", 0.15); },
  boom() { this.noise(0.9, 0.5); this.tone(90, 0.7, "sine", 0.4, 0, 40); },
  drum() { for (let i = 0; i < 10; i++) this.noise(0.05, 0.08 + i * 0.01, i * 0.07); this.tone(660, 0.3, "triangle", 0.2, 0.75); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i === 3 ? 0.7 : 0.18, "square", 0.12, i * 0.16)); },
  /* rustig achtergrondloopje: akkoorden C-Am-F-G */
  music(on) {
    this.mus = on; clearInterval(this.mt); this.mt = null;
    if (!on) return;
    this.init(); this.next = 0;
    const chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
    this.mt = setInterval(() => {
      if (!this.ctx || this.ctx.state !== "running" || !this.mus) return;
      const c = this.ctx, spb = 60 / 112 / 2;
      if (this.next < c.currentTime) this.next = c.currentTime + 0.05;
      while (this.next < c.currentTime + 0.3) {
        const ch = chords[Math.floor(this.step / 16) % 4], i = this.step % 16, at = this.next - c.currentTime, on0 = this.on; this.on = true;
        if (i % 4 === 0) this.tone(ch[0] / 2, spb * 3, "triangle", 0.07, at);
        this.tone(ch[[0, 1, 2, 1][i % 4]] * 2, spb * 0.9, "square", 0.018, at);
        this.on = on0; this.step++; this.next += spb;
      }
    }, 100);
  }
};
addEventListener("pointerdown", () => SND.init());
const SHAPES = [
  '<svg viewBox="0 0 40 40"><path d="M20 4 37 34H3z" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M20 2 38 20 20 38 2 20z" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#fff"/></svg>',
  '<svg viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="4" fill="#fff"/></svg>'];
/* Spelrondes, in speelvolgorde. min = minimaal aantal spelers, def = standaard aan */
const MODES = {
  quiz:  { t: "Quiz", d: "Kies het goede antwoord op je telefoon. Hoe sneller, hoe meer punten.", min: 1, def: true },
  react: { t: "Reflex", d: "Wacht tot je scherm groen wordt en tik dan zo snel als je kan. Te vroeg is af!", min: 1 },
  who:   { t: "Most Likely To", d: "Stem op wie het best bij de stelling past. Kies je hetzelfde als de meerderheid, dan krijg je punten.", min: 2 },
  quip:  { t: "Punchline", d: "Je krijgt twee vragen: schrijf het grappigste antwoord. Daarna strijden de antwoorden in duels en stemt de rest.", min: 3, def: true },
  wave:  { t: "Spectrum", d: "Eén speler ziet waar het doel op de schaal ligt en geeft een hint. De rest schuift zo dicht mogelijk bij het doel.", min: 2, def: true },
  tap:   { t: "Tap Race", d: "Tik zo snel als je kan op je telefoon. Wie het eerst bij de finish is, wint.", min: 1 },
  fake:  { t: "The Faker", d: "Iedereen krijgt hetzelfde geheime woord, behalve de Faker. Geef één hintwoord en ontmasker de Faker, of blijf als Faker onder de radar.", min: 3, def: true },
  count: { t: "How Many of Us?", d: "Beantwoord stiekem ja of nee, en raad hoeveel spelers ja zeiden.", min: 2, def: true },
  stop:  { t: "Stopwatch", d: "Stop de klok op precies het juiste aantal seconden. Na 3 seconden verdwijnt de klok, dus tel in je hoofd!", min: 1 },
  bluff: { t: "Bluff", d: "Verzin een geloofwaardig nep-antwoord. Daarna zoek je het echte antwoord tussen alle verzinsels. Trapt iemand in jouw bluf, dan scoor jij.", min: 2 },
  split: { t: "Fifty-Fifty", d: "Maak een dilemma af zodat de groep precies in tweeën splitst. Hoe dichter bij 50/50, hoe meer punten.", min: 3 },
  potato:{ t: "Hot Potato", d: "Heb jij de bom? Typ snel iets uit de categorie om hem door te geven. Wie de bom heeft als hij ontploft, verliest!", min: 2 },
  art:   { t: "Art Bluff", d: "Teken je geheime opdracht. Daarna verzint iedereen een nep-titel bij elkaars tekening. Zoek de echte titel.", min: 3 },
  shake: { t: "Shake It", d: "Schud je telefoon zo hard als je kan (hou hem stevig vast!) en blaas je ballon op tot hij knapt.", min: 1 },
  tele:  { t: "Broken Telephone", d: "Schrijf een zin, teken andermans zin, beschrijf andermans tekening… Aan het eind zie je wat ervan geworden is.", min: 3 },
  draw:  { t: "Draw & Guess", d: "Eén speler tekent op zijn telefoon, de rest raadt zo snel mogelijk wat het is.", min: 2, def: true },
  last:  { t: "Last Stand", d: "Snelle quizvragen. Fout is een leven kwijt. Zonder levens word je een geest die de rest mag laten schrikken. Wie blijft er over?", min: 2 }
};
/* Modussen: kant-en-klare selecties van rondes. min = geschatte minuten per ronde bij ±4 spelers */
const MIN = { quiz: 3, who: 2.5, quip: 5, wave: 4, fake: 3, count: 2.5, bluff: 4, split: 4, art: 6, tele: 6, draw: 6, react: 2, tap: 1.5, stop: 2, potato: 3, shake: 1.5, last: 4 };
const PRESETS = {
  party:   { t: "Party Mix", d: "Een mix van alles: snel, grappig, een reflextest en een beetje tekenen.", r: ["quiz", "react", "quip", "wave", "fake", "count", "draw"] },
  arcade:  { t: "Arcade Mode", d: "Snelle actie-minigames: reflexen, tikken, schudden en een tikkende bom.", r: ["react", "tap", "stop", "potato", "shake"] },
  draw:    { t: "Draw Mode", d: "Alle tekenrondes.", r: ["draw", "art", "tele"] },
  brain:   { t: "Brain Mode", d: "Kennis, inschatten en bluffen met echte feitjes, met Last Stand als finale.", r: ["quiz", "bluff", "wave", "last"] },
  comedy:  { t: "Comedy Mode", d: "Grappige antwoorden verzinnen en elkaar laten lachen.", r: ["quip", "split", "tele", "who"] },
  friends: { t: "Friends Mode", d: "Alles over elkaar: hoe goed ken je je vrienden?", r: ["who", "count", "fake", "split"] },
  all:     { t: "Everything", d: "Alle " + Object.keys(MODES).length + " rondes achter elkaar. Reken op een lange avond!", r: Object.keys(MODES) }
};
/* Instellingen per ronde (aantallen) */
const OPTS = {
  quiz:  { l: "Aantal vragen", min: 3, max: 15, def: 5 },
  who:   { l: "Aantal stellingen", min: 2, max: 10, def: 4 },
  wave:  { l: "Aantal beurten", min: 2, max: 8, def: 4 },
  fake:  { l: "Aantal rondes", min: 1, max: 5, def: 2 },
  count: { l: "Aantal vragen", min: 2, max: 10, def: 4 },
  bluff: { l: "Aantal vragen", min: 2, max: 8, def: 3 },
  tele:  { l: "Stappen per verhaal", min: 3, max: 8, def: 4 },
  draw:  { l: "Tekenbeurten per speler", min: 1, max: 3, def: 1 },
  react: { l: "Aantal rondes", min: 1, max: 5, def: 3 },
  tap:   { l: "Aantal races", min: 1, max: 3, def: 1 },
  stop:  { l: "Aantal rondes", min: 1, max: 5, def: 3 },
  potato:{ l: "Aantal bommen", min: 1, max: 5, def: 3 },
  shake: { l: "Aantal keer", min: 1, max: 3, def: 1 },
  last:  { l: "Levens", min: 1, max: 3, def: 2 }
};
const SPEEDS = [[0.7, "Kort"], [1, "Normaal"], [1.5, "Lang"]];
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
  rounds: initRounds(), cfg: initCfg(), strokes: [], smap: {}, feed: [], guessed: {}, t: null, next: null,
  streak: {}, sn: {}, stats: {}, best: {}, mult: 1, taps: {}, fin: [], lives: {}, emoT: {} };
function initCfg() {
  let c = null; try { c = JSON.parse(store.get("kabaal:cfg") || "null"); } catch (e) {}
  const cfg = {}; for (const k in OPTS) { const v = c && +c[k]; cfg[k] = v >= OPTS[k].min && v <= OPTS[k].max ? v : OPTS[k].def; }
  cfg.speed = c && SPEEDS.some(x => x[0] === c.speed) ? c.speed : 1;
  cfg.teams = c && [0, 2, 3].includes(c.teams) ? c.teams : 0;
  for (const [k, d] of [["fin", true], ["snd", true], ["mus", false]]) cfg[k] = c && typeof c[k] === "boolean" ? c[k] : d;
  return cfg;
}
const T = ms => Math.round(ms * H.cfg.speed / 1000) * 1000;
const C = k => H.cfg[k];
function initRounds() {
  let saved = null; try { saved = JSON.parse(store.get("kabaal:rounds") || "null"); } catch (e) {}
  return Object.fromEntries(Object.keys(MODES).map(k => [k, saved && typeof saved[k] === "boolean" ? saved[k] : PRESETS.party.r.includes(k)]));
}
function syncPresets() {
  const on = Object.keys(MODES).filter(k => H.rounds[k]);
  const match = Object.keys(PRESETS).find(p => PRESETS[p].r.length === on.length && PRESETS[p].r.every(k => H.rounds[k]));
  app.querySelectorAll("[data-p]").forEach(b => b.classList.toggle("on", b.dataset.p === (match || "custom")));
  app.querySelectorAll("[data-r]").forEach(c => c.checked = !!H.rounds[c.dataset.r]);
  const min = Math.round(on.reduce((a, k) => a + MIN[k] * (OPTS[k] ? H.cfg[k] / OPTS[k].def : 1), 0) * (0.55 + 0.45 * H.cfg.speed) / 5) * 5;
  const el = document.getElementById("pdesc");
  if (el) el.textContent = (match ? PRESETS[match].d + " " : on.length ? "Je eigen selectie. " : "") + (on.length ? `${on.length} ${on.length === 1 ? "ronde" : "rondes"}, ongeveer ${Math.max(5, min)} minuten.` : "Kies minstens één ronde.");
  store.set("kabaal:rounds", JSON.stringify(H.rounds)); store.set("kabaal:cfg", JSON.stringify(H.cfg));
}
const key = () => H.phase + ":" + H.ri + ":" + H.qi;
const R = () => H.plan[H.ri];
const IT = () => R() && R().items[H.qi];
const active = () => H.order.filter(id => Date.now() - H.players[id].seen < 20000);
const P_ = id => H.players[id] || { name: "?", color: "#999" };
/* teams: nieuwe spelers gaan naar het kleinste team */
function assignTeams(reshuffle) {
  const n = H.cfg.teams;
  if (!n) { H.order.forEach(id => delete H.players[id].tm); return; }
  if (reshuffle) shuffle(H.order).forEach((id, i) => H.players[id].tm = i % n);
  H.order.forEach(id => { const p = H.players[id]; if (!(p.tm >= 0 && p.tm < n)) { const cnt = Array.from({ length: n }, (_, t) => H.order.filter(i => H.players[i].tm === t).length); p.tm = cnt.indexOf(Math.min(...cnt)); } });
}
const teamScores = () => TEAMS.slice(0, H.cfg.teams).map((t, i) => ({ ...t, i, score: H.order.filter(id => H.players[id].tm === i).reduce((a, id) => a + H.players[id].score, 0) })).sort((a, b) => b.score - a.score);
function stat(id, k, n = 1) { if (!H.players[id]) return; const s = H.stats[id] = H.stats[id] || {}; s[k] = (s[k] || 0) + n; }

async function startHost() {
  const L = "BCDFGHJKLMNPRSTVWXZ";
  H.code = Array.from({length: 4}, () => L[Math.floor(Math.random() * L.length)]).join("");
  app.innerHTML = `<div class="start"><div class="box"><span class="logo">Kabaal!</span><div class="tag">Spel klaarzetten…</div></div></div>`;
  try { H.net = await connect(H.code, hostMsg); }
  catch (e) { app.innerHTML = `<div class="start"><div class="box card" style="padding:24px"><h2>Geen verbinding</h2><p>Kan de spelserver niet bereiken. Check je internet en probeer het opnieuw.</p><button class="btn" onclick="location.reload()">Opnieuw</button></div></div>`; return; }
  setInterval(pub, 2000);
  setInterval(() => { if (H.phase === "lobby") liveLobby(); }, 3000);
  SND.on = H.cfg.snd; SND.init(); if (H.cfg.mus) SND.music(true);
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
  if (ph === "potato") return [];
  if (ph === "last_q") return a.filter(i => H.lives[i] > 0);
  if (ph === "tap" || ph === "shake") return a.filter(i => !H.fin.includes(i));
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
  if (ph === "react") x.goIn = Math.max(0, H.t0 + it.delay - Date.now());
  if (ph === "react_r") { x.res = it.res; x.early = it.early; }
  if (ph === "tap_r" || ph === "shake_r") x.rank = it.rank;
  if (ph === "stop") { x.tgt = it.tgt; x.el = Date.now() - H.t0; }
  if (ph === "stop_r") { x.tgt = it.tgt; x.res = it.res; }
  if (ph === "potato" || ph === "potato_r") { x.cat = it.cat; x.holder = it.holder; x.used = (it.used || []).slice(0, 6).map(u => u.w); }
  if (ph === "last_q" || ph === "last_r") { x.q = it.q; x.opts = it.opts; x.lives = H.lives; x.sp = it.sp || {}; if (ph === "last_r") { x.c = it.c; x.dead = it.dead; } }
  if (ph === "last_end") { x.surv = r.surv; x.lives = H.lives; }
  if (ph === "awards") x.aw = (H.awards || []).map(a => [a.id, a.t, a.d(a.v)]);
  H.net.send("s", { k: key(), ph, left: H.endsAt ? Math.max(0, H.endsAt - Date.now()) : 0, dur: H.dur, hide: ph === "potato" || ph.endsWith("_c") || ph === "stop" || ph === "react",
    rt: r ? r.type : null, pl: H.order.map(id => { const p = H.players[id]; return [id, p.name, p.color, p.score, p.a, p.x, p.tm]; }),
    done: Object.keys(doneMap()), el: elig(), g: H.gain, sn: H.sn, mult: H.mult, teams: H.cfg.teams, it: x });
}

function hostMsg(t, d) {
  if (!d || typeof d !== "object") return;
  const id = String(d.id || "").slice(0, 40); if (!id) return;
  const p = H.players[id];
  if (t === "join") {
    const name = txt(d.name, 14) || "Speler", a = ANK.includes(d.a) ? d.a : pick(ANK), x = ACK.includes(d.x) ? d.x : "none";
    if (!p) {
      const used = H.order.map(i => H.players[i].color);
      H.players[id] = { id, name, a, x, color: COLORS.find(c => !used.includes(c)) || COLORS[H.order.length % COLORS.length], score: 0, seen: Date.now() };
      H.order.push(id); assignTeams(); SND.pop();
    } else { p.name = name; p.a = a; p.x = x; p.seen = Date.now(); }
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
  if (t === "emo" && EMOJI.includes(d.e) && !(Date.now() - (H.emoT[id] || 0) < 600)) { H.emoT[id] = Date.now(); flyEmoji(d.e, p); }
  if (t === "tap" && d.k === key() && (H.phase === "tap" || H.phase === "shake")) onTap(id, +d.n);
}
function flyEmoji(e, p) {
  const f = document.createElement("div"); f.className = "fly"; f.style.left = (6 + Math.random() * 84) + "%";
  f.innerHTML = `<span class="fe">${e}</span>${av(p)}`; document.body.appendChild(f); setTimeout(() => f.remove(), 3200);
}

function setPhase(phase, ms, next) {
  clearTimeout(H.t); H.t = null;
  H.phase = phase; H.dur = ms || 0; H.endsAt = ms ? Date.now() + ms : 0; H.next = next || null;
  if (ms && next) H.t = setTimeout(() => { H.t = null; next(); }, ms);
  H.t0 = Date.now(); H.lastSec = null;
  if (phase === "intro") SND.whoosh(); else if (phase === "end" || phase === "awards") SND.fanfare(); else if (phase === "scores") SND.drum(); else if (phase.endsWith("_r")) SND.ding();
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
    if (k === "quiz") plan.push({ type: k, items: pickN(D.quiz, C("quiz")).map(a => { const opts = shuffle(a.slice(1, 5)); return { q: a[0], opts, c: opts.indexOf(a[1]) }; }) });
    if (k === "who") plan.push({ type: k, items: pickN(D.who, C("who")).map(q => ({ q })) });
    if (k === "bluff") plan.push({ type: k, items: pickN(D.bluff, C("bluff")).map(a => ({ q: a[0], real: a[1], alt: a.slice(2) })) });
    if (k === "draw") { const words = shuffle(D.draw), order = []; for (let r = 0; r < C("draw"); r++) order.push(...shuffle(ids)); plan.push({ type: k, items: order.map((id, i) => ({ drawer: id, word: words[i % words.length] })) }); }
    if (k === "quip") {
      const qs = pickN(D.quip, n), as = {}; ids.forEach(id => as[id] = []);
      const items = qs.map((q, i) => { const by = [ids[i], ids[(i + 1) % n]]; by.forEach(b => as[b].push(i)); return { q, by, pi: i }; });
      plan.push({ type: k, qs, as, answers: qs.map(() => ({})), items: [{ write: true }, ...shuffle(items)] });
    }
    if (k === "wave") { const sp = pickN(D.wave, C("wave")); plan.push({ type: k, items: sp.map((s, i) => ({ psy: ids[i % n], l: s[0], r: s[1], tgt: 8 + Math.round(Math.random() * 84) })) }); }
    if (k === "fake") plan.push({ type: k, items: pickN(D.fake, C("fake")).map(([cat, word]) => ({ cat, word, fk: pick(ids) })) });
    if (k === "count") plan.push({ type: k, items: pickN(D.count, C("count")).map(q => ({ q })) });
    if (k === "split") { const ds = shuffle(D.split), pr = {}; ids.forEach((id, i) => pr[id] = ds[i % ds.length]); plan.push({ type: k, pr, items: [{ write: true }] }); }
    if (k === "art") { const ps = shuffle(D.art), pr = {}; ids.forEach((id, i) => pr[id] = ps[i % ps.length]); plan.push({ type: k, pr, items: [{ draw: true }] }); }
    if (k === "react") plan.push({ type: k, items: Array.from({ length: C("react") }, () => ({ delay: 1500 + Math.round(Math.random() * 3500) })) });
    if (k === "tap") plan.push({ type: k, items: Array.from({ length: C("tap") }, () => ({})) });
    if (k === "shake") plan.push({ type: k, items: Array.from({ length: C("shake") }, () => ({})) });
    if (k === "stop") plan.push({ type: k, items: Array.from({ length: C("stop") }, () => ({ tgt: 4 + Math.floor(Math.random() * 8) })) });
    if (k === "potato") plan.push({ type: k, items: pickN(D.potato, C("potato")).map(cat => ({ cat, fuse: 20000 + Math.round(Math.random() * 20000) })) });
    if (k === "last") {
      const usedQ = new Set((plan.find(r => r.type === "quiz") || { items: [] }).items.map(i => i.q));
      plan.push({ type: k, lives: C("last"), items: shuffle(D.quiz.filter(a => !usedQ.has(a[0]))).slice(0, 20).map(a => { const opts = shuffle(a.slice(1, 5)); return { q: a[0], opts, c: opts.indexOf(a[1]) }; }) });
    }
    if (k === "tele") {
      const L = C("tele");
      plan.push({ type: k, ids: ids.slice(), L, chains: ids.map(() => []), items: [...Array.from({ length: L }, (_, s) => ({ step: s })), ...ids.map((_, c) => ({ show: c }))] });
    }
  }
  if (skipped.length) toast("Overgeslagen (te weinig spelers): " + skipped.join(", "), 4500);
  return plan;
}
function startGame() {
  const sm = document.getElementById("setm"); if (sm) sm.remove();
  if (active().length < 2) { toast("Je hebt minstens 2 spelers nodig."); return; }
  if (!Object.values(H.rounds).some(Boolean)) { toast("Kies minstens één spelronde."); return; }
  H.order.forEach(id => H.players[id].score = 0);
  H.streak = {}; H.stats = {}; H.best = {}; assignTeams();
  H.plan = buildPlan(); H.ri = -1;
  if (!H.plan.length) { toast("Geen van de gekozen rondes kan met zo weinig spelers."); return; }
  nextRound();
}
function nextRound() {
  H.ri++; H.qi = -1; H.rgain = {};
  if (H.ri >= H.plan.length) { H.mult = 1; H.awards = calcAwards(); return H.awards.length ? setPhase("awards", 3000 + 2600 * H.awards.length, () => setPhase("end", 0, null)) : setPhase("end", 0, null); }
  H.mult = H.cfg.fin && H.plan.length > 1 && H.ri === H.plan.length - 1 ? 3 : 1;
  if (R().type === "last") { H.lives = {}; active().forEach(id => H.lives[id] = R().lives); }
  setPhase("intro", H.mult > 1 ? 8000 : 6000, nextItem);
}
function nextItem() {
  H.qi++; H.ans = {}; H.gain = {}; H.win = []; H.sn = {};
  const r = R();
  if (H.qi >= r.items.length) return setPhase("scores", 9000, nextRound);
  const it = IT(), t = r.type;
  if (t === "quiz") return setPhase("quiz", T(20000), revealQuiz);
  if (t === "who") return setPhase("who", T(20000), revealWho);
  if (t === "bluff") return setPhase("bluff_w", T(50000), bluffVote);
  if (t === "draw") {
    if (!H.players[it.drawer] || !active().includes(it.drawer)) return nextItem();
    H.strokes = []; H.smap = {}; H.feed = []; H.guessed = {};
    return setPhase("draw", T(80000), () => setPhase("draw_r", 6000, nextItem));
  }
  if (t === "quip") {
    if (it.write) return setPhase("quip_w", T(80000), nextItem);
    const a = r.answers[it.pi]; it.a = it.by.map(id => a[id] || "(geen antwoord)");
    return setPhase("quip_v", T(20000), revealQuip);
  }
  if (t === "wave") {
    if (!active().includes(it.psy)) return nextItem();
    return setPhase("wave_c", T(45000), () => { if (!it.clue) it.clue = "(geen hint)"; H.ans = {}; setPhase("wave_g", T(25000), revealWave); });
  }
  if (t === "fake") {
    if (!active().includes(it.fk)) it.fk = pick(active());
    return setPhase("fake_h", T(45000), () => { it.hints = { ...H.ans }; H.ans = {}; setPhase("fake_v", T(35000), revealFake); });
  }
  if (t === "count") return setPhase("count_a", T(25000), revealCount);
  if (t === "react") { H.go = false; clearTimeout(H.goT); H.goT = setTimeout(() => { H.go = true; SND.go(); const p = document.getElementById("rpan"); if (p) { p.className = "rpan go"; p.textContent = "NU!"; } }, it.delay); return setPhase("react", it.delay + 3500, revealReact); }
  if (t === "tap" || t === "shake") { H.taps = {}; H.fin = []; return setPhase(t + "_c", t === "shake" ? 6000 : 3500, () => setPhase(t, 10000, revealRace)); }
  if (t === "stop") return setPhase("stop", (it.tgt + 6) * 1000, revealStop);
  if (t === "potato") {
    const a = active(); if (a.length < 2) return nextItem();
    it.holder = pick(a); it.used = []; it.passes = 0;
    return setPhase("potato", it.fuse, () => { SND.boom(); stat(it.holder, "boom"); active().filter(i => i !== it.holder).forEach(i => give(i, 150)); setPhase("potato_r", 7000, nextItem); });
  }
  if (t === "last") {
    const alive = active().filter(i => H.lives[i] > 0);
    if (alive.length <= 1 && H.qi > 0) return lastEnd(alive);
    return setPhase("last_q", T(14000), revealLast);
  }
  if (t === "split") {
    if (it.write) return setPhase("split_w", T(50000), () => {
      shuffle(Object.entries(H.ans)).forEach(([id, a]) => r.items.push({ by: id, text: r.pr[id].replace("___", a) }));
      nextItem();
    });
    return setPhase("split_v", T(15000), revealSplit);
  }
  if (t === "art") {
    if (it.draw) return setPhase("art_d", T(80000), () => {
      shuffle(Object.entries(H.ans)).forEach(([id, s]) => { if (s.length) r.items.push({ artist: id, strokes: s, real: r.pr[id] }); });
      nextItem();
    });
    return setPhase("art_w", T(40000), artVote);
  }
  if (t === "tele") {
    if (it.step !== undefined) {
      const kind = it.step % 2 ? "d" : "t";
      setPhase("tele_s", T(kind === "d" ? 75000 : it.step ? 40000 : 45000), () => {
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
function give(id, pts) { if (!H.players[id] || !pts) return; pts *= H.mult || 1; H.players[id].score += pts; H.gain[id] = (H.gain[id] || 0) + pts; H.rgain[id] = (H.rgain[id] || 0) + pts; }
/* goed antwoord: punten + reeksbonus (Kahoot-stijl) */
function right(id, pts) { give(id, pts); stat(id, "brain"); const s = H.streak[id] = (H.streak[id] || 0) + 1; if (s >= 2) { give(id, Math.min(300, 100 * (s - 1))); H.sn[id] = s; } }
function wrong(id) { H.streak[id] = 0; }

function onAnswer(id, v) {
  const ph = H.phase, it = IT(), r = R(), el = elig();
  /* geesten in Last Stand: één keer per vraag iemand laten schrikken */
  if (ph === "last_q" && !(H.lives[id] > 0) && v && v.spook && H.lives[v.spook] > 0) {
    it.sp = it.sp || {}; if (Object.values(it.sp).includes(id)) return; it.sp[v.spook] = id; renderHost(); pubSoon(); return;
  }
  /* Hot Potato: de bomhouder geeft door met een woord uit de categorie */
  if (ph === "potato") {
    if (id !== it.holder) return;
    const w = txt(v, 30); if (w.length < 2) return;
    if (it.used.some(u => same(u.w, w))) { H.net.send("nope2", { id, msg: "Die is al geweest! Iets anders." }); return; }
    it.used.unshift({ w, by: id }); it.used = it.used.slice(0, 14); it.passes++;
    const others = active().filter(i => i !== id); it.holder = pick(others.length ? others : [id]); SND.pop();
    renderHost(); pub(); return;
  }
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
  else if (ph === "react") { if (v && v.early) H.ans[id] = -1; else { const rt = Math.round(+(v && v.rt)); if (!(rt >= 60 && rt <= 5000)) return; H.ans[id] = rt; if (!H.best[id] || rt < H.best[id]) H.best[id] = rt; } }
  else if (ph === "stop") { const t = +v; if (!(t > 0 && t < 60)) return; H.ans[id] = Math.round(t * 100) / 100; }
  else if (ph === "last_q") { if (!(v >= 0 && v < 4)) return; H.ans[id] = v | 0; }
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
  for (const id of active()) { const a = H.ans[id]; if (a && a.i === it.c) right(id, 500 + Math.round(500 * Math.max(0, 1 - (a.t - start) / H.dur))); else wrong(id); }
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
function bluffVote() { const it = IT(); it.opts = makeOpts(it, H.ans, it.alt); H.ans = {}; setPhase("bluff_v", T(30000), revealBluff); }
function revealBluff() {
  const it = IT();
  for (const [id, v] of Object.entries(H.ans)) { const o = it.opts[v]; if (!o) continue; if (o.real) right(id, 500); else { wrong(id); o.by.forEach(a => { if (a !== id) { give(a, 250); stat(a, "fool"); } }); } }
  setPhase("bluff_r", 12000, nextItem);
}
function artVote() { const it = IT(); it.opts = makeOpts(it, H.ans, pickN(D.art.filter(a => a !== it.real), 2)); H.ans = {}; setPhase("art_v", T(25000), revealArt); }
function revealArt() {
  const it = IT();
  for (const [id, v] of Object.entries(H.ans)) { const o = it.opts[v]; if (!o) continue; if (o.real) { right(id, 500); give(it.artist, 250); stat(it.artist, "artist"); } else { wrong(id); o.by.forEach(a => { if (a !== id) { give(a, 250); stat(a, "fool"); } }); } }
  setPhase("art_r", 11000, nextItem);
}
function revealQuip() {
  const it = IT(), votes = [[], []];
  for (const [id, v] of Object.entries(H.ans)) votes[v].push(id);
  const tot = votes[0].length + votes[1].length;
  it.votes = votes; it.lol = -1;
  [0, 1].forEach(i => { give(it.by[i], votes[i].length * 100); stat(it.by[i], "laugh", votes[i].length); if (votes[i].length > votes[1 - i].length) give(it.by[i], 100); if (tot > 1 && votes[i].length === tot) { give(it.by[i], 250); it.lol = i; } });
  setPhase("quip_r", 8000, nextItem);
}
function wavePts(d) { return d <= 5 ? 400 : d <= 12 ? 250 : d <= 20 ? 100 : 0; }
function revealWave() {
  const it = IT(), g = Object.entries(H.ans); let sum = 0;
  g.forEach(([id, v]) => { const p = wavePts(Math.abs(v - it.tgt)); sum += p; give(id, p); stat(id, "mind", p); });
  if (g.length) give(it.psy, Math.round(sum / g.length * 0.75));
  it.guesses = g;
  setPhase("wave_r", 9000, nextItem);
}
function revealFake() {
  const it = IT(), cnt = {};
  Object.values(H.ans).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
  const max = Math.max(0, ...Object.values(cnt));
  it.caught = max > 0 && cnt[it.fk] === max; it.votes = { ...H.ans };
  for (const [id, t] of Object.entries(H.ans)) if (t === it.fk && id !== it.fk) { give(id, 300); stat(id, "detective"); }
  if (!it.caught) { give(it.fk, 600); stat(it.fk, "sneak"); }
  setPhase("fake_r", 10000, nextItem);
}
function revealCount() {
  const it = IT(), a = Object.entries(H.ans);
  it.yes = a.filter(([, x]) => x.y).length; it.tot = a.length; it.guesses = a.map(([id, x]) => [id, x.g]);
  a.forEach(([id, x]) => { const d = Math.abs(x.g - it.yes); if (d === 0) right(id, 400); else { wrong(id); if (d === 1) give(id, 150); } });
  setPhase("count_r", 8000, nextItem);
}
function revealSplit() {
  const it = IT(), v = Object.values(H.ans);
  it.yes = v.filter(x => x).length; it.no = v.length - it.yes;
  if (v.length) give(it.by, Math.round(600 * (1 - Math.abs(it.yes - it.no) / v.length)));
  setPhase("split_r", 7000, nextItem);
}
function revealReact() {
  clearTimeout(H.goT); const it = IT(), ok = Object.entries(H.ans).filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);
  it.res = ok; it.early = Object.keys(H.ans).filter(id => H.ans[id] === -1);
  ok.forEach(([id], i) => give(id, [400, 250, 150][i] || 75));
  setPhase("react_r", 7000, nextItem);
}
const GOAL = 60;
function onTap(id, n) {
  if (!(n >= 0 && n < 10000) || H.fin.includes(id)) return;
  H.taps[id] = Math.max(H.taps[id] || 0, Math.min(n, GOAL));
  if (H.taps[id] >= GOAL) { H.fin.push(id); SND.pop(); if (elig().length === 0) early(); }
  if (!H.raceRaf) H.raceRaf = requestAnimationFrame(() => { H.raceRaf = 0; liveRace(); });
}
function revealRace() {
  const it = IT(), rest = active().filter(i => !H.fin.includes(i)).sort((a, b) => (H.taps[b] || 0) - (H.taps[a] || 0));
  it.rank = [...H.fin, ...rest]; it.taps = { ...H.taps };
  it.rank.forEach((id, i) => { give(id, [400, 250, 150][i] || 50); if (R().type === "tap") stat(id, "tap", it.taps[id] || 0); });
  setPhase(R().type + "_r", 8000, nextItem);
}
function revealStop() {
  const it = IT(); it.res = Object.entries(H.ans).map(([id, t]) => [id, t, Math.abs(t - it.tgt)]).sort((a, b) => a[2] - b[2]);
  it.res.forEach(([id, , d]) => { const p = d < 0.1 ? 400 : d < 0.25 ? 300 : d < 0.5 ? 200 : d < 1 ? 100 : 0; if (p) give(id, p); if (d < 0.25) stat(id, "clock"); });
  setPhase("stop_r", 8000, nextItem);
}
function revealLast() {
  const it = IT(), alive = active().filter(i => H.lives[i] > 0), lost = [];
  for (const id of alive) { if (H.ans[id] === it.c) right(id, 200); else { wrong(id); H.lives[id]--; lost.push(id); } }
  /* valt iedereen tegelijk af? Dan overleeft iedereen met 1 leven */
  it.saved = alive.length > 0 && alive.every(i => H.lives[i] <= 0);
  if (it.saved) alive.forEach(i => H.lives[i] = 1);
  it.lost = lost; it.dead = lost.filter(i => H.lives[i] <= 0);
  setPhase("last_r", 7000, nextItem);
}
function lastEnd(alive) {
  const r = R(); r.surv = alive.length ? alive : active().filter(i => H.lives[i] > 0);
  H.gain = {}; r.surv.forEach(id => { give(id, r.surv.length === 1 ? 1000 : 500); stat(id, "survivor"); });
  setPhase("last_end", 8000, () => { H.qi = r.items.length; nextItem(); });
}
const AWARDS = [
  { k: "brain", t: "Wandelende encyclopedie", d: n => `${n} keer het goede antwoord` },
  { k: "fast", t: "Snelste vinger", d: n => `reageerde in ${n} ms`, low: 1 },
  { k: "fool", t: "Grootste bluffer", d: n => `${n} keer iemand voor de gek gehouden` },
  { k: "laugh", t: "Grappigste van de avond", d: n => `${n} stemmen op grappen` },
  { k: "mind", t: "Gedachtelezer", d: n => `${n} punten met inschatten` },
  { k: "sneak", t: "Meesterfaker", d: n => `${n} keer onopgemerkt de Faker` },
  { k: "detective", t: "Detective", d: n => `${n} keer de Faker ontmaskerd` },
  { k: "artist", t: "Tekentalent", d: n => `${n} keer werd je tekening geraden` },
  { k: "tap", t: "Tikmonster", d: n => `${n} keer getikt` },
  { k: "clock", t: "Menselijke klok", d: n => `${n} keer bijna precies op tijd` },
  { k: "survivor", t: "Overlever", d: () => "bleef staan in Last Stand" },
  { k: "boom", t: "Pechvogel", d: n => `${n} keer ontploft met de bom` }
];
function calcAwards() {
  const out = [];
  for (const a of AWARDS) {
    let best = null, val = a.low ? Infinity : 0;
    for (const id of H.order) { const v = a.k === "fast" ? H.best[id] : (H.stats[id] || {})[a.k]; if (v && (a.low ? v < val : v > val)) { val = v; best = id; } }
    if (best) out.push({ ...a, id: best, v: val });
  }
  return out.slice(0, 7);
}
function onGuess(id, v) {
  const it = IT(); if (id === it.drawer || H.guessed[id] || !v) return;
  const name = H.players[id].name;
  if (same(v, it.word)) {
    const pts = 100 + Math.round(400 * Math.max(0, (H.endsAt - Date.now()) / H.dur));
    H.guessed[id] = pts; give(id, pts); give(it.drawer, 100); stat(it.drawer, "artist");
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
  const pc = document.getElementById("pclock"); if (pc && P.stopStart) { const e = Date.now() - P.stopStart; pc.textContent = e < 3000 ? (e / 1000).toFixed(2) : "?.??"; pc.classList.toggle("gone", e >= 3000); }
  if (H.net && ends) {
    const left = ends - Date.now(), sec = Math.ceil(left / 1000), ph = H.phase;
    if (ph === "potato") { const iv = left < 3000 ? 250 : left < 8000 ? 500 : 1000, b = Math.floor((Date.now() - H.t0) / iv); if (b !== H.lastSec) { H.lastSec = b; SND.tick(); } }
    else if (sec !== H.lastSec) { H.lastSec = sec; if (sec <= 5 && sec > 0 && !/_r$|intro|scores|awards|last_end|stop|react/.test(ph)) SND.tick(); }
    const sc = document.getElementById("sclock"); if (sc) { const e = Date.now() - H.t0; sc.textContent = e < 3000 ? (e / 1000).toFixed(2) : "?.??"; sc.classList.toggle("gone", e >= 3000); }
  }
  const ring = document.getElementById("ring"), num = document.getElementById("tnum");
  if (ends && dur) {
    const left = Math.max(0, ends - Date.now());
    if (ring) ring.style.strokeDashoffset = 276.5 * (1 - left / dur);
    if (num) num.textContent = Math.ceil(left / 1000);
    const cd = document.getElementById("cdown"); if (cd) cd.textContent = left > 0 ? Math.ceil(left / 1000) : "GO!";
  } else if (num) num.textContent = "";
  requestAnimationFrame(tick);
}
function statusHtml() { const done = doneMap(); return elig().map(id => av(H.players[id], done[id] !== undefined ? "ok" : "")).join(""); }
function rlabel() {
  const r = R(), it = IT(), list = r.items.filter(x => !x.write && !x.draw && x.step === undefined), i = list.indexOf(it);
  return `<div class="rlabel">${esc(MODES[r.type].t)}${r.type === "last" ? ` · vraag ${H.qi + 1}` : i >= 0 ? ` · ${i + 1} van ${list.length}` : ""}</div>`;
}
function live() {
  if (H.phase === "lobby") return liveLobby();
  const st = document.getElementById("status"); if (st) st.innerHTML = statusHtml();
  const lv = document.getElementById("lives"); if (lv) lv.innerHTML = livesHtml();
  const fd = document.getElementById("feed"); if (fd) fd.innerHTML = H.feed.map(f => `<div class="${f.hit ? "hit" : ""}">${esc(f.txt)}</div>`).join("") || `<div class="muted">Nog geen gokjes…</div>`;
}
function liveLobby() {
  const el = document.getElementById("players"); if (!el) return;
  const act = active();
  const chip = id => `<span class="chip ${act.includes(id) ? "" : "off"}">${av(H.players[id])}${esc(H.players[id].name)}</span>`;
  el.innerHTML = !H.order.length ? `<div class="muted" style="font-size:20px">Nog niemand… Scan de QR-code of ga naar de link.</div>`
    : H.cfg.teams ? TEAMS.slice(0, H.cfg.teams).map((t, i) => `<div class="tcol" style="--tc:${t.c}"><b>${t.n}</b><div class="players">${H.order.filter(id => H.players[id].tm === i).map(chip).join("")}</div></div>`).join("") + `<button class="lnk" id="tshuf" type="button">Teams husselen</button>`
    : H.order.map(chip).join("");
  const ts = document.getElementById("tshuf"); if (ts) ts.onclick = () => { assignTeams(true); liveLobby(); pubSoon(); };
  const n = document.getElementById("pcount"); if (n) n.textContent = act.length === 1 ? "1 speler" : act.length + " spelers";
  const sb = document.getElementById("startb"); if (sb) sb.disabled = act.length < 2;
  app.querySelectorAll(".rt").forEach(l => l.classList.toggle("few", act.length > 0 && act.length < MODES[l.dataset.m].min));
}
function renderHostBar() { const a = document.getElementById("sndb"), b = document.getElementById("musb"); if (a) a.textContent = "Geluid " + (H.cfg.snd ? "aan" : "uit"); if (b) b.textContent = "Muziek " + (H.cfg.mus ? "aan" : "uit"); }
function openSettings() {
  const old = document.getElementById("setm"); if (old) old.remove();
  const m = document.createElement("div"); m.id = "setm"; m.className = "modal";
  const draw = () => {
    m.innerHTML = `<div class="card sheet" role="dialog" aria-label="Instellingen"><h2 style="font-size:32px">Instellingen</h2>
      <div class="sgrid">
        <div><div class="b sl">Tijd per vraag</div><div class="seg">${SPEEDS.map(([v, l]) => `<button type="button" data-sp="${v}" class="${H.cfg.speed === v ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div><div class="b sl">Teams</div><div class="seg">${[[0, "Ieder voor zich"], [2, "2 teams"], [3, "3 teams"]].map(([v, l]) => `<button type="button" data-tm="${v}" class="${H.cfg.teams === v ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div><div class="b sl">Finale: punten ×3</div><div class="seg">${[[true, "Aan"], [false, "Uit"]].map(([v, l]) => `<button type="button" data-fi="${v}" class="${H.cfg.fin === v ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div><div class="b sl">Geluid / muziek</div><div class="seg"><button type="button" data-sn="1" class="${H.cfg.snd ? "on" : ""}">Geluid</button><button type="button" data-mu="1" class="${H.cfg.mus ? "on" : ""}">Muziek</button></div></div>
      </div>
      <div>${Object.keys(OPTS).map(k => `<div class="optrow ${H.rounds[k] ? "" : "dim"}"><div><b>${esc(MODES[k].t)}</b><div class="muted" style="font-size:14px">${esc(OPTS[k].l)}${H.rounds[k] ? "" : " · nu niet gekozen"}</div></div>
        <div class="stp"><button type="button" data-k="${k}" data-d="-1" aria-label="Minder" ${H.cfg[k] <= OPTS[k].min ? "disabled" : ""}>−</button><b>${H.cfg[k]}</b><button type="button" data-k="${k}" data-d="1" aria-label="Meer" ${H.cfg[k] >= OPTS[k].max ? "disabled" : ""}>+</button></div></div>`).join("")}</div>
      <div class="muted" style="font-size:14px">Bij Punchline, Fifty-Fifty en Art Bluff doet iedereen één keer mee per ronde.</div>
      <div class="muted b" id="sdur"></div>
      <div style="display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap"><button class="btn ghost" type="button" id="sreset">Standaard</button><button class="btn co" type="button" id="sdone">Klaar</button></div></div>`;
    syncPresets(); const d = document.getElementById("pdesc"), sd = m.querySelector("#sdur"); if (d && sd) sd.textContent = d.textContent;
    m.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { H.cfg.speed = +b.dataset.sp; draw(); });
    m.querySelectorAll("[data-tm]").forEach(b => b.onclick = () => { H.cfg.teams = +b.dataset.tm; assignTeams(true); liveLobby(); pubSoon(); draw(); });
    m.querySelectorAll("[data-fi]").forEach(b => b.onclick = () => { H.cfg.fin = b.dataset.fi === "true"; draw(); });
    m.querySelectorAll("[data-sn]").forEach(b => b.onclick = () => { H.cfg.snd = SND.on = !H.cfg.snd; SND.init(); SND.ding(); draw(); renderHostBar(); });
    m.querySelectorAll("[data-mu]").forEach(b => b.onclick = () => { H.cfg.mus = !H.cfg.mus; SND.init(); SND.music(H.cfg.mus); draw(); renderHostBar(); });
    m.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { const k = b.dataset.k; H.cfg[k] = Math.min(OPTS[k].max, Math.max(OPTS[k].min, H.cfg[k] + +b.dataset.d)); draw(); });
    m.querySelector("#sreset").onclick = () => { for (const k in OPTS) H.cfg[k] = OPTS[k].def; H.cfg.speed = 1; H.cfg.fin = true; draw(); };
    m.querySelector("#sdone").onclick = () => m.remove();
  };
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m); draw(); m.querySelector("#sdone").focus();
}
const HEART = `<svg class="heart" viewBox="0 0 24 22"><path d="M12 21 2.5 11.5A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 9.5 7.5Z" fill="#ff5a5f" stroke="#14213d" stroke-width="2"/></svg>`;
const BOMB = `<svg class="bomb" viewBox="0 0 200 200" aria-hidden="true"><circle cx="92" cy="118" r="70" fill="#14213d"/><circle cx="68" cy="94" r="16" fill="#fff" opacity=".25"/><rect x="120" y="40" width="34" height="26" rx="6" fill="#3a3f5c" transform="rotate(35 137 53)"/><path d="M150 42 Q166 18 186 26" fill="none" stroke="#8d6e63" stroke-width="6" stroke-linecap="round"/><g class="spark"><circle cx="188" cy="24" r="10" fill="#ffd23f"/><circle cx="188" cy="24" r="5" fill="#ff5a5f"/></g></svg>`;
function raceHtml() {
  const ids = active(), shake = H.phase === "shake";
  return ids.map(id => { const p = Math.min(1, (H.taps[id] || 0) / GOAL), f = H.fin.includes(id);
    return shake
      ? `<div class="bal ${f ? "popd" : ""}"><div class="bb" style="--s:${0.35 + p * 0.85};background:${esc(P_(id).color)}">${f ? "POP!" : ""}</div><div class="bs"></div>${av(P_(id))}</div>`
      : `<div class="lane"><div class="trk"><div class="runner" style="left:${p * 88}%">${av(P_(id))}</div><div class="flag"></div></div><b>${f ? "finish!" : Math.round(p * 100) + "%"}</b></div>`; }).join("");
}
function livesHtml() {
  const it = IT() || {}, rev = H.phase === "last_r";
  return H.order.filter(id => H.lives[id] !== undefined).map(id => `<div class="lv ${H.lives[id] > 0 ? "" : "ghost"} ${rev && (it.lost || []).includes(id) ? "hit" : ""} ${!rev && H.ans[id] !== undefined ? "ok" : ""}">${av(P_(id))}<span>${H.lives[id] > 0 ? HEART.repeat(H.lives[id]) : "geest"}</span>${(it.sp || {})[id] ? `<em>BOE!</em>` : ""}</div>`).join("");
}
function liveRace() { const el = document.getElementById("race"); if (el) el.innerHTML = raceHtml(); live(); }
function teamBar() {
  const ts = teamScores(), max = Math.max(1, ...ts.map(t => t.score));
  return `<div class="bars">${ts.map(t => `<div class="bar"><span class="tdot" style="background:${t.c}"></span><div class="tr"><div class="fl" data-w="${t.score / max * 100}" style="background:${t.c}"></div></div><span>${esc(t.n)} · ${t.score}</span></div>`).join("")}</div>`;
}
function qrSvg(text) { try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { return ""; } }
function board(showGain) {
  const ids = H.order.slice().sort((a, b) => H.players[b].score - H.players[a].score);
  return `<div class="board">${ids.map((id, i) => { const p = H.players[id], g = H.rgain[id];
    return `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * 90}ms"><span class="pos">${i + 1}</span>${av(p)}<span>${esc(p.name)}</span><span>${showGain && g ? `<span class="gain">+${g}</span>` : ""}<span class="pts">${p.score}</span></span></div>`; }).join("")}</div>`;
}
function gainsLine() {
  const ids = Object.keys(H.gain).filter(id => H.gain[id] > 0).sort((a, b) => H.gain[b] - H.gain[a]);
  return `<div class="gains">${ids.length ? ids.map(id => `<span class="chip" style="font-size:18px">${av(P_(id))}+${H.gain[id]}${H.sn[id] ? `<span class="streak">${H.sn[id]} op rij!</span>` : ""}</span>`).join("") : `<span class="muted" style="font-size:20px">Niemand scoorde deze keer.</span>`}</div>`;
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
        <div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><h3 style="font-size:24px">Kies een modus</h3><button class="lnk" id="setb" type="button">Instellingen</button></div>
        <div class="presets">${Object.keys(PRESETS).map(p => `<button class="preset" type="button" data-p="${p}">${esc(PRESETS[p].t)}</button>`).join("")}<button class="preset" type="button" data-p="custom">Custom</button></div>
        <div class="muted" id="pdesc" style="margin:8px 0 10px"></div>
        <details class="rdet" ${H.rdOpen ? "open" : ""}><summary>Rondes zelf kiezen</summary><div class="rounds">${Object.keys(MODES).map(k => `<label class="rt" data-m="${k}"><input type="checkbox" data-r="${k}" ${H.rounds[k] ? "checked" : ""}><span>${esc(MODES[k].t)}${MODES[k].min > 2 ? `<small>vanaf ${MODES[k].min} spelers</small>` : ""}</span></label>`).join("")}</div></details></div>
      </div></div>`;
  } else if (ph === "intro") {
    stage = `<div class="qwrap intro"><div class="rlabel">${H.mult > 1 ? "Laatste ronde" : `Ronde ${H.ri + 1} van ${H.plan.length}`}</div>${H.mult > 1 ? `<div class="finale">FINALE · alle punten ×3!</div>` : ""}<div class="disp">${esc(MODES[r.type].t)}</div><p>${esc(MODES[r.type].d)}</p></div>`;
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
  } else if (ph === "react") {
    stage = `<div class="qwrap">${rlabel()}<div class="rpan ${H.go ? "go" : ""}" id="rpan">${H.go ? "NU!" : "Wacht…"}</div><div class="muted big">Tik op je telefoon zodra die groen wordt. Te vroeg = af!</div><div class="status" id="status"></div></div>`;
  } else if (ph === "react_r") {
    stage = `<div class="qwrap">${rlabel()}${bigQ("Reactietijden", 1)}<div class="board">${it.res.map(([id, ms], i) => `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * 120}ms"><span class="pos">${i + 1}</span>${av(P_(id))}<span>${esc(P_(id).name)}</span><span class="pts">${ms} ms</span></div>`).join("")}</div>
      ${it.early.length ? `<div class="big b">Te vroeg: ${it.early.map(id => esc(P_(id).name)).join(", ")}</div>` : ""}${gainsLine()}</div>`;
  } else if (ph === "tap_c" || ph === "shake_c") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(ph === "tap_c" ? "Vinger klaar…" : "Pak je telefoon stevig vast…")}${ph === "shake_c" ? `<div class="muted big">Op een iPhone: tik eerst op "Sensor aanzetten" op je telefoon.</div>` : ""}<div class="cdown" id="cdown"></div></div>`;
  } else if (ph === "tap" || ph === "shake") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(ph === "tap" ? "TIKKEN!" : "SCHUDDEN!", 1)}<div class="race ${ph}" id="race">${raceHtml()}</div>${waitRow()}</div>`;
  } else if (ph === "tap_r" || ph === "shake_r") {
    stage = `<div class="qwrap">${rlabel()}${bigQ("Uitslag", 1)}<div class="board">${it.rank.map((id, i) => `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * 120}ms"><span class="pos">${i + 1}</span>${av(P_(id))}<span>${esc(P_(id).name)}</span><span class="pts">${H.fin.includes(id) ? "finish!" : Math.round((it.taps[id] || 0) / GOAL * 100) + "%"}</span></div>`).join("")}</div>${gainsLine()}</div>`;
  } else if (ph === "stop") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(`Stop op precies <span style="color:var(--co)">${it.tgt},00</span> seconden`)}<div class="sclock" id="sclock">0.00</div><div class="muted big">Na 3 seconden verdwijnt de klok. Tel in je hoofd en druk op STOP!</div><div class="status" id="status"></div></div>`;
  } else if (ph === "stop_r") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(`Doel: ${it.tgt},00 seconden`, 1)}<div class="board">${it.res.map(([id, t, d], i) => `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * 120}ms"><span class="pos">${i + 1}</span>${av(P_(id))}<span>${esc(P_(id).name)}</span><span class="pts">${t.toFixed(2)} s <small style="font-size:.6em">(${d < 0.005 ? "perfect!" : (t > it.tgt ? "+" : "−") + d.toFixed(2)})</small></span></div>`).join("")}</div>${gainsLine()}</div>`;
  } else if (ph === "potato" || ph === "potato_r") {
    const hp = P_(it.holder), boom = ph === "potato_r";
    stage = `<div class="qwrap">${rlabel()}<div class="pcat">Categorie: <b>${esc(it.cat)}</b></div>
      <div class="bombwrap ${boom ? "boom" : ""}">${boom ? `<div class="kaboom">BOEM!</div>` : BOMB}<div class="holder">${av(hp)}<b>${esc(hp.name)}</b> ${boom ? "had de bom…" : "heeft de bom!"}</div></div>
      ${boom ? gainsLine() : `<div class="gains">${(it.used || []).slice(0, 8).map(u => `<span class="chip" style="font-size:17px">${av(P_(u.by))}${esc(u.w)}</span>`).join("")}</div>`}</div>`;
  } else if (ph === "last_q" || ph === "last_r") {
    const rev = ph === "last_r";
    stage = `<div class="qwrap">${rlabel()}${bigQ(esc(it.q), 1)}
      <div class="opts">${it.opts.map((o, i) => `<div class="opt o${i} ${rev && i !== it.c ? "dim" : ""}">${SHAPES[i]}<span>${esc(o)}</span></div>`).join("")}</div>
      <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;justify-content:center">${rev ? "" : timerHtml()}<div class="lives" id="lives">${livesHtml()}</div></div>
      ${rev ? (it.saved ? `<div class="big b">Iedereen fout! Niemand valt af, jullie krijgen allemaal nog één leven.</div>` : it.dead.length ? `<div class="big b">Uitgeschakeld: ${it.dead.map(id => esc(P_(id).name)).join(", ")}</div>` : "") : ""}</div>`;
  } else if (ph === "last_end") {
    stage = `<div class="qwrap">${rlabel()}${bigQ(r.surv.length === 1 ? esc(P_(r.surv[0]).name) + " is de laatste overlever!" : "Overlevers!")}<div class="gains">${r.surv.map(id => `<span class="chip" style="font-size:24px">${av(P_(id))}${esc(P_(id).name)}</span>`).join("")}</div>${gainsLine()}</div>`;
  } else if (ph === "awards") {
    stage = `<div class="qwrap"><div class="rlabel">Prijsuitreiking</div>${bigQ("De awards van vanavond")}<div class="awards">${H.awards.map((a, i) => `<div class="award" style="animation-delay:${0.6 + i * 2.6}s">${av(P_(a.id))}<div><b>${esc(a.t)}</b><div>${esc(P_(a.id).name)}</div><small>${esc(a.d(a.v))}</small></div></div>`).join("")}</div></div>`;
  } else if (ph === "scores") {
    stage = `<div class="qwrap"><div class="rlabel">Tussenstand</div>${bigQ(H.ri + 1 < H.plan.length ? "Na ronde " + (H.ri + 1) : "Bijna klaar…")}${H.cfg.teams ? teamBar() : ""}${board(true)}</div>`;
  } else if (ph === "end") {
    const ids = H.order.slice().sort((a, b) => H.players[b].score - H.players[a].score), top = [ids[1], ids[0], ids[2]];
    const ts = H.cfg.teams ? teamScores() : null, hgt = ts ? [80, 120, 60] : [150, 220, 110];
    stage = `<div class="qwrap"><div class="rlabel">Einde</div>${bigQ(ts ? `<span style="color:${ts[0].c}">${esc(ts[0].n)}</span> wint Kabaal!` : esc(P_(ids[0]).name) + " wint Kabaal!")}${ts ? teamBar() : ""}
      <div class="podium">${top.map((id, i) => id ? `<div class="pod">${av(P_(id))}<span>${esc(P_(id).name)}</span><span>${P_(id).score}</span><div class="blk" style="height:${hgt[i]}px">${[2, 1, 3][i]}</div></div>` : "").join("")}</div></div>`;
  }
  const inGame = ph !== "lobby" && ph !== "end";
  app.innerHTML = `<div class="host">
    <div class="hbar"><span class="logo">Kabaal!</span><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="pill pbtn" id="sndb" type="button">Geluid ${H.cfg.snd ? "aan" : "uit"}</button><button class="pill pbtn" id="musb" type="button">Muziek ${H.cfg.mus ? "aan" : "uit"}</button><span class="pill">Code ${esc(H.code)}</span>${inGame && r ? `<span class="pill">Ronde ${H.ri + 1}/${H.plan.length}</span>` : ""}</div></div>
    <div class="hstage">${stage}</div>
    <div class="hfoot">${ph === "lobby" ? `<span class="muted">Tip: 3 tot 8 spelers is het leukst.</span><button class="btn co" id="startb">Start het spel</button>`
      : ph === "end" ? `<button class="btn co" id="again">Nog een keer</button>`
      : `<button class="btn ghost" id="skipb">Overslaan</button>`}</div></div>`;
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.addEventListener("click", f); };
  on("startb", startGame); on("skipb", skip);
  on("sndb", () => { H.cfg.snd = SND.on = !H.cfg.snd; SND.init(); store.set("kabaal:cfg", JSON.stringify(H.cfg)); renderHost(); });
  on("musb", () => { H.cfg.mus = !H.cfg.mus; SND.init(); SND.music(H.cfg.mus); store.set("kabaal:cfg", JSON.stringify(H.cfg)); renderHost(); });
  const rd = app.querySelector(".rdet"); if (rd) rd.addEventListener("toggle", () => { H.rdOpen = rd.open; });
  on("again", () => { H.plan = []; H.ri = -1; H.qi = -1; H.order.forEach(id => H.players[id].score = 0); setPhase("lobby", 0, null); });
  app.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.p === "custom") { toast("Vink hieronder zelf de rondes aan die je wilt spelen."); return; }
    Object.keys(MODES).forEach(k => H.rounds[k] = PRESETS[b.dataset.p].r.includes(k)); syncPresets();
  }));
  app.querySelectorAll("[data-r]").forEach(c => c.addEventListener("change", () => { H.rounds[c.dataset.r] = c.checked; syncPresets(); }));
  if (ph === "lobby") syncPresets();
  on("setb", openSettings);
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
  P.a = ANK.includes(store.get("kabaal:a")) ? store.get("kabaal:a") : pick(ANK); P.x = ACK.includes(store.get("kabaal:x")) ? store.get("kabaal:x") : "none";
  const hello = P.hello = () => P.net.send("join", { id: P.id, name: P.name, a: P.a, x: P.x });
  hello();
  addEventListener("devicemotion", onMotion);
  setInterval(() => { if (!P.st || !P.st.pl.some(p => p[0] === P.id)) hello(); else P.net.send("ping", { id: P.id }); }, 4000);
  setTimeout(() => { if (!P.st) app.innerHTML = `<div class="start"><div class="box card" style="padding:24px;display:grid;gap:12px"><h2>Geen spel gevonden</h2><p>Er staat geen spel open met code <b>${esc(code)}</b>. Klopt de code op het grote scherm?</p><button class="btn" onclick="location.href=location.pathname${LOCAL ? "+'?local=1'" : ""}">Andere code</button></div></div>`; }, 7000);
  try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
  requestAnimationFrame(tick);
}
const me = () => { const p = P.st && P.st.pl.find(x => x[0] === P.id); return p ? PL(p) : { name: P.name, color: "#999", score: 0, a: P.a, x: P.x }; };
const pl = id => { const p = P.st.pl.find(x => x[0] === id); return p ? PL(p) : { id, name: "?", color: "#999", score: 0 }; };

function phoneMsg(t, d) {
  if (!d) return;
  if (t === "s") {
    const fresh = !P.st || d.k !== P.k;
    const wasIn = P.st && P.st.pl.some(p => p[0] === P.id);
    P.st = d;
    const le = Date.now() + d.left;
    if (fresh || Math.abs(le - P.endsAt) > 1200) P.endsAt = d.left ? le : 0;
    P.dur = d.dur;
    if (fresh) { if (P.k && P.k.split(":")[0] === "bluff_w" && d.ph !== "bluff_w") P.fake = ""; P.k = d.k; P.cy = undefined; onFresh(d); renderPhone(); }
    else {
      updPhone(); if (!wasIn && P.st.pl.some(p => p[0] === P.id)) renderPhone();
      if (d.ph === "potato" && d.it.holder !== P.holder) { P.holder = d.it.holder; if (P.holder === P.id && navigator.vibrate) navigator.vibrate(120); renderPhone(); }
      else if (d.ph === "potato") { const ul = document.getElementById("pused"); if (ul) ul.innerHTML = usedHtml(d.it); }
      if (d.ph === "last_q") checkBoo();
    }
  }
  if (t === "nope" && d.id === P.id) { delete P.sent[P.k]; toast("Haha, dat is toevallig het échte antwoord! Verzin iets anders.", 3500); renderPhone(); }
  if (t === "hit" && d.id === P.id) { P.sent[P.k] = "hit"; P.hitPts = d.pts; renderPhone(); }
  if (t === "task" && d.id === P.id) { P.task = d; if (d.k === P.k) renderPhone(); }
  if (t === "nope2" && d.id === P.id) toast(d.msg || "Probeer iets anders.");
}
/* bij elke nieuwe fase: timers en tellers van de vorige fase stoppen en nieuwe starten */
function onFresh(d) {
  clearTimeout(P.goT); clearInterval(P.tapIv); P.goNow = false; P.n = 0; P.en = 0; P.stopStart = 0; P.holder = d.it && d.it.holder;
  if (d.ph === "react") P.goT = setTimeout(() => { P.goNow = true; P.t0 = performance.now(); const b = document.getElementById("rbtn"); if (b) { b.className = "rbtn go"; b.textContent = "TIK!"; } if (navigator.vibrate) navigator.vibrate(60); }, d.it.goIn);
  if (d.ph === "stop") P.stopStart = Date.now() - d.it.el;
  if (d.ph === "tap" || d.ph === "shake") { let last = -1; const k = d.k; P.tapIv = setInterval(() => { if (P.k !== k) return clearInterval(P.tapIv); if (P.n !== last) { last = P.n; P.net.send("tap", { id: P.id, k, n: P.n }); } }, 150); }
}
function onMotion(e) {
  if (!P.st || P.st.ph !== "shake") return;
  const a = e.accelerationIncludingGravity || e.acceleration; if (!a || a.x === null) return;
  const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0), d = Math.abs(m - (P.lastMag || m)); P.lastMag = m;
  if (d > 3) { P.en += d; P.n = Math.min(60, Math.round(P.en / 40)); updShake(); }
}
function updShake() { const b = document.getElementById("shp"); if (b) b.style.setProperty("--p", Math.min(1, P.n / 60)); }
function checkBoo() {
  const st = P.st; if (!st || st.ph !== "last_q" || !(st.it.sp || {})[P.id] || (P.boo = P.boo || {})[P.k]) return;
  P.boo[P.k] = 1; const o = document.createElement("div"); o.className = "boo"; o.innerHTML = `<b>BOE!</b><span>${esc(pl(st.it.sp[P.id]).name)} laat je schrikken</span>`;
  document.body.appendChild(o); if (navigator.vibrate) navigator.vibrate([80, 40, 80]); setTimeout(() => o.remove(), 2500);
}
const usedHtml = it => (it.used || []).map(w => `<span class="chip" style="font-size:15px;padding:4px 12px">${esc(w)}</span>`).join("");
function send(v) { P.sent[P.k] = true; P.net.send("ans", { id: P.id, k: P.k, v }); renderPhone(); }
function updPhone() {
  const sc = document.getElementById("psc"); if (sc) sc.textContent = me().score;
  const st = P.st, list = document.getElementById("plist");
  if (list && st.ph === "lobby") list.innerHTML = st.pl.map(p => `<span class="chip" style="font-size:16px">${av(PL(p))}${esc(p[1])}</span>`).join("");
}
const wait = (h, sub) => `<div class="pmsg"><h2>${h}</h2>${sub ? `<div class="muted">${sub}</div>` : ""}</div>`;
const look = wait("Kijk naar het scherm!", "");
function gainMsg() { const g = P.st.g[P.id], sn = (P.st.sn || {})[P.id]; return g ? `<div class="pmsg flash"><h2 style="color:#1b8a7f">+${g} punten!</h2>${sn ? `<div class="streak big">${sn} op rij! Bonus erbij</div>` : ""}</div>` : `<div class="pmsg"><h2>Geen punten deze keer</h2><div class="muted">Volgende keer beter!</div></div>`; }
const inputForm = (id, ph, btn, val = "", max = 40) => `<form id="${id}" class="pform"><input class="field" maxlength="${max}" placeholder="${esc(ph)}" autocomplete="off" value="${esc(val)}"><button class="btn co">${btn}</button></form>`;
const padHtml = (btn) => `<canvas id="pcv" class="cv"></canvas><div class="tools">${["#14213d", "#ff5a5f", "#3a6ff7", "#2ec4b6", "#f39c12", "#ffffff"].map(c => `<button class="sw ${c === (P.col || "#14213d") ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="${c === "#ffffff" ? "Gum" : "Kleur"}"></button>`).join("")}<button class="btn ghost sm" id="thick">${P.thick ? "Dun" : "Dik"}</button><button class="btn ghost sm" id="clr" style="margin-left:auto">Wissen</button></div>${btn ? `<button class="btn co" id="padok">${btn}</button>` : ""}`;

function renderPhone() {
  const st = P.st; if (!st) return;
  const m = me(), it = st.it, ph = st.ph, sent = P.sent[P.k];
  const joined = st.pl.some(p => p[0] === P.id), mine = st.el.includes(P.id);
  PAINT = [];
  let body = "";
  if (!joined) body = wait("Even geduld…", "Je wordt aangemeld.");
  else if (ph === "lobby") body = `<div class="pmsg" style="padding:12px 0 0"><h2>Je zit erin, ${esc(m.name)}!</h2><div class="muted">Kies je dier en accessoire terwijl je wacht. Het spel begint zodra de host op start drukt.</div></div>
    <div class="anpick">${ANIMALS.map(a => `<button class="anb ${P.a === a.k ? "on" : ""}" data-an="${a.k}" aria-label="${esc(a.n)}" style="background:${esc(m.color)}">${animalSvg(a.k, P.x)}</button>`).join("")}</div>
    <div class="accpick">${ACCS.map(a => `<button class="accb ${P.x === a.k ? "on" : ""}" data-ac="${a.k}">${esc(a.n)}</button>`).join("")}</div>
    <div class="players" id="plist" style="justify-content:center;min-height:0"></div>`;
  else if (ph === "intro") body = `<div class="pmsg"><div class="rlabel">${st.mult > 1 ? "Laatste ronde" : "Nieuwe ronde"}</div>${st.mult > 1 ? `<div class="finale sm">FINALE · punten ×3!</div>` : ""}<h2 style="font-size:40px">${esc(MODES[it.type].t)}</h2><div style="font-weight:700">${esc(MODES[it.type].d)}</div></div>`;
  else if (ph === "quiz") body = sent ? wait("Antwoord staat vast!", "Wachten op de rest…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="popts">${it.opts.map((o, i) => `<button class="opt o${i}" data-a="${i}">${SHAPES[i]}<span>${esc(o)}</span></button>`).join("")}</div>`;
  else if (ph === "quiz_r") body = `<div class="pmsg"><div class="muted">Het goede antwoord was</div><h2>${esc(it.opts[it.c])}</h2></div>${gainMsg()}`;
  else if (ph === "who") body = sent ? wait("Stem uitgebracht!", "Benieuwd wat de rest vindt…") :
    `<div class="pq disp">${esc(it.q)}</div><div class="popts">${st.pl.map(p => `<button class="pick" data-a="${esc(p[0])}">${av(PL(p))}${esc(p[1])}${p[0] === P.id ? " (jij)" : ""}</button>`).join("")}</div>`;
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
  else if (ph === "react") body = sent ? wait(P.rtTxt || "", "Wachten op de rest…") : `<button class="rbtn ${P.goNow ? "go" : ""}" id="rbtn">${P.goNow ? "TIK!" : "Wacht op groen…"}</button>`;
  else if (ph === "tap_c" || ph === "shake_c") body = `<div class="pmsg"><h2>${ph === "tap_c" ? "Maak je vinger klaar!" : "Hou je telefoon stevig vast!"}</h2><div class="cdown" id="cdown"></div>${ph === "shake_c" && window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function" && !P.motionOK ? `<button class="btn co" id="motb">Sensor aanzetten</button>` : ""}</div>`;
  else if (ph === "tap") body = !mine ? wait("Finish!", "Wachten op de rest…") : `<button class="tapb" id="tapb"><b id="tapn">${P.n || 0}</b><span>TIK TIK TIK!</span></button>`;
  else if (ph === "shake") body = !mine ? wait("POP!", "Je ballon is geknapt!") : `<div class="pmsg"><h2>SCHUDDEN!</h2><div class="shbal" id="shp" style="--p:0;background:${esc(m.color)}"></div><button class="btn ghost" id="shtap">Werkt schudden niet? Tik dan hier</button></div>`;
  else if (ph === "stop") body = sent ? wait(P.stopTxt || "", "Kijk straks wie het dichtst bij zat…") : `<div class="pmsg"><div class="muted">Stop op precies</div><h2 style="font-size:44px">${it.tgt},00 sec</h2><div class="sclock sm" id="pclock">0.00</div></div><button class="rbtn stopb" id="stopb">STOP</button>`;
  else if (ph === "potato") {
    const hold = it.holder === P.id;
    body = hold ? `<div class="pmsg fk"><h2>JIJ HEBT DE BOM!</h2><div>Typ snel iets uit de categorie om hem door te geven:</div><div class="b" style="font-size:22px">${esc(it.cat)}</div></div>${inputForm("pf", "Typ en druk op Enter", "Doorgeven!", "", 30)}`
      : `<div class="pmsg"><h2>${esc(pl(it.holder).name)} heeft de bom!</h2><div class="muted">Categorie: <b>${esc(it.cat)}</b>. Bedenk alvast iets, voor als hij bij jou komt…</div></div>`;
    body += `<div class="gains" id="pused">${usedHtml(it)}</div>`;
  }
  else if (ph === "potato_r") body = (it.holder === P.id ? wait("BOEM!", "Jij had de bom toen hij ontplofte…") : wait("Gered!", esc(pl(it.holder).name) + " had de bom.")) + gainMsg();
  else if (ph === "last_q") {
    const alive = (it.lives || {})[P.id] > 0;
    body = alive ? (sent ? wait("Antwoord staat vast!", "Duimen maar…") : `<div class="plives">${HEART.repeat(it.lives[P.id])}</div><div class="pq disp">${esc(it.q)}</div><div class="popts">${it.opts.map((o, i) => `<button class="opt o${i}" data-a="${i}">${SHAPES[i]}<span>${esc(o)}</span></button>`).join("")}</div>`)
      : P.spooked === P.k ? wait("Boe!", "Je hebt iemand laten schrikken.") : `<div class="pmsg"><h2>Je bent een geest!</h2><div class="muted">Kies wie je laat schrikken. Diegene ziet even niks op zijn telefoon.</div></div><div class="popts">${st.pl.filter(p => (it.lives || {})[p[0]] > 0).map(p => `<button class="pick" data-spk="${esc(p[0])}">${av(PL(p))}${esc(p[1])}</button>`).join("")}</div>`;
  }
  else if (ph === "last_r") { const alive = (it.lives || {})[P.id] > 0; body = (it.dead.includes(P.id) ? wait("Uitgeschakeld!", "Je bent nu een geest. Je mag de rest laten schrikken.") : alive ? `<div class="pmsg"><div class="plives">${HEART.repeat(it.lives[P.id])}</div></div>` : wait("Geest", "Je doet nog mee als geest.")) + gainMsg(); }
  else if (ph === "last_end") body = ((it.surv || []).includes(P.id) ? wait("Je hebt het overleefd!", "") : look) + gainMsg();
  else if (ph === "react_r" || ph === "tap_r" || ph === "shake_r" || ph === "stop_r") body = look + gainMsg();
  else if (ph === "awards") { const mine2 = (it.aw || []).filter(a => a[0] === P.id); body = mine2.length ? `<div class="pmsg"><div class="muted">Jij wint</div>${mine2.map(a => `<div class="award me"><div><b>${esc(a[1])}</b><small>${esc(a[2])}</small></div></div>`).join("")}</div>` : wait("Prijsuitreiking!", "Kijk naar het scherm wie wat wint."); }
  else if (ph === "scores" || ph === "end") {
    const sorted = st.pl.slice().sort((a, b) => b[3] - a[3]), pos = sorted.findIndex(p => p[0] === P.id) + 1;
    body = `<div class="pmsg"><div class="muted">${ph === "end" ? "Eindstand" : "Tussenstand"}</div><h2 style="font-size:64px">#${pos}</h2><div style="font-weight:900;font-size:22px">${m.score} punten</div>${ph === "end" ? `<div class="muted">${pos === 1 ? "Kampioen! Gefeliciteerd!" : "Nog een potje? De host kan opnieuw starten."}</div>` : ""}</div>`;
  }
  const timed = st.left > 0 && !st.hide && !["intro", "scores", "awards", "last_end"].includes(ph) && !ph.endsWith("_r");
  const emo = joined && !body.includes('id="pcv"') && !["react", "tap", "shake", "tap_c", "shake_c", "stop"].includes(ph);
  const tm = st.teams && m.tm >= 0 ? TEAMS[m.tm] : null;
  app.innerHTML = `<div class="phone ${emo ? "hasemo" : ""}"><div class="ptop">${av(m)}<span>${esc(m.name)}</span>${tm ? `<span class="tbadge" style="background:${tm.c}">${esc(tm.n.replace("Team ", ""))}</span>` : ""}${timed ? `<span class="tm" id="tnum"></span>` : ""}<span class="sc" id="psc">${m.score}</span></div><div class="pbody">${body}</div></div>
    ${emo ? `<div class="emobar">${EMOJI.map(e => `<button class="emob" data-e="${e}" aria-label="Reactie ${e}">${e}</button>`).join("")}</div>` : ""}`;
  app.querySelectorAll("[data-e]").forEach(b => b.addEventListener("click", () => { P.net.send("emo", { id: P.id, e: b.dataset.e }); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }));
  app.querySelectorAll("[data-an]").forEach(b => b.addEventListener("click", () => { P.a = b.dataset.an; store.set("kabaal:a", P.a); P.hello(); renderPhone(); }));
  app.querySelectorAll("[data-ac]").forEach(b => b.addEventListener("click", () => { P.x = b.dataset.ac; store.set("kabaal:x", P.x); P.hello(); renderPhone(); }));
  app.querySelectorAll("[data-spk]").forEach(b => b.addEventListener("click", () => { P.spooked = P.k; P.net.send("ans", { id: P.id, k: P.k, v: { spook: b.dataset.spk } }); renderPhone(); }));
  const rb = document.getElementById("rbtn");
  if (rb) rb.addEventListener("pointerdown", e => { e.preventDefault(); if (!P.goNow) { P.rtTxt = "Te vroeg!"; clearTimeout(P.goT); send({ early: 1 }); } else { const rt = Math.round(performance.now() - P.t0); P.rtTxt = rt + " ms"; send({ rt }); } });
  const tb = document.getElementById("tapb");
  if (tb) tb.addEventListener("pointerdown", e => { e.preventDefault(); P.n = Math.min(60, (P.n || 0) + 1); document.getElementById("tapn").textContent = P.n; tb.classList.remove("hit"); void tb.offsetWidth; tb.classList.add("hit"); });
  const sht = document.getElementById("shtap"); if (sht) sht.addEventListener("pointerdown", e => { e.preventDefault(); P.n = Math.min(60, (P.n || 0) + 1); updShake(); });
  updShake(); checkBoo();
  const mb = document.getElementById("motb");
  if (mb) mb.addEventListener("click", () => DeviceMotionEvent.requestPermission().then(r => { P.motionOK = r === "granted"; toast(P.motionOK ? "Sensor staat aan!" : "Geen toegang: tik straks dan maar heel snel."); renderPhone(); }).catch(() => toast("Sensor kon niet aan. Tik straks dan maar heel snel.")));
  const sb2 = document.getElementById("stopb");
  if (sb2) sb2.addEventListener("pointerdown", e => { e.preventDefault(); const t = (Date.now() - P.stopStart) / 1000; P.stopTxt = "Je stopte op " + t.toFixed(2) + " sec"; send(t); });
  const pf = document.getElementById("pf");
  if (pf) { const inp = pf.querySelector("input"); inp.focus(); pf.addEventListener("submit", e => { e.preventDefault(); const v = inp.value.trim(); if (v.length < 2) return; P.net.send("ans", { id: P.id, k: P.k, v }); inp.value = ""; }); }
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
