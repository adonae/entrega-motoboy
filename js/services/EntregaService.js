// ============================================================
//  EntregaService.js
//  Regras de negócio das entregas. Sem dependência de DOM.
//
//  Melhorias aplicadas:
//  - Strings de status e mensagens vêm de constants.js
//  - Novo método `escutarPorId` que delega o onSnapshot ao Repository
// ============================================================

import { EntregaRepository } from "../repositories/EntregaRepository.js";
import { serverTimestamp } from "../firebase.js";
import { STATUS, MENSAGENS } from "../utils/constants.js";

export const EntregaService = {
  montarEndereco(detalhes) {
    if (!detalhes?.rua || !detalhes?.numero || !detalhes?.cidade || !detalhes?.uf) {
      return "";
    }
    const complemento = detalhes.complemento ? `, ${detalhes.complemento}` : "";
    return [
      `${detalhes.rua}, ${detalhes.numero}${complemento}`,
      detalhes.bairro,
      `${detalhes.cidade} - ${detalhes.uf}`,
      `CEP ${detalhes.cep}`,
    ]
      .filter(Boolean)
      .join(" - ");
  },

  validarTelefone(telefone) {
    const digits = String(telefone ?? "").replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) return false;
    return true;
  },

  validarCep(cep) {
    const digits = String(cep ?? "").replace(/\D/g, "");
    return digits.length === 8;
  },

  async criar({ nome, telefone, observacoes, enderecoDetalhes }) {
    if (!nome || !telefone || !enderecoDetalhes) {
      throw new Error(MENSAGENS.CAMPOS_OBRIGATORIOS);
    }
    if (!this.validarTelefone(telefone)) {
      throw new Error("Telefone invalido. Informe DDD + numero (10 ou 11 digitos).");
    }
    if (enderecoDetalhes.cep && !this.validarCep(enderecoDetalhes.cep)) {
      throw new Error("CEP invalido. Informe 8 digitos.");
    }
    const endereco = this.montarEndereco(enderecoDetalhes);
    if (!endereco) {
      throw new Error(MENSAGENS.CAMPOS_OBRIGATORIOS);
    }
    return EntregaRepository.add({
      nome,
      telefone,
      endereco,
      enderecoDetalhes,
      observacoes: observacoes ?? "",
      status: STATUS.PENDENTE,
    });
  },

  async editar(id, { nome, telefone, observacoes, enderecoDetalhes }) {
    if (!id) {
      throw new Error(MENSAGENS.ID_INVALIDO);
    }
    if (!nome || !telefone || !enderecoDetalhes) {
      throw new Error(MENSAGENS.CAMPOS_OBRIGATORIOS);
    }
    if (!this.validarTelefone(telefone)) {
      throw new Error("Telefone invalido. Informe DDD + numero (10 ou 11 digitos).");
    }
    if (enderecoDetalhes.cep && !this.validarCep(enderecoDetalhes.cep)) {
      throw new Error("CEP invalido. Informe 8 digitos.");
    }
    const endereco = this.montarEndereco(enderecoDetalhes);
    if (!endereco) {
      throw new Error(MENSAGENS.CAMPOS_OBRIGATORIOS);
    }
    return EntregaRepository.update(id, {
      nome,
      telefone,
      endereco,
      enderecoDetalhes,
      observacoes: observacoes ?? "",
    });
  },

  async excluir(id) {
    if (!id) {
      throw new Error(MENSAGENS.ID_INVALIDO);
    }
    return EntregaRepository.delete(id);
  },

  async buscarPorId(id) {
    const entrega = await EntregaRepository.getById(id);
    if (!entrega) throw new Error(MENSAGENS.ENTREGA_NAO_ENCONTRADA);
    return entrega;
  },

  /**
   * Escuta uma entrega em tempo real.
   * Retorna a função `unsubscribe` — chame ao sair da página para evitar leak.
   *
   * @example
   * const parar = EntregaService.escutarPorId(id, (entrega) => renderizar(entrega), handleError);
   * // quando sair da página:
   * parar();
   */
  escutarPorId(id, onChange, onError) {
    return EntregaRepository.escutarPorId(id, onChange, onError);
  },

  async listarTodas() {
    return EntregaRepository.listAll();
  },

  async listarPendentes() {
    return EntregaRepository.listByStatus(STATUS.PENDENTE);
  },

  async sairParaEntrega(id) {
    return EntregaRepository.updateStatus(id, STATUS.EM_ROTA, {
      saiuEm: serverTimestamp(),
    });
  },

  async confirmarEntrega(id, { observacoesEntrega = "" } = {}) {
    return EntregaRepository.updateStatus(id, STATUS.ENTREGUE, {
      entregueEm: serverTimestamp(),
      observacoesEntrega,
    });
  },

  async atualizarStatus(id, novoStatus, extraData = {}) {
    if (!id) throw new Error(MENSAGENS.ID_INVALIDO);
    const timestamps = {
      [STATUS.EM_ROTA]: { emRotaEm: serverTimestamp() },
      [STATUS.ENTREGUE]: { entregueEm: serverTimestamp() },
    };
    return EntregaRepository.updateStatus(id, novoStatus, {
      ...(timestamps[novoStatus] ?? {}),
      ...extraData,
    });
  },

  contarPorStatus(entregas) {
    return entregas.reduce(
      (acc, e) => {
        acc.total++;
        if (e.status === STATUS.PENDENTE) acc.pendente++;
        else if (e.status === STATUS.SAIU_LOJA) acc.saiu_loja++;
        else if (e.status === STATUS.EM_ROTA) acc.em_rota++;
        else if (e.status === STATUS.ENTREGUE) acc.entregue++;
        return acc;
      },
      { total: 0, pendente: 0, saiu_loja: 0, em_rota: 0, entregue: 0 },
    );
  },
};
