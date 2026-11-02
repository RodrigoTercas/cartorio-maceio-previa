/* 7ª Circunscrição — Casamento e Notas · protótipo interativo.
   Script clássico (não módulo) de propósito: abre por file:// sem servidor. */
(() => {
'use strict';
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const ic = (n) => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
const norm = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const WA = '5582993812394';
const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const guarda = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('m7-' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('m7-' + k, JSON.stringify(v)); } catch { /* modo privado */ } },
};
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('ver'), 3200); }
const dataBR = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/* ------------------------------------------------------------------ dados
   Conteúdo extraído do site atual; [*] marca o que foi atualizado ou incluído. */
const SERVICOS = [
  { id: 'escritura', cat: 'Notas', nome: 'Escritura de compra e venda, doação e outras', online: true,
    resumo: 'Documento lavrado em cartório que oficializa transações imobiliárias, doações e outros atos jurídicos, com segurança e validade perante terceiros.',
    docs: ['Documentos pessoais (RG e CPF) de todas as partes', 'Certidão de matrícula do imóvel atualizada', 'Comprovante de pagamento do ITBI (compra e venda) ou do ITCMD (doação)', 'Certidões de nascimento, casamento ou óbito, conforme o estado civil das partes'],
    tags: ['casa', 'apartamento', 'imovel', 'terreno', 'lote', 'comprar', 'vender', 'venda', 'doar', 'doacao', 'escritura'] },
  { id: 'inventario', cat: 'Notas', nome: 'Inventário e partilha extrajudicial', online: true,
    resumo: 'Partilha dos bens de quem faleceu, feita em cartório quando os herdeiros estão de acordo. Com herdeiro menor ou incapaz também é possível, nas condições da Resolução CNJ 571/2024.',
    docs: ['Documentos pessoais do(a) falecido(a) e de todos os herdeiros', 'Certidão de óbito', 'Escritura de união estável, se houver', 'Documentos dos bens (matrículas, veículos, saldos bancários)', 'Plano de partilha', 'Advogado(a) ou defensor(a) público(a) — assistência obrigatória'],
    tags: ['heranca', 'falecimento', 'morte', 'espolio', 'partilha', 'herdeiro', 'inventario'] },
  { id: 'divorcio', cat: 'Notas', nome: 'Divórcio consensual', online: true,
    resumo: 'Divórcio em cartório, rápido, quando o casal está de acordo. Havendo filhos menores, é possível se guarda, convivência e alimentos já estiverem resolvidos na Justiça (Res. CNJ 571/2024).',
    docs: ['Certidão de casamento atualizada', 'Documentos pessoais (RG e CPF) dos dois', 'Pacto antenupcial, se houver', 'Documentos dos bens a partilhar, se houver', 'Advogado(a) ou defensor(a) público(a) — assistência obrigatória'],
    tags: ['separacao', 'separar', 'fim do casamento', 'divorcio'] },
  { id: 'uniao', cat: 'Notas', nome: 'União estável — declaração e dissolução', online: true,
    resumo: 'Formaliza a convivência do casal, define o regime de bens e dá segurança para planos de saúde, previdência e herança.',
    docs: ['Documentos pessoais (RG e CPF) dos dois', 'Certidão de nascimento, ou de casamento com averbação do divórcio', 'Comprovante de residência', 'Regime de bens escolhido'],
    tags: ['morar junto', 'companheiro', 'companheira', 'namorado', 'convivencia', 'uniao estavel'] },
  { id: 'pacto', cat: 'Notas', nome: 'Pacto antenupcial', online: true, novo: true,
    resumo: 'Escritura obrigatória para casar em regime diferente da comunhão parcial. É feita antes da habilitação do casamento.',
    docs: ['Documentos pessoais (RG e CPF) dos noivos', 'Certidões de nascimento, ou de casamento com averbação do divórcio', 'Regime escolhido e cláusulas desejadas'],
    tags: ['regime de bens', 'separacao total', 'comunhao universal', 'pacto'], acao: ['Simular casamento', '#casamento'] },
  { id: 'procuracao', cat: 'Notas', nome: 'Procuração pública', online: true,
    resumo: 'Concede poderes a alguém para agir em seu nome — bancos, imóveis, INSS e outros. Também substabelecimento e revogação.',
    docs: ['Documentos pessoais do outorgante (quem dá os poderes)', 'Nome completo, CPF e estado civil do procurador', 'Especificação dos poderes a conceder'],
    tags: ['representar', 'poderes', 'procurador', 'banco', 'inss', 'revogar'] },
  { id: 'testamento', cat: 'Notas', nome: 'Testamento público',
    resumo: 'Assegura a sua vontade sobre a distribuição de bens e direitos depois do falecimento, com a segurança do tabelião.',
    docs: ['Documento de identidade e CPF do testador', 'Indicação dos beneficiários e dos bens', 'Duas testemunhas maiores de idade, com documento com foto'],
    tags: ['ultima vontade', 'deixar bens', 'heranca em vida', 'testamento'] },
  { id: 'firma', cat: 'Notas', nome: 'Reconhecimento de firma',
    resumo: 'Atesta a autenticidade da assinatura de um documento. Primeira vez aqui? A ficha de firma é aberta na hora.',
    docs: ['Documento original a ser reconhecido', 'Documento de identidade com foto de quem assina', 'Ficha de firma no cartório (aberta no atendimento, se ainda não houver)'],
    tags: ['assinatura', 'reconhecer assinatura', 'carro', 'veiculo', 'dut', 'contrato', 'firma'] },
  { id: 'autenticacao', cat: 'Notas', nome: 'Autenticação de documentos',
    resumo: 'Certifica que a cópia corresponde fielmente ao original, para uso com validade legal.',
    docs: ['Documento original', 'Cópia a ser autenticada (ou a cópia é feita aqui)'],
    tags: ['xerox', 'copia autenticada', 'copia', 'autenticar'] },
  { id: 'apostila', cat: 'Notas', nome: 'Apostilamento de Haia', novo: true,
    resumo: 'Certifica a autenticidade de documento público brasileiro para uso nos países da Convenção da Apostila.',
    docs: ['Documento original (certidão, diploma, contrato…)', 'País de destino do documento'],
    tags: ['exterior', 'haia', 'estrangeiro', 'cidadania', 'intercambio', 'apostila'] },
  { id: 'casamento', cat: 'Registro civil', nome: 'Casamento civil ou religioso com efeito civil',
    resumo: 'Habilitação e celebração do casamento — no espaço do cartório, em outro local ou com efeito civil em cerimônia religiosa.',
    docs: ['Documentos pessoais (RG e CPF) dos noivos', 'Certidão de nascimento atualizada', 'Comprovante de residência', 'Duas testemunhas maiores de idade', 'Divorciado(a) ou viúvo(a): certidão com averbação do divórcio ou certidão de óbito do cônjuge'],
    tags: ['casar', 'casamento', 'noivos', 'habilitacao', 'proclamas', 'religioso', 'igreja'], acao: ['Simular meu casamento', '#casamento'] },
  { id: 'nascimento', cat: 'Registro civil', nome: 'Registro de nascimento', gratis: true,
    resumo: 'Garante a identidade civil do recém-nascido e o acesso a serviços públicos. O registro e a primeira certidão são gratuitos.',
    docs: ['Declaração de Nascido Vivo (DNV) fornecida pelo hospital', 'Documentos pessoais (RG e CPF) dos pais', 'Certidão de casamento dos pais, se casados', 'Pais não casados: presença do pai ou documento de reconhecimento de paternidade'],
    tags: ['bebe', 'filho', 'filha', 'recem nascido', 'dnv', 'nascimento'] },
  { id: 'obito', cat: 'Registro civil', nome: 'Registro de óbito', gratis: true,
    resumo: 'Formaliza o falecimento e permite as providências seguintes, como o inventário. O registro e a primeira certidão são gratuitos.',
    docs: ['Declaração de Óbito (DO) emitida pelo médico ou hospital', 'Documentos pessoais do(a) falecido(a)', 'Documentos do declarante (RG e CPF)'],
    tags: ['falecimento', 'morte', 'faleceu', 'obito', 'enterro'] },
  { id: 'nome', cat: 'Registro civil', nome: 'Alteração de nome',
    resumo: 'Mudança de prenome direto no cartório, uma vez, sem processo judicial (Lei 14.382/2022); inclusão de sobrenome de família e adequação de gênero.',
    docs: ['Documento de identidade e CPF', 'Certidão de nascimento ou de casamento', 'Comprovantes que justifiquem a alteração, quando exigidos', 'Decisão judicial, quando aplicável'],
    tags: ['mudar nome', 'prenome', 'sobrenome', 'genero', 'nome social', 'trocar nome'] },
  { id: 'retificacao', cat: 'Registro civil', nome: 'Retificação de registro',
    resumo: 'Corrige erros em registros civis — digitação, datas incorretas ou informações incompletas.',
    docs: ['Documento de identidade e CPF', 'Certidão a ser corrigida', 'Documentos que comprovem a informação correta', 'Decisão judicial, quando necessária'],
    tags: ['erro', 'corrigir', 'errado', 'retificar', 'certidao errada'] },
  { id: 'segunda-via', cat: 'Certidões e digital', nome: '2ª via de certidão',
    resumo: 'Certidões de nascimento, casamento e óbito em breve relato ou inteiro teor, com pedido on-line.',
    docs: ['Documento de identidade do solicitante', 'Nome de quem consta no registro e data aproximada', 'Cartório onde foi feito o registro'],
    tags: ['segunda via', 'certidao', 'copia da certidao', 'inteiro teor'], acao: ['Montar pedido', '#certidoes'] },
  { id: 'outros-cartorios', cat: 'Certidões e digital', nome: 'Certidão de outros cartórios',
    resumo: 'A equipe solicita certidões de cartórios de outras cidades e estados, sem você precisar se deslocar.',
    docs: ['Tipo de certidão (nascimento, casamento, óbito…)', 'Nome completo das pessoas envolvidas', 'Cartório e cidade onde foi registrado'],
    tags: ['outra cidade', 'outro estado', 'certidao de fora'] },
  { id: 'certificado', cat: 'Certidões e digital', nome: 'Certificado digital ICP-Brasil',
    resumo: 'Emissão de certificado digital para assinaturas eletrônicas e acesso a sistemas do governo.',
    docs: ['Documento de identidade (RG ou CNH) e CPF', 'Comprovante de residência atualizado', 'Outros documentos conforme o tipo de certificado'],
    tags: ['e-cpf', 'ecpf', 'e-cnpj', 'token', 'certificado digital', 'assinatura digital'] },
  { id: 'enotariado', cat: 'Certidões e digital', nome: 'e-Notariado e certificado notarizado', online: true,
    resumo: 'Atos notariais por videoconferência, com a mesma validade do balcão. O certificado notarizado é gratuito.',
    docs: ['Documentos pessoais (RG e CPF)', 'Pré-cadastro preenchido', 'Celular com câmera para a videochamada'],
    tags: ['online', 'on-line', 'videoconferencia', 'assinar a distancia', 'notarizado', 'remoto'], acao: ['Fazer pré-cadastro', '#enotariado'] },
];
const POR_ID = Object.fromEntries(SERVICOS.map((s) => [s.id, s]));
const CATS = ['Notas', 'Registro civil', 'Certidões e digital'];

