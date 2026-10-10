import { aoMudarAutenticacao, sair } from './firebase-init.js';
import { api } from './api.js';

export function protegerPagina(perfisPermitidos = null) {
  return new Promise((resolve) => {
    aoMudarAutenticacao(async (usuarioFirebase) => {
      if (!usuarioFirebase) {
        window.location.href = './index.html';
        return;
      }

      try {
        const perfil = await api.perfil();

        if (perfisPermitidos && !perfisPermitidos.includes(perfil.tipoUsuario)) {
          redirecionarParaAreaDoPerfil(perfil.tipoUsuario);
          return;
        }

        preencherCabecalho(perfil);
        resolve(perfil);
      } catch (erro) {
        console.error('Falha ao carregar perfil:', erro);
        window.location.href = './index.html';
      }
    });
  });
}

function redirecionarParaAreaDoPerfil(tipoUsuario) {
  const destinos = {
    paciente: './paciente.html',
    profissional: './profissional.html',
    administrador: './admin.html',
  };
  window.location.href = destinos[tipoUsuario] || './index.html';
}

function preencherCabecalho(perfil) {
  const nomeEl = document.querySelector('[data-usuario-nome]');
  const tipoEl = document.querySelector('[data-usuario-tipo]');
  if (nomeEl) nomeEl.textContent = perfil.nome || perfil.email;
  if (tipoEl) tipoEl.textContent = rotuloTipo(perfil.tipoUsuario);

  const btnSair = document.querySelector('[data-acao-sair]');
  if (btnSair) {
    btnSair.addEventListener('click', async () => {
      await sair();
      window.location.href = './index.html';
    });
  }
}

function rotuloTipo(tipo) {
  const rotulos = { paciente: 'Paciente', profissional: 'Profissional de saúde', administrador: 'Administrador' };
  return rotulos[tipo] || tipo;
}

export function mostrarAlerta(elemento, mensagem, tipo = 'erro') {
  elemento.textContent = mensagem;
  elemento.className = `alerta alerta-${tipo} mostrar`;
}

export function ocultarAlerta(elemento) {
  elemento.className = 'alerta';
}

export function formatarDataHora(dataHoraISO) {
  const [data, hora] = dataHoraISO.split('T');
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano} as ${hora}`;
}

export function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function agruparPorDia(horarios) {
  const grupos = new Map();
  horarios.forEach((horario) => {
    if (!grupos.has(horario.data)) grupos.set(horario.data, []);
    grupos.get(horario.data).push(horario);
  });
  return grupos;
}

export function partesDaData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
  return {
    dia,
    mesAbreviado: data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    semana: capitalizar(data.toLocaleDateString('pt-BR', { weekday: 'long' })),
    mesAno: capitalizar(data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })),
  };
}

export function renderizarGruposPorDia(container, grupos, criarGrupo) {
  let mesAnterior = '';
  grupos.forEach((itens, data) => {
    const mes = data.slice(0, 7);
    if (mes !== mesAnterior) {
      const rotulo = document.createElement('div');
      rotulo.className = 'grupo-mes';
      rotulo.textContent = partesDaData(data).mesAno;
      container.appendChild(rotulo);
      mesAnterior = mes;
    }
    container.appendChild(criarGrupo(itens, data));
  });
}

export function textoContagem(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}
