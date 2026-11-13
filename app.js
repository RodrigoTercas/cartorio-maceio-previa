/* 7ª Circunscrição — Casamento e Notas · protótipo interativo.
   Script clássico (não módulo) de propósito: abre por file:// sem servidor. */
(() => {
'use strict';
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const ic = (n) => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
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
// Arquivo .ics (RFC 5545) com um ou mais eventos; {titulo, data} = dia inteiro, {titulo, inicio, fim} = com hora local
function baixarICS(nome, eventos) {
  const txt = (t) => String(t).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&');
  const dia = (d) => iso(d).replace(/-/g, ''), hora = (d) => dia(d) + 'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00';
  const agora = new Date().toISOString().replace(/[-:]|\.\d+/g, '');
  const l = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//7a Circunscricao Casamento e Notas Maceio//PT', 'METHOD:PUBLISH'];
  eventos.forEach((ev, i) => l.push('BEGIN:VEVENT', `UID:${agora}-${i}@casamentoenotasmaceio`, `DTSTAMP:${agora}`, `SUMMARY:${txt(ev.titulo)}`,
    ev.inicio ? `DTSTART;TZID=America/Maceio:${hora(ev.inicio)}` : `DTSTART;VALUE=DATE:${dia(ev.data)}`,
    ev.inicio ? `DTEND;TZID=America/Maceio:${hora(ev.fim)}` : `DTEND;VALUE=DATE:${dia(somaDias(ev.data, 1))}`,
    ev.local ? `LOCATION:${txt(ev.local)}` : '', ev.desc ? `DESCRIPTION:${txt(ev.desc)}` : '',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${txt(ev.titulo)}`, `TRIGGER:${ev.alarme || '-P1D'}`, 'END:VALARM', 'END:VEVENT'));
  l.push('END:VCALENDAR');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([l.filter(Boolean).join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const ENDERECO = 'R. Eng. Roberto Gonçalves Menezes, 63 — Centro, Maceió/AL, 57020-680';

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
const FERIADOS = {"2026-01-01": "Confraternização Universal (nacional)", "2026-04-03": "Sexta-feira da Paixão (municipal)", "2026-04-21": "Tiradentes (nacional)", "2026-05-01": "Dia do Trabalho (nacional)", "2026-06-04": "Corpus Christi (municipal)", "2026-06-24": "São João (estadual)", "2026-06-29": "Marechal Floriano Peixoto (municipal)", "2026-08-27": "Nossa Senhora dos Prazeres (municipal)", "2026-09-07": "Independência do Brasil (nacional)", "2026-09-16": "Emancipação Política de Alagoas (estadual)", "2026-10-12": "Nossa Senhora Aparecida (nacional)", "2026-11-02": "Finados (nacional)", "2026-11-15": "Proclamação da República (nacional)", "2026-11-20": "Dia Nacional de Zumbi e da Consciência Negra (nacional)", "2026-11-30": "Dia Estadual do Evangélico (estadual)", "2026-12-08": "Nossa Senhora da Conceição (municipal)", "2026-12-25": "Natal (nacional)"}; // 2026 — Leis 662/49, 6.802/80, 9.093/95, 14.759/23; Dec. mun. Maceió 10.234/25. Ampliar a cada ano.
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
  ['Calculadora de custas', 'Emolumentos da Lei estadual 9.778/2025 + TSNR, item a item, para 17 atos; link ao simulador oficial do TJAL e regras de formação do valor. Hoje: nada.', '#atendimento'],
  ['“Meus pedidos”', 'O cidadão revê e reenvia o que pediu, sem cadastro.', '#atendimento'],
  ['Horário ao vivo', '“Aberto agora · fecha às 12h” no topo, no hero e no contato.', '#contato'],
  ['Nome unificado', '“7ª Circunscrição — Casamento e Notas”. Hoje o site usa três nomes e escreve “7º”.', '#inicio'],
  ['Conteúdo jurídico atualizado', 'Res. CNJ 571/2024 (divórcio e inventário com menores), Lei 14.382/2022 (prenome e habilitação), gratuidade do nascimento e óbito.', '#duvidas'],
  ['Depoimentos', 'A seção de depoimentos do site atual está vazia; no lugar, um convite para avaliar no Google.', '#duvidas'],
  ['Sem erros de programação', 'O site atual dispara erro de JavaScript em todas as páginas.', '#inicio'],
  ['Mais leve', 'Foto principal de 314 KB para 117 KB (63 KB no celular); ícones em SVG no lugar de fonte de 128 KB; fontes no próprio site.', '#inicio'],
  ['Acessibilidade', 'Tamanho da letra (A− / A+), tema escuro, navegação por teclado e respeito a “reduzir movimento”.', '#topo'],
  ['Feriados', 'Aviso “Fechado hoje · feriado” no topo e bloqueio no agendamento; calendário de 2026 e plantão do registro civil no Contato.', '#feriados'],
  ['Ouvidoria com protocolo', 'OUV-AAAAMMDD-NNNN, prazo de 30 dias (Lei 13.460/2017) e canais externos: TJAL, Corregedoria e CNJ.', '#ouvidoria'],
  ['Avaliação do atendimento', 'Nota de 1 a 5; nota alta convida a avaliar no Google, nota baixa encaminha à ouvidoria.', '#avaliacao'],
  ['Glossário', '23 termos de cartório em linguagem simples, com base legal e busca.', '#glossario'],
  ['Empresas e advogados', 'Documentos da pessoa jurídica com checklist e pedido de atendimento recorrente.', '#empresas'],
  ['Guia em inglês e espanhol', 'Casamento com estrangeiro, apostilas e atos notariais, para quem não fala português.', '#estrangeiros'],
  ['Transparência', 'Produtividade da serventia no Justiça Aberta (CNJ) e dados do selo digital (TJAL).', '#transparencia'],
  ['Verificar documento', 'Selo digital do TJAL, apostila da Haia, certidão digital e atos do e-Notariado — cada um na consulta oficial, com o código já copiado.', '#verificar'],
  ['Acompanhar pedido', 'Pelo protocolo, as etapas do agendamento, da certidão ou da ouvidoria. No site definitivo, a equipe atualiza o andamento.', '#atendimento'],
  ['Agenda visual', 'Calendário com dias úteis, feriados bloqueados e horários livres/ocupados (ocupação simulada no protótipo).', '#atendimento'],
  ['Trilha do casamento', 'Progresso persistente em 5 etapas: simulação, documentos, habilitação agendada, certificado, cerimônia — na home e na seção.', '#casamento'],
  ['Tour guiado', 'Sete passos pelo protótipo, acionado no hero ou neste painel.', '#inicio'],
  ['Links úteis', 'Doze portais oficiais (TJAL, Registro Civil, e-Proclamas, e-Notariado, CENSEC, Busca Testamento…) e o formulário de habilitação em PDF.', '#links'],
  ['Certidão de ato notarial', 'Pedido de certidão de escritura, procuração, ata ou testamento, com protocolo CN- e aviso de sigilo para testamento.', '#certidoes'],
  ['Pré-cadastro', 'Dados das pessoas do ato, com CPF validado, guardados só no aparelho; gera o resumo impresso e preenche o agendamento.', '#atendimento'],
  ['Religioso com efeito civil e diligência', 'Prazo de 90 dias para registrar o termo religioso (CC, art. 1.516) e o acréscimo da tabela para cerimônia fora do cartório.', '#casamento'],
  ['Cartório × Justiça', 'Divórcio e inventário lado a lado: requisitos, advogado, prazo e custas calculadas.', '#atendimento'],
  ['Aplicativo instalável (PWA)', 'Manifesto + service worker: ícone na tela inicial e o site abre sem internet, com as simulações guardadas.', '#privacidade'],
  ['Privacidade e LGPD', 'O que fica no aparelho, o que nunca é enviado, direitos do titular e botão que apaga tudo que o site guardou.', '#privacidade'],
  ['Endereço pelo CEP', 'No pré-cadastro, digitar o CEP preenche rua, bairro, cidade e UF (ViaCEP, serviço público).', '#atendimento'],
  ['Avisos do navegador', 'Com sua permissão, o site avisa quando a etapa de um pedido muda — demonstrado no “simular próxima etapa”.', '#atendimento'],
  ['Compartilhar', 'Roteiro do casamento, recibo e pedidos saem pela folha nativa de compartilhamento do celular.', '#casamento'],
  ['Parcelamento', 'Na calculadora, o valor em 3, 6 e 12 vezes (meio eletrônico, inclusive parcelado — Lei 8.935/1994, art. 30, XV).', '#atendimento'],
  ['Pergunte ao tabelião', 'Dúvida que o FAQ não resolve vira pergunta com protocolo PT- e prazo de resposta.', '#duvidas'],
  ['Novidades e números', 'Cards com as mudanças legais recentes; contadores animados e estimativa de movimento na home.', '#inicio'],
  ['Mapa sob demanda', 'O mapa do Google só carrega quando você clica — sem rastreador antes disso.', '#contato'],
  ['Tema automático e animações', 'Segue o tema claro/escuro do sistema; blocos surgem ao rolar, respeitando “reduzir movimento”.', '#inicio'],
  ['Lembretes no calendário', 'Arquivo .ics do agendamento (com alarme 2 h antes) e das datas do casamento: entrada da habilitação e cerimônia.', '#casamento'],
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
  const h = +p.hour + +p.minute / 60;
  const hojeISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Maceio' }).format(new Date());
  if (FERIADOS[hojeISO]) return [false, `Fechado hoje · feriado: ${FERIADOS[hojeISO].replace(/ \(.*\)$/, '')}`];
  const util = dia >= 1 && dia <= 5;
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
  // Sinônimo exato vence até prefixo do nome ("casa" é imóvel, não casamento); inteiro vence prefixo, que vence palavra solta dentro da frase. Trecho de
  // palavra não conta: "casar" contém "casa" e jogava a escritura acima do casamento.
  // Sinônimo mais cedo na lista = mais característico do ato.
  let melhor = 0;
  s.tags.forEach((t, i) => {
    const n = norm(t);
    const pontos = n === alvo ? 96 : n.startsWith(alvo) ? 52 : new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(alvo) ? 42 : 0;
    if (pontos) melhor = Math.max(melhor, pontos - i);
  });
  if (melhor) return melhor;
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
  const aba = e.target.closest('[data-aba]'); if (aba) { trocarAba(aba.dataset.aba); if (aba.dataset.aba === 'custas') custas.escolher(''); }
  const cu = e.target.closest('[data-custas]'); if (cu) { e.preventDefault(); location.hash = '#atendimento'; trocarAba('custas'); custas.escolher(cu.dataset.custas); const l = $('#cu-local'); if (l) { l.value = 'urbana'; l.dispatchEvent(new Event('change', { bubbles: true })); } }
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
const simuladorCas = (function simulador() {
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

  function alertasLocal(x) {
    if (x.local === 'religioso') return [['', '<b>Religioso com efeito civil:</b> a habilitação é a mesma do casamento civil e o cartório entrega o certificado ao celebrante. O termo da celebração deve ser levado a registro em <b>até 90 dias</b> (CC, art. 1.516, § 1º). Celebraram sem habilitar antes? Ainda dá para registrar, com habilitação posterior (§ 2º).']];
    if (x.local === 'diligencia') return [['', '<b>Cerimônia fora do cartório:</b> acréscimo da tabela — R$ 63,35 na zona urbana (RCPN 1.3) ou R$ 164,94 na zona rural, em fim de semana ou feriado (RCPN 1.4). <a href="#atendimento" data-custas="casamento">Ver o cálculo</a>.']];
    return [];
  }
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
    if (x.local === 'religioso') docs.push('Nome da autoridade religiosa e do templo da celebração', 'Termo da celebração religiosa assinado pelo celebrante, pelos noivos e por duas testemunhas (para o registro)');
    return docs;
  }

  function resultado() {
    const x = v(), docs = documentos(x), hoje = new Date();
    guarda.set('trilha', { ...guarda.get('trilha', {}), x, quando: new Date().toISOString() }); desenharTrilha();
    const pacto = x.regime !== 'parcial' || x.id.some((i) => i >= 70);
    let datas = '<li><b>Dê entrada quando tiver os documentos</b><span>O certificado sai em até 5 dias e vale por 90.</span></li>';
    let aperto = ''; const eventos = [];
    if (x.data) {
      const alvo = new Date(x.data + 'T12:00:00');
      const ini = somaDias(alvo, -90), fim = somaDias(alvo, -10);      // margem de 5 dias além dos 5 do certificado
      const iniReal = ini < hoje ? hoje : ini;
      if (fim < hoje) aperto = `<div class="aviso aviso--alerta">${ic('alerta')}<p>Prazo apertado: para ${dataBR(alvo)} a entrada precisaria ser imediata. Fale com a equipe hoje mesmo.</p></div>`;
      datas = `<li><b>Entrada da habilitação</b><span>Entre ${dataBR(iniReal)} e ${dataBR(fim < hoje ? hoje : fim)}</span></li>
        <li><b>Certificado de habilitação</b><span>Em até 5 dias com a documentação completa (Lei 6.015/73, art. 67, § 1º)</span></li>
        <li><b>Validade do certificado</b><span>90 dias para celebrar (CC, art. 1.532)</span></li>
        <li><b>O grande dia</b><span>${dataBR(alvo)} · ${LOC[x.local].toLowerCase()}</span></li>${x.local === 'religioso' ? `<li><b>Registro do casamento religioso</b><span>Até ${dataBR(somaDias(alvo, 90))} — levar o termo ao cartório (CC, art. 1.516, § 1º)</span></li>` : ''}`;
      if (x.local === 'religioso') eventos.push({ titulo: 'Prazo para registrar o casamento religioso', data: somaDias(alvo, 90), desc: 'Levar o termo da celebração ao cartório (CC, art. 1.516, § 1º).', alarme: '-P7D' });
      eventos.push({ titulo: 'Dar entrada na habilitação de casamento', data: iniReal, local: ENDERECO, desc: `Entrada entre ${dataBR(iniReal)} e ${dataBR(fim < hoje ? hoje : fim)}. Documentos conforme o roteiro do site. WhatsApp (82) 99381-2394.`, alarme: '-P2D' },
        { titulo: 'Último dia para a entrada da habilitação', data: fim < hoje ? hoje : fim, desc: 'Margem para o certificado (até 5 dias) sair antes da cerimônia.' },
        { titulo: 'Casamento', data: alvo, local: x.local === 'cartorio' ? ENDERECO : '', desc: `${LOC[x.local]} · regime: ${ROT[x.regime]}`, alarme: '-P7D' });
    }
    $('#resultado-cas').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Seu roteiro</p>
      <dl><dt>Noivos</dt><dd>${x.ec.map((e, i) => `${{ solteiro: 'solteiro(a)', divorciado: 'divorciado(a)', viuvo: 'viúvo(a)' }[e]}, ${x.id[i]} anos`).join(' · ')}${x.estr ? ' · um(a) estrangeiro(a)' : ''}</dd>
      <dt>Cerimônia</dt><dd>${LOC[x.local]}</dd><dt>Regime</dt><dd>${ROT[x.regime]}${pacto ? ' — com pacto antenupcial' : ''}</dd></dl></div>
      ${htmlAlertas(alertasRegime(x).concat(alertasLocal(x)))}${aperto}
      <h3 style="margin-top:1.3rem">Linha do tempo</h3>
      <ol class="linha-tempo">${pacto ? '<li><b>Pacto antenupcial</b><span>Escritura no cartório, antes da habilitação</span></li>' : ''}${datas}</ol>
      <h3>Documentos de vocês</h3><div class="progresso"><i></i></div><p class="mini" data-prog></p>
      ${checklistHTML(docs)}
      <div class="acoes"><span style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a class="bt bt--whats" id="cas-enviar" target="_blank" rel="noopener">${ic('whatsapp')} Enviar roteiro</a>
        <button class="bt bt--linha" type="button" onclick="print()">${ic('impressora')} Imprimir</button>
        <a class="bt bt--linha" href="assets/docs/formulario-habilitacao-casamento.pdf" target="_blank" rel="noopener">${ic('arquivo')} Formulário (PDF)</a>
        ${eventos.length ? `<button class="bt bt--linha" type="button" id="cas-ics">${ic('agenda')} Lembretes no calendário</button>` : ''}
        <button class="bt bt--linha" type="button" id="cas-compartilhar" data-compartilhar="Nosso roteiro de casamento" data-texto="">Compartilhar</button></span>
        <button class="bt bt--ouro" type="button" data-agendar="casamento">${ic('agenda')} Agendar a habilitação</button></div>
      <p class="mini">Orientação geral com base na lei. A equipe confere o caso de vocês antes da habilitação.</p>`;
    $('#cas-ics')?.addEventListener('click', () => { baixarICS('casamento-lembretes.ics', eventos); toast('Lembretes salvos — abra o arquivo no seu calendário'); });
    ligarChecklist($('#resultado-cas'), 'casamento', ({ total, feitos, faltando }) => {
      $('#resultado-cas .progresso i').style.width = (100 * feitos / total) + '%';
      $('#resultado-cas [data-prog]').textContent = `${feitos} de ${total} separados`; guarda.set('trilha', { ...guarda.get('trilha', {}), docs: [feitos, total] }); desenharTrilha();
      $('#cas-compartilhar').dataset.texto = `Roteiro do casamento — ${LOC[x.local]} · ${ROT[x.regime]}${x.data ? ` · ${dataBR(new Date(x.data + 'T12:00:00'))}` : ''}. Faltam: ${faltando.join(', ') || 'nada'}.`;
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
    $('#form-casamento').scrollIntoView({ block: 'start' });
  });
  $('#cas-voltar').addEventListener('click', () => mostrar(Math.max(0, atual - 1)));
  f.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') { e.target.setAttribute('aria-invalid', 'false'); e.target.nextElementSibling?.classList.contains('erro') && e.target.nextElementSibling.remove(); } });
  // repõe no formulário o que foi simulado e abre direto no roteiro
  function retomar(x) {
    f.elements.ec1.value = x.ec[0]; f.elements.ec2.value = x.ec[1]; f.elements.id1.value = x.id[0]; f.elements.id2.value = x.id[1];
    if (f.elements.estrangeiro) f.elements.estrangeiro.checked = x.estr; if (f.elements.partilhaFeita) f.elements.partilhaFeita.checked = x.partilha;
    f.elements.local.value = x.local; f.elements.data.value = x.data || ''; f.elements.regime.value = x.regime;
    revisarVoceSilencioso(); mostrar(3); f.scrollIntoView({ block: 'start' });
  }
  return { retomar, recomecar() { f.reset(); revisarVoceSilencioso(); mostrar(0); } };
})();

/* ------------------------------------------------------------------ trilha do casamento (progresso persistente) */
function desenharTrilha() {
  const t = guarda.get('trilha', null), alvo = $('#trilha-cas'), casa = $('#trilha-home');
  if (!t) { alvo.hidden = casa.hidden = true; return; }
  const [df, dt] = t.docs || [0, 0];
  const agendado = guarda.get('pedidos', []).some((p) => p.tipo === 'Agendamento' && /^Casamento/.test(p.resumo));
  const dia = t.x.data ? new Date(t.x.data + 'T12:00:00') : null, passou = dia && dia < new Date();
  const etapas = [['Simulação feita', `${new Date(t.quando).toLocaleDateString('pt-BR')} · ${t.x.regime === 'parcial' ? 'comunhão parcial' : t.x.regime}`, true],
    ['Documentos reunidos', dt ? `${df} de ${dt} separados` : 'marque no checklist do roteiro', dt > 0 && df === dt],
    ['Habilitação agendada', agendado ? 'pedido em “Meus pedidos”' : 'agende a entrada dos documentos', agendado],
    ['Certificado de habilitação', t.certificado ? 'recebido' : 'vale 90 dias (CC, art. 1.532)', !!t.certificado],
    ['Cerimônia', dia ? dataBR(dia) : 'data a definir', !!passou]];
  const feitos = etapas.filter((e) => e[2]).length, atual = etapas.findIndex((e) => !e[2]);
  const pct = Math.round(100 * feitos / etapas.length);
  casa.hidden = false; casa.innerHTML = `<div class="trilha"><span>${ic('aneis-p')}</span><span><b>Seu casamento: ${feitos} de ${etapas.length} etapas</b><small class="mini">Próxima: ${atual < 0 ? 'tudo feito — parabéns!' : etapas[atual][0].toLowerCase()}</small></span><div class="progresso"><i style="width:${pct}%"></i></div><a class="bt bt--p" href="#casamento">Continuar</a></div>`;
  alvo.hidden = false; alvo.innerHTML = `<div class="painel" style="margin-bottom:1.2rem"><p class="olho">Sua trilha</p><div class="progresso"><i style="width:${pct}%"></i></div>
    <ol class="trilha-etapas">${etapas.map((e, i) => `<li class="${e[2] ? 'feito' : i === atual ? 'atual' : ''}">${e[0]}<span>${esc(e[1])}</span></li>`).join('')}</ol>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="bt bt--p" type="button" data-trilha="retomar">Ver meu roteiro</button>
      ${agendado ? '' : '<button class="bt bt--linha bt--p" type="button" data-agendar="casamento">Agendar a habilitação</button>'}
      ${t.certificado ? '' : '<button class="bt bt--linha bt--p" type="button" data-trilha="certificado">Recebi o certificado</button>'}
      <button class="bt bt--linha bt--p" type="button" data-trilha="recomecar">Recomeçar do zero</button></div></div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-trilha]'); if (!b) return;
  const t = guarda.get('trilha', null); if (!t) return;
  if (b.dataset.trilha === 'retomar') simuladorCas.retomar(t.x);
  if (b.dataset.trilha === 'certificado') { guarda.set('trilha', { ...t, certificado: true }); desenharTrilha(); toast('Certificado anotado — agora é só marcar a data'); }
  if (b.dataset.trilha === 'recomecar' && confirm('Apagar a simulação e o checklist salvos neste aparelho?')) { guarda.set('trilha', null); guarda.set('docs-casamento', []); simuladorCas.recomecar(); desenharTrilha(); }
});
desenharTrilha();

/* ------------------------------------------------------------------ tour guiado */
const TOUR = [
  ['#busca-hero', 'inicio', null, 'Busca que entende o cidadão', 'Escreva “casa”, “herança” ou “morar junto”: a busca leva ao serviço certo, com os documentos.'],
  ['#atalhos .atalho[href="#casamento"]', 'inicio', null, 'Simulador de casamento', 'Três perguntas e o casal recebe a lista exata de documentos, o regime de bens e as datas de entrada.'],
  ['#ag-dias', 'atendimento', 'agendar', 'Agenda visual', 'Dias úteis clicáveis, feriados bloqueados e horários livres ou ocupados. O pedido gera protocolo e arquivo para o calendário.'],
  ['#cu-ato', 'atendimento', 'custas', 'Custas na hora', 'Tabela da Lei 9.778/2025 item a item, com a TSNR, e link ao simulador oficial do TJAL.'],
  ['#form-acomp', 'atendimento', 'pedidos', 'Acompanhar pedido', 'Pelo protocolo, o cidadão vê em que etapa está o pedido — sem cadastro e sem ligar para o cartório.'],
  ['#verificar .card', 'verificar', null, 'Verificar documento', 'Selo digital, apostila, certidão digital e e-Notariado: cada um na consulta oficial, com o código já copiado.'],
  ['#bt-apres', 'inicio', null, 'O que mudou', 'Este painel lista as 25 melhorias em relação ao site atual, cada uma com link para ver no protótipo.'],
];
(function tour() {
  const caixa = $('#tour'); let i = -1, alvo = null;
  const limpar = () => { alvo?.classList.remove('tour-alvo'); alvo = null; };
  function ir(n) {
    limpar(); if (n < 0 || n >= TOUR.length) { caixa.hidden = true; i = -1; return; }
    i = n; const [sel, vista, aba, titulo, texto] = TOUR[n];
    if (location.hash !== '#' + vista) location.hash = vista;
    setTimeout(() => {
      if (aba) trocarAba(aba); if (aba === 'agendar') { $$('#form-ag .etapa')[2].hidden = false; agendamento.etapa(2); }
      alvo = $(sel); alvo?.classList.add('tour-alvo'); alvo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      $('#tour-passo').textContent = `Passo ${n + 1} de ${TOUR.length}`; $('#tour-titulo').textContent = titulo; $('#tour-texto').textContent = texto;
      $('#tour-ant').disabled = n === 0; $('#tour-prox').textContent = n === TOUR.length - 1 ? 'Concluir' : 'Próximo';
      caixa.hidden = false; $('#tour-prox').focus({ preventScroll: true });
    }, 60);
  }
  $$('[data-tour]').forEach((b) => b.addEventListener('click', () => { alternarApres(false); ir(0); }));
  $('#tour-prox').addEventListener('click', () => ir(i + 1)); $('#tour-ant').addEventListener('click', () => ir(i - 1)); $('#tour-fechar').addEventListener('click', () => ir(-1));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && i >= 0) ir(-1); });
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
      <button class="bt bt--linha bt--p" type="button" data-acomp="${esc(p.prot)}">Acompanhar</button><a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa(p.texto)}">Reenviar</a><button class="bt bt--linha bt--p" type="button" data-remover="${k}">Remover</button></div>`).join('')
    : '<p class="sub" style="font-size:.95rem">Nenhum pedido ainda. Agendamentos e certidões feitos aqui aparecem nesta lista.</p>';
}
$('#lista-pedidos').addEventListener('click', (e) => {
  const a = e.target.closest('[data-acomp]'); if (a) { $('#ac-prot').value = a.dataset.acomp; acompanhar(a.dataset.acomp); $('#ac-saida').scrollIntoView({ block: 'nearest' }); return; }
  const b = e.target.closest('[data-remover]'); if (!b) return;
  const l = guarda.get('pedidos', []); l.splice(+b.dataset.remover, 1); guarda.set('pedidos', l); desenharPedidos(); });
desenharPedidos();

// acompanhar pedido — etapas por tipo; só a 1ª é real aqui (registro no site). No site definitivo, a equipe avança as demais.
const ETAPAS = { Agendamento: ['Pedido registrado no site', 'Enviado à equipe', 'Horário confirmado', 'Atendimento realizado'],
  Certidão: ['Pedido registrado no site', 'Enviado à equipe', 'Registro localizado', 'Certidão emitida'],
  Ouvidoria: ['Manifestação registrada', 'Recebida pela serventia', 'Em apuração', 'Resposta enviada'],
  Empresa: ['Pedido registrado no site', 'Enviado à equipe', 'Contato da equipe', 'Atendimento recorrente ativo'],
  Pergunta: ['Pergunta registrada', 'Enviada à equipe', 'Em análise pelo tabelião', 'Respondida'] };
function acompanhar(prot) {
  const p = guarda.get('pedidos', []).find((q) => q.prot === prot), saida = $('#ac-saida');
  if (!p) { saida.innerHTML = `<div class="aviso aviso--alerta">${ic('alerta')}<p>Não encontramos <b>${esc(prot)}</b> neste aparelho — os pedidos ficam só no navegador em que foram feitos. <a target="_blank" rel="noopener" href="${wa(`Olá! Quero saber o andamento do pedido ${prot}.`)}">Perguntar à equipe pelo WhatsApp</a>.</p></div>`; return; }
  const etapas = ETAPAS[p.tipo] || ETAPAS.Agendamento, feita = p.etapa ?? 0;
  saida.innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} ${esc(p.tipo)} ${esc(p.prot)}</p><p style="margin:0">${esc(p.resumo)}</p>
    <ol class="linha-tempo">${etapas.map((t, i) => `<li class="${i <= feita ? 'feito' : 'pendente'}"><b>${t}</b><span>${i === 0 ? new Date(p.quando).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : i <= feita ? 'concluída' : 'a confirmar pela equipe'}</span></li>`).join('')}</ol>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa(`Olá! Quero saber o andamento do pedido ${p.prot}.`)}">${ic('whatsapp')} Perguntar o andamento</a>
      ${feita < etapas.length - 1 ? `<button class="bt bt--linha bt--p" type="button" data-avancar="${esc(p.prot)}">Simular próxima etapa</button>` : ''}
      ${'Notification' in window && Notification.permission !== 'granted' ? '<button class="bt bt--linha bt--p" type="button" id="ac-avisar">Avisar-me das etapas</button>' : ''}
      <button class="bt bt--linha bt--p" type="button" data-compartilhar="${esc(p.tipo + ' ' + p.prot)}" data-texto="${esc(p.texto)}">Compartilhar</button></div>
    <p class="mini" style="margin:.7rem 0 0">Protótipo: no site definitivo as etapas são atualizadas pela equipe; o botão “simular” só demonstra a tela.</p></div>`;
}
$('#form-acomp').addEventListener('submit', (e) => { e.preventDefault(); const c = $('#ac-prot'); c.value = c.value.trim().toUpperCase(); if (!validar(e.target)) return; acompanhar(c.value); });
$('#ac-saida').addEventListener('click', (e) => { const b = e.target.closest('[data-avancar]'); if (!b) return;
  const l = guarda.get('pedidos', []), p = l.find((q) => q.prot === b.dataset.avancar); if (!p) return;
  p.etapa = Math.min((ETAPAS[p.tipo] || ETAPAS.Agendamento).length - 1, (p.etapa ?? 0) + 1); guarda.set('pedidos', l); acompanhar(p.prot);
  if ('Notification' in window && Notification.permission === 'granted') setTimeout(() => new Notification(`${p.tipo} ${p.prot}`, { body: `Nova etapa: ${(ETAPAS[p.tipo] || ETAPAS.Agendamento)[p.etapa]}`, icon: 'assets/icone.svg' }), 800); });
$('#ac-saida').addEventListener('click', async (e) => { if (!e.target.closest('#ac-avisar')) return; const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Avisos ativados neste aparelho' : 'Sem permissão — os avisos ficam desligados'); if (r === 'granted') acompanhar($('#ac-prot').value); });

// verificar documento — copia o código e abre a consulta oficial (as páginas do TJAL e do CNJ não aceitam o código pela URL)
$$('[data-verificar]').forEach((f) => f.addEventListener('submit', async (e) => {
  e.preventDefault(); if (!validar(f)) return;
  const cod = f.elements.codigo.value.trim().toUpperCase(); f.elements.codigo.value = cod;
  try { await navigator.clipboard.writeText(cod); toast(`Código ${cod} copiado — cole na consulta oficial`); } catch (_) { toast('Abrindo a consulta oficial'); }
  window.open(f.dataset.verificar, '_blank', 'noopener');
}));
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
  if (servico && aba === 'agendar') agendamento.comecar(servico);
  if (servico && aba === 'custas') custas.escolher(servico);
  if (location.hash !== '#atendimento') location.hash = '#atendimento'; else scrollTo({ top: 0 });
}

/* ------------------------------------------------------------------ agendamento (4 etapas, como no site do Rio) */
const agendamento = (() => {
  const f = $('#form-ag'), etapas = $$('.etapa', f), passos = $$('#passos-ag li');
  const sel = $('#ag-servico'), data = $('#ag-data'); let atual = 0;
  sel.innerHTML = '<option value="">Escolha o serviço…</option>' + CATS.map((c) => `<optgroup label="${c}">${SERVICOS.filter((s) => s.cat === c).map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</optgroup>`).join('');
  const horas = []; for (const [a, b] of [[8, 12], [14, 17]]) for (let h = a; h < b; h += .5) horas.push(`${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`);
  const hora = $('#ag-hora'), min = iso(somaDias(new Date(), 1)), max = iso(somaDias(new Date(), 90));
  // agenda visual: mês navegável, dias úteis clicáveis, grade de horários
  // ponytail: ocupação simulada por hash determinístico (~30%); trocar por consulta à agenda real da serventia
  const ocupado = (d, h) => parseInt(idDoc(d + h).slice(1), 36) % 10 < 3;
  let mes = new Date(); mes.setDate(1);
  function desenharAgenda() {
    const hoje = iso(new Date()), y = mes.getFullYear(), m = mes.getMonth(), ini = new Date(y, m, 1).getDay(), dias = new Date(y, m + 1, 0).getDate();
    $('#ag-mes').textContent = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const limite = new Date(max + 'T12:00:00'); $('#ag-mes-ant').disabled = mes <= new Date(new Date().getFullYear(), new Date().getMonth(), 1); $('#ag-mes-prox').disabled = new Date(y, m + 1, 1) > limite;
    let html = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => `<small aria-hidden="true">${d}</small>`).join('') + '<i></i>'.repeat(ini);
    for (let d = 1; d <= dias; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, dow = new Date(y, m, d).getDay();
      const bloq = k < min || k > max || dow === 0 || dow === 6 || FERIADOS[k];
      html += `<button class="agenda__dia${k === hoje ? ' hoje' : ''}" type="button" data-dia="${k}" ${bloq ? 'disabled' : ''} aria-pressed="${k === data.value}" aria-label="${d} de ${mes.toLocaleDateString('pt-BR', { month: 'long' })}${FERIADOS[k] ? ' — feriado: ' + FERIADOS[k] : ''}">${d}</button>`;
    }
    $('#ag-dias').innerHTML = html;
    $('#ag-horas').innerHTML = !data.value ? '' : `<div class="horas"><b>${dataBR(new Date(data.value + 'T12:00:00'))}</b>${horas.map((h, i) => `${i === 8 ? '<b>Tarde</b>' : i === 0 ? '<b>Manhã</b>' : ''}<button class="hora" type="button" data-hora="${h}" ${ocupado(data.value, h) ? 'disabled aria-label="' + h + ' ocupado"' : ''} aria-pressed="${h === hora.value}">${h}</button>`).join('')}</div>`;
  }
  $('#ag-mes-ant').addEventListener('click', () => { mes.setMonth(mes.getMonth() - 1); desenharAgenda(); });
  $('#ag-mes-prox').addEventListener('click', () => { mes.setMonth(mes.getMonth() + 1); desenharAgenda(); });
  $('#ag-dias').addEventListener('click', (e) => { const b = e.target.closest('[data-dia]'); if (!b) return; data.value = b.dataset.dia; hora.value = ''; $('#ag-erro-hora').hidden = true; desenharAgenda(); });
  $('#ag-horas').addEventListener('click', (e) => { const b = e.target.closest('[data-hora]'); if (!b) return; hora.value = b.dataset.hora; $('#ag-erro-hora').hidden = true; $$('[data-hora]').forEach((x) => x.setAttribute('aria-pressed', x === b)); });

  function formas() {
    const s = POR_ID[sel.value];
    $('#ag-info').innerHTML = s ? `<div class="aviso">${ic('alerta')}<p>${s.online ? 'Este ato pode ser praticado no balcão ou por videoconferência pelo e-Notariado.' : 'Este ato é praticado no balcão: depende da conferência presencial da assinatura ou do documento original.'}${s.gratis ? ' O registro e a primeira certidão são gratuitos.' : ''}</p></div>` : '';
    $('#ag-formas').innerHTML = `
      <label class="opcao"><input type="radio" name="forma" value="No cartório" ${s && !s.online ? 'checked' : ''} required><span><b>No cartório</b><span>R. Eng. Roberto Gonçalves Menezes, 63 — Centro</span></span></label>
      ${!s || s.online ? '<label class="opcao"><input type="radio" name="forma" value="Videoconferência (e-Notariado)" required><span><b>Por videoconferência</b><span>Pelo e-Notariado, com certificado notarizado</span></span></label>' : ''}
      <label class="opcao"><input type="radio" name="forma" value="Ainda não sei" required><span><b>Ainda não sei</b><span>A equipe orienta a melhor forma</span></span></label>`;
  }
  sel.addEventListener('change', formas); formas();

  data.addEventListener('change', () => {
    const d = new Date(data.value + 'T12:00:00').getDay(), feriado = FERIADOS[data.value];
    const erro = d === 0 || d === 6 ? 'O cartório atende de segunda a sexta. Escolha um dia útil.' : feriado ? `Não há expediente nesse dia — feriado: ${feriado}.` : '';
    if (erro) data.dataset.regra = '1'; else delete data.dataset.regra;
    data.setAttribute('aria-invalid', !!erro); data.parentElement.querySelector('.erro')?.remove();
    if (erro) data.insertAdjacentHTML('afterend', `<span class="erro">${erro}</span>`);
  });

  function validarEtapa(i) {
    let ok = true; const grupos = new Set();
    $$('input, select, textarea', etapas[i]).filter((c) => c.required).forEach((c) => {
      if (c.type === 'radio') { if (grupos.has(c.name)) return; grupos.add(c.name); if (!f.querySelector(`input[name="${c.name}"]:checked`)) ok = false; return; }
      const bom = c.checkValidity() && !c.dataset.regra; c.setAttribute('aria-invalid', !bom); if (!bom) ok = false;
    });
    if (i === 2 && !(data.value && hora.value)) { ok = false; $('#ag-erro-hora').hidden = false; }
    if (!ok) $('[aria-invalid="true"]', etapas[i])?.focus();
    return ok;
  }
  function mostrar(i) {
    atual = i; etapas.forEach((e, k) => { e.hidden = k !== i; });
    passos.forEach((p, k) => { p.className = k < i ? 'feito' : k === i ? 'atual' : ''; });
    $('#ag-voltar').hidden = i === 0; $('#ag-seguir').hidden = i === 3; $('#ag-enviar').hidden = i !== 3;
    if (i === 2) desenharAgenda();
  }
  $('#ag-seguir').addEventListener('click', () => { if (validarEtapa(atual)) mostrar(atual + 1); });
  $('#ag-voltar').addEventListener('click', () => mostrar(atual - 1));

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    for (let i = 0; i < 4; i++) if (!validarEtapa(i)) { mostrar(i); return; }
    const x = Object.fromEntries(new FormData(f)), s = POR_ID[x.servico], prot = protocolo('AG');
    const quando = `${dataBR(new Date(x.data + 'T12:00:00'))}, às ${x.hora}`;
    const texto = `*Pedido de agendamento ${prot}*\n\nServiço: ${s.nome}\nForma: ${x.forma}\nPreferência: ${quando}\n\nNome: ${x.nome}\nWhatsApp: ${x.tel}\nE-mail: ${x.email}${x.obs ? `\n\nObservação: ${x.obs}` : ''}\n\nEnviado pelo site.`;
    registrarPedido({ tipo: 'Agendamento', prot, resumo: `${s.nome} · ${quando}`, texto });
    if (s.id === 'casamento') desenharTrilha();
    f.hidden = true; passos.forEach((p) => { p.className = 'feito'; });
    const r = $('#ag-recibo'); r.hidden = false;
    r.innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Pedido registrado</p><h3 style="font-size:1.6rem">Protocolo ${prot}</h3>
      <p class="sub" style="font-size:.95rem">Falta um passo: envie o pedido para a equipe. A confirmação do horário vem em até um dia útil.</p>
      <dl><dt>Serviço</dt><dd>${esc(s.nome)}</dd><dt>Forma</dt><dd>${esc(x.forma)}</dd><dt>Preferência</dt><dd>${quando}</dd><dt>Contato</dt><dd>${esc(x.nome)} · ${esc(x.tel)} · ${esc(x.email)}</dd></dl>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a class="bt bt--whats bt--g" target="_blank" rel="noopener" href="${wa(texto)}">${ic('whatsapp')} Enviar pelo WhatsApp</a>
        <a class="bt bt--linha" href="mailto:1crcmaceio@gmail.com?subject=${encodeURIComponent('Agendamento ' + prot)}&body=${encodeURIComponent(texto.replace(/\*/g, ''))}">${ic('email')} Enviar por e-mail</a>
        <button class="bt bt--linha" type="button" onclick="print()">${ic('impressora')} Imprimir</button>
        <button class="bt bt--linha" type="button" id="ag-ics">${ic('agenda')} Salvar no calendário</button>
        <button class="bt bt--linha" type="button" data-compartilhar="Agendamento ${prot}" data-texto="${esc(texto.replace(/\*/g, ''))}">Compartilhar</button></div>
      <p class="mini" style="margin:.9rem 0 0"><button class="bt bt--linha bt--p" type="button" id="ag-novo">Fazer outro agendamento</button> · <button class="bt bt--linha bt--p" type="button" data-servico="${s.id}">Ver documentos de ${esc(s.nome)}</button></p></div>`;
    $('#ag-novo').addEventListener('click', () => { r.hidden = true; f.hidden = false; f.reset(); formas(); mostrar(0); });
    $('#ag-ics').addEventListener('click', () => {
      const inicio = new Date(`${x.data}T${x.hora}:00`), fim = new Date(inicio.getTime() + 30 * 6e4);
      baixarICS(`agendamento-${prot}.ics`, [{ titulo: `Cartório: ${s.nome}`, inicio, fim, local: x.forma.startsWith('Video') ? 'Videoconferência (e-Notariado)' : ENDERECO, desc: `Protocolo ${prot}. Horário de preferência, a confirmar pela equipe. WhatsApp (82) 99381-2394.`, alarme: '-PT2H' }]);
      toast('Evento salvo — abra o arquivo no seu calendário');
    });
    toast(`Agendamento ${prot} salvo em “Meus pedidos”`);
  });
  mostrar(0);
  return { etapa: mostrar, comecar(servico) { $('#ag-recibo').hidden = true; f.hidden = false; sel.value = servico; formas(); mostrar(0); setTimeout(() => $('#ag-seguir').focus({ preventScroll: true }), 400); } };
})();

