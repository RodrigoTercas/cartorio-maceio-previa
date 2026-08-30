/* Assistente de escolha do ato.
   A árvore fica em dados, não em ifs espalhados: o cartório amplia
   editando FLUXO, sem mexer na lógica de navegação. */
import { SERVICOS } from './catalogo.js?v=20919b6d27';
import { $, $$, icone, whatsappUrl, urlAto, rastrear } from './app.js?v=cb2dc82c2c';

const FLUXO = {
  inicio: {
    pergunta: 'O que você precisa resolver?',
    opcoes: [
      { texto: 'Transferir ou receber um bem', ajuda: 'Imóvel, veículo, quota — compra, doação, dação', vai: 'bem' },
      { texto: 'Resolver uma questão de família', ajuda: 'Herança, divórcio, união estável, casamento', vai: 'familia' },
      { texto: 'Dar poderes a alguém', ajuda: 'Alguém agir em seu nome, ou cancelar isso', vai: 'poderes' },
      { texto: 'Validar assinatura ou documento', ajuda: 'Firma, cópia autenticada, documento para o exterior', vai: 'validar' },
      { texto: 'Resolver algo sem sair de casa', ajuda: 'Atos eletrônicos, certificado digital, viagem de menor', vai: 'online' },
    ],
  },
  bem: {
    pergunta: 'Como o bem vai ser transferido?',
    opcoes: [
      { texto: 'Vendendo — há pagamento em dinheiro', resultado: ['compra-e-venda'] },
      { texto: 'Doando — sem pagamento', resultado: ['doacao'] },
      { texto: 'Para quitar uma dívida', resultado: ['dacao-em-pagamento'] },
      { texto: 'É um veículo', resultado: ['transferencia-do-veiculo-digital', 'reconhecimento-de-firma'] },
      { texto: 'Ocupo o imóvel há anos e quero regularizar', resultado: ['usucapiao-extrajudicial'] },
    ],
  },
  familia: {
    pergunta: 'Qual é a situação?',
    opcoes: [
      { texto: 'Alguém da família faleceu', ajuda: 'Partilha de bens entre herdeiros', resultado: ['inventario-extrajudicial', 'certidao-de-existencia-de-testamento'] },
      { texto: 'Fim de casamento', resultado: ['divorcio'] },
      { texto: 'Vou casar e quero definir o regime de bens', resultado: ['pacto-antenupcial'] },
      { texto: 'Vivo com meu companheiro e quero formalizar', resultado: ['declaracao-de-uniao-estavel'] },
      { texto: 'Quero organizar minha sucessão em vida', resultado: ['testamento', 'dav-testamento-vital'] },
      { texto: 'Reconhecer filho ou emancipar menor', resultado: ['reconhecimento-de-filho', 'emancipacao'] },
    ],
  },
  poderes: {
    pergunta: 'O que você quer fazer?',
    opcoes: [
      { texto: 'Nomear alguém para agir em meu nome', resultado: ['procuracao-e-substabelecimento'] },
      { texto: 'Cancelar uma procuração já feita', resultado: ['revogacao-de-procuracao'] },
    ],
  },
  validar: {
    pergunta: 'O que precisa ser validado?',
    opcoes: [
      { texto: 'Minha assinatura em um documento', ajuda: 'Se é a primeira vez, é preciso abrir firma antes', resultado: ['reconhecimento-de-firma', 'abertura-de-firma'] },
      { texto: 'Uma cópia de documento', resultado: ['autenticacao-de-copia'] },
      { texto: 'Um documento que vai para o exterior', resultado: ['apostilamento'] },
      { texto: 'Registrar um fato como prova', ajuda: 'Conversa, site, estado de um imóvel', resultado: ['ata-notarial'] },
      { texto: 'Um documento digital que preciso em papel', resultado: ['materializacao-de-documento'] },
    ],
  },
  online: {
    pergunta: 'O que você precisa?',
    opcoes: [
      { texto: 'Assinar atos por videoconferência', resultado: ['atos-notariais-eletronicos', 'certificado-digital'] },
      { texto: 'Autorizar viagem de menor', resultado: ['autorizacao-eletronica-de-viagem-aev'] },
      { texto: 'Registrar doação de órgãos', resultado: ['autorizacao-eletronica-de-doacao-de-orgaos-aedo'] },
      { texto: 'Emitir certificado digital', resultado: ['certificado-digital'] },
      { texto: 'Conferir se um documento é autêntico', resultado: ['autenticidade-de-documentos', 'validacao-de-certificado'] },
    ],
  },
};

