// Fonte unica de verdade para strings reutilizadas no projeto.

/** Nomes das colecoes do Firestore. */
export const COLECOES = {
  ENTREGAS: "entregas",
};

/** Valores possiveis do campo `status` de uma entrega. */
export const STATUS = {
  PENDENTE: "pendente",
  EM_ROTA: "em_rota",
  ENTREGUE: "entregue",
};

/** Chaves usadas no localStorage. */
export const STORAGE_KEYS = {
  ENDERECO_LOJA: "endereco_loja",
};

/** Mensagens de erro padronizadas. */
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
};