/* ------------------------------------------------------------------ custas — Lei estadual nº 9.778/2025 (AL)
   Emolumentos do Anexo I; TSNR de 26% sobre o emolumento (art. 24), exceto atos gratuitos.
   Valores transcritos da lei; a equipe confere na hora do ato. */
const TABELA_AL = {
  fonte: 'Lei estadual nº 9.778, de 23/12/2025 (DOE-AL 29/12/2025), Anexo I — em vigor desde março de 2026',
  tsnr: 26,
  faixas: [[2500, 178.62], [5000, 257.21], [7500, 436.86], [15000, 624.12], [25000, 873.80], [35000, 1092.27], [45000, 1341.95],
    [60000, 1716.47], [75000, 2090.99], [90000, 2434.30], [120000, 3183.34], [150000, 3901.17], [200000, 4494.16], [250000, 4900.16],
    [300000, 5306.11], [450000, 5712.11], [600000, 6118.11], [750000, 6524.11], [1e6, 6930.11], [1.5e6, 7539.67], [2e6, 8148.11],
    [4e6, 8960.11], [6e6, 9772.11], [8e6, 10584.11], [1e7, 11396.11], [Infinity, 12208.11]],
};
const porFaixa = (v) => TABELA_AL.faixas.find(([ate]) => v <= ate)[1];
// Cada ato: campos de entrada e a função que devolve as linhas [descrição, item da lei, valor]
const ATOS_CUSTAS = {
  escritura: { nome: 'Escritura de compra e venda, doação e outras', campos: [['valor', 'Valor do negócio (R$)']],
    linhas: ({ valor }) => valor ? [['Escritura com conteúdo financeiro (inclui 1º traslado)', 'Notas 5.2', porFaixa(valor)]] : null },
  inventario: { nome: 'Inventário e partilha', campos: [['valor', 'Valor dos bens do espólio, excluída a meação (R$)']],
    linhas: ({ valor }) => valor ? [['Escritura de inventário com bens', 'Notas 6.2 → 5.2', porFaixa(valor)]] : [['Escritura sem bens', 'Notas 6.1', 196.32]] },
  divorcio: { nome: 'Divórcio consensual', campos: [['valor', 'Valor dos bens partilhados — deixe vazio se não houver (R$)']],
    linhas: ({ valor }) => valor ? [['Escritura de divórcio com bens', 'Notas 6.2 → 5.2', porFaixa(valor)]] : [['Escritura de divórcio sem bens', 'Notas 6.1', 196.32]] },
  pacto: { nome: 'Pacto antenupcial', linhas: () => [['Escritura sem conteúdo financeiro', 'Notas 5.1', 141.97]] },
  uniao: { nome: 'União estável', campos: [['tipo', 'O que você precisa', ['termo:Termo de união estável (registro civil)', 'registro:Registro de união estável já formalizada', 'escritura:Escritura declaratória sem bens']]],
    linhas: ({ tipo }) => ({ termo: [['Termo de união estável', 'RCPN 7.2', 217.29]], registro: [['Registro de união estável', 'RCPN 7.1', 146.64]], escritura: [['Escritura sem conteúdo financeiro', 'Notas 5.1', 141.97]] })[tipo || 'termo'] },
  procuracao: { nome: 'Procuração pública', campos: [['tipo', 'Tipo', ['foro:Poderes para o foro em geral', 'sem:Sem valor econômico', 'com:Com valor econômico', 'inss:Só para benefício do INSS']], ['extras', 'Outorgantes além do primeiro', 'n']],
    linhas: ({ tipo, extras }) => tipo === 'inss' ? [['Procuração para benefício do INSS', 'Notas 2.1', 0]] :
      [[{ foro: 'Procuração com poderes para o foro', sem: 'Procuração sem valor econômico', com: 'Procuração com valor econômico' }[tipo || 'sem'], 'Notas 2.' + ({ foro: 2, sem: 3, com: 4 }[tipo || 'sem']), { foro: 45.26, sem: 67.69, com: 135.38 }[tipo || 'sem']],
       ...(extras ? [[`${extras} outorgante(s) a mais`, 'Notas 2.6', 4.77 * extras]] : [])] },
  testamento: { nome: 'Testamento público', campos: [['tipo', 'Conteúdo', ['com:Com especificação de bens', 'sem:Sem especificação de bens ou revogação']]],
    linhas: ({ tipo }) => tipo === 'sem' ? [['Testamento sem especificação de bens', 'Notas 3.2', 142.88]] : [['Testamento com especificação de bens', 'Notas 3.1', 571.52]] },
  firma: { nome: 'Reconhecimento de firma', campos: [['tipo', 'Modalidade', ['sem:Por semelhança', 'aut:Por autenticidade (assinando na frente do tabelião)']], ['qtd', 'Quantidade de assinaturas', 'n']],
    linhas: ({ tipo, qtd }) => [[`${qtd || 1} reconhecimento(s) por ${tipo === 'aut' ? 'autenticidade' : 'semelhança'}`, tipo === 'aut' ? 'Notas 1.2' : 'Notas 1.3', (tipo === 'aut' ? 9.49 : 7.25) * (qtd || 1)]] },
  autenticacao: { nome: 'Autenticação de documentos', campos: [['qtd', 'Páginas a autenticar', 'n']],
    linhas: ({ qtd }) => [[`${qtd || 1} página(s) autenticada(s)`, 'Notas 1.1', 7.25 * (qtd || 1)]] },
  apostila: { nome: 'Apostilamento de Haia', campos: [['qtd', 'Documentos', 'n']], linhas: ({ qtd }) => [[`${qtd || 1} apostila(s)`, 'Notas 10', 74.10 * (qtd || 1)]] },
  ata: { nome: 'Ata notarial', campos: [['paginas', 'Páginas', 'n']], linhas: ({ paginas }) => [['Primeira folha', 'Notas 4.1', 141.97], ...(paginas > 1 ? [[`${paginas - 1} página(s) excedente(s)`, 'Notas 4.2', 6 * (paginas - 1)]] : [])] },
  casamento: { nome: 'Casamento', campos: [['local', 'Onde', ['sede:No cartório', 'urbana:Fora do cartório, zona urbana', 'rural:Fora do cartório, zona rural, ou em fim de semana/feriado']]],
    linhas: ({ local }) => [['Habilitação, registro e assento de casamento', 'RCPN 1.1', 319.23], ...(local === 'urbana' ? [['Celebração fora da serventia (zona urbana)', 'RCPN 1.3', 63.35]] : local === 'rural' ? [['Celebração fora da serventia (rural / fim de semana / feriado)', 'RCPN 1.4', 164.94]] : [])] },
  'segunda-via': { nome: '2ª via de certidão', campos: [['tipo', 'Modelo', ['breve:Breve relato (1 folha)', 'inteiro:Inteiro teor']]],
    linhas: ({ tipo }) => tipo === 'inteiro' ? [['Certidão de inteiro teor', 'RCPN 5.3', 66.52]] : [['Certidão, uma folha', 'RCPN 5.1', 44.35]] },
  nascimento: { nome: 'Registro de nascimento', linhas: () => [['Registro e primeira certidão', 'RCPN 2.1', 0]] },
  obito: { nome: 'Registro de óbito', linhas: () => [['Assento e primeira certidão', 'RCPN 2.2', 0]] },
  retificacao: { nome: 'Retificação de registro', linhas: () => [['Procedimento de retificação (sem erro do oficial)', 'RCPN 8.1', 88.54], ['Averbação à margem do registro', 'RCPN 4.1', 56.66], ['Certidão atualizada', 'RCPN 5.1', 44.35]] },
  nome: { nome: 'Alteração de nome', linhas: () => [['Procedimento de alteração de prenome / patronímico', 'RCPN 8.1', 88.54], ['Averbação à margem do registro', 'RCPN 4.1', 56.66], ['Certidão atualizada', 'RCPN 5.1', 44.35]] },
};
const custas = (() => {
  const sel = $('#cu-ato'), campos = $('#cu-campos'), saida = $('#cu-saida');
  $('#cu-fonte').textContent = 'Base: ' + TABELA_AL.fonte + '.';
  sel.innerHTML = '<option value="">Escolha o ato…</option>' + Object.entries(ATOS_CUSTAS).map(([id, a]) => `<option value="${id}">${esc(a.nome)}</option>`).join('');
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  function desenharCampos() {
    const a = ATOS_CUSTAS[sel.value];
    campos.innerHTML = !a ? '' : (a.campos || []).map(([n, rot, op]) => `<div class="campo"><label for="cu-${n}">${rot}</label>${
      Array.isArray(op) ? `<select id="cu-${n}" name="${n}">${op.map((o) => { const [v, t] = o.split(':'); return `<option value="${v}">${t}</option>`; }).join('')}</select>`
      : op === 'n' ? `<input id="cu-${n}" name="${n}" type="number" inputmode="numeric" min="${n === 'extras' ? 0 : 1}" max="99" value="${n === 'extras' ? 0 : 1}">`
      : `<input id="cu-${n}" name="${n}" inputmode="numeric" placeholder="R$ 0,00">`}</div>`).join('');
    $$('input:not([type=number])', campos).forEach((i) => i.addEventListener('input', () => { const n = i.value.replace(/\D/g, '').slice(0, 13); i.value = n ? brl(n / 100) : ''; }));
    calcular();
  }
  function valores() {
    const v = {};
    $$('input, select', campos).forEach((c) => { v[c.name] = c.type === 'number' ? +c.value : c.tagName === 'SELECT' ? c.value : +(c.value.replace(/\D/g, '') || 0) / 100; });
    return v;
  }
  function calcular() {
    const a = ATOS_CUSTAS[sel.value]; if (!a) return saida.innerHTML = '';
    const linhas = a.linhas(valores());
    if (!linhas) return saida.innerHTML = '<p class="sub" style="font-size:.95rem">Informe o valor do negócio para ver a estimativa.</p>';
    const emol = linhas.reduce((s, l) => s + l[2], 0);
    if (!emol) return saida.innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Gratuito por lei</p><p style="margin:0">${linhas.map((l) => esc(l[0])).join('; ')} — sem emolumentos nem taxa (${linhas.map((l) => l[1]).join(', ')}).</p></div>`;
    const taxa = emol * TABELA_AL.tsnr / 100, total = emol + taxa;
    saida.innerHTML = `<div class="resumo"><p class="olho">Estimativa</p><p class="preco">${brl(total)}</p><p class="mini">${esc(a.nome)}</p>
      <div class="tabela"><table><thead><tr><th>Componente</th><th>Item</th><th class="num">Valor</th></tr></thead><tbody>
        ${linhas.map((l) => `<tr><td>${esc(l[0])}</td><td class="item">${l[1]}</td><td class="num">${brl(l[2])}</td></tr>`).join('')}
        <tr><td>TSNR — taxa de fiscalização (${TABELA_AL.tsnr}%)</td><td class="item">art. 24</td><td class="num">${brl(taxa)}</td></tr>
        <tr><td>ISS municipal sobre o emolumento</td><td class="item">Maceió</td><td class="num"><mark>[a serventia informa]</mark></td></tr>
        <tr class="total"><td colspan="2">Total estimado (sem ISS)</td><td class="num">${brl(total)}</td></tr></tbody></table></div>
      <p class="mini" style="margin:.6rem 0 0">Parcelado no cartão <mark>[condições: a serventia informa]</mark>:</p><div class="parcelas">${[3, 6, 12].map((n) => `<span>${n}× de ${brl(total / n)}</span>`).join('')}</div>
      <p class="mini">Confira no <a href="https://emolumentos.tjal.jus.br/" target="_blank" rel="noopener">simulador oficial do TJAL</a>. Não inclui ITBI/ITCMD, registro de imóveis nem certidões de outros órgãos. O valor é conferido pelo cartório antes do ato.</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="bt bt--p" type="button" data-agendar="${sel.value in POR_ID ? sel.value : 'escritura'}">${ic('agenda')} Agendar este ato</button>
        <a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa(`Olá! Simulei no site: ${a.nome} — estimativa de ${brl(total)}. Podem confirmar o valor?`)}">${ic('whatsapp')} Confirmar com a equipe</a></div></div>`;
  }
  sel.addEventListener('change', desenharCampos); campos.addEventListener('input', calcular); campos.addEventListener('change', calcular);
  return { escolher(id) { sel.value = id in ATOS_CUSTAS ? id : ''; desenharCampos(); } };
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

/* ------------------------------------------------------------------ vistas (menu abre a seção, não rola a página)
   A página continua sendo uma só — o roteador apenas esconde as outras seções.
   Hash na URL: Voltar/Avançar do navegador funcionam e cada vista tem link próprio. */
const VISTAS = ['servicos', 'casamento', 'certidoes', 'verificar', 'atendimento', 'links', 'privacidade', 'enotariado', 'duvidas', 'contato', 'ouvidoria', 'glossario', 'empresas', 'estrangeiros'];
const ALIAS = { espaco: 'casamento', galeria: 'casamento', topo: 'inicio', conteudo: 'inicio', feriados: 'contato', avaliacao: 'contato', transparencia: 'contato' };
const secoes = $$('main > section');
function vistaDoHash() { const id = location.hash.slice(1); return VISTAS.includes(ALIAS[id] || id) ? (ALIAS[id] || id) : 'inicio'; }
function mostrarVista() {
  const v = vistaDoHash(), alvo = location.hash.slice(1);
  secoes.forEach((s) => { s.hidden = v === 'inicio' ? !['inicio', 'atalhos'].includes(s.id) : s.id !== v; });
  $$('.menu a').forEach((a) => { a.getAttribute('href') === '#' + v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  document.title = (v === 'inicio' ? '' : ($(`#${v} h2, #${v} h1`)?.textContent.trim() + ' · ')) + '7ª Circunscrição · Casamento e Notas · Maceió/AL';
  // âncora interna (ex.: #espaco dentro de casamento) ainda leva ao ponto certo; senão, topo da vista
  const el = alvo && alvo !== v ? document.getElementById(alvo) : null;
  if (el) el.scrollIntoView({ block: 'start' }); else scrollTo({ top: 0 });
  topo.classList.remove('aberto'); $('#bt-menu').setAttribute('aria-expanded', 'false');
}
addEventListener('hashchange', mostrarVista);
document.addEventListener('keydown', (e) => { if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName)) { e.preventDefault(); location.hash = '#inicio'; setTimeout(() => $('#busca-hero').focus(), 60); } });
document.documentElement.style.scrollBehavior = 'auto'; mostrarVista();

/* ------------------------------------------------------------------ glossário, ouvidoria, empresas, estrangeiros, feriados, avaliação */
const GLOSSARIO = [["Apostila", "Certificado que confirma a origem de um documento público brasileiro para que ele valha em outro país que adota a Convenção da Apostila, sem legalização no consulado. Base legal: Decreto nº 8.660/2016."], ["Ata notarial", "Documento em que o tabelião registra fatos que constatou, como o conteúdo de uma página da internet ou de mensagens. Base legal: Lei nº 8.935/1994, art. 7º, III."], ["Autenticação de cópia", "Confirmação, pelo tabelião, de que a cópia corresponde ao original apresentado. Base legal: Lei nº 8.935/1994, art. 7º, V."], ["Averbação", "Anotação feita no registro para informar uma mudança posterior, como o divórcio no registro de casamento ou a inclusão de sobrenome. Base legal: Lei nº 6.015/1973, art. 57."], ["Causa suspensiva", "Situação em que a lei recomenda não casar, como a do divorciado cuja partilha ainda não foi feita. O casamento não é proibido, mas o regime passa a ser o da separação de bens. Base legal: Código Civil, arts. 1.523 e 1.641, I."], ["CENSEC", "Central Notarial de Serviços Eletrônicos Compartilhados, que reúne informações sobre testamentos, escrituras de separação, divórcio e inventário e procurações lavradas no país. Base legal: Provimento CNJ nº 149/2023, art. 265."], ["Certidão", "Documento emitido pelo cartório que reproduz ou resume o que consta de um registro ou de um ato."], ["Certificado de habilitação", "Documento que atesta que os noivos estão habilitados para casar. Vale por 90 dias. Base legal: Código Civil, art. 1.532."], ["Certificado digital notarizado", "Identidade digital fornecida gratuitamente pelo tabelião para assinar atos no e-Notariado. Base legal: Provimento CNJ nº 149/2023, art. 292, § 4º."], ["e-Notariado", "Plataforma oficial dos atos notariais eletrônicos, feitos por videoconferência e assinados com certificado digital. Base legal: Provimento CNJ nº 149/2023, art. 287."], ["Emolumentos", "Valor cobrado pelo ato, fixado em lei estadual e igual em todos os cartórios do estado. Base legal: Lei estadual nº 9.778/2025."], ["Escritura pública", "Documento lavrado pelo tabelião no livro de notas para formalizar um negócio ou uma declaração, como compra e venda, doação, divórcio ou inventário. Base legal: Lei nº 8.935/1994, art. 7º, I."], ["Habilitação para o casamento", "Processo em que o cartório confere os documentos dos noivos e publica os proclamas antes do casamento. Base legal: Código Civil, arts. 1.525 e 1.526; Lei nº 6.015/1973, art. 67."], ["Livre escolha do tabelião", "Direito de escolher o tabelião de notas, qualquer que seja o domicílio das partes ou o lugar dos bens. Nos atos feitos à distância, valem as regras de competência do e-Notariado. Base legal: Lei nº 8.935/1994, art. 8º; Provimento CNJ nº 149/2023, art. 302."], ["Pacto antenupcial", "Escritura em que os noivos escolhem um regime de bens diferente da comunhão parcial. Só produz efeitos se o casamento acontecer. Base legal: Código Civil, art. 1.653."], ["Procuração pública", "Escritura em que uma pessoa dá poderes a outra para agir em seu nome. Base legal: Lei nº 8.935/1994, art. 7º, I."], ["Proclamas", "Edital que torna pública a intenção de casar, publicado por meio eletrônico durante a habilitação. Base legal: Lei nº 6.015/1973, art. 67, § 1º; Provimento CNJ nº 149/2023, art. 122."], ["Reconhecimento de firma", "Confirmação, pelo tabelião, de que a assinatura em um documento é de quem diz tê-la feito. Base legal: Lei nº 8.935/1994, art. 7º, IV."], ["Regime de bens", "Conjunto de regras que define o que é de cada cônjuge e o que é do casal. Sem pacto, vale a comunhão parcial. Base legal: Código Civil, art. 1.640."], ["Selo digital", "Código de fiscalização do Tribunal de Justiça impresso em todo ato, que permite conferir o ato na internet. Base legal: Lei estadual nº 9.778/2025, art. 13, § 1º."], ["Testamento público", "Testamento escrito pelo tabelião conforme a vontade do testador e lido em voz alta a ele e a duas testemunhas. Base legal: Código Civil, art. 1.864."], ["Traslado", "Cópia da escritura entregue às partes; o seu valor já está incluído nos emolumentos do ato. Base legal: Lei estadual nº 9.778/2025, art. 10, I."], ["TSNR", "Taxa sobre os Serviços Notariais e Registrais, de 26% sobre os emolumentos, destinada à fiscalização do Poder Judiciário. Base legal: Lei estadual nº 9.778/2025, art. 24."]];
(function glossario() {
  const lista = $('#lista-gloss'), campo = $('#busca-gloss');
  const desenhar = () => { const a = norm(campo.value); const itens = GLOSSARIO.filter(([t, d]) => !a || norm(t + ' ' + d).includes(a));
    lista.innerHTML = itens.map(([t, d]) => `<details class="faq" name="gloss"><summary>${esc(t)}</summary><p>${esc(d)}</p></details>`).join('') || '<p class="sub">Nenhum termo com esse texto.</p>';
    $('#gloss-contagem').textContent = `${itens.length} de ${GLOSSARIO.length} termos`; };
  campo.addEventListener('input', desenhar); desenhar();
})();
(function feriados() {
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  $('#lista-feriados').innerHTML = Object.entries(FERIADOS).sort().map(([d, n]) => { const [, m, dia] = d.split('-'); const [nome, esf] = n.split(' (');
    return `<li><span class="data-fer"><b>${dia}</b>${MES[+m - 1]}</span><span>${esc(nome)}${esf ? `<small>${esc(esf.replace(')', ''))}</small>` : ''}</span></li>`; }).join('');
})();
(function ouvidoria() {
  const f = $('#form-ouv');
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validar(f)) return;
    const x = Object.fromEntries(new FormData(f)), prot = protocolo('OUV');
    const texto = `*Ouvidoria — ${x.tipo} ${prot}*\n\n${x.servico ? `Serviço: ${x.servico}\n` : ''}${x.data ? `Data do atendimento: ${x.data}\n` : ''}\nRelato:\n${x.relato}\n\n${x.nome ? `Nome: ${x.nome}\n` : ''}${x.contato ? `Contato para resposta: ${x.contato}\n` : 'Manifestação anônima.\n'}\nEnviado pelo site.`;
    registrarPedido({ tipo: 'Ouvidoria', prot, resumo: `${x.tipo}${x.servico ? ' · ' + x.servico : ''}`, texto });
    $('#ouv-saida').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Protocolo ${prot}</p>
      <p style="margin:0 0 .8rem">Guarde este número. Prazo de referência para a resposta final: <b>30 dias</b>, prorrogáveis uma vez com justificativa (Lei 13.460/2017, art. 16).</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="bt bt--whats" target="_blank" rel="noopener" href="${wa(texto)}">${ic('whatsapp')} Enviar pelo WhatsApp</a>
      <a class="bt bt--linha" href="mailto:1crcmaceio@gmail.com?subject=${encodeURIComponent('Ouvidoria ' + prot)}&body=${encodeURIComponent(texto.replace(/\*/g, ''))}">${ic('email')} Enviar por e-mail</a></div></div>`;
    toast(`Manifestação ${prot} registrada`);
  });
})();
(function empresas() {
  const docs = ['Contrato social ou estatuto, com a última alteração ou a consolidação', 'Certidão simplificada da Junta Comercial, atualizada', 'Comprovante de inscrição no CNPJ', 'Documento de identidade e CPF de quem representa a empresa', 'Ata de eleição da diretoria ou procuração do representante, quando for o caso'];
  $('#docs-empresa').innerHTML = checklistHTML(docs);
  ligarChecklist($('#empresas'), 'empresa', ({ total, feitos, faltando }) => { $('#emp-prog').textContent = `${feitos} de ${total} separados`;
    $('#emp-enviar').href = wa('Olá! Sou de empresa/escritório e preciso dos atos com pessoa jurídica.\n\nAinda reunindo:\n' + (faltando.map((d) => '• ' + d).join('\n') || '(tudo pronto)')); });
  const f = $('#form-emp');
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validar(f)) return;
    const x = new FormData(f), prot = protocolo('EMP'), serv = x.getAll('servicos').join(', ') || 'a definir';
    const texto = `*Atendimento a empresa ${prot}*\n\nEmpresa/escritório: ${x.get('empresa')}${x.get('cnpj') ? `\nCNPJ/OAB: ${x.get('cnpj')}` : ''}\nResponsável: ${x.get('nome')}\nContato: ${x.get('tel')}${x.get('email') ? ` · ${x.get('email')}` : ''}\nServiços: ${serv}${x.get('volume') ? `\nVolume mensal: ${x.get('volume')}` : ''}${x.get('obs') ? `\n\n${x.get('obs')}` : ''}\n\nEnviado pelo site.`;
    registrarPedido({ tipo: 'Empresa', prot, resumo: `${x.get('empresa')} · ${serv}`, texto });
    $('#emp-saida').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Pedido ${prot}</p><a class="bt bt--whats" target="_blank" rel="noopener" href="${wa(texto)}">${ic('whatsapp')} Enviar pelo WhatsApp</a></div>`;
    toast(`Pedido ${prot} registrado`);
  });
})();
$$('[data-idioma]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-idioma]').forEach((x) => x.setAttribute('aria-pressed', x === b)); $$('[data-lingua]').forEach((d) => { d.hidden = d.dataset.lingua !== b.dataset.idioma; });
}));
(function avaliacao() {
  const f = $('#form-av');
  f.addEventListener('submit', (e) => {
    e.preventDefault(); const x = Object.fromEntries(new FormData(f)); if (!x.nota) { toast('Escolha uma nota de 1 a 5.'); return; }
    const boa = +x.nota >= 4;
    $('#av-saida').innerHTML = `<div class="resumo"><p class="olho">${ic('estrela')} Obrigado pela nota ${x.nota}</p>
      <p style="margin:0 0 .8rem">${boa ? 'Que bom que correu bem! Sua avaliação pública no Google ajuda outras famílias a nos encontrar.' : 'Sentimos muito. Queremos entender o que aconteceu — pode registrar na ouvidoria, que gera protocolo e tem prazo de resposta.'}</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">${boa ? `<a class="bt bt--ouro" target="_blank" rel="noopener" href="https://g.co/kgs/fFvqKzj">${ic('estrela')} Avaliar no Google</a>` : `<a class="bt" href="#ouvidoria">Registrar na ouvidoria</a>`}
      <a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa(`Avaliação do atendimento: nota ${x.nota}/5${x.servico ? ` · ${x.servico}` : ''}${x.comentario ? `\n\n${x.comentario}` : ''}`)}">${ic('whatsapp')} Enviar comentário à equipe</a></div></div>`;
  });
})();

