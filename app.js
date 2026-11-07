'use strict';

/* Offset del campo nel palcoscenico (vedi style.css): il campo parte a (14, 10) unità. */
const OFFSET_X = 14;
const OFFSET_Y = 10;

const stato = { modo: 'ricezione', pos: 1, step: 0, inCorso: false, timer: null };

const el = {
  stage: document.getElementById('stage'),
  giocatori: document.getElementById('giocatori'),
  palla: document.getElementById('palla'),
  posizioni: document.getElementById('posizioni'),
  fase: document.getElementById('fase'),
  descrizione: document.getElementById('descrizione'),
  contesto: document.getElementById('contesto'),
  prec: document.getElementById('prec'),
  succ: document.getElementById('succ'),
  play: document.getElementById('play'),
  riavvia: document.getElementById('riavvia'),
  zone: document.getElementById('zone'),
  toggleZone: document.getElementById('toggle-zone'),
  toggleNomi: document.getElementById('toggle-nomi'),
  nomi: document.getElementById('nomi'),
  nomiCampi: document.getElementById('nomi-campi'),
  copiaLink: document.getElementById('copia-link'),
  copiaEsito: document.getElementById('copia-esito')
};

const token = {};   // id -> elemento del giocatore
const nomi = {};    // id -> nome inserito

function schema() {
  return (stato.modo === 'ricezione' ? RICEZIONE : BATTUTA)[stato.pos];
}
function stepTesti() { return stato.modo === 'ricezione' ? STEP_RICEZIONE : STEP_BATTUTA; }
function palle() { return stato.modo === 'ricezione' ? PALLA_RICEZIONE : PALLA_BATTUTA; }
function durate() { return stato.modo === 'ricezione' ? DURATA_RICEZIONE : DURATA_BATTUTA; }
function numStep() { return stepTesti().length; }

function posiziona(elemento, x, y) {
  elemento.style.left = ((x + OFFSET_X) * 1) + 'cqw';
  elemento.style.top = ((y + OFFSET_Y) * 1) + 'cqw';
}

function impostaDurata(ms) {
  el.stage.style.setProperty('--dur', ms + 'ms');
}

/* ---- Costruzione interfaccia ---- */
function costruisci() {
  for (const g of GIOCATORI) {
    const d = document.createElement('div');
    d.className = 'giocatore ' + g.id;
    d.id = 'g-' + g.id;
    d.setAttribute('aria-label', g.nome);
    d.innerHTML = '<span class="sigla"></span><sub></sub><span class="nome"></span>';
    d.querySelector('.sigla').textContent = g.sigla;
    el.giocatori.appendChild(d);
    token[g.id] = d;
  }
  for (let n = 1; n <= 6; n++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'P' + n;
    b.dataset.pos = n;
    b.setAttribute('aria-label', 'Palleggiatore in posizione ' + n);
    b.addEventListener('click', () => scegli(stato.modo, n));
    el.posizioni.appendChild(b);
  }
  document.querySelectorAll('.modo').forEach(b =>
    b.addEventListener('click', () => scegli(b.dataset.modo, stato.pos)));

  const dl = document.getElementById('responsabilita');
  for (const [ruolo, testo] of RESPONSABILITA) {
    const dt = document.createElement('dt'); dt.textContent = ruolo;
    const dd = document.createElement('dd'); dd.textContent = testo;
    dl.append(dt, dd);
  }
  document.getElementById('difesa').textContent = DIFESA_BASE;

  for (const g of GIOCATORI) {
    const lab = document.createElement('label');
    lab.textContent = g.nome;
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 20; inp.id = 'nome-' + g.id; inp.placeholder = 'Nome';
    inp.addEventListener('input', () => { nomi[g.id] = inp.value.trim(); mostraNomi(); salvaNomi(); });
    lab.appendChild(inp);
    el.nomiCampi.appendChild(lab);
  }
}

/* ---- Nomi nel link ---- */
function leggiNomi() {
  const p = new URLSearchParams(location.search);
  for (const g of GIOCATORI) {
    const v = p.get(g.id);
    if (v) { nomi[g.id] = v.slice(0, 20); document.getElementById('nome-' + g.id).value = nomi[g.id]; }
  }
}
function salvaNomi() {
  const p = new URLSearchParams();
  for (const g of GIOCATORI) if (nomi[g.id]) p.set(g.id, nomi[g.id]);
  const q = p.toString();
  try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '')); } catch (e) { /* file:// in alcuni browser */ }
}
function mostraNomi() {
  for (const g of GIOCATORI) token[g.id].querySelector('.nome').textContent = nomi[g.id] || '';
}

