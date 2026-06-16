import { getDb, serverTimestamp } from "../firebase.js";
import { LoteRepository } from "../repositories/LoteRepository.js";
import { EntregaRepository } from "../repositories/EntregaRepository.js";
import { STATUS, COLECOES, MENSAGENS } from "../utils/constants.js";

export const LoteService = {
  async criar(entregaIds) {
    if (!entregaIds?.length) {
      throw new Error(MENSAGENS.SEM_ENTREGAS_PENDENTES);
    }
    return LoteRepository.add(entregaIds);
  },

  async buscarPorId(id) {
    const lote = await LoteRepository.getById(id);
    if (!lote) throw new Error(MENSAGENS.LOTE_NAO_ENCONTRADO);
    return lote;
  },

  async listarTodos() {
    return LoteRepository.listAll();
  },

  async sairLoja(loteId) {
    const db = getDb();
    const loteRef = db.collection(COLECOES.LOTES).doc(loteId);

    await db.runTransaction(async (transaction) => {
      const loteSnap = await transaction.get(loteRef);
      if (!loteSnap.exists) {
        throw new Error(MENSAGENS.LOTE_NAO_ENCONTRADO);
      }
      const lote = { id: loteSnap.id, ...loteSnap.data() };
      if (lote.saiuEm) return;

      transaction.update(loteRef, { saiuEm: serverTimestamp() });

      for (const entregaId of lote.entregaIds) {
        const ref = db.collection(COLECOES.ENTREGAS).doc(entregaId);
        transaction.update(ref, {
          status: STATUS.SAIU_LOJA,
          loteId,
        });
      }
    });
  },

  async carregarEntregasDoLote(lote) {
    if (!lote?.id) return [];
    return EntregaRepository.listByLoteId(lote.id);
  },
};