/* ------------------------------------------------------------------ compartilhar (Web Share, com cópia como reserva) */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-compartilhar]'); if (!b) return;
  const dados = { title: b.dataset.compartilhar, text: b.dataset.texto || b.dataset.compartilhar, url: location.href };
  try { if (navigator.share) { await navigator.share(dados); return; } await navigator.clipboard.writeText(`${dados.text}\n${dados.url}`); toast('Texto copiado — cole onde quiser'); } catch (_) { /* cancelado */ }
});

/* ------------------------------------------------------------------ aplicativo (PWA) */
if ('serviceWorker' in navigator && /^(https:|http:\/\/localhost)/.test(location.href)) navigator.serviceWorker.register('sw.js').catch(() => {});
let promptInstalar = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalar = e; $('#bt-instalar').hidden = false; $('#instalar-dica').hidden = true; });
$('#bt-instalar').addEventListener('click', async () => { if (!promptInstalar) return; promptInstalar.prompt(); const { outcome } = await promptInstalar.userChoice; toast(outcome === 'accepted' ? 'Instalado — procure o ícone na tela inicial' : 'Tudo bem, fica para depois'); promptInstalar = null; $('#bt-instalar').hidden = true; });

/* ------------------------------------------------------------------ revelação ao rolar */
(function revelar() {
  const alvos = $$('.card, .painel, .atalho, .numeros div, #verificar .card');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('ver'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
  alvos.forEach((a, i) => { a.classList.add('revela'); a.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(a); });
})();

/* ------------------------------------------------------------------ números e movimento (home) */
(function numeros() {
  const alvo = { servicos: SERVICOS.length, online: SERVICOS.filter((s) => s.online).length, anos: new Date().getFullYear() - 1978, feriados: Object.keys(FERIADOS).length };
  const contar = (el, fim) => { const t0 = performance.now(), dur = 1100; const passo = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(fim * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); };
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (!x.isIntersecting) return; $$('[data-conta]', x.target).forEach((b) => contar(b, alvo[b.dataset.conta])); io.disconnect(); }));
  io.observe($('#numeros'));
  // aba em segundo plano pausa o requestAnimationFrame: garante o valor final
  setTimeout(() => $$('#numeros [data-conta]').forEach((x) => { if (x.textContent === '0') x.textContent = alvo[x.dataset.conta]; }), 2500);
  // ponytail: movimento estimado pela hora do dia (padrão típico de balcão); trocar pela fila real da serventia
  const [aberto] = estadoAgora(), h = +new Intl.DateTimeFormat('en-US', { timeZone: 'America/Maceio', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
  const nivel = !aberto ? ['Fechado', 'agende para evitar fila'] : h < 9 ? ['Baixo', 'espera de ~5 min'] : h < 11 ? ['Alto', 'espera de ~25 min'] : h < 12 ? ['Médio', 'espera de ~15 min'] : h < 15 ? ['Baixo', 'espera de ~5 min'] : ['Médio', 'espera de ~15 min'];
  $('#movimento b').textContent = nivel[0]; $('#movimento span').insertAdjacentHTML('beforeend', ` · ${nivel[1]}`);
})();

