import { protegerPagina, mostrarAlerta, ocultarAlerta, formatarData, formatarDataHora } from './auth-guard.js';
import { api } from './api.js';

let perfilAtual = null;
let clinicas = [];
let especialidades = [];

iniciar();

async function iniciar() {
  perfilAtual = await protegerPagina(['profissional']);

  if (!perfilAtual.profissionalId) {
    document.querySelector('.container').insertAdjacentHTML(
      'afterbegin',
      '<div class="alerta alerta-erro mostrar">Sua conta ainda nao esta vinculada a um cadastro de profissional. Fale com a administracao.</div>'
    );
    return;
  }

  configurarAbas();
  clinicas = await api.listarClinicas();
  especialidades = await api.listarEspecialidades();
  preencherSelectClinicas();

  document.getElementById('form-horario').addEventListener('submit', cadastrarHorario);

  await carregarAgenda();
  await carregarHorarios();
}

function configurarAbas() {
  const botoes = document.querySelectorAll('.aba-btn');
  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      botoes.forEach((b) => b.classList.remove('ativa'));
      document.querySelectorAll('.painel-aba').forEach((p) => p.classList.remove('ativa'));
      botao.classList.add('ativa');
      document.getElementById(`painel-${botao.dataset.aba}`).classList.add('ativa');
    });
  });
}

function preencherSelectClinicas() {
  const select = document.getElementById('h-clinica');
  clinicas.filter((c) => c.ativo !== false).forEach((c) => select.append(new Option(c.nome, c.id)));
}

async function carregarAgenda() {
  const alerta = document.getElementById('alerta-agenda');
  ocultarAlerta(alerta);
  const container = document.getElementById('lista-agenda');
  container.innerHTML = '<p class="vazio">Carregando...</p>';

  try {
    const agendamentos = (await api.listarAgendamentos()).filter((a) => a.status === 'confirmado');

    if (!agendamentos.length) {
      container.innerHTML = '<div class="vazio"><strong>Nenhum atendimento confirmado</strong>Cadastre horarios disponiveis para comecar a receber agendamentos.</div>';
      return;
    }

    const modelo = document.getElementById('modelo-agenda-item');
    container.innerHTML = '';
    agendamentos
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
      .forEach((agendamento) => {
        const item = modelo.content.cloneNode(true);
        const clinica = clinicas.find((c) => c.id === agendamento.clinicaId);
        const especialidade = especialidades.find((e) => e.id === agendamento.especialidadeId);
        item.querySelector('[data-campo="paciente"]').textContent = agendamento.pacienteNome || 'Paciente';
        item.querySelector('[data-campo="detalhes"]').textContent = [
          especialidade ? especialidade.nome : null,
          clinica ? clinica.nome : 'Clinica',
          formatarDataHora(agendamento.dataHora),
        ].filter(Boolean).join(' \u2022 ');
        const selo = item.querySelector('[data-campo="selo"]');
        selo.textContent = 'Confirmado';
        selo.classList.add('selo-confirmado');
        container.appendChild(item);
      });
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

async function cadastrarHorario(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-horario');

  const dados = {
    profissionalId: perfilAtual.profissionalId,
    clinicaId: document.getElementById('h-clinica').value,
    data: document.getElementById('h-data').value,
    horaInicio: document.getElementById('h-inicio').value,
    horaFim: document.getElementById('h-fim').value,
    duracaoMinutos: Number(document.getElementById('h-duracao').value) || 30,
  };

  try {
    await api.criarDisponibilidade(dados);
    mostrarAlerta(alerta, 'Horario cadastrado com sucesso.', 'sucesso');
    document.getElementById('form-horario').reset();
    document.getElementById('h-duracao').value = 30;
    await carregarHorarios();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

async function carregarHorarios() {
  const container = document.getElementById('lista-horarios-profissional');
  container.innerHTML = '<p class="vazio">Carregando...</p>';

  try {
    const [disponiveis, reservados] = await Promise.all([
      api.listarDisponibilidades({ profissionalId: perfilAtual.profissionalId, status: 'disponivel' }),
      api.listarDisponibilidades({ profissionalId: perfilAtual.profissionalId, status: 'reservado' }),
    ]);
    const horarios = [...disponiveis, ...reservados].sort((a, b) => `${a.data}${a.horaInicio}`.localeCompare(`${b.data}${b.horaInicio}`));

    if (!horarios.length) {
      container.innerHTML = '<div class="vazio"><strong>Nenhum horario cadastrado</strong>Use o formulario acima para abrir sua agenda.</div>';
      return;
    }

    const modelo = document.getElementById('modelo-horario-item');
    container.innerHTML = '';
    horarios.forEach((horario) => {
      const item = modelo.content.cloneNode(true);
      const clinica = clinicas.find((c) => c.id === horario.clinicaId);
      item.querySelector('[data-campo="data"]').textContent = `${formatarData(horario.data)} \u2022 ${horario.horaInicio} - ${horario.horaFim}`;
      item.querySelector('[data-campo="detalhes"]').textContent = clinica ? clinica.nome : 'Clinica';

      const selo = item.querySelector('[data-campo="selo"]');
      selo.textContent = horario.status === 'disponivel' ? 'Disponivel' : 'Reservado';
      selo.classList.add(horario.status === 'disponivel' ? 'selo-disponivel' : 'selo-reservado');

      const btnRemover = item.querySelector('[data-acao="remover"]');
      if (horario.status === 'reservado') {
        btnRemover.remove();
      } else {
        btnRemover.addEventListener('click', () => removerHorario(horario.id));
      }

      container.appendChild(item);
    });
  } catch (erro) {
    container.innerHTML = `<p class="vazio">${erro.message}</p>`;
  }
}

async function removerHorario(id) {
  if (!confirm('Remover este horario da sua agenda?')) return;
  try {
    await api.removerDisponibilidade(id);
    await carregarHorarios();
  } catch (erro) {
    alert(erro.message);
  }
}
