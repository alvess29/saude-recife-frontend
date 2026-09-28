import { protegerPagina, mostrarAlerta, ocultarAlerta, formatarData, formatarDataHora } from './auth-guard.js';
import { api } from './api.js';

let perfilAtual = null;
let clinicas = [];
let especialidades = [];
let mesExibido = iniciarMesAtual();
const diasDesmarcados = new Set();
const diasAbertos = new Set();
let primeiraListagem = true;
let horariosCarregados = [];

iniciar();

async function iniciar() {
  perfilAtual = await protegerPagina(['profissional']);

  if (!perfilAtual.profissionalId) {
    document.querySelector('.container').insertAdjacentHTML(
      'afterbegin',
      '<div class="alerta alerta-erro mostrar">Sua conta ainda não está vinculada a um cadastro de profissional. Fale com a administração.</div>'
    );
    return;
  }

  configurarAbas();
  clinicas = await api.listarClinicas();
  especialidades = await api.listarEspecialidades();
  preencherSelectClinicas();

  document.getElementById('form-horario').addEventListener('submit', gerarHorarios);
  document.getElementById('btn-mes-anterior').addEventListener('click', () => mudarMes(-1));
  document.getElementById('btn-mes-seguinte').addEventListener('click', () => mudarMes(1));
  document.getElementById('btn-marcar-tudo').addEventListener('click', marcarTodosOsDias);
  document.getElementById('btn-desmarcar-tudo').addEventListener('click', desmarcarTodosOsDias);
  renderizarCalendario();

  await carregarAgenda();
  await carregarHorarios();
  setInterval(renderizarHorarios, 60000);
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
      container.innerHTML = '<div class="vazio"><strong>Nenhum atendimento confirmado</strong>Cadastre horários disponíveis para começar a receber agendamentos.</div>';
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
          clinica ? clinica.nome : 'Clínica',
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

function iniciarMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

function chaveIso(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function mudarMes(delta) {
  const proximo = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + delta, 1);
  const inicioMesAtual = iniciarMesAtual();
  if (proximo < inicioMesAtual) return;
  mesExibido = proximo;
  renderizarCalendario();
}

function renderizarCalendario() {
  const ano = mesExibido.getFullYear();
  const mes = mesExibido.getMonth();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  document.getElementById('calendario-titulo').textContent = mesExibido.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  document.getElementById('btn-mes-anterior').disabled = mesExibido.getTime() <= iniciarMesAtual().getTime();

  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const corpo = document.getElementById('calendario-corpo');
  corpo.innerHTML = '';

  let linha = document.createElement('tr');
  for (let i = 0; i < primeiroDiaSemana; i += 1) {
    linha.appendChild(document.createElement('td'));
  }

  for (let dia = 1; dia <= totalDias; dia += 1) {
    const dataIso = chaveIso(ano, mes, dia);
    const dataDia = new Date(ano, mes, dia);
    const celula = document.createElement('td');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'dia-calendario';
    botao.textContent = dia;

    if (dataDia < hoje) {
      botao.disabled = true;
    } else {
      if (diasDesmarcados.has(dataIso)) botao.classList.add('dia-desmarcado');
      botao.addEventListener('click', () => alternarDia(dataIso, botao));
    }

    celula.appendChild(botao);
    linha.appendChild(celula);

    if ((primeiroDiaSemana + dia) % 7 === 0) {
      corpo.appendChild(linha);
      linha = document.createElement('tr');
    }
  }
  if (linha.children.length) {
    while (linha.children.length < 7) linha.appendChild(document.createElement('td'));
    corpo.appendChild(linha);
  }
}

function alternarDia(dataIso, botao) {
  if (diasDesmarcados.has(dataIso)) {
    diasDesmarcados.delete(dataIso);
    botao.classList.remove('dia-desmarcado');
  } else {
    diasDesmarcados.add(dataIso);
    botao.classList.add('dia-desmarcado');
  }
}

function diasDoMesAPartirDeHoje() {
  const ano = mesExibido.getFullYear();
  const mes = mesExibido.getMonth();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dias = [];
  for (let dia = 1; dia <= totalDias; dia += 1) {
    if (new Date(ano, mes, dia) >= hoje) dias.push(chaveIso(ano, mes, dia));
  }
  return dias;
}

function diasMarcadosDoMes() {
  return diasDoMesAPartirDeHoje().filter((dataIso) => !diasDesmarcados.has(dataIso));
}

function marcarTodosOsDias() {
  diasDoMesAPartirDeHoje().forEach((dataIso) => diasDesmarcados.delete(dataIso));
  renderizarCalendario();
}

function desmarcarTodosOsDias() {
  diasDoMesAPartirDeHoje().forEach((dataIso) => diasDesmarcados.add(dataIso));
  renderizarCalendario();
}

async function gerarHorarios(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-horario');
  const dias = diasMarcadosDoMes();

  if (!dias.length) {
    mostrarAlerta(alerta, 'Nenhum dia marcado neste mês. Desmarque menos dias ou avance para o próximo mês.', 'erro');
    return;
  }

  const dados = {
    profissionalId: perfilAtual.profissionalId,
    clinicaId: document.getElementById('h-clinica').value,
    dias,
    horaInicio: document.getElementById('h-inicio').value,
    horaFim: document.getElementById('h-fim').value,
    duracaoMinutos: Number(document.getElementById('h-duracao').value) || 30,
  };

  try {
    const resultado = await api.criarDisponibilidadesEmLote(dados);
    mostrarAlerta(alerta, `${resultado.total} horários criados em ${dias.length} dia(s).`, 'sucesso');
    await carregarHorarios();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

function agruparPorDia(horarios) {
  const grupos = new Map();
  horarios.forEach((horario) => {
    if (!grupos.has(horario.data)) grupos.set(horario.data, []);
    grupos.get(horario.data).push(horario);
  });
  return grupos;
}

function nomeDiaSemana(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'long' });
}

function textoContagem(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function criarGrupoDia(data, horariosDoDia) {
  const grupo = document.getElementById('modelo-dia-horarios').content.cloneNode(true);
  const detalhes = grupo.querySelector('details');
  const disponiveis = horariosDoDia.filter((h) => h.status === 'disponivel').length;
  const reservados = horariosDoDia.length - disponiveis;
  const nomesClinicas = [...new Set(horariosDoDia.map((h) => {
    const clinica = clinicas.find((c) => c.id === h.clinicaId);
    return clinica ? clinica.nome : 'Clínica';
  }))];
  const primeiro = horariosDoDia[0];
  const ultimo = horariosDoDia[horariosDoDia.length - 1];

  grupo.querySelector('[data-campo="dia"]').textContent = formatarData(data);
  grupo.querySelector('[data-campo="semana"]').textContent = nomeDiaSemana(data);
  grupo.querySelector('[data-campo="detalhes"]').textContent =
    `${primeiro.horaInicio} às ${ultimo.horaFim} \u2022 ${nomesClinicas.join(', ')}`;

  const seloDisponiveis = grupo.querySelector('[data-campo="disponiveis"]');
  const seloReservados = grupo.querySelector('[data-campo="reservados"]');
  if (disponiveis) seloDisponiveis.textContent = textoContagem(disponiveis, 'disponível', 'disponíveis');
  else seloDisponiveis.remove();
  if (reservados) seloReservados.textContent = textoContagem(reservados, 'reservado', 'reservados');
  else seloReservados.remove();

  const listaHorarios = grupo.querySelector('[data-campo="horarios"]');
  horariosDoDia.forEach((horario) => listaHorarios.appendChild(criarChipHorario(horario)));

  detalhes.open = diasAbertos.has(data);
  detalhes.addEventListener('toggle', () => {
    if (detalhes.open) diasAbertos.add(data);
    else diasAbertos.delete(data);
  });

  return grupo;
}

function criarChipHorario(horario) {
  const chip = document.getElementById('modelo-horario-chip').content.cloneNode(true);
  const intervalo = `${horario.horaInicio} - ${horario.horaFim}`;
  const elemento = chip.querySelector('.horario-chip');
  const btnRemover = chip.querySelector('[data-acao="remover"]');

  chip.querySelector('[data-campo="hora"]').textContent = intervalo;

  if (horario.status === 'reservado') {
    elemento.classList.add('horario-chip-reservado');
    elemento.title = 'Reservado por um paciente';
    btnRemover.remove();
  } else {
    btnRemover.setAttribute('aria-label', `Remover horário ${intervalo}`);
    btnRemover.title = 'Remover horário';
    btnRemover.addEventListener('click', () => removerHorario(horario.id));
  }

  return chip;
}

function horarioJaPassou(horario) {
  return new Date(`${horario.data}T${horario.horaInicio}`) <= new Date();
}

function renderizarHorarios() {
  const container = document.getElementById('lista-horarios-profissional');
  const horarios = horariosCarregados.filter((h) => h.status === 'reservado' || !horarioJaPassou(h));

  if (!horarios.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhum horário cadastrado</strong>Use o formulário acima para abrir sua agenda.</div>';
    return;
  }

  const grupos = agruparPorDia(horarios);
  if (primeiraListagem) diasAbertos.add(grupos.keys().next().value);
  primeiraListagem = false;

  container.innerHTML = '';
  grupos.forEach((horariosDoDia, data) => container.appendChild(criarGrupoDia(data, horariosDoDia)));
}

async function carregarHorarios() {
  const container = document.getElementById('lista-horarios-profissional');
  container.innerHTML = '<p class="vazio">Carregando...</p>';

  try {
    const [disponiveis, reservados] = await Promise.all([
      api.listarDisponibilidades({ profissionalId: perfilAtual.profissionalId, status: 'disponivel' }),
      api.listarDisponibilidades({ profissionalId: perfilAtual.profissionalId, status: 'reservado' }),
    ]);
    horariosCarregados = [...disponiveis, ...reservados].sort((a, b) => `${a.data}${a.horaInicio}`.localeCompare(`${b.data}${b.horaInicio}`));
    renderizarHorarios();
  } catch (erro) {
    container.innerHTML = `<p class="vazio">${erro.message}</p>`;
  }
}

async function removerHorario(id) {
  if (!confirm('Remover este horário da sua agenda?')) return;
  try {
    await api.removerDisponibilidade(id);
    await carregarHorarios();
  } catch (erro) {
    alert(erro.message);
  }
}
