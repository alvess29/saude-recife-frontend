import { protegerPagina, mostrarAlerta, ocultarAlerta, formatarDataHora } from './auth-guard.js';
import { api } from './api.js';

let clinicas = [];
let profissionais = [];
let especialidades = [];
let pacientes = [];
let pacienteEmEdicaoId = null;

iniciar();

async function iniciar() {
  await protegerPagina(['administrador']);
  configurarAbas();

  document.getElementById('form-clinica').addEventListener('submit', criarClinica);
  document.getElementById('form-profissional').addEventListener('submit', criarProfissional);
  document.getElementById('form-especialidade').addEventListener('submit', criarEspecialidade);
  document.getElementById('form-paciente').addEventListener('submit', salvarPaciente);
  document.getElementById('botao-cancelar-edicao-paciente').addEventListener('click', cancelarEdicaoPaciente);
  document.getElementById('form-administrador').addEventListener('submit', criarAdministrador);

  await carregarEspecialidades();
  await carregarClinicas();
  await carregarProfissionais();
  await carregarAgendamentos();
  await carregarPacientes();
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
  const senha = document.getElementById('p-senha').value;
  const email = valor('p-email');

  if (senha && !email) {
    mostrarAlerta(alerta, 'Informe o e-mail do profissional para criar o login.', 'erro');
    return;
  }

  try {
    const profissional = await api.criarProfissional({
      nome: valor('p-nome'),
      cpf: valor('p-cpf').replace(/\D/g, ''),
      registroProfissional: valor('p-registro'),
      conselho: valor('p-conselho'),
      ufRegistro: valor('p-uf'),
      telefone: valor('p-telefone'),
      email,
      especialidadeIds: selecionados('p-especialidades'),
      clinicaIds: selecionados('p-clinicas'),
    });

    if (senha) {
      try {
        await api.registrarEquipe({
          nome: valor('p-nome'),
          email,
          senha,
          tipoUsuario: 'profissional',
          profissionalId: profissional.id,
        });
      } catch (erroLogin) {
        mostrarAlerta(alerta, `Profissional cadastrado, mas o login nao foi criado: ${erroLogin.message}`, 'erro');
        document.getElementById('form-profissional').reset();
        await carregarProfissionais();
        return;
      }
    }

    mostrarAlerta(alerta, senha ? 'Profissional e login criados com sucesso.' : 'Profissional cadastrado com sucesso.', 'sucesso');
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
    pacientes = await api.listarPacientes();
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
      item.querySelector('[data-acao="editar"]').addEventListener('click', () => editarPaciente(p.uid));
      container.appendChild(item);
    });
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

function editarPaciente(uid) {
  const paciente = pacientes.find((p) => p.uid === uid);
  if (!paciente) return;

  pacienteEmEdicaoId = uid;
  document.getElementById('pa-nome').value = paciente.nome || '';
  document.getElementById('pa-cpf').value = formatarCpf(paciente.cpf);
  document.getElementById('pa-email').value = paciente.email || '';
  document.getElementById('pa-telefone').value = paciente.telefone || '';
  document.getElementById('pa-nascimento').value = paciente.dataNascimento || '';
  document.getElementById('pa-sexo').value = paciente.sexo || '';
  document.getElementById('pa-observacoes').value = paciente.observacoes || '';

  document.getElementById('pa-cpf').disabled = true;
  document.getElementById('pa-email').disabled = true;
  document.getElementById('grupo-pa-senha').style.display = 'none';

  document.getElementById('titulo-form-paciente').textContent = `Editando: ${paciente.nome}`;
  document.getElementById('botao-form-paciente').textContent = 'Salvar alteracoes';
  document.getElementById('botao-cancelar-edicao-paciente').style.display = 'inline-flex';
  document.getElementById('form-paciente').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoPaciente() {
  pacienteEmEdicaoId = null;
  document.getElementById('form-paciente').reset();
  document.getElementById('pa-cpf').disabled = false;
  document.getElementById('pa-email').disabled = false;
  document.getElementById('grupo-pa-senha').style.display = 'block';
  document.getElementById('titulo-form-paciente').textContent = 'Novo paciente';
  document.getElementById('botao-form-paciente').textContent = 'Cadastrar paciente';
  document.getElementById('botao-cancelar-edicao-paciente').style.display = 'none';
  ocultarAlerta(document.getElementById('alerta-paciente'));
}

async function salvarPaciente(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-paciente');

  try {
    if (pacienteEmEdicaoId) {
      await api.atualizarPaciente(pacienteEmEdicaoId, {
        nome: valor('pa-nome'),
        telefone: valor('pa-telefone'),
        dataNascimento: valor('pa-nascimento'),
        sexo: document.getElementById('pa-sexo').value,
        observacoes: valor('pa-observacoes'),
      });
      mostrarAlerta(alerta, 'Paciente atualizado com sucesso.', 'sucesso');
      cancelarEdicaoPaciente();
    } else {
      const senha = document.getElementById('pa-senha').value;
      if (!senha) {
        mostrarAlerta(alerta, 'Informe uma senha provisoria para o paciente.', 'erro');
        return;
      }
      await api.registrarPaciente({
        nome: valor('pa-nome'),
        cpf: valor('pa-cpf').replace(/\D/g, ''),
        email: valor('pa-email'),
        senha,
        telefone: valor('pa-telefone'),
        dataNascimento: valor('pa-nascimento'),
        sexo: document.getElementById('pa-sexo').value,
        observacoes: valor('pa-observacoes'),
      });
      mostrarAlerta(alerta, 'Paciente cadastrado com sucesso.', 'sucesso');
      document.getElementById('form-paciente').reset();
    }
    await carregarPacientes();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
  }
}

function formatarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return cpf || '-';
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

async function criarAdministrador(evento) {
  evento.preventDefault();
  const alerta = document.getElementById('alerta-administradores');

  try {
    await api.registrarEquipe({
      nome: valor('ad-nome'),
      email: valor('ad-email'),
      senha: document.getElementById('ad-senha').value,
      tipoUsuario: 'administrador',
    });
    mostrarAlerta(alerta, 'Conta de administrador criada com sucesso.', 'sucesso');
    document.getElementById('form-administrador').reset();
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