/* ------------------------------------------------------------------ novidades */
const NOVIDADES = [
  ['2026-03-29', 'Nova tabela de emolumentos em Alagoas', 'Desde março vale a tabela da Lei estadual 9.778/2025, com reajuste anual pelo INPC em janeiro. A calculadora deste site já usa os valores novos.', '#atendimento', 'Calcular custas'],
  ['2026-06-22', 'CNJ lança a plataforma Meu Registro', 'Um só endereço para pedir serviços de cartórios de todo o país, acompanhar pelo protocolo unificado e pagar on-line. Certidões deste cartório continuam pelo Registro Civil on-line.', 'https://irtdpjbrasil.org.br/nova-plataforma-que-simplifica-acesso-a-documentos-cartorarios-ja-recebeu-470-mil-pedidos', 'Ler a notícia'],
  ['2024-08-26', 'Divórcio e inventário em cartório com filhos menores', 'A Resolução CNJ 571/2024 passou a admitir a via extrajudicial em hipóteses com incapazes, com manifestação do Ministério Público. Veja o comparativo cartório × Justiça.', '#atendimento', 'Ver comparativo'],
];
$('#lista-novidades').innerHTML = NOVIDADES.map(([d, t, r, u, a]) => `<article class="card novidade"><time datetime="${d}">${dataBR(new Date(d + 'T12:00:00'))}</time><h3>${esc(t)}</h3><p>${esc(r)}</p><div class="card__pe"><a class="bt bt--linha bt--p" href="${u}" ${u.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${a}</a></div></article>`).join('');

