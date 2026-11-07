/* Dati estratti da https://learnvolley.com/formation5-1 (vedi schemi-5-1.md).
   Coordinate: [left, top] in unità del campo (campo 72x72 = 9 m x 9 m). top 0 = rete.
   Ordine dei giocatori: P, L, O, S1, S2, C1, C2 (sigle italiane; sul sito: S, L, OP, OH1, OH2, MB1, MB2).
   [76, 36] = giocatore fuori campo (sostituito dal libero). */
'use strict';

const GIOCATORI = [
  { id: 's',  sigla: 'P',   nome: 'Palleggiatore (P)' },
  { id: 'l',  sigla: 'L',   nome: 'Libero (L)' },
  { id: 'r',  sigla: 'O',  nome: 'Opposto (O)' },
  { id: 'o1', sigla: 'S1', nome: 'Schiacciatore 1 (S1)' },
  { id: 'o2', sigla: 'S2', nome: 'Schiacciatore 2 (S2)' },
  { id: 'm1', sigla: 'C1', nome: 'Centrale 1 (C1)' },
  { id: 'm2', sigla: 'C2', nome: 'Centrale 2 (C2)' }
];

const FUORI_CAMPO = [76, 36];

/* Step: titolo e descrizione (traduzione fedele dei testi del sito). */
const STEP_RICEZIONE = [
  { titolo: 'In posizione', desc: 'L’altra squadra sta per battere. I tuoi giocatori vanno nelle posizioni di ricezione e si fermano prima della battuta.' },
  { titolo: 'Ricezione', desc: 'La battuta passa la rete e il ricevitore centrale alza la palla in su. Il palleggiatore va verso il bersaglio a rete.' },
  { titolo: 'Transizione all’attacco', desc: 'La ricezione arriva al palleggiatore a rete. Gli attaccanti si allontanano per iniziare la rincorsa.' },
  { titolo: 'Alzata', desc: 'Il palleggiatore alza una palla alta all’attaccante di prima linea di sinistra. Gli altri attaccanti continuano la rincorsa.' },
  { titolo: 'Attacco e copertura d’attacco', desc: 'L’attaccante di prima linea di sinistra attacca. I compagni si abbassano attorno all’attaccante nel caso il muro rimandi la palla.' },
  { titolo: 'Transizione alla difesa', desc: 'L’attacco ha superato la rete. Tutti tornano a una posizione difensiva di base prima che gli avversari possano attaccare.' },
  { titolo: 'Muro e copertura del muro', desc: 'Gli avversari attaccano dalla loro sinistra, davanti alla tua zona 2. Due giocatori di prima linea murano; gli altri difendono attorno al muro.' }
];

const STEP_BATTUTA = [
  { titolo: 'In posizione', desc: 'La tua squadra batte. Chi batte sta dietro la linea di fondo; gli altri aspettano in campo.' },
  { titolo: 'Battuta e transizione alla difesa', desc: 'La battuta passa la rete. Chi ha battuto entra in campo e tutti si muovono verso una posizione difensiva di base.' },
  { titolo: 'Muro e copertura del muro', desc: 'Gli avversari attaccano dalla loro sinistra, davanti alla tua zona 2. Due giocatori di prima linea murano; gli altri difendono attorno al muro.' }
];

/* Palla [left, top] per step. */
const PALLA_RICEZIONE = [[20, -8], [34, 52], [40, 2], [24.25, 2], [4, 2], [20, -8], [52, -4]];
const PALLA_BATTUTA = [[34, 71], [20, -8], [52, -4]];

/* Durata (ms) del movimento che porta allo step i. Scelta dell'app, non letta dall'originale. */
const DURATA_RICEZIONE = [900, 2000, 2000, 600, 3000, 2500, 2500];
const DURATA_BATTUTA = [900, 2500, 2500];
const PAUSA_TRA_STEP = 400;

/* Una rotazione per posizione di partenza del palleggiatore (1..6).
   sub = numero di rotazione sul token (in ordine P,L,O,S1,S2,C1,C2; '' = fuori campo).
   attaccanti = attaccanti di prima linea. lib = [posizione del libero, sostituito] o null. */