const FAQ = [
  ['Quais documentos são necessários para o casamento civil?', 'RG, CPF, certidão de nascimento atualizada, comprovante de residência e duas testemunhas maiores de idade. Divorciados apresentam a certidão de casamento com averbação do divórcio. O simulador monta a lista exata para o caso de vocês.'],
  ['Quanto tempo leva a habilitação de casamento?', 'Com a documentação completa, o certificado de habilitação sai em até 5 dias (Lei 6.015/73, art. 67, § 1º) e vale por 90 dias para a celebração (Código Civil, art. 1.532).'],
  ['Como faço para reconhecer firma em um documento?', 'Por autenticidade, quando você assina na presença do tabelião, ou por semelhança, quando a assinatura é comparada à ficha já existente no cartório. Se for a primeira vez, abrimos a ficha na hora.'],
  ['Qual a diferença entre união estável e casamento?', 'A união estável é a convivência pública e duradoura do casal, que pode ser formalizada por escritura. O casamento é um ato solene, registrado, que produz direitos e deveres imediatos e altera o estado civil.'],
  ['O que é necessário para fazer o divórcio no cartório?', 'Consenso entre o casal e assistência de advogado(a). Havendo filhos menores ou incapazes, a via extrajudicial é admitida quando guarda, convivência e alimentos já estiverem resolvidos judicialmente (Resolução CNJ 571/2024). Leve a certidão de casamento atualizada, os documentos pessoais e, se houver bens, a proposta de partilha.'],
  ['O que é uma procuração e quando ela é necessária?', 'É o documento que dá a alguém poderes para agir em seu nome — em bancos, na venda de um imóvel, junto ao INSS e em outras situações. Pode ter poderes gerais ou específicos.'],
  ['O que é o apostilamento de Haia?', 'É a certificação que dá validade internacional a um documento público brasileiro nos países da Convenção da Apostila — certidões, diplomas, contratos.'],
  ['Como faço para autenticar uma cópia?', 'Traga o documento original. O tabelião confere e autentica a cópia, que passa a valer como o original para fins legais.'],
  ['Preciso agendar para ser atendido?', 'O atendimento pode ser por ordem de chegada, mas o agendamento on-line evita espera. Casamento, divórcio e inventário pedem agendamento prévio para análise dos documentos.'],
  ['O registro de nascimento é pago?', 'Não. O registro de nascimento e o de óbito, com a primeira certidão de cada um, são gratuitos (Lei 9.534/1997).'],
];