/* ------------------------------------------------------------------ mapa sob demanda */
$('#bt-mapa').addEventListener('click', () => { const m = $('#mapa'); m.hidden = false; m.innerHTML = '<iframe title="Mapa: R. Eng. Roberto Gonçalves Menezes, 63 — Centro, Maceió" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=R.+Eng.+Roberto+Gon%C3%A7alves+Menezes,+63,+Centro,+Macei%C3%B3+-+AL&output=embed"></iframe>'; $('#bt-mapa').hidden = true; m.scrollIntoView({ block: 'nearest' }); });

/* ------------------------------------------------------------------ privacidade: inventário e apagamento */
(function privacidade() {
  const resumo = () => { const n = Object.keys(localStorage).filter((k) => k.startsWith('m7-')).length; $('#priv-resumo').textContent = n ? `${n} item(ns) guardado(s) neste navegador.` : 'Nada guardado neste navegador.'; };
  $('#priv-apagar').addEventListener('click', () => { if (!confirm('Apagar simulações, pedidos, pré-cadastro e preferências deste aparelho?')) return; Object.keys(localStorage).filter((k) => k.startsWith('m7-')).forEach((k) => localStorage.removeItem(k)); toast('Tudo apagado — a página vai recarregar'); setTimeout(() => location.reload(), 900); });
  resumo(); addEventListener('hashchange', resumo);
})();

