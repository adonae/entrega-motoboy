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
    const lote = await LoteRepository.getById(loteId);
    if (!lote) throw new Error(MENSAGENS.LOTE_NAO_ENCONTRADO);
    if (lote.saiuEm) return;

    const db = getDb();
    const batch = db.batch();

    const loteRef = db.collection(COLECOES.LOTES).doc(loteId);
    batch.update(loteRef, { saiuEm: serverTimestamp() });

    for (const entregaId of lote.entregaIds) {
      const ref = db.collection(COLECOES.ENTREGAS).doc(entregaId);
      batch.update(ref, {
        status: STATUS.SAIU_LOJA,
        loteId,
      });
    }

    await batch.commit();
  },

  async carregarEntregasDoLote(lote) {
    if (!lote?.entregaIds?.length) return [];
    const entregas = await Promise.all(
      lote.entregaIds.map((id) => EntregaRepository.getById(id)),
    );
    return entregas.filter(Boolean);
  },
};