const MELHORIAS = [
  ['Simulador de casamento', 'Checklist por noivo(a), regime de bens com as regras do Código Civil e datas de entrada calculadas. Hoje: só um botão para o WhatsApp.', '#casamento'],
  ['Assistente “qual serviço preciso?”', 'Duas perguntas levam ao ato certo.', 'assistente'],
  ['Busca que entende o cidadão', '“casa”, “herança”, “carro”, “morar junto” chegam ao serviço certo.', '#inicio'],
  ['Checklist que salva o progresso', 'Marca o que já separou e envia pelo WhatsApp só o que falta. Hoje: lista estática + “envie cópias para o Gmail”.', '#servicos'],
  ['Agendamento em 4 etapas com protocolo', 'Forma de atendimento conforme o ato, bloqueio de fim de semana e feriados, recibo por WhatsApp, e-mail ou impressão.', '#atendimento'],
  ['2ª via de certidão guiada', 'Monta o pedido e direciona ao Registro Civil on-line ou à equipe.', '#certidoes'],
  ['Calculadora de custas', 'Emolumentos da Lei estadual 9.778/2025 + TSNR, item a item, para 17 atos. Hoje: nada.', '#atendimento'],
  ['“Meus pedidos”', 'O cidadão revê e reenvia o que pediu, sem cadastro.', '#atendimento'],
  ['Horário ao vivo', '“Aberto agora · fecha às 12h” no topo, no hero e no contato.', '#contato'],
  ['Nome unificado', '“7ª Circunscrição — Casamento e Notas”. Hoje o site usa três nomes e escreve “7º”.', '#inicio'],
  ['Conteúdo jurídico atualizado', 'Res. CNJ 571/2024 (divórcio e inventário com menores), Lei 14.382/2022 (prenome e habilitação), gratuidade do nascimento e óbito.', '#duvidas'],
  ['Depoimentos', 'A seção de depoimentos do site atual está vazia; no lugar, um convite para avaliar no Google.', '#duvidas'],
  ['Sem erros de programação', 'O site atual dispara erro de JavaScript em todas as páginas.', '#inicio'],
  ['Mais leve', 'Foto principal de 314 KB para 117 KB (63 KB no celular); ícones em SVG no lugar de fonte de 128 KB; fontes no próprio site.', '#inicio'],
  ['Acessibilidade', 'Tamanho da letra (A− / A+), tema escuro, navegação por teclado e respeito a “reduzir movimento”.', '#topo'],
];

/* ------------------------------------------------------------------ utilidades de página */
$$('[data-whats]').forEach((a) => { a.href = wa(a.dataset.whats); a.target = '_blank'; a.rel = 'noopener'; });
$('#ano').textContent = new Date().getFullYear();

// tema e tamanho da letra
$('#bt-tema').addEventListener('click', () => {
  const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
  document.documentElement.dataset.tema = novo; guarda.set('tema', novo);
  try { localStorage.setItem('m7-tema', novo); } catch {}
});
$$('[data-fonte]').forEach((b) => b.addEventListener('click', () => {
  const atual = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--escala')) || 1;
  const nova = Math.min(1.3, Math.max(.9, +(atual + .1 * b.dataset.fonte).toFixed(1)));
  document.documentElement.style.setProperty('--escala', nova);
  try { localStorage.setItem('m7-escala', nova); } catch {}
  toast(`Tamanho da letra: ${Math.round(nova * 100)}%`);
}));

// menu no celular
const topo = $('#topo');
$('#bt-menu').addEventListener('click', (e) => {
  const aberto = topo.classList.toggle('aberto'); e.currentTarget.setAttribute('aria-expanded', aberto);
});
$$('#menu a').forEach((a) => a.addEventListener('click', () => { topo.classList.remove('aberto'); $('#bt-menu').setAttribute('aria-expanded', 'false'); }));

// diálogos: fechar pelo botão e pelo fundo
$$('dialog').forEach((d) => {
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-fechar]')) d.close(); });
});

// parallax da foto (só com movimento liberado)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = $('.hero'), foto = $('.hero picture'); let agendado = false;
  addEventListener('scroll', () => {
    if (agendado) return; agendado = true;
    requestAnimationFrame(() => { agendado = false; if (scrollY < hero.offsetHeight) foto.style.setProperty('--paralaxe', (scrollY * .25).toFixed(1) + 'px'); });
  }, { passive: true });
}

/* ------------------------------------------------------------------ horário ao vivo */
// Maceió não tem horário de verão: o fuso fixo evita depender do relógio do visitante estar em AL.
function estadoAgora() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Maceio', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const h = +p.hour + +p.minute / 60, util = dia >= 1 && dia <= 5;
  if (util && ((h >= 8 && h < 12) || (h >= 14 && h < 17))) return [true, `Aberto agora · fecha às ${h < 12 ? '12h' : '17h'}`];
  if (util && h < 8) return [false, 'Fechado · abre hoje às 8h'];
  if (util && h >= 12 && h < 14) return [false, 'Intervalo · reabre às 14h'];
  return [false, `Fechado · abre ${dia === 5 || dia === 6 || dia === 0 ? 'segunda' : 'amanhã'} às 8h`];
}
function pintarEstado() {
  const [aberto, txt] = estadoAgora();
  $('#estado-topo').classList.toggle('aberto', aberto); $('#estado-topo span').textContent = txt;
  $('#estado-hero').textContent = txt; $('#estado-contato').textContent = txt + ' (exceto feriados)';
}
pintarEstado(); setInterval(pintarEstado, 60000);