const RICEZIONE = {
  1: { attaccanti: ['O', 'C2', 'S1'], lib: [6, 'C1'], sub: ['1', '6', '4', '2', '5', '', '3'], step: [
    [[60,56],[32,52],[1,16],[54,48],[10,52],[76,36],[32,4]],
    [[40,2],[32,52],[1,16],[54,48],[10,52],[76,36],[32,4]],
    [[40,2],[12,40],[-12,24],[76,24],[32,56],[76,36],[20,24]],
    [[40,2],[12,40],[-12,24],[76,24],[32,56],[76,36],[20,24]],
    [[16,2],[4,20],[2,2],[52,32],[20,40],[76,36],[16,12]],
    [[54,40],[12,40],[10,4],[52,4],[32,56],[76,36],[32,4]],
    [[60,44],[16,40],[16,12],[52,2],[28,52],[76,36],[44,2]] ] },
  2: { attaccanti: ['C2', 'S1'], lib: [1, 'C1'], sub: ['2', '1', '5', '3', '6', '', '4'], step: [
    [[40,2],[54,52],[20,64],[10,48],[32,52],[76,36],[1,16]],
    [[40,2],[54,52],[62,64],[10,48],[32,52],[76,36],[1,16]],
    [[40,2],[12,40],[62,36],[-12,24],[32,56],[76,36],[20,24]],
    [[40,2],[12,40],[62,36],[-12,24],[32,56],[76,36],[20,24]],
    [[16,2],[4,20],[44,32],[2,2],[20,40],[76,36],[16,12]],
    [[52,2],[12,40],[52,40],[10,4],[32,56],[76,36],[40,2]],
    [[52,2],[16,40],[60,44],[16,12],[28,52],[76,36],[44,2]] ] },
  3: { attaccanti: ['S1', 'C1'], lib: [5, 'C2'], sub: ['3', '5', '6', '4', '1', '2', ''], step: [
    [[40,2],[32,52],[44,64],[10,48],[54,52],[62,16],[76,36]],
    [[40,2],[32,52],[62,64],[10,48],[54,52],[62,16],[76,36]],
    [[40,2],[12,40],[62,36],[-12,24],[32,56],[20,24],[76,36]],
    [[40,2],[12,40],[62,36],[-12,24],[32,56],[20,24],[76,36]],
    [[16,2],[4,20],[44,32],[2,2],[20,40],[16,12],[76,36]],
    [[52,2],[12,40],[52,40],[10,4],[32,56],[40,2],[76,36]],
    [[52,2],[16,40],[60,44],[16,12],[28,52],[44,2],[76,36]] ] },
  4: { attaccanti: ['C1', 'S2'], lib: [6, 'C2'], sub: ['4', '6', '1', '5', '2', '3', ''], step: [
    [[2,2],[54,52],[60,64],[32,52],[10,48],[6,8],[76,36]],
    [[40,2],[54,52],[62,36],[32,52],[10,48],[6,8],[76,36]],
    [[40,2],[12,40],[62,36],[32,56],[-12,24],[20,24],[76,36]],
    [[40,2],[12,40],[62,36],[32,56],[-12,24],[20,24],[76,36]],
    [[16,2],[4,20],[44,32],[20,40],[2,2],[16,12],[76,36]],
    [[52,2],[12,40],[52,40],[32,56],[10,4],[40,2],[76,36]],
    [[52,2],[16,40],[60,44],[28,52],[16,12],[44,2],[76,36]] ] },
  5: { attaccanti: ['C1', 'S2', 'O'], lib: [1, 'C2'], sub: ['5', '1', '2', '6', '3', '4', ''], step: [
    [[4,16],[54,52],[63,16],[32,52],[10,48],[1,10],[76,36]],
    [[40,2],[54,52],[63,16],[32,52],[10,48],[1,10],[76,36]],
    [[40,2],[12,40],[76,24],[32,56],[-12,24],[20,24],[76,36]],
    [[40,2],[12,40],[76,24],[32,56],[-12,24],[20,24],[76,36]],
    [[16,2],[4,20],[52,32],[20,40],[2,2],[16,12],[76,36]],
    [[54,40],[12,40],[52,4],[32,56],[10,4],[32,4],[76,36]],
    [[60,44],[16,40],[52,2],[28,52],[16,12],[44,2],[76,36]] ] },
  6: { attaccanti: ['S2', 'O', 'C2'], lib: [5, 'C1'], sub: ['6', '5', '3', '1', '4', '', '2'], step: [
    [[40,8],[32,52],[40,2],[54,52],[10,48],[76,36],[62,16]],
    [[40,2],[32,52],[76,24],[54,52],[10,48],[76,36],[62,16]],
    [[40,2],[12,40],[76,24],[32,56],[-12,24],[76,36],[20,24]],
    [[40,2],[12,40],[76,24],[32,56],[-12,24],[76,36],[20,24]],
    [[16,2],[4,20],[52,32],[20,40],[2,2],[76,36],[16,12]],
    [[54,40],[12,40],[52,4],[32,56],[10,4],[76,36],[32,4]],
    [[60,44],[16,40],[52,2],[28,52],[16,12],[76,36],[44,2]] ] }
};