/* ------------------------------------------------------------------ pergunte ao tabelião */
$('#form-pergunta').addEventListener('submit', (e) => {
  e.preventDefault(); const f = e.target; if (!validar(f)) return;
  const x = Object.fromEntries(new FormData(f)), prot = protocolo('PT');
  const texto = `*Pergunta ${prot}*\n\n${x.pergunta}\n\nNome: ${x.nome}\nResposta para: ${x.contato}\n\nEnviado pelo site.`;
  registrarPedido({ tipo: 'Pergunta', prot, resumo: x.pergunta.slice(0, 60) + (x.pergunta.length > 60 ? '…' : ''), texto });
  $('#pg-saida').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Pergunta ${prot} registrada</p><div style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="bt bt--whats bt--p" target="_blank" rel="noopener" href="${wa(texto)}">${ic('whatsapp')} Enviar pelo WhatsApp</a><a class="bt bt--linha bt--p" href="mailto:1crcmaceio@gmail.com?subject=${encodeURIComponent('Pergunta ' + prot)}&body=${encodeURIComponent(texto.replace(/\*/g, ''))}">${ic('email')} Por e-mail</a><a class="bt bt--linha bt--p" href="#atendimento" data-aba="pedidos">Acompanhar</a></div></div>`;
  toast(`Pergunta ${prot} salva em “Meus pedidos”`); f.reset();
});

/* ------------------------------------------------------------------ links úteis */
const LINKS = [
  ['Formulário de habilitação (PDF)', 'Formulário do cartório para preencher à mão e levar com os documentos do casamento.', 'assets/docs/formulario-habilitacao-casamento.pdf'],
  ['Portal Extrajudicial de Alagoas', 'Página do TJAL sobre os cartórios do estado: tabela de emolumentos, selos e consultas.', 'https://extrajudicial.tjal.jus.br/'],
  ['Consulta do selo digital (TJAL)', 'Confere o ato a que pertence o selo impresso no documento.', 'https://seloapp.tjal.jus.br/publico/selo'],
  ['Simulador de emolumentos (TJAL)', 'Calcula o valor de um ato pela tabela oficial vigente.', 'https://emolumentos.tjal.jus.br/'],
  ['Registro Civil on-line (este cartório)', 'Pedido de certidões de nascimento, casamento e óbito registradas aqui.', 'https://www.registrocivil.net/2873?targetForm=T'],
  ['Portal oficial do Registro Civil', '2ª via de certidões de qualquer cartório do país, busca de registros e validação de certidão digital.', 'https://www.registrocivil.org.br/'],
  ['e-Proclamas', 'Editais de proclamas de casamento publicados pelos cartórios de registro civil.', 'https://proclamas.org.br/'],
  ['e-Notariado', 'Plataforma oficial dos atos notariais eletrônicos e do certificado digital notarizado.', 'https://www.e-notariado.org.br/'],
  ['CENSEC', 'Central notarial que informa se existe escritura de separação, divórcio ou inventário.', 'https://censec.org.br/'],
  ['Busca Testamento', 'Certidão sobre a existência de testamento, exigida nos inventários.', 'https://buscatestamento.org.br/'],
  ['Validação de apostila (CNJ)', 'Confere apostilas emitidas no sistema Apostil.', 'https://apostil.org.br/validation'],
  ['Colégio Notarial do Brasil', 'Entidade nacional dos tabeliães de notas.', 'https://www.notariado.org.br/'],
  ['Conselho Nacional de Justiça', 'Normas e políticas do Judiciário para os cartórios de todo o país.', 'https://www.cnj.jus.br/'],
  ['Tribunal de Justiça de Alagoas', 'Portal do Poder Judiciário de Alagoas.', 'https://www.tjal.jus.br/'],
  ['Receita Federal', 'Consulta e regularização do CPF, exigido na maior parte dos atos.', 'https://www.gov.br/receitafederal/pt-br'],
];
$('#lista-links').innerHTML = LINKS.map(([t, d, u]) => `<a class="card card--clic" href="${u}" target="_blank" rel="noopener"><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="mini">${u.startsWith('http') ? new URL(u).hostname : 'PDF · 3 páginas'} ↗</span></a>`).join('');

/* ------------------------------------------------------------------ certidão de ato notarial */
(function certidaoNotas() {
  const f = $('#form-cert-notas'), tipo = $('#cn-tipo');
  tipo.addEventListener('change', () => { $('#cn-aviso').innerHTML = tipo.value === 'Testamento público' ? `<div class="aviso">${ic('alerta')}<p>Certidão de testamento tem sigilo: em vida, só ao próprio testador; depois do óbito, a quem comprove interesse (herdeiro, inventariante). Traga a certidão de óbito.</p></div>` : ''; });
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validar(f)) return;
    const x = Object.fromEntries(new FormData(f)), prot = protocolo('CN');
    const texto = `*Pedido de certidão notarial ${prot}*\n\nAto: ${x.tipo}${x.ano ? ` (${x.ano})` : ''}${x.livro ? `\nLivro/folha: ${x.livro}` : ''}\nPartes: ${x.partes}\nFinalidade: ${x.fim}\n\nSolicitante: ${x.nome}\nWhatsApp: ${x.tel}\n\nEnviado pelo site.`;
    registrarPedido({ tipo: 'Certidão', prot, resumo: `${x.tipo} · ${x.partes}`, texto });
    $('#cn-saida').innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Pedido ${prot} montado</p><p style="margin:0 0 .8rem">A equipe localiza o ato no livro, confirma o valor e avisa quando a certidão estiver pronta.</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="bt bt--whats" target="_blank" rel="noopener" href="${wa(texto)}">${ic('whatsapp')} Enviar à equipe</a><a class="bt bt--linha bt--p" href="#atendimento" data-aba="pedidos">Acompanhar</a></div></div>`;
    toast(`Pedido ${prot} salvo em “Meus pedidos”`);
  });
})();