/* ------------------------------------------------------------------ checklist persistente */
function idDoc(t) { let h = 5381; for (const c of t) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'd' + Math.abs(h).toString(36); }
function checklistHTML(docs) {
  return `<ul class="checklist">${docs.map((d) => { const id = idDoc(d); return `<li><input type="checkbox" id="${id}" data-doc><label for="${id}">${esc(d)}</label></li>`; }).join('')}</ul>`;
}
function ligarChecklist(raiz, chave, aoMudar) {
  const salvos = new Set(guarda.get('docs-' + chave, []));
  const caixas = $$('[data-doc]', raiz);
  caixas.forEach((c) => { c.checked = salvos.has(c.id); });
  const rot = (c) => $(`label[for="${c.id}"]`, raiz).textContent;
  const atualizar = () => {
    const m = caixas.filter((c) => c.checked);
    guarda.set('docs-' + chave, m.map((c) => c.id));
    aoMudar({ total: caixas.length, feitos: m.length, faltando: caixas.filter((c) => !c.checked).map(rot) });
  };
  caixas.forEach((c) => c.addEventListener('change', atualizar)); atualizar();
}

/* ------------------------------------------------------------------ busca */
function pontuar(s, alvo) {
  const n = norm(s.nome);
  if (n.startsWith(alvo)) return 90;
  if (n.includes(alvo)) return 70;
  const i = s.tags.findIndex((t) => norm(t).includes(alvo) || alvo.includes(norm(t)));
  if (i >= 0) return 55 - i;          // sinônimo mais cedo na lista = mais característico do ato
  if (norm(s.resumo).includes(alvo)) return 15;
  return 0;
}
const buscar = (termo) => { const a = norm(termo).trim(); if (a.length < 2) return [];
  return SERVICOS.map((s) => [s, pontuar(s, a)]).filter((x) => x[1] > 0).sort((x, y) => y[1] - x[1]).map((x) => x[0]); };

(function buscaHero() {
  const campo = $('#busca-hero'), lista = $('#res-hero'); let marc = -1;
  const fechar = () => { lista.hidden = true; campo.setAttribute('aria-expanded', 'false'); };
  const desenhar = () => {
    const r = buscar(campo.value).slice(0, 7); marc = -1;
    if (!campo.value.trim()) return fechar();
    lista.innerHTML = r.length
      ? r.map((s) => `<li role="option"><button type="button" data-servico="${s.id}">${esc(s.nome)}<small>${s.cat}</small></button></li>`).join('')
      : `<li class="busca__vazio">Nada para “${esc(campo.value)}”. <a href="${wa('Olá! Não encontrei no site: ' + campo.value)}" target="_blank" rel="noopener">Pergunte no WhatsApp</a>.</li>`;
    lista.hidden = false; campo.setAttribute('aria-expanded', 'true');
  };
  campo.addEventListener('input', desenhar);
  campo.addEventListener('keydown', (e) => {
    const bs = $$('button', lista);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!bs.length) return;
      marc = (marc + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
      bs.forEach((b, i) => b.setAttribute('aria-selected', i === marc));
    } else if (e.key === 'Enter' && marc >= 0) { e.preventDefault(); bs[marc].click(); }
    else if (e.key === 'Escape') fechar();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.busca')) fechar(); });
})();

/* ------------------------------------------------------------------ catálogo + diálogo do serviço */
let filtro = 'Todos';
function cardServico(s) {
  return `<button class="card card--clic" type="button" data-servico="${s.id}">
    <span class="tag">${s.cat}</span><h3>${esc(s.nome)}</h3><p>${esc(s.resumo)}</p>
    <span class="card__pe">${s.online ? `<span class="tag tag--on">${ic('video')} Pode ser on-line</span>` : ''}${s.gratis ? '<span class="tag tag--gratis">Gratuito</span>' : ''}<span class="mini">${s.docs.length} documentos</span></span></button>`;
}
function desenharCatalogo() {
  const t = norm($('#busca-cat').value).trim();
  let lista = t.length >= 2 ? buscar(t) : SERVICOS;
  if (filtro === 'On-line') lista = lista.filter((s) => s.online);
  else if (filtro !== 'Todos') lista = lista.filter((s) => s.cat === filtro);
  $('#contagem').textContent = `${lista.length} ${lista.length === 1 ? 'serviço' : 'serviços'}`;
  $('#lista-servicos').innerHTML = lista.map(cardServico).join('') || `<p class="sub">Nenhum serviço com esse termo. <a href="${wa('Olá! Procuro um serviço: ' + t)}" target="_blank" rel="noopener">Pergunte no WhatsApp</a>.</p>`;
}
$('#filtros').innerHTML = ['Todos', ...CATS, 'On-line'].map((c) => `<button class="filtro" type="button" aria-pressed="${c === 'Todos'}" data-f="${c}">${c === 'On-line' ? 'Pode ser on-line' : c}</button>`).join('');
$('#filtros').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return;
  filtro = b.dataset.f; $$('[data-f]').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenharCatalogo(); });
$('#busca-cat').addEventListener('input', desenharCatalogo);
desenharCatalogo();

