import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function entrar(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

export function sair() {
  return signOut(auth);
}

export function aoMudarAutenticacao(callback) {
  return onAuthStateChanged(auth, callback);
}

export function tokenAtual() {
  return auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null);
}
