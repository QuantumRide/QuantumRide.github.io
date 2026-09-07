const ART = window.LM_ART || {
  mark: "assets/logo-mark.jpg",
  poster: "assets/poster-web.jpg",
  plaque: "assets/plaque-web.jpg"
};
const ALL = [...LM_SPOTS, ...LM_WORLD];
const byId = Object.fromEntries(ALL.map((s) => [s.id, s]));
const $ = (id) => document.getElementById(id);

const state = {
  tab: "forecast",
  spotId: localStorage.getItem("lm:spot") || LM_DEFAULT,
  atoll: null,
  packs: {},
  chat: ["Chair's warm. Ask swell, wind, when, or gear. Numbers sneak in as punchlines. I don't paddle."]
};

function spot() { return byId[state.spotId] || byId[LM_DEFAULT]; }

function setSpot(id, goForecast) {
  if (!byId[id]) return;
  state.spotId = id;
  localStorage.setItem("lm:spot", id);
  if (goForecast) state.tab = "forecast";
  load(id);
  render();
}

function setTab(tab) {
  state.tab = tab;
  render();
  if (tab === "map") setTimeout(drawMap, 60);
}

function pinColor(label) {
  if (label === "Epic") return "#5ee4a3";
  if (label === "Good") return "#3ee0f0";
  if (label === "Fair") return "#e8c47a";
  return "#8ba3b8";
}

async function load(id) {
  const s = byId[id];
  if (!s) return;
  try {
    const pack = await LM_FX.loadSpot(s, false);
    state.packs[id] = pack;
    render();
  } catch (err) {
    state.packs[id] = { error: err.message || "Live swell didn't land." };
    render();
  }
}

function take(s, c) {
  const h = c.waveH.toFixed(1) + "m";
  const p = c.period.toFixed(0) + "s";
  if (c.label === "Epic") return "They stamped Epic on " + s.name + ". " + h + " at " + p + ". I stamped your problem, my view.";
  if (c.label === "Good") return "Solid chalkboard at " + s.name + ": " + h + " @ " + p + ". I'd go if I went. I don't.";
  if (c.label === "Fair") return s.name + " is Fair — " + h + ". Fun if you're already wet. The chair is undefeated.";
  return s.name + " is sitting Poor. " + h + " of not-enough. This is my Super Bowl.";
}