function abrirServico(id) {
  const s = POR_ID[id]; if (!s) return;
  const d = $('#dlg-servico');
  $('#dlg-cat').textContent = s.cat; $('#dlg-titulo').textContent = s.nome;
  $('#dlg-corpo').innerHTML = `<p>${esc(s.resumo)}</p>
    <p class="card__pe" style="padding:0;margin:0 0 1rem">${s.online ? `<span class="tag tag--on">${ic('video')} Pode ser feito por videoconferência</span>` : ''}${s.gratis ? '<span class="tag tag--gratis">Gratuito por lei</span>' : ''}</p>
    <h3>Documentos necessários</h3><p class="mini" style="margin:0">Marque o que já separou — fica salvo neste aparelho.</p>
    <div class="progresso"><i></i></div><p class="mini" data-prog style="margin:0 0 .4rem"></p>
    ${checklistHTML(s.docs)}
    <div class="acoes">
      <span style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="bt bt--whats bt--p" data-enviar target="_blank" rel="noopener">${ic('whatsapp')} Enviar o que falta</a>
      <button class="bt bt--linha bt--p" type="button" onclick="print()">${ic('impressora')} Imprimir</button></span>
      <span style="display:flex;gap:.5rem;flex-wrap:wrap">${s.acao ? `<a class="bt bt--ouro bt--p" href="${s.acao[1]}" data-fechar-ir>${s.acao[0]}</a>` : ''}
      <button class="bt bt--p" type="button" data-agendar="${s.id}">${ic('agenda')} Agendar</button></span>
    </div>`;
  ligarChecklist(d, s.id, ({ total, feitos, faltando }) => {
    $('.progresso i', d).style.width = (100 * feitos / total) + '%';
    $('[data-prog]', d).textContent = `${feitos} de ${total} separados`;
    $('[data-enviar]', d).href = wa(`Olá! Vou precisar de: ${s.nome}.\n\n` + (faltando.length ? 'Ainda estou reunindo:\n' + faltando.map((f) => '• ' + f).join('\n') : 'Já tenho todos os documentos da lista.') + '\n\nPodem me orientar?');
  });
  d.showModal();
}
document.addEventListener('click', (e) => {
  const sv = e.target.closest('[data-servico]'); if (sv) { $('#dlg-assistente').close(); abrirServico(sv.dataset.servico); return; }
  const ag = e.target.closest('[data-agendar]'); if (ag) { $('#dlg-servico').close(); irPara('agendar', ag.dataset.agendar); return; }
  if (e.target.closest('[data-fechar-ir]')) $$('dialog[open]').forEach((d) => d.close());
  const ab = e.target.closest('[data-abrir="assistente"]'); if (ab) { e.preventDefault(); assistente('inicio', []); $('#dlg-assistente').showModal(); }
  const aba = e.target.closest('[data-aba]'); if (aba) trocarAba(aba.dataset.aba);
});

/* ------------------------------------------------------------------ assistente */
const ARVORE = {
  inicio: ['O que você quer resolver?', [
    ['Casar ou formalizar a união', 'cas'], ['Comprar, vender ou doar um bem', 'bem'], ['Divórcio, herança ou testamento', 'fam'],
    ['Certidão, registro ou correção', 'reg'], ['Assinatura, cópia ou documento para o exterior', 'doc'], ['Dar poderes a alguém ou fazer on-line', 'pod']]],
  cas: ['Qual é o plano?', [['Casar no civil ou no religioso com efeito civil', ['casamento']], ['Formalizar a união estável', ['uniao']], ['Casar em regime de bens diferente', ['pacto', 'casamento']]]],
  bem: ['Que tipo de transferência?', [['Venda ou doação de imóvel', ['escritura']], ['Bens de alguém que faleceu', ['inventario']], ['Veículo', ['firma']]]],
  fam: ['Qual é a situação?', [['Fim do casamento', ['divorcio']], ['Alguém da família faleceu', ['inventario', 'obito']], ['Organizar a sucessão em vida', ['testamento']]]],
  reg: ['O que você precisa?', [['2ª via de certidão', ['segunda-via', 'outros-cartorios']], ['Registrar nascimento ou óbito', ['nascimento', 'obito']], ['Corrigir um erro no registro', ['retificacao']], ['Mudar o nome', ['nome']]]],
  doc: ['O que precisa ser validado?', [['Minha assinatura', ['firma']], ['Uma cópia', ['autenticacao']], ['Documento para usar no exterior', ['apostila']]]],
  pod: ['O que você quer?', [['Que alguém aja em meu nome', ['procuracao']], ['Assinar atos por videoconferência', ['enotariado']], ['Certificado digital', ['certificado', 'enotariado']]]],
};
function assistente(no, trilha) {
  const [perg, ops] = ARVORE[no], corpo = $('#ass-corpo');
  corpo.innerHTML = `<p class="legenda">${perg}</p><div class="opcoes">${ops.map((o, i) => `<button type="button" class="opcao" data-op="${i}" style="text-align:left;font:inherit;color:inherit">${ic('seta-dir')}<span><b>${o[0]}</b></span></button>`).join('')}</div>
    ${trilha.length ? '<div class="acoes"><button class="bt bt--linha" type="button" data-volta>Voltar</button><span></span></div>' : ''}`;
  $$('[data-op]', corpo).forEach((b) => b.addEventListener('click', () => {
    const alvo = ops[+b.dataset.op][1];
    if (typeof alvo === 'string') return assistente(alvo, [...trilha, no]);
    corpo.innerHTML = `<p class="olho">Resultado</p><p class="legenda">Para “${ops[+b.dataset.op][0]}”:</p>
      <div class="grade" style="gap:.7rem">${alvo.map((id) => cardServico(POR_ID[id])).join('')}</div>
      <div class="acoes"><button class="bt bt--linha" type="button" data-volta>Voltar</button>
      <a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa('Olá! O assistente do site indicou: ' + alvo.map((id) => POR_ID[id].nome).join(', ') + '. Podem confirmar?')}">Confirmar com a equipe</a></div>`;
    $('[data-volta]', corpo).addEventListener('click', () => assistente(no, trilha));
  }));
  $('[data-volta]', corpo)?.addEventListener('click', () => assistente(trilha.at(-1), trilha.slice(0, -1)));
}

