/* ============================================================
   Comportamento comum a todas as páginas.
   Sem dependências externas. Módulo ES nativo.
   ============================================================ */
import { SERVICOS, CONTATO } from './catalogo.js?v=20919b6d27';

/* ---------- utilidades ---------- */
export const $  = (s, ctx = document) => ctx.querySelector(s);
export const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
export const icone = (nome, cls = '') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#i-${nome}"></use></svg>`;

/** Remove acentos e caixa — para busca tolerante a "divorcio" vs "divórcio". */
export const normalizar = (t = '') =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Registra um evento de uso. Sem analytics instalado é um no-op silencioso;
    quando o cliente colocar GTM/GA4, os eventos já estão nomeados e fluem
    pelo dataLayer — mesmo modelo data-track do site atual. */
export function rastrear(evento, dados = {}) {
  try {
    (window.dataLayer ??= []).push({ event: evento, ...dados });
  } catch { /* nunca quebrar a página por causa de métrica */ }
}

/** Id estável de um documento, derivado do próprio texto.
    Duas páginas mostram a mesma lista (o ato e a solicitação); numerar por
    posição fazia cada uma gerar ids diferentes e a marcação se perdia na
    troca de página. */
export function idDocumento(texto) {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return 'doc' + Math.abs(h).toString(36);
}

/** Guarda em localStorage o que já foi separado e avisa a página a cada mudança. */
export function ligarChecklist(slug, aoMudar) {
  const chave = `docs:${slug}`;
  let salvos = new Set();
  try { salvos = new Set(JSON.parse(localStorage.getItem(chave) || '[]')); } catch { /* modo privado */ }

  const caixas = [...document.querySelectorAll('[data-doc]')];
  caixas.forEach((c) => { if (salvos.has(c.id)) c.checked = true; });

  const rotulo = (c) => document.querySelector(`label[for="${c.id}"]`)?.textContent.trim() || '';
  const atualizar = () => {
    const marcadas = caixas.filter((c) => c.checked);
    try { localStorage.setItem(chave, JSON.stringify(marcadas.map((c) => c.id))); } catch { /* idem */ }
    aoMudar?.({ total: caixas.length, marcadas: marcadas.length,
                faltando: caixas.filter((c) => !c.checked).map(rotulo) });
  };
  caixas.forEach((c) => c.addEventListener('change', atualizar));
  atualizar();
  return atualizar;
}

/** Caminho a partir da raiz do site. As páginas de ato vivem em servicos/,
    então nem todo link relativo pode ser escrito na mão. */
export const url = (caminho) => (window.REL || '') + caminho;
/** Endereço da página de um ato. */
export const urlAto = (slug) => url(`servicos/${slug}.html`);

export const whatsappUrl = (texto) =>
  `https://wa.me/5521986600006?text=${encodeURIComponent(texto)}`;