/* ------------------------------------------------------------------ pré-cadastro (fica só no aparelho) */
function cpfValido(s) {
  const d = s.replace(/\D/g, ''); if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n) => { let soma = 0; for (let i = 0; i < n; i++) soma += d[i] * (n + 1 - i); const r = (soma * 10) % 11; return (r === 10 ? 0 : r) === +d[n]; };
  return dv(9) && dv(10);
}
(function preCadastro() {
  const raiz = $('#pre-pessoas'), f = $('#form-pre'), saida = $('#pre-saida');
  const EC = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'];
  let pessoas = guarda.get('pre', [{}]);
  const campo = (i, n, rot, extra = '') => `<div class="campo"><label for="pre-${i}-${n}">${rot}</label>${extra.startsWith('<') ? extra : `<input id="pre-${i}-${n}" name="${n}" value="${esc(pessoas[i][n] || '')}" ${extra}>`}</div>`;
  function desenhar() {
    raiz.innerHTML = pessoas.map((p, i) => `<fieldset class="painel pre-pessoa" data-i="${i}"><legend class="legenda">Pessoa ${i + 1} ${pessoas.length > 1 ? `<button class="bt bt--linha bt--p" type="button" data-pre-rm="${i}">remover</button>` : ''}</legend>
      <div class="linha2">${campo(i, 'nome', 'Nome completo', 'required autocomplete="off"')}${campo(i, 'cpf', 'CPF', 'required inputmode="numeric" placeholder="000.000.000-00" maxlength="14"')}</div>
      <div class="linha2">${campo(i, 'nasc', 'Data de nascimento', 'type="date"')}${campo(i, 'ec', 'Estado civil', `<select id="pre-${i}-ec" name="ec">${EC.map((e) => `<option ${p.ec === e ? 'selected' : ''}>${e}</option>`).join('')}</select>`)}</div>
      <div class="linha2">${campo(i, 'prof', 'Profissão', '')}${campo(i, 'nac', 'Nacionalidade', '')}</div>
      <div class="linha2">${campo(i, 'cep', 'CEP', 'inputmode="numeric" maxlength="9" placeholder="57000-000"')}${campo(i, 'end', 'Endereço', 'placeholder="preenchido pelo CEP"')}</div>
      <div class="linha2">${campo(i, 'bairro', 'Bairro', '')}${campo(i, 'cidade', 'Cidade/UF', '')}</div></fieldset>`).join('');
    pessoas.forEach((p, i) => { if (!p.nac) $(`#pre-${i}-nac`).value = 'Brasileira'; });
  }
  const ler = () => { pessoas = $$('.pre-pessoa', raiz).map((fs) => Object.fromEntries($$('input, select', fs).map((c) => [c.name, c.value]))); guarda.set('pre', pessoas); };
  // ViaCEP: serviço público, sem chave; preenche rua, bairro e cidade ao completar o CEP
  raiz.addEventListener('input', async (e) => { const c = e.target; if (c.name !== 'cep') return; const d = c.value.replace(/\D/g, '').slice(0, 8); c.value = d.replace(/(\d{5})(\d)/, '$1-$2'); if (d.length !== 8) return;
    const fs = c.closest('.pre-pessoa'); try { const r = await (await fetch(`https://viacep.com.br/ws/${d}/json/`)).json(); if (r.erro) return toast('CEP não encontrado'); $('[name="end"]', fs).value = r.logradouro || ''; $('[name="bairro"]', fs).value = r.bairro || ''; $('[name="cidade"]', fs).value = `${r.localidade}/${r.uf}`; ler(); toast('Endereço preenchido pelo CEP'); } catch (_) { toast('Sem conexão com o ViaCEP'); } });
  raiz.addEventListener('input', (e) => { const c = e.target; if (c.name === 'cpf') { const d = c.value.replace(/\D/g, '').slice(0, 11); c.value = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); if (d.length === 11 && !cpfValido(d)) c.dataset.regra = '1'; else delete c.dataset.regra; } ler(); });
  raiz.addEventListener('click', (e) => { const b = e.target.closest('[data-pre-rm]'); if (!b) return; ler(); pessoas.splice(+b.dataset.preRm, 1); guarda.set('pre', pessoas); desenhar(); });
  $('#pre-mais').addEventListener('click', () => { if (pessoas.length >= 6) return toast('Até seis pessoas por pré-cadastro'); ler(); pessoas.push({}); guarda.set('pre', pessoas); desenhar(); $(`#pre-${pessoas.length - 1}-nome`).focus(); });
  $('#pre-apagar').addEventListener('click', () => { if (!confirm('Apagar os dados do pré-cadastro deste aparelho?')) return; pessoas = [{}]; guarda.set('pre', pessoas); saida.innerHTML = ''; desenhar(); });
  f.addEventListener('submit', (e) => {
    e.preventDefault(); ler(); $$('[name="cpf"]', raiz).forEach((c) => { if (!cpfValido(c.value)) c.dataset.regra = '1'; }); if (!validar(f)) return toast('Confira os campos em vermelho — CPF inválido ou nome em branco');
    saida.innerHTML = `<div class="resumo"><p class="olho">${ic('check-circ')} Resumo para levar ao cartório</p>
      <div class="tabela"><table><thead><tr><th>Nome</th><th>CPF</th><th>Nascimento</th><th>Estado civil</th><th>Profissão</th><th>Nacionalidade</th><th>Endereço</th></tr></thead><tbody>${pessoas.map((p) => `<tr><td>${esc(p.nome)}</td><td>${esc(p.cpf)}</td><td>${p.nasc ? dataBR(new Date(p.nasc + 'T12:00:00')) : '—'}</td><td>${esc(p.ec || '')}</td><td>${esc(p.prof || '—')}</td><td>${esc(p.nac || '')}</td><td>${esc([p.end, p.bairro, p.cidade, p.cep].filter(Boolean).join(', ') || '—')}</td></tr>`).join('')}</tbody></table></div>
      <p class="mini">Gerado em ${new Date().toLocaleString('pt-BR')}. Leve com os documentos originais; o cartório confere e lança no ato.</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="bt bt--linha bt--p" type="button" onclick="print()">${ic('impressora')} Imprimir</button><button class="bt bt--p" type="button" id="pre-usar">${ic('agenda')} Usar no agendamento</button></div></div>`;
    $('#pre-usar').addEventListener('click', () => { trocarAba('agendar'); $('#ag-nome').value = pessoas[0].nome; $('#ag-obs').value = `Pessoas do ato (pré-cadastro feito no site): ${pessoas.map((p) => p.nome).join('; ')}`; toast('Nome e pessoas do ato levados ao agendamento — sem os CPFs'); });
  });
  desenhar();
})();