/* ------------------------------------------------------------------ simulador de casamento */
(function simulador() {
  const f = $('#form-casamento'), etapas = $$('.etapa', f), passos = $$('#passos-cas li');
  let atual = 0;
  const v = () => {
    const d = new FormData(f);
    return { ec: [d.get('ec1'), d.get('ec2')], id: [+d.get('id1'), +d.get('id2')], estr: d.get('estrangeiro') === 'on',
      partilha: d.get('partilhaFeita') === 'on', local: d.get('local'), data: d.get('data'), regime: d.get('regime') };
  };
  const ROT = { parcial: 'Comunhão parcial', universal: 'Comunhão universal', separacao: 'Separação de bens', aquestos: 'Participação final nos aquestos' };
  const LOC = { cartorio: 'No espaço de casamentos do cartório', diligencia: 'Em outro local (diligência)', religioso: 'Religioso com efeito civil' };
  const dataCampo = $('#data-cas'); dataCampo.min = iso(somaDias(new Date(), 1));

  function revisarVoce() {
    const x = v(); $('#part-pendente').hidden = !x.ec.some((e) => e !== 'solteiro');
    $$('#form-casamento .erro').forEach((e) => e.remove());
    let ok = true;
    ['id1', 'id2'].forEach((n, i) => {
      const c = f.elements[n], idade = x.id[i];
      const ruim = !idade || idade < 16 || idade > 110;
      c.setAttribute('aria-invalid', ruim);
      if (ruim) { ok = false; c.insertAdjacentHTML('afterend', `<span class="erro">${idade && idade < 16 ? 'A lei não permite o casamento antes dos 16 anos (Código Civil, art. 1.520).' : 'Informe a idade.'}</span>`); }
    });
    return ok;
  }
  // Regras que a lei impõe ao regime, na ordem em que o cidadão precisa saber delas
  function alertasRegime(x) {
    const a = [];
    const suspensiva = x.ec.some((e) => e !== 'solteiro') && !x.partilha;
    if (suspensiva) a.push(['alerta', 'Sem a partilha (ou o inventário) do casamento anterior, a lei impõe a <b>separação obrigatória de bens</b> (Código Civil, arts. 1.523 e 1.641, I) — salvo se provada a ausência de prejuízo. Vale concluir a partilha antes.']);
    if (x.id.some((i) => i >= 70)) a.push(['alerta', 'Para quem tem 70 anos ou mais, a lei prevê a separação obrigatória (CC, art. 1.641, II), mas o STF admite afastá-la por escritura pública (Tema 1.236). O pacto antenupcial resolve.']);
    if (x.regime !== 'parcial') a.push(['', `<b>${ROT[x.regime]}</b> exige <b>pacto antenupcial</b> por escritura pública, feito antes da habilitação (CC, arts. 1.640, parágrafo único, e 1.653). Este cartório lavra o pacto.`]);
    return a;
  }
  const htmlAlertas = (a) => a.map(([t, m]) => `<div class="aviso ${t ? 'aviso--alerta' : ''}">${ic('alerta')}<p>${m}</p></div>`).join('');
  f.addEventListener('change', () => { revisarVoceSilencioso(); if (atual === 2) $('#aviso-regime').innerHTML = htmlAlertas(alertasRegime(v())); });
  function revisarVoceSilencioso() { $('#part-pendente').hidden = !v().ec.some((e) => e !== 'solteiro'); }

  function documentos(x) {
    const docs = ['Documento com foto e CPF de cada noivo(a)', 'Comprovante de residência de cada noivo(a)', 'Duas testemunhas maiores de 18 anos, com documento com foto'];
    x.ec.forEach((e, i) => {
      const q = `(noivo(a) ${i + 1})`;
      if (e === 'solteiro') docs.push(`Certidão de nascimento atualizada ${q}`);
      if (e === 'divorciado') { docs.push(`Certidão de casamento com averbação do divórcio ${q}`); if (x.partilha) docs.push(`Comprovante da partilha de bens do casamento anterior ${q}`); }
      if (e === 'viuvo') { docs.push(`Certidão do casamento anterior e certidão de óbito do cônjuge ${q}`); if (x.partilha) docs.push(`Comprovante do inventário e partilha ${q}`); }
      if (x.id[i] < 18) docs.push(`Autorização de ambos os pais ou responsáveis legais, com os documentos deles ${q} — CC, art. 1.517`);
    });
    if (x.estr) docs.push('Estrangeiro(a): passaporte ou documento de identidade do país de origem', 'Estrangeiro(a): certidão de nascimento apostilada (ou legalizada) e traduzida por tradutor juramentado', 'Estrangeiro(a): prova do estado civil emitida no país de origem, apostilada e traduzida');
    if (x.regime !== 'parcial' || x.id.some((i) => i >= 70)) docs.push('Escritura de pacto antenupcial (lavrada antes da habilitação)');
    if (x.local === 'diligencia') docs.push('Endereço e horário do local da cerimônia');
    if (x.local === 'religioso') docs.push('Nome da autoridade religiosa e do templo da celebração');
    return docs;
  }

  function resultado() {
    const x = v(), docs = documentos(x), hoje = new Date();
    const pacto = x.regime !== 'parcial' || x.id.some((i) => i >= 70);
    let datas = '<li><b>Dê entrada quando tiver os documentos</b><span>O certificado sai em até 5 dias e vale por 90.</span></li>';
    let aperto = '';
    if (x.data) {
      const alvo = new Date(x.data + 'T12:00:00');
      const ini = somaDias(alvo, -90), fim = somaDias(alvo, -10);      // margem de 5 dias além dos 5 do certificado
      const iniReal = ini < hoje ? hoje : ini;
      if (fim < hoje) aperto = `<div class="aviso aviso--alerta">${ic('alerta')}<p>Prazo apertado: para ${dataBR(alvo)} a entrada precisaria ser imediata. Fale com a equipe hoje mesmo.</p></div>`;
      datas = `<li><b>Entrada da habilitação</b><span>Entre ${dataBR(iniReal)} e ${dataBR(fim < hoje ? hoje : fim)}</span></li>
        <li><b>Certificado de habilitação</b><span>Em até 5 dias com a documentação completa (Lei 6.015/73, art. 67, § 1º)</span></li>
        <li><b>Validade do certificado</b><span>90 dias para celebrar (CC, art. 1.532)</span></li>
        <li><b>O grande dia</b><span>${dataBR(alvo)} · ${LOC[x.local].toLowerCase()}</span></li>`;
    }
    $('#resultado-cas').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Seu roteiro</p>
      <dl><dt>Noivos</dt><dd>${x.ec.map((e, i) => `${{ solteiro: 'solteiro(a)', divorciado: 'divorciado(a)', viuvo: 'viúvo(a)' }[e]}, ${x.id[i]} anos`).join(' · ')}${x.estr ? ' · um(a) estrangeiro(a)' : ''}</dd>
      <dt>Cerimônia</dt><dd>${LOC[x.local]}</dd><dt>Regime</dt><dd>${ROT[x.regime]}${pacto ? ' — com pacto antenupcial' : ''}</dd></dl></div>
      ${htmlAlertas(alertasRegime(x))}${aperto}
      <h3 style="margin-top:1.3rem">Linha do tempo</h3>
      <ol class="linha-tempo">${pacto ? '<li><b>Pacto antenupcial</b><span>Escritura no cartório, antes da habilitação</span></li>' : ''}${datas}</ol>
      <h3>Documentos de vocês</h3><div class="progresso"><i></i></div><p class="mini" data-prog></p>
      ${checklistHTML(docs)}
      <div class="acoes"><span style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a class="bt bt--whats" id="cas-enviar" target="_blank" rel="noopener">${ic('whatsapp')} Enviar roteiro</a>
        <button class="bt bt--linha" type="button" onclick="print()">${ic('impressora')} Imprimir</button></span>
        <button class="bt bt--ouro" type="button" data-agendar="casamento">${ic('agenda')} Agendar a habilitação</button></div>
      <p class="mini">Orientação geral com base na lei. A equipe confere o caso de vocês antes da habilitação.</p>`;
    ligarChecklist($('#resultado-cas'), 'casamento', ({ total, feitos, faltando }) => {
      $('#resultado-cas .progresso i').style.width = (100 * feitos / total) + '%';
      $('#resultado-cas [data-prog]').textContent = `${feitos} de ${total} separados`;
      $('#cas-enviar').href = wa(`Olá! Simulei nosso casamento no site.\n• Cerimônia: ${LOC[x.local]}\n• Regime: ${ROT[x.regime]}${x.data ? `\n• Data desejada: ${dataBR(new Date(x.data + 'T12:00:00'))}` : ''}\n\nAinda reunindo:\n${faltando.map((d) => '• ' + d).join('\n') || '(tudo pronto)'}`);
    });
  }

  function mostrar(i) {
    atual = i; etapas.forEach((e, k) => { e.hidden = k !== i; });
    passos.forEach((p, k) => { p.className = k < i ? 'feito' : k === i ? 'atual' : ''; });
    $('#cas-voltar').hidden = i === 0;
    $('#cas-seguir').textContent = i === 2 ? 'Ver meu roteiro' : i === 3 ? 'Recomeçar' : 'Continuar';
    if (i === 2) $('#aviso-regime').innerHTML = htmlAlertas(alertasRegime(v()));
    if (i === 3) resultado();
  }
  $('#cas-seguir').addEventListener('click', () => {
    if (atual === 0 && !revisarVoce()) return;
    if (atual === 3) { f.reset(); revisarVoceSilencioso(); return mostrar(0); }
    mostrar(atual + 1);
    $('#casamento').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  $('#cas-voltar').addEventListener('click', () => mostrar(Math.max(0, atual - 1)));
  f.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') { e.target.setAttribute('aria-invalid', 'false'); e.target.nextElementSibling?.classList.contains('erro') && e.target.nextElementSibling.remove(); } });
})();

/* ------------------------------------------------------------------ galeria */
(function galeria() {
  const fotos = Array.from({ length: 8 }, (_, i) => `assets/espaco-${i + 1}.webp`);
  $('#galeria').innerHTML = fotos.map((src, i) => `<button type="button" data-foto="${i}" aria-label="Ampliar foto ${i + 1} do espaço de casamentos"><img src="${src}" alt="" loading="lazy" width="720" height="720"></button>`).join('');
  const dlg = $('#dlg-foto'), img = $('#foto-grande'); let i = 0;
  const ver = (n) => { i = (n + fotos.length) % fotos.length; img.src = fotos[i]; img.alt = `Espaço de casamentos — foto ${i + 1} de ${fotos.length}`; };
  $('#galeria').addEventListener('click', (e) => { const b = e.target.closest('[data-foto]'); if (b) { ver(+b.dataset.foto); dlg.showModal(); } });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ver(i + 1); if (e.key === 'ArrowLeft') ver(i - 1); });
  img.addEventListener('click', () => ver(i + 1));
})();

/* ------------------------------------------------------------------ pedidos (agendamentos, certidões, orçamentos) */
function protocolo(prefixo) { const d = new Date(); return `${prefixo}-${iso(d).replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`; }
function registrarPedido(p) { const l = guarda.get('pedidos', []); l.unshift({ ...p, quando: new Date().toISOString() }); guarda.set('pedidos', l.slice(0, 30)); desenharPedidos(); }
function desenharPedidos() {
  const l = guarda.get('pedidos', []);
  $('#n-pedidos').textContent = l.length ? `(${l.length})` : '';
  $('#lista-pedidos').innerHTML = l.length ? l.map((p, k) => `<div class="pedido"><span><b>${esc(p.tipo)}</b> · ${esc(p.prot)}<br><small>${esc(p.resumo)} · ${new Date(p.quando).toLocaleDateString('pt-BR')}</small></span>
      <a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa(p.texto)}">Reenviar</a><button class="bt bt--linha bt--p" type="button" data-remover="${k}">Remover</button></div>`).join('')
    : '<p class="sub" style="font-size:.95rem">Nenhum pedido ainda. Agendamentos e certidões feitos aqui aparecem nesta lista.</p>';
}
$('#lista-pedidos').addEventListener('click', (e) => { const b = e.target.closest('[data-remover]'); if (!b) return;
  const l = guarda.get('pedidos', []); l.splice(+b.dataset.remover, 1); guarda.set('pedidos', l); desenharPedidos(); });
desenharPedidos();
function concluir(form, tipo, prefixo, resumo, texto) {
  const prot = protocolo(prefixo), msg = `*${tipo} ${prot}*\n\n${texto}\n\nEnviado pelo site.`;
  registrarPedido({ tipo, prot, resumo, texto: msg });
  window.open(wa(msg), '_blank', 'noopener');
  toast(`${tipo} ${prot} registrado — confira o WhatsApp`);
  return prot;
}
// Valida só o que é exigido; aria-invalid reflete o estado atual e é limpo ao corrigir
function validar(form) {
  let ok = true;
  $$('[required]', form).forEach((c) => { const bom = c.checkValidity() && !c.dataset.regra; c.setAttribute('aria-invalid', !bom); if (!bom) ok = false; });
  if (!ok) $('[aria-invalid="true"]', form).focus();
  return ok;
}
document.addEventListener('input', (e) => { const c = e.target; if (c.getAttribute?.('aria-invalid') === 'true' && c.checkValidity() && !c.dataset.regra) c.setAttribute('aria-invalid', 'false'); });

// abas
function trocarAba(nome) {
  $$('.aba').forEach((a) => { const sel = a.id === 'aba-' + nome; a.setAttribute('aria-selected', sel); $('#' + a.getAttribute('aria-controls')).hidden = !sel; });
}
$$('.aba').forEach((a) => a.addEventListener('click', () => trocarAba(a.id.slice(4))));
function irPara(aba, servico) {
  trocarAba(aba);
  if (servico) { $('#ag-servico').value = servico; }
  $('#atendimento').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#ag-data').focus({ preventScroll: true }), 500);
}

// agendamento
(function agendar() {
  const f = $('#pn-agendar'), sel = $('#ag-servico'), data = $('#ag-data');
  sel.innerHTML = '<option value="">Escolha o serviço…</option>' + CATS.map((c) => `<optgroup label="${c}">${SERVICOS.filter((s) => s.cat === c).map((s) => `<option value="${s.id}">${s.nome}</option>`).join('')}</optgroup>`).join('');
  const horas = []; for (const [a, b] of [[8, 12], [14, 17]]) for (let h = a; h < b; h += .5) horas.push(`${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`);
  $('#ag-hora').innerHTML = horas.map((h) => `<option>${h}</option>`).join('');
  data.min = iso(somaDias(new Date(), 1)); data.max = iso(somaDias(new Date(), 60));
  data.addEventListener('change', () => {
    const d = new Date(data.value + 'T12:00:00').getDay(), fds = d === 0 || d === 6;
    data.dataset.regra = fds ? '1' : ''; if (!fds) delete data.dataset.regra;
    data.setAttribute('aria-invalid', fds);
    data.parentElement.querySelector('.erro')?.remove();
    if (fds) data.insertAdjacentHTML('afterend', '<span class="erro">O cartório atende de segunda a sexta. Escolha um dia útil.</span>');
  });
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validar(f)) return;
    const x = Object.fromEntries(new FormData(f)), s = POR_ID[x.servico], quando = `${dataBR(new Date(x.data + 'T12:00:00'))}, às ${x.hora}`;
    concluir(f, 'Agendamento', 'AG', `${s.nome} · ${quando}`, `Serviço: ${s.nome}\nForma: ${x.forma}\nPreferência: ${quando}\nNome: ${x.nome}\nWhatsApp: ${x.tel}`);
    f.reset();
  });
})();