const BATTUTA = {
  1: { battitore: 'P',   attaccanti: ['O', 'C2', 'S1'], lib: [6, 'C1'], sub: ['1', '6', '4', '2', '5', '', '3'], step: [
    [[32,74],[36,40],[24,2],[40,2],[28,40],[76,36],[32,2]],
    [[54,40],[12,40],[40,2],[24,2],[32,52],[76,36],[32,2]],
    [[60,44],[16,40],[52,2],[16,12],[28,52],[76,36],[44,2]] ] },
  2: { battitore: 'C1', attaccanti: ['C2', 'S1'], lib: null, sub: ['2', '', '5', '3', '6', '1', '4'], step: [
    [[40,2],[76,36],[28,40],[32,2],[36,40],[32,74],[24,2]],
    [[40,2],[76,36],[54,40],[24,2],[32,52],[12,40],[32,2]],
    [[52,2],[76,36],[60,44],[16,12],[28,52],[16,40],[44,2]] ] },
  3: { battitore: 'S2', attaccanti: ['S1', 'C1'], lib: [5, 'C2'], sub: ['3', '5', '6', '4', '1', '2', ''], step: [
    [[32,2],[28,40],[36,40],[24,2],[32,74],[40,2],[76,36]],
    [[40,2],[12,40],[54,40],[24,2],[32,52],[32,2],[76,36]],
    [[52,2],[16,40],[60,44],[16,12],[28,52],[44,2],[76,36]] ] },
  4: { battitore: 'O', attaccanti: ['C1', 'S2'], lib: [6, 'C2'], sub: ['4', '6', '1', '5', '2', '3', ''], step: [
    [[24,2],[36,40],[32,74],[28,40],[40,2],[32,2],[76,36]],
    [[40,2],[12,40],[54,40],[32,52],[24,2],[32,2],[76,36]],
    [[52,2],[16,40],[60,44],[28,52],[16,12],[44,2],[76,36]] ] },
  5: { battitore: 'C2', attaccanti: ['C1', 'S2', 'O'], lib: null, sub: ['5', '', '2', '6', '3', '4', '1'], step: [
    [[28,40],[76,36],[40,2],[36,40],[32,2],[24,2],[32,74]],
    [[54,40],[76,36],[40,2],[32,52],[24,2],[32,2],[12,40]],
    [[60,44],[76,36],[52,2],[28,52],[16,12],[44,2],[16,40]] ] },
  6: { battitore: 'S1', attaccanti: ['S2', 'O', 'C2'], lib: [5, 'C1'], sub: ['6', '5', '3', '1', '4', '', '2'], step: [
    [[36,40],[28,40],[32,2],[32,74],[24,2],[76,36],[40,2]],
    [[54,40],[12,40],[40,2],[32,52],[24,2],[76,36],[32,2]],
    [[60,44],[16,40],[52,2],[28,52],[16,12],[76,36],[44,2]] ] }
};

/* Responsabilità dei ruoli (dal sito). */
const RESPONSABILITA = [
  ['Palleggiatore (P)', 'Alza, mura, batte, difende la zona 1.'],
  ['Centrale (C)', 'Muro centrale, attacco centrale, batte.'],
  ['Schiacciatore di banda (S)', 'Muro esterno, attacco esterno, batte, riceve, difende la zona 6. Eccezione: in ricezione con il palleggiatore in rotazione 1 resta in zona 2 e attacca da destra.'],
  ['Libero (L)', 'Riceve, difende la zona 5; non può battere.'],
  ['Opposto (O)', 'Batte, muro in posizione di destra, attacco da destra, difende la zona 1. Eccezione: in ricezione con il palleggiatore in rotazione 1 resta in zona 4 e attacca da sinistra.']
];

const DIFESA_BASE = 'Difesa 6-back (perimetrale): il centrale in seconda linea resta profondo per gli attacchi forti, il muratore “fuori” copre le palle piazzate. Il palleggiatore di seconda linea difende la zona 1 e va a rete solo dopo la difesa della palla.';
