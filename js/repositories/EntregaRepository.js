// ============================================================
//  EntregaRepository.js
//  Acesso ao Firestore. Única camada que conhece o banco.
//
//  Melhorias aplicadas:
//  - Nome da coleção vem de COLECOES (constants.js) — sem string mágica
//  - Novo método `escutarPorId` com onSnapshot para tempo real
// ============================================================

import { getDb, serverTimestamp } from "../firebase.js";
import { COLECOES } from "../utils/constants.js";

export const EntregaRepository = {
  async add(data) {
    const db = getDb();
    return db.collection(COLECOES.ENTREGAS).add({
      ...data,
      criadoEm: serverTimestamp(),
    });
  },

  async getById(id) {
    const db = getDb();
    const doc = await db.collection(COLECOES.ENTREGAS).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async update(id, data) {
    const db = getDb();
    return db
      .collection(COLECOES.ENTREGAS)
      .doc(id)
      .update({ ...data, atualizadoEm: serverTimestamp() });
  },

  async delete(id) {
    const db = getDb();
    return db.collection(COLECOES.ENTREGAS).doc(id).delete();
  },

  async listAll() {
    const db = getDb();
    const snap = await db
      .collection(COLECOES.ENTREGAS)
      .orderBy("criadoEm", "desc")
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async listByStatus(status) {
    const db = getDb();
    const snap = await db
      .collection(COLECOES.ENTREGAS)
      .where("status", "==", status)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async updateStatus(id, status, extraData = {}) {
    const db = getDb();
    return db
      .collection(COLECOES.ENTREGAS)
      .doc(id)
      .update({ status, ...extraData });
  },

  /**
   * Escuta mudanças em tempo real em uma entrega específica via onSnapshot.
   *
   * @param {string}   id        - ID do documento no Firestore
   * @param {Function} onChange  - Chamada com { id, ...data } toda vez que mudar
   * @param {Function} onError   - Chamada com o erro caso o listener falhe
   * @returns {Function} unsubscribe — chame para parar de escutar (evitar memory leak)
   */
  escutarPorId(id, onChange, onError) {
    const db = getDb();
    return db
      .collection(COLECOES.ENTREGAS)
      .doc(id)
      .onSnapshot(
        (doc) => {
          if (!doc.exists) {
            onError(new Error("Entrega não encontrada."));
            return;
          }
          onChange({ id: doc.id, ...doc.data() });
        },
        onError,
      );
  },
};