function reply(text, s, c) {
  const q = text.toLowerCase();
  const n = c ? { h: c.waveH.toFixed(1) + "m", p: c.period.toFixed(0) + "s", k: c.windKts.toFixed(0) + " kts", q: c.label, dir: LM_FX.compass(c.windDir), swell: LM_FX.compass(c.swellDir) } : null;
  if (/gear|board|bring/.test(q)) return n ? "Gear for " + s.name + " at " + n.h + "? A board you trust. I pack the chair and Ray-Bans." : "Board you trust. I pack the chair.";
  if (/wind/.test(q)) return n ? "Wind from the chair: " + n.k + " " + n.dir + ". Umbrella ruffled." : "Wind is doing wind things.";
  if (/swell|wave|size|period|how's|how is|looking/.test(q)) return n ? s.name + " whispered " + n.h + " at " + n.p + ", swell " + n.swell + ". Still not paddling." : s.name + " swell talk without a number.";
  if (/when|should i|worth|window/.test(q)) {
    if (!n) return "When the boat leaves and I stay.";
    if (n.q === "Epic" || n.q === "Good") return "They stamped " + n.q + ". Dawn boat's your problem.";
    return s.name + " is " + n.q + ". Peak better not risk it today bro.";
  }
  if (/wisdom|philosophy|vibe/.test(q)) return "The wave doesn't care about your schedule. It comes when it comes.";
  return n ? "From this chair, " + s.name + " is wearing " + n.h + " of " + n.q.toLowerCase() + "." : "Duuude. Chalkboard's still drying.";
}

function forecastHTML(s, pack) {
  const err = pack && pack.error;
  const cur = pack && pack.data && pack.data.current;
  const hours = (pack && pack.data && pack.data.hours) || [];
  const wins = cur ? LM_FX.bestWindows(hours) : [];
  const days = cur ? LM_FX.dayStrip(hours) : [];
  const ranked = LM_SPOTS.map((x) => ({ s: x, c: state.packs[x.id] && state.packs[x.id].data && state.packs[x.id].data.current })).filter((x) => x.c).sort((a, b) => b.c.score - a.c.score).slice(0, 8);
  let html = '<p class="kicker">' + s.atoll + (s.island ? " · " + s.island : "") + '</p>';
  html += '<h2>' + s.name + '</h2>';
  html += '<p class="muted">' + s.desc + '</p>';
  html += '<div class="card sec">';
  if (err && !cur) html += '<p class="muted">' + err + '</p><button class="primary" data-retry>Try again</button>';
  if (!cur && !err) html += '<p class="muted">Loading live swell…</p>';
  if (cur) {
    html += '<div class="row"><p class="hero-m">' + cur.waveH.toFixed(1) + '<span> m</span></p><span class="badge ' + cur.label + '">' + cur.label + '</span></div>';
    html += '<div class="stats"><div class="stat"><b>' + cur.period.toFixed(0) + 's</b><span>Period</span></div>';
    html += '<div class="stat"><b>' + LM_FX.compass(cur.swellDir) + '</b><span>Swell · ' + cur.swellH.toFixed(1) + 'm</span></div>';
    html += '<div class="stat"><b>' + cur.windKts.toFixed(0) + ' ' + LM_FX.compass(cur.windDir) + '</b><span>' + LM_FX.windFeel(cur.windKts) + ' · kts</span></div></div>';
    html += '<p class="muted" style="margin-top:.7rem">Prefers ' + LM_FX.compass(s.swell) + ' swell, ' + LM_FX.compass(s.wind) + ' wind · ' + s.side + ' · ' + s.difficulty + '</p>';
  }
  html += '</div>';
  if (cur) html += '<div class="card sec"><label>Martey\'s take</label><p class="take">' + take(s, cur) + '</p></div>';
  if (wins.length) {
    html += '<div class="sec"><label>Best windows</label><div class="windows">';
    wins.forEach((h) => {
      const d = new Date(h.t);
      html += '<div class="win"><b>' + d.toLocaleDateString(undefined,{weekday:"short"}) + ' ' + d.getHours() + ':00</b><span class="muted">' + h.waveH.toFixed(1) + 'm @ ' + h.period.toFixed(0) + 's</span><span class="badge ' + h.label + '">' + h.label + '</span></div>';
    });
    html += '</div></div>';
  }
  if (ranked.length) {
    html += '<div class="sec"><label>Ranked reefs</label><div class="chips">';
    ranked.forEach((r) => {
      html += '<button data-pick="' + r.s.id + '">' + r.s.name + '<br><span class="muted">' + r.s.atoll + ' · ' + r.c.waveH.toFixed(1) + 'm ' + r.c.label + '</span></button>';
    });
    html += '</div></div>';
  }
  if (days.length) {
    html += '<div class="sec"><label>7-day strip</label><div class="days">';
    days.forEach((row, i) => {
      const name = i === 0 ? "Today" : new Date(row.d).toLocaleDateString(undefined,{weekday:"short"});
      html += '<div class="day"><b>' + name + '</b><span class="muted">' + row.min.toFixed(1) + '–' + row.max.toFixed(1) + 'm</span><span class="badge ' + row.best.label + '">' + row.best.label + '</span></div>';
    });
    html += '</div></div>';
  }
  return html;
}

function spotsHTML() {
  const q = (($("q") && $("q").value) || "").toLowerCase();
  let html = '<input class="search" id="q" placeholder="Search reefs, islands, atolls…" value="' + q.replace(/"/g,"") + '">';
  LM_ATOLLS.forEach((a) => {
    const list = LM_SPOTS.filter((s) => s.atoll === a && (!q || (s.name + " " + s.atoll + " " + s.island).toLowerCase().includes(q)));
    if (!list.length) return;
    html += '<div class="sec"><label>' + a + '</label>';
    list.forEach((s) => {
      const lab = state.packs[s.id] && state.packs[s.id].data && state.packs[s.id].data.current ? state.packs[s.id].data.current.label : "";
      html += '<button class="spot" data-pick="' + s.id + '"><b>' + s.name + '</b><span class="muted">' + s.island + ' · ' + s.side + ' · ' + s.difficulty + (lab ? " · " + lab : "") + '</span></button>';
    });
    html += '</div>';
  });
  html += '<div class="sec"><label>World</label>';
  LM_WORLD.filter((s) => !q || s.name.toLowerCase().includes(q)).forEach((s) => {
    html += '<button class="spot" data-pick="' + s.id + '"><b>' + s.name + '</b><span class="muted">' + s.island + '</span></button>';
  });
  html += '</div>';
  return html;
}

function meetHTML() {
  return '<div class="card"><p class="kicker">Meet Martey</p><h2 class="brand-title">Martey</h2><p class="take" style="color:var(--gold)">Knows everything, Surfs nothing</p><p class="muted">Three decades of beach wisdom, zero hours on a board. He\'ll put you on the empty peak and stay famous for watching.</p><div class="grid2"><div class="stat"><b>30+</b><span>Years</span></div><div class="stat"><b>56</b><span>Reefs</span></div><div class="stat"><b>0</b><span>Waves surfed</span></div><div class="stat"><b>∞</b><span>Chair hours</span></div></div><div class="grid2"><a class="primary" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="https://www.instagram.com/legendary_martey/" target="_blank" rel="noopener">Instagram</a><button class="ghost" data-tab="chat">Ask him</button></div></div><div class="card sec"><label>The Legend</label><p class="muted">North Shore energy, Maldives charter life, still not paddling. Lives on the charts. The board lives in storage. Wildcard into Pipe Pro. Drank the coconut water, slept in, kinda bailed. Maximum knowledge. Minimum wetness.</p></div><div class="sec"><label style="color:var(--gold)">Martey\'s Wisdom</label><div class="card wisdom"><div><b>On Patience</b><p class="take muted">The wave doesn\'t care about your schedule, dude. It comes when it comes.</p></div></div><div class="card wisdom"><div><b>On Wipeouts</b><p class="take muted">Every wipeout is just the ocean giving you a hug. A really aggressive hug.</p></div></div><div class="card wisdom"><div><b>On Timing</b><p class="take muted">Dawn patrol is for the committed. I committed to sleeping in — still legendary.</p></div></div><div class="card wisdom"><div><b>On Life</b><p class="take muted">You don\'t need to ride the wave to understand the ocean. Sometimes you just gotta vibe.</p></div></div></div><div class="card sec"><label>Essential Gear</label><p><b>Vintage Ray-Bans</b><br><span class="muted">To see the waves clearly. And look legendary.</span></p><p><b>Coconut water</b><br><span class="muted">Hydration. Also a Pipe Pro medical excuse.</span></p><p><b>Beach chair</b><br><span class="muted">Best surf observation deck known to man.</span></p><p><b>SPF 50</b><br><span class="muted">Protect the legend.</span></p><p><b>Bluetooth speaker</b><br><span class="muted">Beach vibes need a soundtrack.</span></p><p><b>Notebook</b><br><span class="muted">Peace energy scores. Chart scribbles.</span></p></div><div class="card sec"><label>The Martey Method</label><p class="take" style="color:var(--cyan)">You see, the thing about surfing is… you don\'t actually have to surf.</p><p class="muted">Observe, analyze, advise, chill. <b style="color:var(--fg)">Maximum knowledge, minimum wetness.</b></p></div>';
}

function chatHTML() {
  const s = spot();
  let html = '<p class="muted">Tuned into ' + s.name + '</p><div class="chat-log" id="log">';
  state.chat.forEach((t, i) => { html += '<div class="bubble ' + (i % 2 ? "me" : "bot") + '">' + t + '</div>'; });
  html += '</div><div class="chips">';
  [["Swell","How\'s the swell?"],["Wind","What\'s the wind doing?"],["When","When should I go?"],["Gear","What board should I bring?"],["Wisdom","Drop some wisdom"]].forEach((pair) => {
    html += '<button data-ask="' + pair[1] + '">' + pair[0] + '</button>';
  });
  html += '</div><form class="chat-form" id="ask"><input maxlength="240" placeholder="Ask Martey…"><button class="primary" style="width:auto;padding:0 1rem">Send</button></form>';
  return html;
}

function mapHTML() {
  const s = spot();
  const cur = state.packs[s.id] && state.packs[s.id].data && state.packs[s.id].data.current;
  let html = '<div class="row"><label>' + (state.atoll || "Maldives atolls") + '</label>';
  html += state.atoll ? '<button class="ghost" data-all>All atolls</button>' : '<span class="muted">Tap an atoll</span>';
  html += '</div><div id="map" class="lm-map sec"></div><div class="chips sec">';
  LM_ATOLLS.forEach((a) => { html += '<button class="' + (state.atoll === a ? "on" : "") + '" data-atoll="' + a + '">' + a + '</button>'; });
  html += '</div><div class="card sec"><div class="row"><div><b>' + s.name + '</b><p class="muted">';
  html += s.world ? "World spot — Maldives map stays on the chain." : (s.island + " · " + s.lat.toFixed(3) + ", " + s.lon.toFixed(3) + " · " + s.difficulty);
  html += '</p></div>' + (cur ? '<span class="badge ' + cur.label + '">' + cur.label + '</span>' : '') + '</div>';
  html += '<button class="primary" style="margin-top:.75rem" data-open>Open forecast</button></div>';
  return html;
}

let map, layers = [];

function drawMap() {
  const el = $("map");
  if (!el || typeof L === "undefined") return;
  if (!map) {
    map = L.map(el, { zoomControl: false, scrollWheelZoom: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 18
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
  }
  map.invalidateSize();
  layers.forEach((l) => l.remove());
  layers = [];
  if (!state.atoll) {
    const ll = [];
    LM_ATOLLS.forEach((a) => {
      const reefs = LM_SPOTS.filter((s) => s.atoll === a);
      const lat = reefs.reduce((n, s) => n + s.lat, 0) / reefs.length;
      const lon = reefs.reduce((n, s) => n + s.lon, 0) / reefs.length;
      ll.push([lat, lon]);
      const lab = reefs.map((s) => state.packs[s.id] && state.packs[s.id].data && state.packs[s.id].data.current && state.packs[s.id].data.current.label).find(Boolean);
      const m = L.circleMarker([lat, lon], { radius: 10, color: pinColor(lab), weight: 2, fillColor: pinColor(lab), fillOpacity: 0.9 });
      m.bindTooltip(a, { permanent: true, direction: "top", offset: [0, -12], className: "lm-tip" });
      m.on("click", () => { state.atoll = a; render(); setTimeout(drawMap, 40); });
      m.addTo(map); layers.push(m);
    });
    map.fitBounds(ll, { padding: [36, 36], maxZoom: 7 });
  } else {
    const reefs = LM_SPOTS.filter((s) => s.atoll === state.atoll);
    const ll = reefs.map((s) => [s.lat, s.lon]);
    reefs.forEach((s) => {
      const lab = state.packs[s.id] && state.packs[s.id].data && state.packs[s.id].data.current && state.packs[s.id].data.current.label;
      const selected = s.id === state.spotId;
      const m = L.circleMarker([s.lat, s.lon], {
        radius: selected ? 11 : 7,
        color: selected ? "#e8c47a" : pinColor(lab),
        weight: selected ? 3 : 2,
        fillColor: selected ? "#e8c47a" : pinColor(lab),
        fillOpacity: 0.95
      });
      m.bindTooltip(s.name, { permanent: true, direction: "top", offset: [0, -10], className: "lm-tip" });
      m.on("click", () => setSpot(s.id, false));
      m.addTo(map); layers.push(m);
    });
    if (ll.length) map.fitBounds(ll, { padding: [40, 40], maxZoom: 13 });
  }
}

function render() {
  const s = spot();
  const pack = state.packs[s.id];
  $("sub").innerHTML = s.name + ' <span>· ' + s.atoll + '</span>';
  const badge = pack && pack.data && pack.data.current && pack.data.current.label;
  $("head-badge").innerHTML = badge ? '<span class="badge ' + badge + '">' + badge + '</span>' : "";
  $("forecast").classList.toggle("hidden", state.tab !== "forecast");
  $("map-pane").classList.toggle("hidden", state.tab !== "map");
  $("spots").classList.toggle("hidden", state.tab !== "spots");
  $("chat").classList.toggle("hidden", state.tab !== "chat");
  $("meet").classList.toggle("hidden", state.tab !== "meet");
  if (state.tab === "forecast") $("forecast").innerHTML = forecastHTML(s, pack);
  if (state.tab === "map") $("map-pane").innerHTML = mapHTML();
  if (state.tab === "spots") $("spots").innerHTML = spotsHTML();
  if (state.tab === "chat") $("chat").innerHTML = chatHTML();
  if (state.tab === "meet") $("meet").innerHTML = meetHTML();
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
  if (state.tab === "map") setTimeout(drawMap, 40);
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab],[data-pick],[data-atoll],[data-all],[data-open],[data-ask],[data-retry]");
  if (!t) return;
  if (t.dataset.tab) setTab(t.dataset.tab);
  if (t.dataset.pick) setSpot(t.dataset.pick, true);
  if (t.dataset.atoll) { state.atoll = t.dataset.atoll; render(); setTimeout(drawMap, 40); }
  if (t.dataset.all !== undefined) { state.atoll = null; render(); setTimeout(drawMap, 40); }
  if (t.dataset.open) setSpot(state.spotId, true);
  if (t.dataset.retry) { LM_FX.loadSpot(spot(), true).then((p) => { state.packs[spot().id] = p; render(); }); }
  if (t.dataset.ask) send(t.dataset.ask);
});

document.addEventListener("input", (e) => {
  if (e.target.id === "q") {
    $("spots").innerHTML = spotsHTML();
    const box = $("q");
    if (box) { box.focus(); box.setSelectionRange(e.target.value.length, e.target.value.length); }
  }
});

document.addEventListener("submit", (e) => {
  if (e.target.id !== "ask") return;
  e.preventDefault();
  const input = e.target.querySelector("input");
  send(input.value);
  input.value = "";
});

function send(text) {
  const msg = text.trim();
  if (!msg) return;
  const s = spot();
  const cur = state.packs[s.id] && state.packs[s.id].data && state.packs[s.id].data.current || null;
  state.chat.push(msg);
  render();
  setTimeout(() => { state.chat.push(reply(msg, s, cur)); render(); }, 280);
}

LM_SPOTS.forEach((s) => load(s.id));
if (byId[state.spotId] && byId[state.spotId].world) load(state.spotId);
render();
