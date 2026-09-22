import { protegerPagina, mostrarAlerta, ocultarAlerta, formatarData, formatarDataHora } from './auth-guard.js';
import { api } from './api.js';

let clinicas = [];
let profissionais = [];
let especialidades = [];
let profissionalSelecionadoId = '';

iniciar();

async function iniciar() {
  const perfil = await protegerPagina(['paciente']);
  preencherFormularioPerfil(perfil);
  configurarAbas();

  await carregarReferencia();
  preencherFiltros();

  document.getElementById('filtro-especialidade').addEventListener('change', () => {
    limparSelecaoProfissional();
    renderizarBuscaProfissionais();
    carregarHorarios();
  });
  document.getElementById('filtro-clinica').addEventListener('change', () => {
    limparSelecaoProfissional();
    renderizarBuscaProfissionais();
    carregarHorarios();
  });
  document.getElementById('busca-prof-nome').addEventListener('input', renderizarBuscaProfissionais);
  document.getElementById('form-perfil').addEventListener('submit', salvarPerfil);

  renderizarBuscaProfissionais();
  await carregarHorarios();
  await carregarMeusAgendamentos();
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

async function carregarReferencia() {
  [clinicas, profissionais, especialidades] = await Promise.all([
    api.listarClinicas(),
    api.listarProfissionais(),
    api.listarEspecialidades(),
  ]);
}

function preencherFiltros() {
  const selectEsp = document.getElementById('filtro-especialidade');
  especialidades.filter((e) => e.ativo !== false).forEach((e) => {
    selectEsp.append(new Option(e.nome, e.id));
  });

  const selectClinica = document.getElementById('filtro-clinica');
  clinicas.filter((c) => c.ativo !== false).forEach((c) => {
    selectClinica.append(new Option(c.nome, c.id));
  });
}

function renderizarBuscaProfissionais() {
  const container = document.getElementById('lista-busca-profissionais');
  const termoNome = document.getElementById('busca-prof-nome').value.trim().toLowerCase();
  const especialidadeId = document.getElementById('filtro-especialidade').value;
  const clinicaId = document.getElementById('filtro-clinica').value;

  const buscaAtiva = Boolean(termoNome || especialidadeId || clinicaId);
  if (!buscaAtiva) {
    container.innerHTML = '<div class="vazio"><strong>Busque por um profissional</strong>Digite um nome ou escolha uma especialidade/clinica acima.</div>';
    return;
  }

  const resultado = profissionais.filter((p) => {
    if (p.ativo === false) return false;
    if (termoNome && !p.nome.toLowerCase().includes(termoNome)) return false;
    if (especialidadeId && !(p.especialidadeIds || []).includes(especialidadeId)) return false;
    if (clinicaId && !(p.clinicaIds || []).includes(clinicaId)) return false;
    return true;
  });

  if (!resultado.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhum profissional encontrado</strong>Tente outro nome, especialidade ou clinica.</div>';
    return;
  }

  const modelo = document.getElementById('modelo-busca-profissional');
  container.innerHTML = '';
  resultado.forEach((p) => {
    const item = modelo.content.cloneNode(true);
    const nomesEspecialidades = (p.especialidadeIds || [])
      .map((id) => especialidades.find((e) => e.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
    const nomesClinicas = (p.clinicaIds || [])
      .map((id) => clinicas.find((c) => c.id === id)?.nome)
      .filter(Boolean)
      .join(', ');

    item.querySelector('[data-campo="nome"]').textContent = p.nome;
    item.querySelector('[data-campo="detalhes"]').textContent =
      `${nomesEspecialidades || 'sem especialidade definida'} \u2022 ${nomesClinicas || 'sem clinica definida'}`;

    const botao = item.querySelector('[data-acao="ver-horarios"]');
    if (p.id === profissionalSelecionadoId) {
      botao.textContent = 'Vendo horarios';
      botao.disabled = true;
    }
    botao.addEventListener('click', () => selecionarProfissional(p));

    container.appendChild(item);
  });
}

function selecionarProfissional(profissional) {
  profissionalSelecionadoId = profissional.id;
  renderizarBuscaProfissionais();

  const indicador = document.getElementById('filtro-profissional-ativo');
  indicador.style.display = 'block';
  indicador.innerHTML = `Mostrando horarios de <strong>${profissional.nome}</strong> &middot; <a href="#" id="limpar-profissional">ver todos</a>`;
  document.getElementById('limpar-profissional').addEventListener('click', (evento) => {
    evento.preventDefault();
    limparSelecaoProfissional();
    renderizarBuscaProfissionais();
    carregarHorarios();
  });

  carregarHorarios();
  document.getElementById('cartao-horarios').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limparSelecaoProfissional() {
  profissionalSelecionadoId = '';
  document.getElementById('filtro-profissional-ativo').style.display = 'none';
}

async function carregarHorarios() {
  const alerta = document.getElementById('alerta-agendar');
  ocultarAlerta(alerta);
  const container = document.getElementById('lista-horarios');
  container.innerHTML = '<p class="vazio">Carregando horarios...</p>';

  const especialidadeId = document.getElementById('filtro-especialidade').value;
  const clinicaId = document.getElementById('filtro-clinica').value;

  try {
    const horarios = await api.listarDisponibilidades({
      ...(especialidadeId && { especialidadeId }),
      ...(clinicaId && { clinicaId }),
      ...(profissionalSelecionadoId && { profissionalId: profissionalSelecionadoId }),
    });

    if (!horarios.length) {
      container.innerHTML = '<div class="vazio"><strong>Nenhum horario encontrado</strong>Tente outra especialidade, clinica ou profissional.</div>';
      return;
    }

    const modelo = document.getElementById('modelo-horario');
    container.innerHTML = '';
    horarios.forEach((horario) => {
      const item = modelo.content.cloneNode(true);
      const profissional = profissionais.find((p) => p.id === horario.profissionalId);
      const clinica = clinicas.find((c) => c.id === horario.clinicaId);

      item.querySelector('[data-campo="profissional"]').textContent = profissional ? profissional.nome : 'Profissional';
      item.querySelector('[data-campo="detalhes"]').textContent =
        `${clinica ? clinica.nome : 'Clinica'} \u2022 ${formatarData(horario.data)} as ${horario.horaInicio}`;

      item.querySelector('[data-acao="agendar"]').addEventListener('click', (evento) =>
        agendar(horario.id, especialidadeId, evento.target)
      );
      container.appendChild(item);
    });
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
    container.innerHTML = '';
  }
}

async function agendar(disponibilidadeId, especialidadeId, botao) {
  const alerta = document.getElementById('alerta-agendar');
  botao.disabled = true;
  botao.textContent = 'Agendando...';

  try {
    await api.criarAgendamento({ disponibilidadeId, especialidadeId: especialidadeId || null });
    mostrarAlerta(alerta, 'Consulta agendada com sucesso! Confira em "Meus agendamentos".', 'sucesso');
    await carregarHorarios();
    await carregarMeusAgendamentos();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
    botao.disabled = false;
    botao.textContent = 'Agendar';
  }
}

async function carregarMeusAgendamentos() {
  const alerta = document.getElementById('alerta-meus');
  ocultarAlerta(alerta);
  const container = document.getElementById('lista-agendamentos');
  container.innerHTML = '<p class="vazio">Carregando...</p>';

  try {
    const agendamentos = await api.listarAgendamentos();

    if (!agendamentos.length) {
      container.innerHTML = '<div class="vazio"><strong>Voce ainda nao tem agendamentos</strong>Va em "Agendar consulta" para marcar seu primeiro atendimento.</div>';
      return;
    }

    const modelo = document.getElementById('modelo-agendamento');
    container.innerHTML = '';
    agendamentos.forEach((agendamento) => {
      const item = modelo.content.cloneNode(true);
      const profissional = profissionais.find((p) => p.id === agendamento.profissionalId);
      const clinica = clinicas.find((c) => c.id === agendamento.clinicaId);
      const especialidade = especialidades.find((e) => e.id === agendamento.especialidadeId);

      item.querySelector('[data-campo="profissional"]').textContent = profissional ? profissional.nome : 'Profissional';
      item.querySelector('[data-campo="detalhes"]').textContent = [
        especialidade ? especialidade.nome : null,
        clinica ? clinica.nome : 'Clinica',
        formatarDataHora(agendamento.dataHora),
      ].filter(Boolean).join(' \u2022 ');

      const selo = item.querySelector('[data-campo="selo"]');
      selo.textContent = agendamento.status === 'confirmado' ? 'Confirmado' : 'Cancelado';
      selo.classList.add(agendamento.status === 'confirmado' ? 'selo-confirmado' : 'selo-cancelado');

      const btnCancelar = item.querySelector('[data-acao="cancelar"]');
      if (agendamento.status === 'cancelado') {
        btnCancelar.remove();
      } else {
        btnCancelar.addEventListener('click', () => cancelarAgendamento(agendamento.id));
      }

      container.appendChild(item);
    });
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
    container.innerHTML = '';
  }
}

async function cancelarAgendamento(id) {
  const alerta = document.getElementById('alerta-meus');
  if (!confirm('Deseja realmente cancelar este agendamento?')) return;

  try {
    await api.cancelarAgendamento(id);
    mostrarAlerta(alerta, 'Agendamento cancelado.', 'sucesso');
    await carregarMeusAgendamentos();
    await carregarHorarios();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

function preencherFormularioPerfil(perfil) {
  document.getElementById('perfil-nome').value = perfil.nome || '';
  document.getElementById('perfil-telefone').value = perfil.telefone || '';
  document.getElementById('perfil-nascimento').value = perfil.dataNascimento || '';
  document.getElementById('perfil-observacoes').value = perfil.observacoes || '';
}

async function salvarPerfil(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-perfil');
  try {
    await api.atualizarPerfil({
      nome: document.getElementById('perfil-nome').value.trim(),
      telefone: document.getElementById('perfil-telefone').value.trim(),
      dataNascimento: document.getElementById('perfil-nascimento').value || null,
      observacoes: document.getElementById('perfil-observacoes').value.trim(),
    });
    mostrarAlerta(alerta, 'Dados atualizados com sucesso.', 'sucesso');
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}
