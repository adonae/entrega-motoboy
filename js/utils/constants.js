// Fonte unica de verdade para strings reutilizadas no projeto.

/** Nomes das colecoes do Firestore. */
export const COLECOES = {
  ENTREGAS: "entregas",
  LOTES: "lotes",
};

/** Valores possiveis do campo `status` de uma entrega. */
export const STATUS = {
  PENDENTE: "pendente",
  SAIU_LOJA: "saiu_loja",
  EM_ROTA: "em_rota",
  ENTREGUE: "entregue",
};

/** Status que representam etapas na timeline de rastreamento. */
export const TIMELINE = [
  { label: "Pedido criado", status: STATUS.PENDENTE },
  { label: "Saiu da loja", status: STATUS.SAIU_LOJA },
  { label: "Em rota", status: STATUS.EM_ROTA },
  { label: "Entregue", status: STATUS.ENTREGUE },
];

export const STATUS_STEP_INDEX = {
  [STATUS.PENDENTE]: 0,
  [STATUS.SAIU_LOJA]: 1,
  [STATUS.EM_ROTA]: 2,
  [STATUS.ENTREGUE]: 3,
};

/** Chaves usadas no localStorage. */
export const STORAGE_KEYS = {
  ENDERECO_LOJA: "endereco_loja",
};

export const LOJA = {
  ENDERECO: "Avenida Tabajaras, 848, Centro, Joao Pessoa - PB, CEP 58013-270",
  COORDS: {
    lat: -7.1235,
    lng: -34.87785,
    display: "Avenida Tabajaras, Centro, Joao Pessoa - PB, CEP 58013-270",
  },
};

/** Mensagens padronizadas. */
export const MENSAGENS = {
  ENTREGA_NAO_ENCONTRADA: "Entrega nao encontrada.",
  CAMPOS_OBRIGATORIOS: "Nome, telefone e endereco sao obrigatorios.",
  ERRO_CARREGAR: "Erro ao carregar. Tente novamente.",
  ERRO_SALVAR: "Erro ao salvar. Tente novamente.",
  ERRO_CONFIRMAR: "Erro ao confirmar entrega.",
  ID_INVALIDO: "Informe um ID valido.",
  NENHUMA_ENTREGA_PENDENTE: "Nenhuma entrega pendente.",
  ENDERECO_SALVO: "Endereco salvo!",
  ENTREGA_CRIADA: "Entrega criada com sucesso!",
  ENTREGA_CONFIRMADA: "Entrega confirmada!",
  FORMULARIO_LIMPO: "Formulario limpo.",
  LOTE_CRIADO: "Lote criado com sucesso!",
  LOTE_NAO_ENCONTRADO: "Lote nao encontrado.",
  SEM_ENTREGAS_PENDENTES: "Nenhuma entrega pendente para criar lote.",
  LOTE_SAIU_LOJA: "Lote marcado como saido da loja!",
};
