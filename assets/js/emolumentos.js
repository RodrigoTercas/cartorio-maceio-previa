/* Calculadora de emolumentos. A tabela vive em emolumentos-tabela.js
   para que a atualização anual não exija tocar nesta lógica. */
import { SERVICOS } from './catalogo.js?v=20919b6d27';
import { TABELA, COM_VALOR } from './emolumentos-tabela.js?v=85070a595e';
import { $, icone, urlAto } from './app.js?v=cb2dc82c2c';

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* aviso enquanto a tabela não for a oficial */
$('#aviso-tabela').innerHTML = TABELA.oficial
  ? `<div class="aviso mb-5">${icone('doc-check')}<p><strong>Valores oficiais.</strong>
       Emolumentos da ${TABELA.fonte}, vigência ${TABELA.vigencia}. A estimativa inclui os acréscimos
       legais; o valor final é conferido pelo cartório na lavratura.</p></div>`
  : `<div class="aviso mb-5">${icone('alerta')}<p><strong>Valores ilustrativos.</strong>
       A tabela oficial do TJ-RJ ainda não foi carregada neste site — o cálculo abaixo serve para
       mostrar como a conta é composta, não como orçamento. Para o valor real,
       <a href="https://wa.me/5521986600006?text=Ol%C3%A1%21%20Gostaria%20de%20um%20or%C3%A7amento.">peça o orçamento à equipe</a>.</p></div>`;

/* select de atos: só os que a calculadora conhece */
const calculaveis = SERVICOS.filter((s) => COM_VALOR.has(s.slug) || s.slug in TABELA.fixos);
$('#ato').innerHTML = '<option value="">Escolha o ato…</option>' +
  calculaveis.map((s) => `<option value="${s.slug}">${s.titulo}</option>`).join('');
$('#ato').value = new URLSearchParams(location.search).get('s') || '';

/* máscara de moeda simples: guarda centavos como inteiro */
const campoValor = $('#valor');
campoValor.addEventListener('input', () => {
  const digitos = campoValor.value.replace(/\D/g, '').slice(0, 12);
  campoValor.value = digitos ? brl(Number(digitos) / 100) : '';
  calcular();
});
const valorEmReais = () => Number(campoValor.value.replace(/\D/g, '') || 0) / 100;

function emolumentoDe(slug, valor) {
  if (TABELA.gratuitos.includes(slug)) return { gratuito: true };
  if (slug in TABELA.fixos) return { ...TABELA.fixos[slug], fixo: true };
  const faixa = TABELA.faixas.find((f) => valor <= f.ate);
  return faixa ? { ...faixa } : { emolumento: 0, total: 0 };
}

function calcular() {
  const slug = $('#ato').value;
  const servico = SERVICOS.find((s) => s.slug === slug);
  const precisaValor = COM_VALOR.has(slug);
  $('#campo-valor').hidden = !precisaValor;

  if (!slug) { $('#saida').innerHTML = ''; return; }
  const valor = valorEmReais();
  if (precisaValor && !valor) {
    $('#saida').innerHTML = `<p class="texto-2">Informe o valor do negócio para ver a estimativa.</p>`;
    return;
  }

  const { emolumento, total: totalTabela, gratuito, fixo } = emolumentoDe(slug, valor);
  if (gratuito) {
    $('#saida').innerHTML = `<div class="resumo"><p class="olho">${icone('check-circ')} Ato gratuito</p>
      <p><strong>${servico.titulo}</strong> é gratuito por determinação legal — não há emolumentos a recolher.</p></div>`;
    return;
  }

  /* fundos estaduais incidem sobre o emolumento; a coluna Total da tabela
     já embute os 2% de atos gratuitos/PMCMV */
  const linhas = TABELA.acrescimos.map((a) => ({ nome: a.nome, valor: emolumento * a.percentual / 100, pct: a.percentual }));
  const gratuitos2 = totalTabela - emolumento;
  let total = totalTabela + linhas.reduce((s, l) => s + l.valor, 0);
  let comTeto = false;
  if (slug === 'inventario-extrajudicial' && TABELA.tetoInventario && total > TABELA.tetoInventario) {
    total = TABELA.tetoInventario; comTeto = true;
  }

  $('#saida').innerHTML = `
    <div class="resumo mt-5">
      <p class="olho">Estimativa</p>
      <p style="font-family:var(--f-titulo);font-size:var(--t-3xl);margin:0;line-height:1">${brl(total)}</p>
      <p class="texto-2 pequeno">${servico.titulo}${precisaValor ? ` · negócio de ${brl(valor)}` : ' · ato sem valor econômico'}</p>
      <div class="tabela-rolagem mt-5">
        <table>
          <caption class="so-leitor">Composição do valor</caption>
          <thead><tr><th>Componente</th><th class="num">Valor</th></tr></thead>
          <tbody>
            <tr><td>Emolumento do tabelião${fixo ? ' (valor fixo)' : ''}</td><td class="num">${brl(emolumento)}</td></tr>
            <tr><td>Atos gratuitos e PMCMV <span class="miudo">(2%)</span></td><td class="num">${brl(gratuitos2)}</td></tr>
            ${linhas.map((l) => `<tr><td>${l.nome} <span class="miudo">(${l.pct}%)</span></td><td class="num">${brl(l.valor)}</td></tr>`).join('')}
            <tr><td><strong>Total estimado${comTeto ? ' (teto legal aplicado)' : ''}</strong></td><td class="num"><strong>${brl(total)}</strong></td></tr>
          </tbody>
        </table>
      </div>
      <p class="miudo mt-4">Não inclui ITBI/ITD, certidões nem o registro do ato no Registro de Imóveis.</p>
      <div class="linha mt-4">
        <a class="botao botao--p" href="${urlAto(slug)}">Ver documentos deste ato</a>
        <a class="botao botao--contorno botao--p" href="agendar.html?s=${slug}">Agendar</a>
      </div>
    </div>`;
}

$('#ato').addEventListener('change', calcular);
calcular();