/* ---------- tema claro/escuro ---------- */
function iniciarTema() {
  const salvo = localStorage.getItem('tema');
  if (salvo) document.documentElement.dataset.tema = salvo;
  $$('[data-alternar-tema]').forEach((b) => {
    b.addEventListener('click', () => {
      const atual = document.documentElement.dataset.tema
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
      const novo = atual === 'escuro' ? 'claro' : 'escuro';
      document.documentElement.dataset.tema = novo;
      localStorage.setItem('tema', novo);
      b.setAttribute('aria-label', novo === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
    });
  });
}

/* ---------- navegação ---------- */
function iniciarNavegacao() {
  const topo = $('.topo');
  const botao = $('.hamburguer');
  if (botao && topo) {
    botao.addEventListener('click', () => {
      const aberto = topo.classList.toggle('menu-aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = aberto ? 'hidden' : '';
      if (aberto) $('.topo nav a')?.focus();
    });
    $('.veu')?.addEventListener('click', () => botao.click());
  }

  // submenus: clique abre, Esc e clique fora fecham
  const gatilhos = $$('.menu [aria-haspopup="true"]');
  gatilhos.forEach((g) => {
    g.addEventListener('click', (e) => {
      e.preventDefault();
      const abrindo = g.getAttribute('aria-expanded') !== 'true';
      gatilhos.forEach((o) => o.setAttribute('aria-expanded', 'false'));
      g.setAttribute('aria-expanded', String(abrindo));
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu > li')) gatilhos.forEach((g) => g.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    gatilhos.forEach((g) => g.setAttribute('aria-expanded', 'false'));
    if (topo?.classList.contains('menu-aberto')) botao.click();
  });

  // marca a página atual
  const aqui = location.pathname.replace(/index\.html$/, '') || '/';
  $$('.menu a[href]').forEach((a) => {
    const alvo = new URL(a.getAttribute('href'), location.origin).pathname.replace(/index\.html$/, '');
    if (alvo === aqui) a.setAttribute('aria-current', 'page');
  });
}

/* ---------- busca de serviços ---------- */
/** Pontua um serviço contra o termo: título > tag/sinônimo > categoria > resumo. */
function pontuar(servico, termo) {
  const t = normalizar(servico.titulo);
  const alvo = normalizar(termo);
  if (t === alvo) return 100;
  if (t.startsWith(alvo)) return 80;
  if (t.includes(alvo)) return 60;
  if (servico.tags?.some((tag) => normalizar(tag).includes(alvo))) return 45;
  if (normalizar(servico.categoria).includes(alvo)) return 25;
  if (normalizar(servico.resumo || '').includes(alvo)) return 12;
  return 0;
}

export function buscarServicos(termo, limite = 8) {
  const alvo = normalizar(termo);
  if (alvo.length < 2) return [];
  return SERVICOS
    .map((s) => ({ s, p: pontuar(s, alvo) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.s.titulo.localeCompare(b.s.titulo))
    .slice(0, limite)
    .map((x) => x.s);
}

function iniciarBusca() {
  $$('[data-busca]').forEach((caixa) => {
    const campo = $('input', caixa);
    const lista = $('.busca__resultados', caixa);
    const limpar = $('.busca__limpar', caixa);
    if (!campo || !lista) return;
    let marcado = -1;

    const desenhar = () => {
      const achados = buscarServicos(campo.value);
      caixa.classList.toggle('tem-texto', campo.value.length > 0);
      marcado = -1;
      if (!campo.value.trim()) { lista.classList.remove('visivel'); lista.innerHTML = ''; return; }
      lista.innerHTML = achados.length
        ? achados.map((s) => `<li role="option"><a href="${urlAto(s.slug)}">
             <img src="${url(s.icone || 'assets/icons/atos-notariais.svg')}" alt="" loading="lazy" width="28" height="28">
             <span>${s.titulo}</span><span class="busca__cat">${s.categoria}</span></a></li>`).join('')
        : `<li class="busca__vazio">Nada encontrado para “${campo.value}”.
             <a href="${url('servicos.html')}">Ver todos os serviços</a> ou
             <a href="${whatsappUrl('Olá! Não encontrei o serviço que preciso no site.')}">perguntar no WhatsApp</a>.</li>`;
      lista.classList.add('visivel');
    };

    campo.addEventListener('input', desenhar);
    campo.addEventListener('focus', () => campo.value && desenhar());
    campo.addEventListener('keydown', (e) => {
      const itens = $$('li[role="option"]', lista);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!itens.length) return;
        itens[marcado]?.classList.remove('marcado');
        marcado = e.key === 'ArrowDown'
          ? (marcado + 1) % itens.length
          : (marcado - 1 + itens.length) % itens.length;
        itens[marcado].classList.add('marcado');
        itens[marcado].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && marcado >= 0) {
        e.preventDefault(); $('a', itens[marcado]).click();
      } else if (e.key === 'Escape') {
        lista.classList.remove('visivel'); campo.blur();
      }
    });
    limpar?.addEventListener('click', () => { campo.value = ''; desenhar(); campo.focus(); });
    document.addEventListener('click', (e) => {
      if (!caixa.contains(e.target)) lista.classList.remove('visivel');
    });
  });
}

/* ---------- acordeão ---------- */
/* Delegação no document: os acordeões da home e do FAQ são criados por JS
   depois deste arquivo rodar, então não dá para ligar listener item a item. */
export function iniciarAcordeoes() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.acordeao__botao');
    if (!b) return;
    const aberto = b.getAttribute('aria-expanded') === 'true';
    if (b.closest('.acordeao')?.dataset.exclusivo !== undefined)
      $$('.acordeao__botao', b.closest('.acordeao')).forEach((o) => {
        o.setAttribute('aria-expanded', 'false');
        o.closest('.acordeao__item')?.classList.remove('aberto');
      });
    b.setAttribute('aria-expanded', String(!aberto));
    b.closest('.acordeao__item')?.classList.toggle('aberto', !aberto);
  });
}

/* ---------- entrada suave + voltar ao topo ---------- */
function iniciarMovimento() {
  const alvos = $$('.surge');
  if (alvos.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    alvos.forEach((a) => obs.observe(a));
  } else {
    alvos.forEach((a) => a.classList.add('visivel'));
  }
  /* Rede de segurança: se algo impedir o observer de disparar (aba em segundo
     plano no carregamento, erro em outro módulo), nada fica invisível. */
  setTimeout(() => alvos.forEach((a) => a.classList.add('visivel')), 2500);

  const dock = $('.dock');
  const aoRolar = () => dock?.classList.toggle('rolou', scrollY > 600);
  addEventListener('scroll', aoRolar, { passive: true }); aoRolar();
  $('[data-topo]')?.addEventListener('click', () =>
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
}

/* ---------- ano no rodapé e telefones ---------- */
function iniciarRodape() {
  $$('[data-ano]').forEach((e) => (e.textContent = new Date().getFullYear()));
  $$('[data-horario]').forEach((e) => (e.textContent = CONTATO.horario));
}

/* Um módulo pode executar antes ou depois do DOMContentLoaded, dependendo de
   quem o importou. Esperar sempre pelo evento deixaria a página morta no
   segundo caso — daí a guarda por readyState. */
let iniciado = false;
function iniciar() {
  if (iniciado) return;
  iniciado = true;
  iniciarTema(); iniciarNavegacao(); iniciarBusca();
  iniciarAcordeoes(); iniciarMovimento(); iniciarRodape();
}
/* cliques em [data-track] viram eventos automaticamente */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-track]');
  if (el) rastrear(el.dataset.track, { local: el.dataset.local || location.pathname });
});

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', iniciar)
  : iniciar();
