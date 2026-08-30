/* Página de um ato. O conteúdo (texto, documentos, prazo) vem estático do
   build; aqui ficam apenas as partes que dependem de estado ou de regra:
   o selo de modalidade, o aviso legal e o checklist. */
import { SERVICOS } from './catalogo.js?v=20919b6d27';
import { modalidadeDoAto, MODALIDADE } from './regras.js?v=8e91b1e90a';
import { $, icone, whatsappUrl, ligarChecklist } from './app.js?v=cb2dc82c2c';

const slug = document.querySelector('meta[name="ato"]')?.content;
const servico = SERVICOS.find((s) => s.slug === slug);
if (servico) {
  const { selo, aviso, modalidade } = modalidadeDoAto(servico);

  if (aviso) $('#aviso-modalidade').innerHTML = `<div class="aviso mt-5">${icone('alerta')}<p>${aviso}</p></div>`;
  if (selo && modalidade !== MODALIDADE.PRESENCIAL)
    $('#selo-modalidade').innerHTML = `<span class="etiqueta etiqueta--online">${icone('video')} ${selo}</span>`;

  $('#tirar-duvida').href = whatsappUrl(`Olá! Preciso de orientação sobre ${servico.titulo}.`);

  ligarChecklist(slug, ({ total, marcadas, faltando }) => {
    $('#progresso').textContent = total ? `${marcadas} de ${total} separados` : '';
    $('#enviar-lista').href = whatsappUrl(
      `Olá! Vou precisar de ${servico.titulo}.\n\nAinda estou reunindo:\n` +
      (faltando.length ? faltando.map((f) => `• ${f}`).join('\n') : '(já tenho todos os documentos)') +
      `\n\nPodem confirmar se está tudo certo?`);
  });

  $('#imprimir').addEventListener('click', () => print());
}
