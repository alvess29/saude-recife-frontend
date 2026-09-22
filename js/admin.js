import { protegerPagina, mostrarAlerta, ocultarAlerta, formatarDataHora } from './auth-guard.js';
import { api } from './api.js';

let clinicas = [];
let profissionais = [];
let especialidades = [];

iniciar();

async function iniciar() {
  await protegerPagina(['administrador']);
  configurarAbas();

  document.getElementById('form-clinica').addEventListener('submit', criarClinica);
  document.getElementById('form-profissional').addEventListener('submit', criarProfissional);
  document.getElementById('form-especialidade').addEventListener('submit', criarEspecialidade);
  document.getElementById('form-equipe').addEventListener('submit', criarConta);
  document.getElementById('q-tipo').addEventListener('change', alternarVinculoEquipe);

  await carregarEspecialidades();
  await carregarClinicas();
  await carregarProfissionais();
  await carregarAgendamentos();
  await carregarPacientes();
  alternarVinculoEquipe();
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

async function carregarClinicas() {
  clinicas = await api.listarClinicas();
  renderizarClinicas();
  atualizarSelectMultiplo('p-clinicas', clinicas);
}

function renderizarClinicas() {
  const container = document.getElementById('lista-clinicas');
  if (!clinicas.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhuma clinica cadastrada</strong>Use o formulario acima para comecar.</div>';
    return;
  }
  const modelo = document.getElementById('modelo-clinica');
  container.innerHTML = '';
  clinicas.forEach((c) => {
    const item = modelo.content.cloneNode(true);
    const nomesEspecialidades = (c.especialidadeIds || [])
      .map((id) => especialidades.find((e) => e.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
    item.querySelector('[data-campo="nome"]').textContent = c.nome;
    item.querySelector('[data-campo="detalhes"]').textContent =
      `${c.endereco} \u2022 ${c.telefone}${nomesEspecialidades ? ' \u2022 ' + nomesEspecialidades : ''}`;
    const selo = item.querySelector('[data-campo="selo"]');
    selo.textContent = c.ativo === false ? 'Inativa' : 'Ativa';
    selo.classList.add(c.ativo === false ? 'selo-cancelado' : 'selo-disponivel');

    configurarBotaoStatus(item, c.ativo, {
      onDesativar: () => remover(api.removerClinica, c.id, carregarClinicas, 'Desativar esta clinica? Ela deixa de aparecer nas buscas, mas o historico e mantido.'),
      onAtivar: () => ativar(api.ativarClinica, c.id, carregarClinicas),
    });

    item.querySelector('[data-acao="excluir"]').addEventListener('click', () =>
      remover(api.removerClinicaDefinitivo, c.id, carregarClinicas, 'Excluir esta clinica PERMANENTEMENTE? Essa acao nao pode ser desfeita.')
    );

    container.appendChild(item);
  });
}

async function criarClinica(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-clinica');
  try {
    await api.criarClinica({
      nome: valor('c-nome'),
      cnpj: valor('c-cnpj'),
      telefone: valor('c-telefone'),
      email: valor('c-email'),
      endereco: valor('c-endereco'),
      horarioFuncionamento: valor('c-horario'),
      especialidadeIds: selecionados('c-especialidades'),
    });
    mostrarAlerta(alerta, 'Clinica cadastrada com sucesso.', 'sucesso');
    document.getElementById('form-clinica').reset();
    await carregarClinicas();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

async function carregarEspecialidades() {
  especialidades = await api.listarEspecialidades();
  renderizarEspecialidades();
  atualizarSelectMultiplo('p-especialidades', especialidades);
  atualizarSelectMultiplo('c-especialidades', especialidades);
}

function renderizarEspecialidades() {
  const container = document.getElementById('lista-especialidades');
  if (!especialidades.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhuma especialidade cadastrada</strong></div>';
    return;
  }
  const modelo = document.getElementById('modelo-especialidade');
  container.innerHTML = '';
  especialidades.forEach((e) => {
    const item = modelo.content.cloneNode(true);
    item.querySelector('[data-campo="nome"]').textContent = e.nome;
    item.querySelector('[data-campo="detalhes"]').textContent = e.descricao || '';
    const selo = item.querySelector('[data-campo="selo"]');
    selo.textContent = e.ativo === false ? 'Inativa' : 'Ativa';
    selo.classList.add(e.ativo === false ? 'selo-cancelado' : 'selo-disponivel');

    configurarBotaoStatus(item, e.ativo, {
      onDesativar: () => remover(api.removerEspecialidade, e.id, carregarEspecialidades, 'Desativar esta especialidade? Ela deixa de aparecer nas buscas, mas o historico e mantido.'),
      onAtivar: () => ativar(api.ativarEspecialidade, e.id, carregarEspecialidades),
    });

    item.querySelector('[data-acao="excluir"]').addEventListener('click', () =>
      remover(api.removerEspecialidadeDefinitivo, e.id, carregarEspecialidades, 'Excluir esta especialidade PERMANENTEMENTE? Essa acao nao pode ser desfeita.')
    );

    container.appendChild(item);
  });
}

async function criarEspecialidade(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-especialidade');
  try {
    await api.criarEspecialidade({ nome: valor('e-nome'), descricao: valor('e-descricao') });
    mostrarAlerta(alerta, 'Especialidade cadastrada com sucesso.', 'sucesso');
    document.getElementById('form-especialidade').reset();
    await carregarEspecialidades();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

async function carregarProfissionais() {
  profissionais = await api.listarProfissionais();
  renderizarProfissionais();
  atualizarSelectSimples('q-profissional', profissionais, 'Selecione um profissional');
}

function renderizarProfissionais() {
  const container = document.getElementById('lista-profissionais');
  if (!profissionais.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhum profissional cadastrado</strong></div>';
    return;
  }
  const modelo = document.getElementById('modelo-profissional');
  container.innerHTML = '';
  profissionais.forEach((p) => {
    const item = modelo.content.cloneNode(true);
    const nomesEspecialidades = (p.especialidadeIds || [])
      .map((id) => especialidades.find((e) => e.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
    item.querySelector('[data-campo="nome"]').textContent = p.nome;
    item.querySelector('[data-campo="detalhes"]').textContent = `${p.conselho} ${p.registroProfissional} \u2022 ${nomesEspecialidades || 'sem especialidade definida'}`;
    const selo = item.querySelector('[data-campo="selo"]');
    selo.textContent = p.ativo === false ? 'Inativo' : 'Ativo';
    selo.classList.add(p.ativo === false ? 'selo-cancelado' : 'selo-disponivel');

    configurarBotaoStatus(item, p.ativo, {
      onDesativar: () => remover(api.removerProfissional, p.id, carregarProfissionais, 'Desativar este profissional? Ele deixa de aparecer nas buscas, mas o historico e mantido.'),
      onAtivar: () => ativar(api.ativarProfissional, p.id, carregarProfissionais),
    });

    item.querySelector('[data-acao="excluir"]').addEventListener('click', () =>
      remover(api.removerProfissionalDefinitivo, p.id, carregarProfissionais, 'Excluir este profissional PERMANENTEMENTE? Essa acao nao pode ser desfeita.')
    );

    container.appendChild(item);
  });
}

async function criarProfissional(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-profissional');
  try {
    await api.criarProfissional({
      nome: valor('p-nome'),
      cpf: valor('p-cpf').replace(/\D/g, ''),
      registroProfissional: valor('p-registro'),
      conselho: valor('p-conselho'),
      ufRegistro: valor('p-uf'),
      telefone: valor('p-telefone'),
      email: valor('p-email'),
      especialidadeIds: selecionados('p-especialidades'),
      clinicaIds: selecionados('p-clinicas'),
    });
    mostrarAlerta(alerta, 'Profissional cadastrado com sucesso.', 'sucesso');
    document.getElementById('form-profissional').reset();
    await carregarProfissionais();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

async function carregarPacientes() {
  const alerta = document.getElementById('alerta-pacientes');
  ocultarAlerta(alerta);
  const container = document.getElementById('lista-pacientes');

  try {
    const pacientes = await api.listarPacientes();
    if (!pacientes.length) {
      container.innerHTML = '<div class="vazio"><strong>Nenhum paciente cadastrado ainda</strong></div>';
      return;
    }
    const modelo = document.getElementById('modelo-paciente');
    container.innerHTML = '';
    pacientes.forEach((p) => {
      const item = modelo.content.cloneNode(true);
      item.querySelector('[data-campo="nome"]').textContent = p.nome;
      item.querySelector('[data-campo="detalhes"]').textContent =
        `${p.email} \u2022 ${p.telefone || 'sem telefone'} \u2022 CPF ${formatarCpf(p.cpf)}`;
      container.appendChild(item);
    });
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

function formatarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return cpf || '-';
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function alternarVinculoEquipe() {
  const tipo = document.getElementById('q-tipo').value;
  document.getElementById('grupo-vinculo').style.display = tipo === 'profissional' ? 'block' : 'none';
}

async function criarConta(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-equipe');
  const tipoUsuario = document.getElementById('q-tipo').value;

  try {
    await api.registrarEquipe({
      nome: valor('q-nome'),
      email: valor('q-email'),
      senha: document.getElementById('q-senha').value,
      tipoUsuario,
      profissionalId: tipoUsuario === 'profissional' ? document.getElementById('q-profissional').value : null,
    });
    mostrarAlerta(alerta, 'Conta criada com sucesso. Compartilhe a senha provisoria com a pessoa.', 'sucesso');
    document.getElementById('form-equipe').reset();
    alternarVinculoEquipe();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

async function carregarAgendamentos() {
  const alerta = document.getElementById('alerta-agendamentos');
  ocultarAlerta(alerta);
  const container = document.getElementById('lista-agendamentos-admin');

  try {
    const agendamentos = await api.listarAgendamentos();
    if (!agendamentos.length) {
      container.innerHTML = '<div class="vazio"><strong>Nenhum agendamento ainda</strong></div>';
      return;
    }
    const modelo = document.getElementById('modelo-agendamento-admin');
    container.innerHTML = '';
    agendamentos
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
      .forEach((a) => {
        const item = modelo.content.cloneNode(true);
        const profissional = profissionais.find((p) => p.id === a.profissionalId);
        const clinica = clinicas.find((c) => c.id === a.clinicaId);
        const especialidade = especialidades.find((e) => e.id === a.especialidadeId);
        item.querySelector('[data-campo="paciente"]').textContent = a.pacienteNome || 'Paciente';
        item.querySelector('[data-campo="detalhes"]').textContent = [
          profissional ? profissional.nome : 'Profissional',
          especialidade ? especialidade.nome : null,
          clinica ? clinica.nome : 'Clinica',
          formatarDataHora(a.dataHora),
        ].filter(Boolean).join(' \u2022 ');
        const selo = item.querySelector('[data-campo="selo"]');
        selo.textContent = a.status === 'confirmado' ? 'Confirmado' : 'Cancelado';
        selo.classList.add(a.status === 'confirmado' ? 'selo-confirmado' : 'selo-cancelado');
        container.appendChild(item);
      });
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

function valor(id) {
  return document.getElementById(id).value.trim();
}

function selecionados(id) {
  return Array.from(document.getElementById(id).selectedOptions).map((o) => o.value);
}

function atualizarSelectMultiplo(id, itens) {
  const select = document.getElementById(id);
  select.innerHTML = '';
  itens.filter((i) => i.ativo !== false).forEach((i) => select.append(new Option(i.nome, i.id)));
}

function atualizarSelectSimples(id, itens, rotuloVazio) {
  const select = document.getElementById(id);
  select.innerHTML = '';
  select.append(new Option(rotuloVazio, ''));
  itens.filter((i) => i.ativo !== false).forEach((i) => select.append(new Option(i.nome, i.id)));
}

async function remover(funcaoApi, id, recarregar, mensagemConfirmacao = 'Confirma esta acao?') {
  if (!confirm(mensagemConfirmacao)) return;
  try {
    await funcaoApi(id);
    await recarregar();
  } catch (erro) {
    alert(erro.message);
  }
}

async function ativar(funcaoApi, id, recarregar) {
  try {
    await funcaoApi(id);
    await recarregar();
  } catch (erro) {
    alert(erro.message);
  }
}

function configurarBotaoStatus(item, ativo, { onDesativar, onAtivar }) {
  const botao = item.querySelector('[data-acao="alternar-status"]');
  if (ativo === false) {
    botao.textContent = 'Ativar';
    botao.classList.remove('btn-secundario');
    botao.classList.add('btn-primario');
    botao.addEventListener('click', onAtivar);
  } else {
    botao.textContent = 'Desativar';
    botao.addEventListener('click', onDesativar);
  }
}
