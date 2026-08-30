/* Home: cards em destaque, FAQ resumida e depoimentos. */
import { SERVICOS } from './catalogo.js?v=20919b6d27';
import { FAQ_DESTAQUE as FAQ } from './faq-home.js?v=06331a427b';
import { modalidadeDoAto, MODALIDADE } from './regras.js?v=8e91b1e90a';
import { $, icone, urlAto } from './app.js?v=cb2dc82c2c';

const DEPOIMENTOS = [
  { nome: 'Fernanda Xavier de Brito', texto: 'Acabei de emitir meu certificado digital para o e-Notariado junto ao 23º Ofício de Notas! Fui atendida com cortesia e eficiência, com o passo a passo de forma muito prática. Serviço de excelente qualidade!' },
  { nome: 'Thiago Gomes da Silva', texto: 'Fui atendido por um dos escreventes, muito atencioso, processo rápido e fácil, e tirou todas as minhas dúvidas. Recomendo a todos que façam o e-Not aqui.' },
  { nome: 'Sergio Sennder', texto: 'Fiz um pré-registro para certificado digital pelo e-Notariado. O cartório respondeu prontamente e me deu instruções para os próximos passos. Recebi o link pouco depois e criei o certificado sem problemas.' },
  { nome: 'Celeste Botelho', texto: 'Desde o começo o escrevente foi educado, prestativo e paciente, explicando tudo de forma clara. Resolveu tudo sem complicação. É sempre bom encontrar profissionais assim.' },
  { nome: 'Isabella Soares', texto: 'Agradeço o atendimento sempre atencioso e respeitoso que recebo neste cartório. Torna qualquer processo mais leve com seu jeito humano e acolhedor.' },
];

/* --- cards em destaque --- */
const grade = $('#destaques');
if (grade) {
  grade.innerHTML = SERVICOS.filter((s) => s.destaque).slice(0, 8).map((s) => {
    const { selo, modalidade } = modalidadeDoAto(s);
    const online = modalidade !== MODALIDADE.PRESENCIAL && selo;
    return `<article class="card card--link">
      <span class="card__icone"><img src="${s.icone || 'assets/icons/atos-notariais.svg'}" alt="" width="32" height="32" loading="lazy"></span>
      <span class="etiqueta">${s.categoria}</span>
      <h3><a href="${urlAto(s.slug)}" style="text-decoration:none;color:inherit">${s.titulo}</a></h3>
      <p class="card__resumo">${s.resumo || 'Veja os documentos necessários e como solicitar.'}</p>
      <div class="card__rodape">
        ${online ? `<span class="etiqueta etiqueta--online">${icone('video')} ${selo}</span>` : ''}
      </div>
    </article>`;
  }).join('');
}

/* --- FAQ resumida (as 5 primeiras) --- */
const faq = $('#faq-home');
if (faq) {
  faq.dataset.exclusivo = '';
  faq.innerHTML = FAQ.map((f, i) => `
    <div class="acordeao__item">
      <h3 style="margin:0"><button class="acordeao__botao" type="button" aria-expanded="false" aria-controls="fh-${i}">
        ${f.p} ${icone('mais')}
      </button></h3>
      <div class="acordeao__painel" id="fh-${i}"><div><p>${f.r}</p></div></div>
    </div>`).join('');
}

/* --- depoimentos --- */
const trilho = $('#depoimentos');
if (trilho) {
  trilho.innerHTML = DEPOIMENTOS.map((d) => `
    <figure class="depoimento">
      <div class="estrelas" aria-label="5 de 5 estrelas">${icone('estrela').repeat(5)}</div>
      <blockquote>“${d.texto}”</blockquote>
      <figcaption><span class="avatar" aria-hidden="true">${d.nome[0]}</span> ${d.nome}</figcaption>
    </figure>`).join('');
}

/* FAQ da home também entra no schema — rich snippet sem duplicar conteúdo */
if (FAQ.length) {
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question', name: f.p,
      acceptedAnswer: { '@type': 'Answer', text: f.r },
    })),
  });
  document.head.appendChild(ld);
}

/* --- parallax da foto do hero --- */
/* A foto desce a ~18% da velocidade da rolagem, o que dá profundidade sem
   enjoar. Tudo dentro de rAF e só enquanto o hero está na tela; quem pede
   movimento reduzido não recebe nada. */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = document.querySelector('.hero');
  const foto = hero?.querySelector('picture');
  if (foto) {
    let agendado = false;
    const aplicar = () => {
      agendado = false;
      const fim = hero.offsetTop + hero.offsetHeight;
      if (scrollY < fim) foto.style.setProperty('--paralaxe', `${(scrollY * 0.18).toFixed(1)}px`);
    };
    addEventListener('scroll', () => {
      if (!agendado) { agendado = true; requestAnimationFrame(aplicar); }
    }, { passive: true });
  }
}
