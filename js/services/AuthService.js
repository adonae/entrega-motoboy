import { getFirebase } from "../firebase.js";

let autenticado = false;

export const AuthService = {
  async init() {
    if (autenticado) return;

    getFirebase();

    await new Promise((resolve, reject) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(
        (user) => {
          if (user) {
            autenticado = true;
            unsubscribe();
            resolve();
          } else {
            firebase.auth().signInAnonymously().catch((err) => {
              unsubscribe();
              reject(err);
            });
          }
        },
        (err) => {
          unsubscribe();
          reject(err);
        },
      );
    });
  },

  isAutenticado() {
    return autenticado;
  },
};
