/* ============================================================
   TABELA DE EMOLUMENTOS — Portaria CGJ nº 2.679/2025 (TJ-RJ)
   Valores de 2026, extraídos do PDF oficial publicado na página
   de preços do cartório (dados/tabela-emolumentos-cgj-2679-2025.pdf).

   Estrutura de cada valor: { emolumento, total } — o "total" é a
   coluna Total da tabela, que já embute os 2% de atos gratuitos
   e PMCMV. Os fundos estaduais são calculados sobre o emolumento.

   TODO (Rodrigo): confirmar os percentuais de `acrescimos` e a
   incidência do ISS para tabelionato de notas na capital. As faixas
   e valores fixos são os da Portaria; os percentuais dos fundos eu
   NÃO extraí do PDF — vieram da prática usual do RJ e precisam de
   conferência antes do go-live.
   ============================================================ */
export const TABELA = {
  oficial: true,
  vigencia: '2026',
  fonte: 'Portaria CGJ nº 2.679/2025 — Corregedoria-Geral da Justiça do RJ (Tabela 22, Lei 9.873/2022)',

  /* Item 1 — Escritura com valor declarado (lavratura, inclusive traslado). */
  faixas: [
    { ate: 21064.17,  emolumento: 331.90,  total: 338.53 },
    { ate: 42128.37,  emolumento: 548.45,  total: 559.41 },
    { ate: 63192.57,  emolumento: 765.04,  total: 780.34 },
    { ate: 84256.79,  emolumento: 938.25,  total: 957.01 },
    { ate: 112342.37, emolumento: 1663.03, total: 1696.29 },
    { ate: 140427.98, emolumento: 1963.31, total: 2002.57 },
    { ate: 280855.98, emolumento: 2656.25, total: 2709.37 },
    /* última faixa da Portaria; acima dela vale o mesmo valor (teto da tabela) */
    { ate: Infinity,  emolumento: 2850.22, total: 2907.22 },
  ],

  /* Teto do art. 19: escritura de inventário e partilha não pode exceder
     este valor, já incluídos acréscimos legais e tributos. */
  tetoInventario: 120560.91,

  /* Acréscimos sobre o EMOLUMENTO (não sobre o total) — CONFERIR percentuais. */
  acrescimos: [
    { nome: 'FETJ', percentual: 20 },
    { nome: 'FUNDPERJ', percentual: 5 },
    { nome: 'FUNPERJ', percentual: 5 },
    { nome: 'FUNARPEN', percentual: 4 },
    { nome: 'ISS', percentual: 5 },
  ],

  /* Atos de valor fixo — item e alínea da Tabela 22 anotados em cada linha. */
  fixos: {
    'divorcio':                        { emolumento: 453.59, total: 462.66 },  // 1.2.b
    'declaracao-de-uniao-estavel':     { emolumento: 211.39, total: 215.61 },  // 1.2.c (regime comum)
    'pacto-antenupcial':               { emolumento: 211.39, total: 215.61 },  // 1.2.a (escritura não especificada) — conferir enquadramento
    'reconhecimento-de-filho':         { emolumento: 211.39, total: 215.61 },  // 1.2.a (reconhecimento de paternidade)
    'procuracao-e-substabelecimento':  { emolumento: 426.86, total: 435.39 },  // 2.b (bens, imóveis e valores)
    'revogacao-de-procuracao':         { emolumento: 176.75, total: 180.28 },  // 2.d (outras hipóteses)
    'reconhecimento-de-firma':         { emolumento: 9.50,   total: 9.69 },    // 3.b (por semelhança); autenticidade: 12,56
    'abertura-de-firma':               { emolumento: 35.35,  total: 36.05 },   // 3.c
    'autenticacao-de-copia':           { emolumento: 9.80,   total: 9.99 },    // 4 (por documento ou página)
    'testamento':                      { emolumento: 692.88, total: 706.73 },  // 5.II.b (sem valor); com bens: faixas do item 1
    'dav-testamento-vital':            { emolumento: 772.33, total: 787.77 },  // 12.a
    'ata-notarial':                    { emolumento: 386.58, total: 394.31 },  // 6 (sem conteúdo econômico, 1ª folha)
    'apostilamento':                   { emolumento: 105.24, total: 105.24 },  // Tabela 16, item 4 (por documento)
    'materializacao-de-documento':     { emolumento: 19.42,  total: 19.80 },   // 9 (por página)
    'autorizacao-eletronica-de-viagem-aev': { emolumento: 75.81, total: 77.32 }, // 11
  },

  /* Gratuidade legal (Resolução CNJ — AEDO). */
  gratuitos: ['autorizacao-eletronica-de-doacao-de-orgaos-aedo'],
};

/** Atos cujo emolumento depende do valor do negócio (item 1 da Tabela 22). */
export const COM_VALOR = new Set([
  'compra-e-venda','doacao','dacao-em-pagamento','inventario-extrajudicial',
  'usucapiao-extrajudicial','carta-de-sentenca',
]);
