import { firebaseConfig } from "./config.js";

let _app = null;
let _db = null;
let _persistenceEnabled = false;

export function getFirebase() {
  if (typeof firebase === "undefined") {
    throw new Error(
      "Firebase SDK não carregado. Verifique os <script> no HTML.",
    );
  }
  if (!_app) {
    _app = firebase.initializeApp(firebaseConfig);
  }
  return _app;
}

export function getDb() {
  if (!_db) {
    _db = getFirebase().firestore();
    if (!_persistenceEnabled) {
      _persistenceEnabled = true;
      _db.enablePersistence().catch((err) => {
        if (err.code === "failed-precondition") {
          console.warn("Firestore: várias abas abertas, cache offline desativado.");
        } else if (err.code === "unimplemented") {
          console.warn("Firestore: navegador não suporta cache offline.");
        } else {
          console.warn("Firestore: erro ao ativar persistência:", err.message);
        }
      });
    }
  }
  return _db;
}

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}
