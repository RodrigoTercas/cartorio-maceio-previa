/* Catálogo: filtro por categoria + busca, com estado na URL. */
import { SERVICOS, CATEGORIAS } from './catalogo.js?v=20919b6d27';
import { modalidadeDoAto, MODALIDADE, PRAZO_ESTIMADO } from './regras.js?v=8e91b1e90a';
import { $, $$, icone, normalizar, urlAto } from './app.js?v=cb2dc82c2c';

const params = new URLSearchParams(location.search);
let categoria = params.get('cat') || 'Todas';
let termo = params.get('q') || '';

const filtros = $('#filtros');
filtros.innerHTML = ['Todas', ...CATEGORIAS].map((c) => {
  const n = c === 'Todas' ? SERVICOS.length : SERVICOS.filter((s) => s.categoria === c).length;
  return `<button class="filtro" type="button" data-cat="${c}" aria-pressed="${c === categoria}">${c} <span aria-hidden="true">· ${n}</span></button>`;
}).join('');

function prazoTexto(cat) {
  const [min, max] = PRAZO_ESTIMADO[cat] || [1, 5];
  if (min === 0 && max <= 1) return 'Na hora, no balcão';
  return `${min} a ${max} dias úteis`;
}

function desenhar() {
  const alvo = normalizar(termo);
  const lista = SERVICOS.filter((s) => {
    const cat = categoria === 'Todas' || s.categoria === categoria;
    const txt = !alvo || normalizar(`${s.titulo} ${s.categoria} ${s.resumo} ${(s.tags || []).join(' ')}`).includes(alvo);
    return cat && txt;
  });

  $('#contagem').textContent = `${lista.length} ${lista.length === 1 ? 'serviço' : 'serviços'}`
    + (categoria !== 'Todas' ? ` em ${categoria}` : '')
    + (termo ? ` para “${termo}”` : '');
  $('#vazio').hidden = lista.length > 0;

  $('#lista').innerHTML = lista.map((s) => {
    const { selo, modalidade } = modalidadeDoAto(s);
    return `<article class="card card--link">
      <span class="card__icone"><img src="${s.icone || 'assets/icons/atos-notariais.svg'}" alt="" width="32" height="32" loading="lazy"></span>
      <span class="etiqueta">${s.categoria}</span>
      <h3><a href="${urlAto(s.slug)}" style="text-decoration:none;color:inherit">${s.titulo}</a></h3>
      <p class="card__resumo">${s.resumo || 'Veja os documentos necessários e como solicitar este ato.'}</p>
      <div class="card__rodape linha" style="gap:.5rem">
        ${modalidade !== MODALIDADE.PRESENCIAL && selo ? `<span class="etiqueta etiqueta--online">${icone('video')} ${selo}</span>` : ''}
        <span class="miudo">${icone('relogio')} ${prazoTexto(s.categoria)}</span>
      </div>
    </article>`;
  }).join('');

  const url = new URL(location);
  categoria === 'Todas' ? url.searchParams.delete('cat') : url.searchParams.set('cat', categoria);
  termo ? url.searchParams.set('q', termo) : url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

filtros.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  categoria = b.dataset.cat;
  $$('[data-cat]', filtros).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  desenhar();
});

/* a busca desta página filtra a grade em vez de abrir o dropdown */
const campo = $('#busca-catalogo');
campo.value = termo;
campo.addEventListener('input', () => { termo = campo.value; desenhar(); });
$('.busca__resultados', campo.closest('.busca'))?.remove();

desenhar();
