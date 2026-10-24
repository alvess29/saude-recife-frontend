export const firebaseConfig = {
  apiKey: "AIzaSyCyRYtHwlG5nmM59fXn8itaFabk6QcQ5aQ",
  authDomain: "saude-recife-46ee8.firebaseapp.com",
  projectId: "saude-recife-46ee8",
  storageBucket: "saude-recife-46ee8.firebasestorage.app",
  messagingSenderId: "708528148608",
  appId: "1:708528148608:web:407130c0ea0ef2d0c11665",
  measurementId: "G-FYL9FYRGZ6"
};

const emDesenvolvimento = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE_URL = emDesenvolvimento
  ? 'http://localhost:3000/api'
  : 'https://COLE-AQUI-A-URL-DO-RENDER.onrender.com/api';