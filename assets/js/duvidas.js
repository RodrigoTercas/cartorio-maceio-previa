/* FAQ completo: 79 perguntas extraídas das páginas de cada ato,
   com filtro por categoria, busca e link para o serviço relacionado. */
import { FAQ } from './conteudo.js?v=89c411fbff';
import { $, $$, icone, normalizar, urlAto } from './app.js?v=cb2dc82c2c';

const lista = $('#lista-faq');
lista.dataset.exclusivo = '';

const CATEGORIAS = [...new Set(FAQ.map((f) => f.categoria).filter(Boolean))].sort();
let categoria = new URLSearchParams(location.search).get('cat') || 'Todas';
let termo = '';

$('#filtros').innerHTML = ['Todas', ...CATEGORIAS].map((c) => {
  const n = c === 'Todas' ? FAQ.length : FAQ.filter((f) => f.categoria === c).length;
  return `<button class="filtro" type="button" data-cat="${c}" aria-pressed="${c === categoria}">${c} <span aria-hidden="true">· ${n}</span></button>`;
}).join('');

function desenhar() {
  const alvo = normalizar(termo);
  const itens = FAQ.filter((f) =>
    (categoria === 'Todas' || f.categoria === categoria) &&
    (!alvo || normalizar(`${f.p} ${f.r} ${f.ato || ''}`).includes(alvo)));

  $('#contagem').textContent = `${itens.length} ${itens.length === 1 ? 'pergunta' : 'perguntas'}`
    + (categoria !== 'Todas' ? ` em ${categoria}` : '')
    + (termo ? ` para “${termo}”` : '');
  $('#vazio').hidden = itens.length > 0;

  lista.innerHTML = itens.map((f, i) => `
    <div class="acordeao__item">
      <h2 style="margin:0;font-size:inherit"><button class="acordeao__botao" type="button" aria-expanded="false" aria-controls="p-${i}">
        ${f.p}${icone('mais')}
      </button></h2>
      <div class="acordeao__painel" id="p-${i}"><div>
        <p>${f.r}</p>
        ${f.servico ? `<p class="pequeno"><a class="link-seta" href="${urlAto(f.servico)}">Ver ${f.ato} ${icone('seta-dir')}</a></p>` : ''}
      </div></div>
    </div>`).join('');

  const url = new URL(location);
  categoria === 'Todas' ? url.searchParams.delete('cat') : url.searchParams.set('cat', categoria);
  history.replaceState(null, '', url);
}

$('#filtros').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  categoria = b.dataset.cat;
  $$('[data-cat]', $('#filtros')).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  desenhar();
});
$('#busca-faq').addEventListener('input', (e) => { termo = e.target.value; desenhar(); });
desenhar();

/* Schema com as perguntas todas — é o conteúdo que rende resultado rico na busca. */
const ld = document.createElement('script');
ld.type = 'application/ld+json';
ld.textContent = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.p,
    acceptedAnswer: { '@type': 'Answer', text: f.r } })),
});
document.head.appendChild(ld);