/* ---- Rendering di uno step ---- */
function contestoTesto(s) {
  const prima = ['2', '3', '4'];
  const riga = prima.includes(s.sub[0]) ? 'in prima linea' : 'in seconda linea';
  const att = s.attaccanti;
  const lista = att.length === 2 ? att.join(' e ') : att.slice(0, -1).join(', ') + ' e ' + att[att.length - 1];
  let t = '';
  if (stato.modo === 'battuta') t += s.battitore + ' batte dalla posizione 1. ';
  t += 'Il palleggiatore (P) parte in posizione ' + stato.pos + ', ' + riga + '. ';
  t += 'Attaccanti in prima linea (' + att.length + '): ' + lista + '.';
  if (s.lib) t += ' Il libero (L) è in campo in posizione ' + s.lib[0] + ' al posto di ' + s.lib[1] + '.';
  return t;
}

function render() {
  const s = schema();
  const coord = s.step[stato.step];
  GIOCATORI.forEach((g, i) => {
    const [x, y] = coord[i];
    posiziona(token[g.id], x, y);
    const fuori = x === FUORI_CAMPO[0] && y === FUORI_CAMPO[1];
    token[g.id].classList.toggle('fuori-campo', fuori);
    token[g.id].querySelector('sub').textContent = s.sub[i];
  });
  const [bx, by] = palle()[stato.step];
  posiziona(el.palla, bx, by);

  const t = stepTesti()[stato.step];
  el.fase.textContent = 'Fase ' + (stato.step + 1) + ' di ' + numStep() + ': ' + t.titolo;
  el.descrizione.textContent = t.desc;
  el.contesto.textContent = contestoTesto(s);

  el.prec.disabled = stato.step === 0;
  el.succ.disabled = stato.step === numStep() - 1;
  el.play.textContent = stato.inCorso ? 'Pausa' : 'Continua';
  el.play.disabled = !stato.inCorso && stato.step === numStep() - 1;

  document.querySelectorAll('.modo').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === stato.modo)));
  el.posizioni.querySelectorAll('button').forEach(b => b.classList.toggle('attivo', Number(b.dataset.pos) === stato.pos));
}

/* ---- Riproduzione ---- */
function ferma() {
  stato.inCorso = false;
  clearTimeout(stato.timer);
  stato.timer = null;
}

function vaiA(nuovoStep, ms) {
  impostaDurata(ms);
  stato.step = nuovoStep;
  render();
}

function avanzaAutomatico() {
  if (!stato.inCorso) return;
  if (stato.step >= numStep() - 1) { ferma(); render(); return; }
  const prossimo = stato.step + 1;
  const ms = durate()[prossimo];
  vaiA(prossimo, ms);
  stato.timer = setTimeout(avanzaAutomatico, ms + PAUSA_TRA_STEP);
}

function scegli(modo, pos) {
  ferma();
  stato.modo = modo;
  stato.pos = pos;
  vaiA(0, durate()[0]);
}

el.play.addEventListener('click', () => {
  if (stato.inCorso) { ferma(); render(); return; }
  if (stato.step >= numStep() - 1) return;
  stato.inCorso = true;
  render();
  avanzaAutomatico();
});
el.prec.addEventListener('click', () => {
  ferma();
  if (stato.step > 0) vaiA(stato.step - 1, 900);
  render();
});
el.succ.addEventListener('click', () => {
  ferma();
  if (stato.step < numStep() - 1) vaiA(stato.step + 1, durate()[stato.step + 1]);
  render();
});
el.riavvia.addEventListener('click', () => { ferma(); vaiA(0, 900); });

/* ---- Altri comandi ---- */
el.toggleZone.addEventListener('click', () => {
  el.zone.hidden = !el.zone.hidden;
  const attivo = !el.zone.hidden;
  el.toggleZone.setAttribute('aria-pressed', String(attivo));
  el.toggleZone.textContent = attivo ? 'Nascondi numeri di zona' : 'Mostra numeri di zona';
});
el.toggleNomi.addEventListener('click', () => {
  el.nomi.hidden = !el.nomi.hidden;
  el.toggleNomi.setAttribute('aria-expanded', String(!el.nomi.hidden));
});
el.copiaLink.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    el.copiaEsito.textContent = 'Link copiato.';
  } catch (e) {
    el.copiaEsito.textContent = 'Copia non disponibile: copia l’indirizzo dalla barra del browser.';
  }
  setTimeout(() => { el.copiaEsito.textContent = ''; }, 3000);
});
/* Clic sul campo = mostra/nascondi zone (come nell'originale). */
el.stage.addEventListener('click', (e) => { if (e.target === el.stage || e.target.closest('#campo')) el.toggleZone.click(); });

/* ---- Avvio ---- */
if (window.matchMedia('(min-width: 900px)').matches) document.getElementById('legenda-box').open = true;
costruisci();
leggiNomi();
mostraNomi();
impostaDurata(0);
render();
