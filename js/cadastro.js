import { entrar } from './firebase-init.js';
import { api } from './api.js';

const form = document.getElementById('form-cadastro');
const alerta = document.getElementById('alerta-cadastro');
const botao = document.getElementById('btn-cadastrar');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  alerta.className = 'alerta';
  botao.disabled = true;
  botao.textContent = 'Criando conta...';

  const dados = {
    nome: valor('nome'),
    cpf: valor('cpf'),
    dataNascimento: valor('dataNascimento') || null,
    sexo: valor('sexo') || null,
    telefone: valor('telefone'),
    email: valor('email'),
    senha: valor('senha'),
  };

  try {
    await api.registrarPaciente(dados);
    await entrar(dados.email, dados.senha);
    window.location.href = 'paciente.html';
  } catch (erro) {
    alerta.textContent = erro.message || 'Nao foi possivel concluir o cadastro.';
    alerta.className = 'alerta alerta-erro mostrar';
    botao.disabled = false;
    botao.textContent = 'Criar minha conta';
  }
});

function valor(id) {
  return document.getElementById(id).value.trim();
}
