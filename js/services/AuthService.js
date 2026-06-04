import { getFirebase } from "../firebase.js";

let autenticado = false;
let authUnsubscribe = null;

export const AuthService = {
  async init() {
    if (autenticado) return;

    getFirebase();

    if (authUnsubscribe) {
      authUnsubscribe();
    }

    await new Promise((resolve, reject) => {
      authUnsubscribe = firebase.auth().onAuthStateChanged(
        (user) => {
          autenticado = !!user;
          if (user) {
            resolve();
          } else {
            firebase.auth().signInAnonymously().catch((err) => {
              reject(err);
            });
          }
        },
        (err) => {
          reject(err);
        },
      );
    });
  },

  isAutenticado() {
    return autenticado;
  },

  destroy() {
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    autenticado = false;
  },
};
