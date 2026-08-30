/* Agendamento em 4 etapas. Sem backend: o pedido é entregue por WhatsApp
   com todos os campos estruturados e fica salvo no navegador do cliente.
   Trocar `enviarPedido` por um POST quando o cartório tiver endpoint. */
import { SERVICOS } from './catalogo.js?v=20919b6d27';
import { modalidadeDoAto, MODALIDADE } from './regras.js?v=8e91b1e90a';
import { $, $$, icone, whatsappUrl, urlAto, rastrear } from './app.js?v=cb2dc82c2c';

const HORARIOS = ['09:00','09:30','10:00','10:30','11:00','11:30',
                  '14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

const form = $('#form-agenda');
const etapas = $$('.etapa', form);
let atual = 0;

/* --- serviços no select, agrupados por categoria --- */
const sel = $('#ato');
const porCategoria = SERVICOS.reduce((acc, s) => ((acc[s.categoria] ??= []).push(s), acc), {});
sel.innerHTML = '<option value="">Escolha o serviço…</option>' +
  Object.entries(porCategoria).map(([cat, itens]) =>
    `<optgroup label="${cat}">${itens.map((s) => `<option value="${s.slug}">${s.titulo}</option>`).join('')}</optgroup>`).join('');
sel.value = new URLSearchParams(location.search).get('s') || '';

/* --- formas de atendimento dependem do ato --- */
function atualizarFormas() {
  const s = SERVICOS.find((x) => x.slug === sel.value);
  const { modalidade, aviso } = s ? modalidadeDoAto(s) : { modalidade: MODALIDADE.HIBRIDO, aviso: null };
  const podeVideo = modalidade !== MODALIDADE.PRESENCIAL;
  const podeBalcao = modalidade !== MODALIDADE.ELETRONICO;

  $('#resumo-ato').innerHTML = s
    ? `<div class="aviso">${icone('alerta')}<p>${aviso || ''}</p></div>` : '';

  $('#formas').innerHTML = `
    ${podeBalcao ? `<label class="opcao">
      <input type="radio" name="forma" value="Presencial no cartório" ${!podeVideo ? 'checked' : ''} required>
      <span><strong>No cartório</strong><span>Av. Presidente Antônio Carlos, 607 — 4º andar, Centro do Rio</span></span></label>` : ''}
    ${podeVideo ? `<label class="opcao">
      <input type="radio" name="forma" value="Videoconferência (e-Notariado)" ${!podeBalcao ? 'checked' : ''} required>
      <span><strong>Por videoconferência</strong><span>Pelo e-Notariado, com certificado digital notarizado</span></span></label>` : ''}
    <label class="opcao">
      <input type="radio" name="forma" value="Ainda não sei" required>
      <span><strong>Ainda não sei</strong><span>A equipe orienta a melhor forma para o seu caso</span></span></label>`;
}
sel.addEventListener('change', atualizarFormas);
atualizarFormas();

/* --- data: só dias úteis, a partir de amanhã --- */
const data = $('#data');
const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
data.min = amanha.toISOString().slice(0, 10);
const daqui90 = new Date(); daqui90.setDate(daqui90.getDate() + 90);
data.max = daqui90.toISOString().slice(0, 10);
data.addEventListener('change', () => {
  const d = new Date(data.value + 'T12:00:00').getDay();
  const erro = d === 0 || d === 6;
  data.dataset.erroRegra = erro ? '1' : '';
  data.setAttribute('aria-invalid', String(erro));
  data.parentElement.querySelector('.erro')?.remove();
  if (erro) data.insertAdjacentHTML('afterend',
    '<span class="erro">O cartório atende de segunda a sexta. Escolha um dia útil.</span>');
});
$('#hora').innerHTML = HORARIOS.map((h) => `<option value="${h}">${h}</option>`).join('');

/* --- navegação entre etapas --- */
function validarEtapa(i) {
  const campos = $$('input, select, textarea', etapas[i]).filter((c) => c.required);
  let ok = true;
  const grupos = new Set();
  campos.forEach((c) => {
    if (c.type === 'radio') {
      if (grupos.has(c.name)) return;
      grupos.add(c.name);
      if (!form.querySelector(`input[name="${c.name}"]:checked`)) ok = false;
      return;
    }
    // aria-invalid é só o reflexo do estado atual — lê-lo aqui travaria o campo
    // como inválido para sempre, mesmo depois de o visitante corrigir o valor.
    // Regra de negócio (dia útil) viaja em data-erro-regra, limpa por quem a aplicou.
    const valido = c.checkValidity() && c.dataset.erroRegra !== '1';
    c.setAttribute('aria-invalid', String(!valido));
    if (!valido) ok = false;
  });
  return ok;
}

function mostrar(i) {
  atual = i;
  etapas.forEach((e, k) => e.classList.toggle('ativa', k === i));
  $$('#passos li').forEach((li, k) => {
    li.classList.toggle('feito', k < i);
    k === i ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current');
  });
  $('#anterior').hidden = i === 0;
  $('#proximo').hidden = i === etapas.length - 1;
  $('#enviar').hidden = i !== etapas.length - 1;
  etapas[i].querySelector('input, select, textarea')?.focus();
}

/* Ao editar um campo já marcado, some com o alerta assim que ele ficar válido:
   deixar o vermelho na tela enquanto a pessoa corrige é ruído. */
form.addEventListener('input', (e) => {
  const c = e.target;
  if (c.getAttribute('aria-invalid') === 'true' && c.checkValidity() && c.dataset.erroRegra !== '1')
    c.setAttribute('aria-invalid', 'false');
});

$('#proximo').addEventListener('click', () => {
  if (!validarEtapa(atual)) { etapas[atual].querySelector('[aria-invalid="true"]')?.focus(); return; }
  mostrar(Math.min(atual + 1, etapas.length - 1));
});
$('#anterior').addEventListener('click', () => mostrar(Math.max(atual - 1, 0)));

/* --- envio --- */
function protocolo() {
  const d = new Date();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `AG-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${seq}`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validarEtapa(atual)) return;
  const d = Object.fromEntries(new FormData(form));
  const servico = SERVICOS.find((s) => s.slug === d.ato);
  const num = protocolo();
  const dataBR = new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const texto = `*Pedido de agendamento ${num}*\n\n`
    + `Ato: ${servico?.titulo || d.ato}\nForma: ${d.forma}\n`
    + `Preferência: ${dataBR}, às ${d.hora}\n\n`
    + `Nome: ${d.nome}\nWhatsApp: ${d.telefone}\nE-mail: ${d.email}\n`
    + (d.obs ? `\nObservação: ${d.obs}\n` : '')
    + `\nEnviado pelo site.`;

    rastrear('agendamento_enviado', { ato: d.ato, forma: d.forma });
  localStorage.setItem('ultimo-agendamento', JSON.stringify({ ...d, num, servico: servico?.titulo }));

  document.querySelectorAll('#passos li').forEach((li) => {
    li.classList.add('feito'); li.removeAttribute('aria-current');
  });
  form.hidden = true;
  const recibo = $('#recibo');
  recibo.hidden = false;
  recibo.innerHTML = `
    <div class="resumo">
      <p class="olho">${icone('check-circ')} Pedido registrado</p>
      <h2 style="font-size:var(--t-2xl)">Protocolo ${num}</h2>
      <p class="texto-2">Falta um passo: envie o pedido para a equipe. A confirmação do horário vem em até um dia útil.</p>
      <dl class="mt-5">
        <dt>Ato</dt><dd>${servico?.titulo || d.ato}</dd>
        <dt>Forma</dt><dd>${d.forma}</dd>
        <dt>Preferência</dt><dd>${dataBR}, às ${d.hora}</dd>
        <dt>Contato</dt><dd>${d.nome} · ${d.telefone} · ${d.email}</dd>
      </dl>
      <div class="linha mt-5">
        <a class="botao botao--whats botao--g" href="${whatsappUrl(texto)}" target="_blank" rel="noopener">
          ${icone('whatsapp')} Enviar pedido pelo WhatsApp</a>
        <a class="botao botao--contorno" href="mailto:cartorio@23notasrj.com?subject=${encodeURIComponent(`Agendamento ${num}`)}&body=${encodeURIComponent(texto.replace(/\*/g, ''))}">
          ${icone('email')} Enviar por e-mail</a>
        <button class="botao botao--contorno" type="button" onclick="print()">${icone('impressora')} Imprimir</button>
      </div>
      ${servico ? `<p class="mt-5 pequeno">Enquanto isso, <a href="${urlAto(servico.slug)}#documentos">confira a lista de documentos</a> deste ato.</p>` : ''}
    </div>`;
  recibo.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

mostrar(0);
