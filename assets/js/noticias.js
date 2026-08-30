/* Notícias: por ora, a lista aponta para os artigos no site atual.
   Migrar o conteúdo dos artigos é etapa própria — cada um é uma página. */
import { $, icone } from './app.js?v=cb2dc82c2c';

const ARTIGOS = [
  { titulo: 'União estável e filho socioafetivo', url: 'https://site14.inovacartorios.com.br/noticias/detalhe/uniao-estavel-e-filho-socioafetivo' },
  { titulo: 'STJ não homologa ato notarial francês sobre testamento com bens no Brasil', url: 'https://site14.inovacartorios.com.br/noticias/detalhe/stj-nao-homologa-ato-notarial-frances-sobre-testamento-com-bens-no-brasil' },
  { titulo: 'Brasil bate recorde de testamentos em 2025 e expõe nova tendência no planejamento sucessório', url: 'https://site14.inovacartorios.com.br/noticias/detalhe/brasil-bate-recorde-de-testamentos-em-2025-e-expoe-nova-tendencia-no-planejamento-sucessorio' },
  { titulo: 'Quando a voz mente e a imagem engana', url: 'https://site14.inovacartorios.com.br/noticias/detalhe/quando-a-voz-mente-e-a-imagem-engana' },
];

$('#lista-noticias').innerHTML = ARTIGOS.map((a) => `
  <a class="card card--link" href="${a.url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
    <h3>${a.titulo}</h3>
    <div class="card__rodape"><span class="link-seta">Ler o artigo ${icone('seta-dir')}</span></div>
  </a>`).join('');
