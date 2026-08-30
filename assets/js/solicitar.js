/* Solicitação on-line.
   O formulário é o da própria plataforma (escrituras.inovacartorios.com.br),
   mas carregado só quando o cliente pede — antes disso ele vê a lista de
   documentos. O iframe pesa mais de 1 MB e não deve entrar no carregamento
   inicial da página. */
import { SERVICOS } from './catalogo.js?v=20919b6d27';
import { DETALHES } from './detalhes.js?v=0fdbbdc216';
import { DOCUMENTOS_BASE } from './regras.js?v=8e91b1e90a';
import { $, icone, whatsappUrl, idDocumento, ligarChecklist, url, rastrear } from './app.js?v=cb2dc82c2c';

const slug = new URLSearchParams(location.search).get('s');
const servico = SERVICOS.find((s) => s.slug === slug);
const palco = $('#palco');

if (!servico) {
  $('#titulo').textContent = 'Escolha o serviço';
  palco.innerHTML = `<div class="pilha">
    <p>Escolha na lista o ato que você precisa solicitar.</p>
    <div class="grade g-2">${SERVICOS.filter((s) => DETALHES[s.slug]?.form_url).map((s) => `
      <a class="atalho" href="${url(`solicitar.html?s=${s.slug}`)}">
        <span class="atalho__icone"><img src="${s.icone}" alt="" width="24" height="24" loading="lazy" style="filter:brightness(3)"></span>
        <span><strong>${s.titulo}</strong><span>${s.categoria}</span></span></a>`).join('')}</div>
    <p class="pequeno texto-2">Não está na lista? <a href="servicos.html">Veja todos os serviços</a> — alguns são resolvidos no balcão ou por agendamento.</p>
  </div>`;
} else {
  const det = DETALHES[slug] || {};
  document.title = `Solicitar ${servico.titulo} | 23º Ofício de Notas do Rio de Janeiro`;
  $('#titulo').textContent = `Solicitar: ${servico.titulo}`;
  $('#migalha').textContent = servico.titulo;
  $('#sub').textContent = 'Confira a lista de documentos e depois preencha o pedido.';

  const grupos = det.documentos_grupos?.length
    ? det.documentos_grupos
    : [{ grupo: null, itens: DOCUMENTOS_BASE }];

  palco.innerHTML = `
    <div class="card mb-6">
      <h2 style="font-size:var(--t-xl);margin:0">Documentos que o cartório vai pedir</h2>
      <p class="pequeno texto-2">Ter tudo em mãos evita idas e vindas. O que faltar pode ser enviado depois.</p>
      ${grupos.map((g, gi) => `
        ${g.grupo ? `<h3 style="font-size:var(--t-md);margin:.75rem 0 .35rem">${g.grupo}</h3>` : ''}
        <ul class="checklist">${g.itens.map((it) => { const id = idDocumento(it);
          return `<li><input type="checkbox" id="${id}" data-doc><label for="${id}">${it}</label></li>`; }).join('')}</ul>`).join('')}
      <div class="linha mt-4">
        <span class="miudo" id="progresso"></span>
        <a class="botao botao--whats botao--p" id="duvida" href="${whatsappUrl(`Olá! Vou solicitar ${servico.titulo} e tenho dúvida sobre a documentação.`)}" target="_blank" rel="noopener">${icone('whatsapp')} Tenho dúvida</a>
      </div>
    </div>

    ${det.form_url ? `
      <div class="card" id="area-form">
        <h2 style="font-size:var(--t-xl);margin:0">Formulário de solicitação</h2>
        <p class="pequeno texto-2">Preenchimento em cerca de 5 minutos. Você recebe a confirmação por e-mail.</p>
        <button class="botao botao--ouro botao--g" type="button" id="abrir-form">${icone('doc-check')} Abrir formulário</button>
        <p class="miudo">O formulário é do sistema do cartório e abre aqui mesmo.</p>
      </div>`
    : `<div class="card">
        <h2 style="font-size:var(--t-xl);margin:0">Este ato é resolvido com atendimento</h2>
        <p>Para ${servico.titulo.toLowerCase()}, o caminho é agendar ou falar com a equipe — assim confirmamos a documentação do seu caso antes.</p>
        <div class="linha">
          <a class="botao" href="${url(`agendar.html?s=${slug}`)}">${icone('agenda')} Agendar atendimento</a>
          <a class="botao botao--whats" href="${whatsappUrl(`Olá! Preciso de ${servico.titulo}.`)}" target="_blank" rel="noopener">${icone('whatsapp')} WhatsApp</a>
        </div>
      </div>`}`;

  /* mesma lista da página do ato: os ids vêm do texto, então a marcação segue junto */
  ligarChecklist(slug, ({ total, marcadas }) => {
    $('#progresso').textContent = `${marcadas} de ${total} separados`;
  });

  /* facade: o iframe só entra depois do clique */
  $('#abrir-form')?.addEventListener('click', (e) => {
    rastrear('solicitacao_form_aberto', { ato: slug });
    const area = $('#area-form');
    area.querySelector('.miudo').remove();
    e.target.replaceWith(Object.assign(document.createElement('iframe'), {
      src: det.form_url, width: '100%', height: '1150', loading: 'lazy',
      title: `Formulário de solicitação — ${servico.titulo}`,
      style: 'border:0;border-radius:var(--raio-sm);margin-top:1rem',
    }));
  });
}
