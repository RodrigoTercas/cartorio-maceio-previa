import { LINKS_UTEIS } from './conteudo.js?v=89c411fbff';
import { $, icone } from './app.js?v=cb2dc82c2c';

const DESCRICOES = {
  'ANOREG': 'Associação dos Notários e Registradores do Brasil.',
  'ARPEN': 'Central dos registros civis: certidões de nascimento, casamento e óbito.',
  'CENPROT': 'Consulta nacional de protesto de títulos.',
  'CNB': 'Colégio Notarial do Brasil — normas e centrais dos tabelionatos de notas.',
  'CNJ': 'Conselho Nacional de Justiça.',
  'E-Notariado': 'Plataforma dos atos notariais eletrônicos e do certificado digital notarizado.',
  'ONR TDPJ': 'Operador Nacional do Registro — serviços eletrônicos de registro de imóveis.',
  'RI Digital': 'Registro de imóveis eletrônico do estado do Rio de Janeiro.',
};

$('#lista-links').innerHTML = LINKS_UTEIS.map((l) => `
  <a class="card card--link" href="${l.url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
    <h3>${l.nome}</h3>
    <p>${DESCRICOES[l.nome] || 'Portal oficial.'}</p>
    <div class="card__rodape"><span class="link-seta">Acessar ${icone('seta-dir')}</span></div>
  </a>`).join('');
