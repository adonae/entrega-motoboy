import { getDb, serverTimestamp } from "../firebase.js";
import { COLECOES } from "../utils/constants.js";

export const LoteRepository = {
  async add(entregaIds) {
    const db = getDb();
    return db.collection(COLECOES.LOTES).add({
      entregaIds,
      criadoEm: serverTimestamp(),
      saiuEm: null,
    });
  },

  async getById(id) {
    const db = getDb();
    const doc = await db.collection(COLECOES.LOTES).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async listAll() {
    const db = getDb();
    const snap = await db
      .collection(COLECOES.LOTES)
      .orderBy("criadoEm", "desc")
      .limit(50)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};