/* ------------------------------------------------------------------ comparativo cartório × Justiça */
(function comparativo() {
  const tipo = $('#comp-tipo'), valor = $('#comp-valor'), saida = $('#comp-saida'), brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const DADOS = {
    divorcio: { req: ['Consenso sobre tudo: partilha, nome e alimentos entre os cônjuges. Com filhos menores ou incapazes, só nas hipóteses da Res. CNJ 571/2024, com manifestação do Ministério Público.', 'Qualquer situação; é o único caminho quando não há acordo.'], prazo: ['Pode sair no mesmo dia, com a documentação completa.', 'Meses, conforme a vara <mark>[a confirmar]</mark>.'], base: 'CPC, art. 733; Lei 11.441/2007; Res. CNJ 35/2007 e 571/2024.' },
    inventario: { req: ['Todos os herdeiros de acordo e capazes; com testamento ou herdeiro incapaz, só nas hipóteses da Res. CNJ 571/2024, com o Ministério Público.', 'Qualquer situação; obrigatório quando há conflito entre herdeiros.'], prazo: ['Dias, depois das certidões e do ITCMD.', 'Meses a anos, conforme a vara <mark>[a confirmar]</mark>.'], base: 'CPC, art. 610; Lei 11.441/2007; Res. CNJ 35/2007 e 571/2024.' },
  };
  valor.addEventListener('input', () => { const n = valor.value.replace(/\D/g, '').slice(0, 13); valor.value = n ? brl(n / 100) : ''; });
  function desenhar() {
    const d = DADOS[tipo.value], v = +(valor.value.replace(/\D/g, '') || 0) / 100, linhas = ATOS_CUSTAS[tipo.value].linhas({ valor: v });
    const emol = linhas ? linhas.reduce((s, l) => s + l[2], 0) : 0, total = emol * (1 + TABELA_AL.tsnr / 100);
    saida.innerHTML = `<div class="tabela comp"><table><thead><tr><th></th><th>Em cartório</th><th>Na Justiça</th></tr></thead><tbody>
      <tr><td>Quando cabe</td><td>${d.req[0]}</td><td>${d.req[1]}</td></tr>
      <tr><td>Advogado</td><td>Obrigatório (assina a escritura)</td><td>Obrigatório</td></tr>
      <tr><td>Prazo típico</td><td>${d.prazo[0]}</td><td>${d.prazo[1]}</td></tr>
      <tr><td>Custas</td><td>${linhas ? `<b>${brl(total)}</b> (emolumentos + TSNR, sem ISS)` : 'Informe o valor dos bens'}</td><td>Custas judiciais do TJAL <mark>[a serventia informa]</mark></td></tr>
      <tr><td>Onde</td><td>Qualquer tabelionato do país (Lei 8.935/1994, art. 8º)</td><td>Vara competente</td></tr></tbody></table></div>
      <p class="mini">Nos dois caminhos: honorários do advogado, ITCMD ao estado (inventário) e registro dos bens à parte. ${d.base}</p>`;
  }
  tipo.addEventListener('change', desenhar); valor.addEventListener('input', desenhar); desenhar();
})();

/* ------------------------------------------------------------------ e-Notariado, FAQ, apresentação */
$('#lista-online').innerHTML = SERVICOS.filter((s) => s.online).map((s) => `<li>${ic('check')}<span>${esc(s.nome)}</span></li>`).join('');

$('#lista-faq').innerHTML = FAQ.map(([p, r]) => `<details class="faq" name="faq"><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join('');
$('#busca-faq').addEventListener('input', (e) => {
  const a = norm(e.target.value), todas = $$('details.faq');
  todas.forEach((d) => { d.hidden = !!a && !norm(d.textContent).includes(a); d.open = false; });
  const vis = todas.filter((d) => !d.hidden);
  // abre a que tem o termo na pergunta; só cai na resposta se nenhuma pergunta tiver
  if (a) (vis.find((d) => norm($('summary', d).textContent).includes(a)) || vis[0])?.setAttribute('open', '');
  $('#faq-vazio').hidden = vis.length > 0;
});

$('#lista-apres').innerHTML = MELHORIAS.map(([t, d, alvo]) => `<li><b>${t}</b><span>${d}</span><br>${alvo === 'assistente' ? '<a href="#" data-abrir="assistente">Ver no protótipo →</a>' : `<a href="${alvo}" data-ir-apres>Ver no protótipo →</a>`}</li>`).join('');
const apres = $('#apres'), btApres = $('#bt-apres');
const alternarApres = (abrir) => { apres.classList.toggle('aberto', abrir); btApres.setAttribute('aria-expanded', abrir); };
btApres.addEventListener('click', () => alternarApres(!apres.classList.contains('aberto')));
$('#apres-fechar').addEventListener('click', () => alternarApres(false));
apres.addEventListener('click', (e) => { if (e.target.closest('[data-ir-apres],[data-abrir]') && innerWidth < 700) alternarApres(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { alternarApres(false); topo.classList.remove('aberto'); } });
})();