// orçamento
(function orcamento() {
  const f = $('#pn-orcamento'), valor = $('#orc-valor');
  $('#orc-ato').innerHTML = '<option value="">Escolha o ato…</option>' + SERVICOS.filter((s) => s.cat === 'Notas').map((s) => `<option value="${s.id}">${s.nome}</option>`).join('');
  valor.addEventListener('input', () => { const n = valor.value.replace(/\D/g, '').slice(0, 13); valor.value = n ? (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''; });
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validar(f)) return;
    const x = Object.fromEntries(new FormData(f)), s = POR_ID[x.ato];
    concluir(f, 'Orçamento', 'OR', s.nome + (x.valor ? ` · ${x.valor}` : ''), `Ato: ${s.nome}${x.valor ? `\nValor do negócio: ${x.valor}` : ''}${x.cidade ? `\nMunicípio do imóvel: ${x.cidade}` : ''}\nNome: ${x.nome}${x.obs ? `\nDetalhes: ${x.obs}` : ''}`);
    f.reset();
  });
})();

// 2ª via de certidão
(function certidao() {
  const f = $('#form-certidao'), onde = $('#cert-onde');
  onde.addEventListener('change', () => { $('#cert-cartorio').hidden = onde.value !== 'outro'; });
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validar(f)) return;
    const x = Object.fromEntries(new FormData(f));
    const tipo = { casamento: 'Casamento', nascimento: 'Nascimento', obito: 'Óbito' }[x.tipo];
    const daqui = x.onde === 'aqui';
    const texto = `Certidão de ${tipo} — ${x.modelo}\nNome no registro: ${x.nome}${x.data ? `\nData aproximada: ${x.data}` : ''}\nRegistro: ${daqui ? 'neste cartório' : x.onde === 'outro' ? (x.serventia || 'outro cartório') : 'não sei onde'}`;
    const prot = protocolo('CE'); const msg = `*Pedido de certidão ${prot}*\n\n${texto}\n\nEnviado pelo site.`;
    registrarPedido({ tipo: 'Certidão', prot, resumo: `${tipo} · ${x.nome}`, texto: msg });
    $('#cert-saida').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Pedido ${prot} montado</p><p style="margin:0 0 .8rem">${esc(texto).replace(/\n/g, '<br>')}</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">${daqui ? `<a class="bt bt--ouro" target="_blank" rel="noopener" href="https://www.registrocivil.net/2873?targetForm=T">Pedir pelo Registro Civil on-line</a>` : ''}
      <a class="bt bt--whats" target="_blank" rel="noopener" href="${wa(msg)}">${ic('whatsapp')} ${daqui ? 'Ou pelo WhatsApp' : 'Enviar à equipe'}</a></div>
      ${daqui ? '' : '<p class="mini" style="margin:.7rem 0 0">Registros de outros cartórios: a equipe solicita à serventia de origem pela central nacional.</p>'}</div>`;
    toast(`Pedido ${prot} salvo em “Meus pedidos”`);
  });
})();

/* ------------------------------------------------------------------ e-Notariado, FAQ, apresentação */
$('#lista-online').innerHTML = SERVICOS.filter((s) => s.online).map((s) => `<li>${ic('check')}<span>${esc(s.nome)}</span></li>`).join('');

$('#lista-faq').innerHTML = FAQ.map(([p, r]) => `<details class="faq" name="faq"><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join('');
$('#busca-faq').addEventListener('input', (e) => {
  const a = norm(e.target.value); let n = 0;
  $$('details.faq').forEach((d) => { const ok = !a || norm(d.textContent).includes(a); d.hidden = !ok; if (ok) n++; if (a && ok) d.open = n === 1; });
  $('#faq-vazio').hidden = n > 0;
});

$('#lista-apres').innerHTML = MELHORIAS.map(([t, d, alvo]) => `<li><b>${t}</b><span>${d}</span><br>${alvo === 'assistente' ? '<a href="#" data-abrir="assistente">Ver no protótipo →</a>' : `<a href="${alvo}" data-ir-apres>Ver no protótipo →</a>`}</li>`).join('');
const apres = $('#apres'), btApres = $('#bt-apres');
const alternarApres = (abrir) => { apres.classList.toggle('aberto', abrir); btApres.setAttribute('aria-expanded', abrir); };
btApres.addEventListener('click', () => alternarApres(!apres.classList.contains('aberto')));
$('#apres-fechar').addEventListener('click', () => alternarApres(false));
apres.addEventListener('click', (e) => { if (e.target.closest('[data-ir-apres],[data-abrir]') && innerWidth < 700) alternarApres(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { alternarApres(false); topo.classList.remove('aberto'); } });
})();
