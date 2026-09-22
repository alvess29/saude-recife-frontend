import { entrar } from './firebase-init.js';
import { api } from './api.js';

const form = document.getElementById('form-login');
const alerta = document.getElementById('alerta-login');
const botao = document.getElementById('btn-login');

const destinosPorPerfil = {
  paciente: 'paciente.html',
  profissional: 'profissional.html',
  administrador: 'admin.html',
};

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  alerta.className = 'alerta';
  botao.disabled = true;
  botao.textContent = 'Entrando...';

  const identificador = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const { email } = await api.resolverLogin(identificador);
    await entrar(email, senha);
    const perfil = await api.perfil();
    window.location.href = destinosPorPerfil[perfil.tipoUsuario] || 'paciente.html';
  } catch (erro) {
    const mensagem = traduzirErro(erro);
    alerta.textContent = mensagem;
    alerta.className = 'alerta alerta-erro mostrar';
    botao.disabled = false;
    botao.textContent = 'Entrar';
  }
});

function traduzirErro(erro) {
  const codigo = erro.code || '';
  if (codigo.includes('invalid-credential') || codigo.includes('wrong-password') || codigo.includes('user-not-found')) {
    return 'E-mail ou senha incorretos.';
  }
  if (codigo.includes('too-many-requests')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  }
  return erro.message || 'Nao foi possivel entrar. Tente novamente.';
}