const palco = $('#palco');
const historico = [];
let no = 'inicio';

function marcarPasso(i) {
  $$('#passos li').forEach((li, k) => {
    li.classList.toggle('feito', k < i);
    k === i ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current');
  });
}

function desenharPergunta(chave) {
  const n = FLUXO[chave];
  marcarPasso(historico.length ? 1 : 0);
  palco.innerHTML = `
    <fieldset class="etapa ativa">
      <legend><h2 style="font-size:var(--t-2xl);margin:0">${n.pergunta}</h2></legend>
      <div class="opcoes">
        ${n.opcoes.map((o, i) => `
          <button class="opcao" type="button" data-i="${i}" style="text-align:left;width:100%">
            <span>${icone('seta-dir')}</span>
            <span><strong>${o.texto}</strong>${o.ajuda ? `<span>${o.ajuda}</span>` : ''}</span>
          </button>`).join('')}
      </div>
    </fieldset>`;
  $('#acoes').hidden = historico.length === 0;

  $$('.opcao', palco).forEach((b) => b.addEventListener('click', () => {
    const o = n.opcoes[+b.dataset.i];
    historico.push(chave);
    if (o.vai) { no = o.vai; desenharPergunta(no); }
    else desenharResultado(o.resultado, o.texto);
  }));
}

function desenharResultado(slugs, escolha) {
  rastrear('assistente_resultado', { atos: slugs.join(','), escolha });
  marcarPasso(2);
  const achados = slugs.map((s) => SERVICOS.find((x) => x.slug === s)).filter(Boolean);
  palco.innerHTML = `
    <div class="etapa ativa">
      <p class="olho">Resultado</p>
      <h2 style="font-size:var(--t-2xl)">${achados.length === 1 ? 'O ato que resolve o seu caso' : 'Os atos que resolvem o seu caso'}</h2>
      <p class="texto-2">Para “${escolha}”.</p>
      <div class="pilha mt-5">
        ${achados.map((s, i) => `
          <article class="card">
            ${achados.length > 1 ? `<span class="etiqueta">${i === 0 ? 'Principal' : 'Pode ser necessário também'}</span>` : ''}
            <h3>${s.titulo}</h3>
            <p>${s.resumo || 'Veja os documentos necessários e como solicitar.'}</p>
            <div class="card__rodape linha">
              <a class="botao botao--p" href="${urlAto(s.slug)}">Ver documentos e solicitar</a>
            </div>
          </article>`).join('')}
      </div>
      <div class="aviso mt-5">${icone('alerta')}
        <p>A indicação é orientativa. Casos com particularidades — bens em outro estado, herdeiro menor, empresa envolvida —
        merecem uma conversa antes. <a href="${whatsappUrl(`Olá! Usei o assistente do site e cheguei em: ${achados.map((a) => a.titulo).join(', ')}. Podem confirmar se é isso mesmo?`)}" target="_blank" rel="noopener">Confirmar no WhatsApp</a>.</p>
      </div>
    </div>`;
  $('#acoes').hidden = false;
}

$('#voltar').addEventListener('click', () => {
  const anterior = historico.pop() || 'inicio';
  no = anterior;
  desenharPergunta(anterior);
  if (!historico.length) $('#acoes').hidden = true;
});

desenharPergunta(no);
