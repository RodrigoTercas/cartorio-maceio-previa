/* ============================================================
   Regras jurídicas do atendimento — 23º Ofício de Notas
   Este arquivo é o ÚNICO lugar do site que decide o que pode
   ser feito à distância. Separado de propósito: layout muda
   toda hora, regra notarial não.
   Base normativa: Provimento CNJ 100/2020, incorporado ao
   Código Nacional de Normas (Provimento 149/2023).
   ============================================================ */

/* Modalidades possíveis de um ato */
export const MODALIDADE = {
  PRESENCIAL: 'presencial',      // só no balcão
  ELETRONICO: 'eletronico',      // videoconferência pelo e-Notariado
  HIBRIDO:    'hibrido',         // qualquer uma das duas
};

/* Atos que a Central Notarial de Serviços Eletrônicos Compartilhados
   trata como serviço eletrônico próprio — não dependem de escritura. */
const SERVICOS_ELETRONICOS = new Set([
  'atos-notariais-eletronicos','e-not-assina','e-not-provas','certificado-digital',
  'autorizacao-eletronica-de-viagem-aev','autorizacao-eletronica-de-doacao-de-orgaos-aedo',
  'transferencia-do-veiculo-digital','autenticidade-de-documentos','autenticidade-de-autenticacoes',
  'validacao-de-certificado','certidao-de-existencia-de-testamento','conta-notarial','busca-cep',
  'central-nacional-de-cartoes-de-firma','e-notariado',
]);

/* Atos que exigem presença física por natureza do ato
   (coleta de assinatura/impressão digital no balcão). */
const SOMENTE_PRESENCIAL = new Set([
  'reconhecimento-de-firma','abertura-de-firma','autenticacao-de-copia',
  'reconhecimento-de-sinal-publico','materializacao-de-documento',
]);

/**
 * Decide como o cliente pode praticar o ato e o que avisar na página.
 *
 * @param {{slug:string, categoria:string}} servico
 * @returns {{modalidade:string, selo:string|null, aviso:string|null}}
 *
 * TODO (Rodrigo): a fatia do meio é jurídica, não de layout — as escrituras.
 * Hoje toda escritura cai em HIBRIDO com um aviso genérico. Na prática cada
 * família tem condição própria: testamento público tem forma legal específica;
 * atos sobre imóvel dependem de certidões e do registro competente; divórcio e
 * inventário exigem advogado; união estável e pacto antenupcial costumam correr
 * bem por videoconferência.
 *
 * Complete o bloco marcado abaixo com a regra que o cartório assume perante o
 * cliente. O que você escrever aqui vira o selo "pode ser por videoconferência"
 * no card e o aviso legal na página do ato — por isso não chuto: um selo errado
 * num site de cartório é problema, não detalhe de UX.
 */
export function modalidadeDoAto(servico) {
  const { slug, categoria } = servico;

  if (SERVICOS_ELETRONICOS.has(slug))
    return { modalidade: MODALIDADE.ELETRONICO, selo: '100% on-line',
             aviso: 'Serviço prestado inteiramente pela plataforma e-Notariado, sem necessidade de comparecimento.' };

  if (SOMENTE_PRESENCIAL.has(slug))
    return { modalidade: MODALIDADE.PRESENCIAL, selo: null,
             aviso: 'Ato praticado no balcão: depende da conferência presencial da assinatura ou do documento original.' };

  // ── COMPLETE AQUI: escrituras, procurações e demais atos notariais ──
  // Sugestão de forma (apague e escreva a sua):
  //
  //   if (slug === 'testamento') return { ... };
  //   if (['compra-e-venda','doacao','dacao-em-pagamento'].includes(slug)) return { ... };
  //   if (['divorcio','inventario-extrajudicial'].includes(slug)) return { ... };
  //
  // Enquanto não estiver preenchido, o site assume o padrão conservador:
  return { modalidade: MODALIDADE.HIBRIDO, selo: 'Presencial ou por vídeo',
           aviso: 'Este ato pode ser praticado no balcão ou por videoconferência pelo e-Notariado, conforme o caso. Confirme com o cartório antes de agendar.' };
}

/** Documentos que todo cliente precisa levar, qualquer que seja o ato. */
export const DOCUMENTOS_BASE = [
  'Documento de identidade com foto (RG, CNH ou passaporte), original',
  'CPF (dispensado se já constar no documento de identidade)',
  'Comprovante de residência atualizado',
  'Certidão de casamento atualizada, se casado(a)',
];

/** Prazo médio de conclusão, em dias úteis, por categoria. Usado só como
    estimativa visível ao cliente — o prazo real depende de certidões. */
export const PRAZO_ESTIMADO = {
  'Escrituras': [3, 10],
  'Procurações': [1, 2],
  'Firmas e autenticações': [0, 1],
  'Atos do e-Notariado': [0, 2],
  'Demais serviços': [1, 5],
};
