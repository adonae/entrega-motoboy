import { getFirebase } from "../firebase.js";

let autenticado = false;
let authUnsubscribe = null;
let inicializando = false;
let initResolve = null;

export const AuthService = {
  async init() {
    if (autenticado) return;
    if (inicializando) return initResolve;

    getFirebase();

    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }

    inicializando = true;

    initResolve = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout de autenticação. Verifique o Firebase Console."));
      }, 10000);

      authUnsubscribe = firebase.auth().onAuthStateChanged(
        (user) => {
          autenticado = !!user;
          if (user) {
            clearTimeout(timeout);
            inicializando = false;
            resolve();
          } else {
            firebase.auth().signInAnonymously().catch((err) => {
              clearTimeout(timeout);
              inicializando = false;
              reject(err);
            });
          }
        },
        (err) => {
          clearTimeout(timeout);
          inicializando = false;
          reject(err);
        },
      );
    });

    return initResolve;
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
    inicializando = false;
    initResolve = null;
  },
};
