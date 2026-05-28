import { firebaseConfig } from "./config.js";

let _app = null;
let _db = null;

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
  }
  return _db;
}

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}
