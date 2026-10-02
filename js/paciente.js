import { protegerPagina, mostrarAlerta, ocultarAlerta, formatarData, formatarDataHora, agruparPorDia, nomeDiaSemana, textoContagem } from './auth-guard.js';
import { api } from './api.js';

let clinicas = [];
let profissionais = [];
let especialidades = [];
let profissionalSelecionadoId = '';
let mensagensTriagem = [];
let triagemEncerrada = false;
const diasAbertos = new Set();

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
  document.getElementById('busca-clinica-nome').addEventListener('input', renderizarClinicas);
  document.getElementById('busca-clinica-especialidade').addEventListener('change', renderizarClinicas);
  document.getElementById('form-perfil').addEventListener('submit', salvarPerfil);

  document.getElementById('btn-abrir-triagem').addEventListener('click', abrirTriagem);
  document.getElementById('btn-fechar-triagem').addEventListener('click', fecharTriagem);
  document.getElementById('form-chat-triagem').addEventListener('submit', enviarMensagemTriagem);

  renderizarBuscaProfissionais();
  renderizarClinicas();
  renderizarEspecialidades();
  await carregarHorarios();
  await carregarMeusAgendamentos();
}

function configurarAbas() {
  document.querySelectorAll('.aba-btn').forEach((botao) => {
    botao.addEventListener('click', () => abrirAba(botao.dataset.aba));
  });
}

function abrirAba(nome) {
  document.querySelectorAll('.aba-btn').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === nome));
  document.querySelectorAll('.painel-aba').forEach((p) => p.classList.toggle('ativa', p.id === `painel-${nome}`));
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

  const selectEspecialidadeClinica = document.getElementById('busca-clinica-especialidade');
  especialidades.filter((e) => e.ativo !== false).forEach((e) => {
    selectEspecialidadeClinica.append(new Option(e.nome, e.id));
  });
}

function semAcento(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function nomesDasEspecialidades(ids) {
  return (ids || [])
    .map((id) => especialidades.find((e) => e.id === id))
    .filter((e) => e && e.ativo !== false)
    .map((e) => e.nome);
}

function renderizarClinicas() {
  const container = document.getElementById('lista-clinicas');
  const termo = semAcento(document.getElementById('busca-clinica-nome').value.trim());
  const especialidadeId = document.getElementById('busca-clinica-especialidade').value;

  const resultado = clinicas.filter((c) => {
    if (c.ativo === false) return false;
    if (termo && !semAcento(c.nome).includes(termo)) return false;
    if (especialidadeId && !(c.especialidadeIds || []).includes(especialidadeId)) return false;
    return true;
  });

  if (!resultado.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhuma clínica encontrada</strong>Tente outro nome ou especialidade.</div>';
    return;
  }

  const modelo = document.getElementById('modelo-clinica');
  container.innerHTML = '';
  resultado.forEach((c) => {
    const item = modelo.content.cloneNode(true);
    const nomes = nomesDasEspecialidades(c.especialidadeIds);

    item.querySelector('[data-campo="nome"]').textContent = c.nome;
    item.querySelector('[data-campo="endereco"]').textContent = c.endereco;

    const contato = item.querySelector('[data-campo="contato"]');
    const telefone = document.createElement('a');
    telefone.href = `tel:${c.telefone.replace(/[^\d+]/g, '')}`;
    telefone.textContent = c.telefone;
    contato.append(telefone, c.email ? ` \u2022 ${c.email}` : '');

    const funcionamento = item.querySelector('[data-campo="funcionamento"]');
    if (c.horarioFuncionamento) funcionamento.textContent = `Funcionamento: ${c.horarioFuncionamento}`;
    else funcionamento.remove();

    item.querySelector('[data-campo="especialidades"]').textContent =
      nomes.length ? `Especialidades: ${nomes.join(', ')}` : 'Especialidades não informadas';

    item.querySelector('[data-acao="ver-profissionais"]').addEventListener('click', () =>
      buscarProfissionaisDe({ clinicaId: c.id })
    );
    container.appendChild(item);
  });
}

function renderizarEspecialidades() {
  const container = document.getElementById('lista-especialidades');
  const ativas = especialidades.filter((e) => e.ativo !== false);

  if (!ativas.length) {
    container.innerHTML = '<div class="vazio"><strong>Nenhuma especialidade disponível</strong>Volte mais tarde.</div>';
    return;
  }

  const modelo = document.getElementById('modelo-especialidade');
  container.innerHTML = '';
  ativas.forEach((e) => {
    const item = modelo.content.cloneNode(true);
    const total = profissionais.filter((p) => p.ativo !== false && (p.especialidadeIds || []).includes(e.id)).length;

    item.querySelector('[data-campo="nome"]').textContent = e.nome;
    item.querySelector('[data-campo="descricao"]').textContent = e.descricao || 'Sem descrição cadastrada.';
    item.querySelector('[data-campo="profissionais"]').textContent =
      total === 1 ? '1 profissional' : `${total} profissionais`;

    const botao = item.querySelector('[data-acao="ver-profissionais"]');
    if (total) {
      botao.addEventListener('click', () => buscarProfissionaisDe({ especialidadeId: e.id }));
    } else {
      botao.disabled = true;
      botao.textContent = 'Sem profissionais';
    }
    container.appendChild(item);
  });
}

function buscarProfissionaisDe({ especialidadeId = '', clinicaId = '' }) {
  document.getElementById('filtro-especialidade').value = especialidadeId;
  document.getElementById('filtro-clinica').value = clinicaId;
  document.getElementById('busca-prof-nome').value = '';
  limparSelecaoProfissional();
  renderizarBuscaProfissionais();
  carregarHorarios();
  abrirAba('agendar');
  document.getElementById('lista-busca-profissionais').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

function nomeDaClinica(clinicaId) {
  const clinica = clinicas.find((c) => c.id === clinicaId);
  return clinica ? clinica.nome : 'Clínica';
}

function agruparPorProfissional(horarios) {
  const grupos = new Map();
  horarios.forEach((horario) => {
    const chave = `${horario.profissionalId}|${horario.clinicaId}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(horario);
  });
  return grupos;
}

function criarGrupoDia(data, horariosDoDia, especialidadeId) {
  const grupo = document.getElementById('modelo-dia-horarios').content.cloneNode(true);
  const detalhes = grupo.querySelector('details');
  const porProfissional = agruparPorProfissional(horariosDoDia);
  const nomesClinicas = [...new Set(horariosDoDia.map((h) => nomeDaClinica(h.clinicaId)))];
  const resumo = [nomesClinicas.join(', ')];
  if (porProfissional.size > 1) resumo.push(`${porProfissional.size} profissionais`);

  grupo.querySelector('[data-campo="dia"]').textContent = formatarData(data);
  grupo.querySelector('[data-campo="semana"]').textContent = nomeDiaSemana(data);
  grupo.querySelector('[data-campo="detalhes"]').textContent = resumo.join(' \u2022 ');
  grupo.querySelector('[data-campo="total"]').textContent = textoContagem(horariosDoDia.length, 'horário', 'horários');

  const lista = grupo.querySelector('[data-campo="profissionais"]');
  porProfissional.forEach((horarios) => lista.appendChild(criarGrupoProfissional(horarios, especialidadeId)));

  detalhes.open = diasAbertos.has(data);
  detalhes.addEventListener('toggle', () => {
    if (detalhes.open) diasAbertos.add(data);
    else diasAbertos.delete(data);
  });

  return grupo;
}

function criarGrupoProfissional(horarios, especialidadeId) {
  const grupo = document.getElementById('modelo-grupo-profissional').content.cloneNode(true);
  const profissional = profissionais.find((p) => p.id === horarios[0].profissionalId);
  const nomeProfissional = profissional ? profissional.nome : 'Profissional';

  grupo.querySelector('[data-campo="nome"]').textContent = nomeProfissional;
  grupo.querySelector('[data-campo="clinica"]').textContent = `\u2022 ${nomeDaClinica(horarios[0].clinicaId)}`;

  const lista = grupo.querySelector('[data-campo="horarios"]');
  horarios.forEach((horario) => lista.appendChild(criarBotaoHorario(horario, nomeProfissional, especialidadeId)));

  return grupo;
}

function criarBotaoHorario(horario, nomeProfissional, especialidadeId) {
  const botao = document.getElementById('modelo-horario-agendar').content.querySelector('button').cloneNode(true);
  botao.textContent = horario.horaInicio;
  botao.setAttribute('aria-label', `Agendar com ${nomeProfissional} em ${formatarData(horario.data)} às ${horario.horaInicio}`);
  botao.addEventListener('click', () => agendar(horario, nomeProfissional, especialidadeId, botao));
  return botao;
}

async function carregarHorarios({ manterDiasAbertos = false } = {}) {
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

    const grupos = agruparPorDia(horarios);
    if (!manterDiasAbertos) {
      diasAbertos.clear();
      diasAbertos.add(grupos.keys().next().value);
    }

    container.innerHTML = '';
    grupos.forEach((horariosDoDia, data) => container.appendChild(criarGrupoDia(data, horariosDoDia, especialidadeId)));
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
    container.innerHTML = '';
  }
}

async function agendar(horario, nomeProfissional, especialidadeId, botao) {
  const dataHora = `${formatarData(horario.data)} às ${horario.horaInicio}`;
  if (!confirm(`Agendar consulta com ${nomeProfissional} em ${dataHora}?`)) return;

  const alerta = document.getElementById('alerta-agendar');
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Agendando...';

  try {
    await api.criarAgendamento({ disponibilidadeId: horario.id, especialidadeId: especialidadeId || null });
    await carregarHorarios({ manterDiasAbertos: true });
    await carregarMeusAgendamentos();
    mostrarAlerta(alerta, 'Consulta agendada com sucesso! Confira em "Meus agendamentos".', 'sucesso');
  } catch (erro) {
    mostrarAlerta(alerta, erro.message, 'erro');
    botao.disabled = false;
    botao.textContent = textoOriginal;
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
      const prazo = item.querySelector('[data-campo="prazo"]');
      if (agendamento.podeCancelar) {
        prazo.textContent = `Você pode cancelar até ${formatarDataHora(agendamento.cancelavelAte)}.`;
        btnCancelar.addEventListener('click', () => cancelarAgendamento(agendamento.id));
      } else {
        btnCancelar.remove();
        const consultaFutura = new Date(agendamento.dataHora) > new Date();
        if (agendamento.status === 'confirmado' && consultaFutura) {
          prazo.textContent = `O prazo para cancelar terminou em ${formatarDataHora(agendamento.cancelavelAte)}. Para alterar, fale com a clínica.`;
        } else {
          prazo.remove();
        }
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
    await carregarHorarios({ manterDiasAbertos: true });
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

function abrirTriagem() {
  document.getElementById('chat-triagem').style.display = 'block';
  document.getElementById('btn-abrir-triagem').style.display = 'none';

  if (!mensagensTriagem.length) {
    adicionarBolhaChat('assistente', 'Oi! Pra te ajudar a escolher a especialidade certa, me conta: o que você está sentindo?');
  }
  document.getElementById('chat-entrada').focus();
}

function fecharTriagem() {
  document.getElementById('chat-triagem').style.display = 'none';
  document.getElementById('btn-abrir-triagem').style.display = 'inline-flex';
}

function adicionarBolhaChat(papel, texto) {
  const container = document.getElementById('chat-mensagens');
  const bolha = document.createElement('div');
  bolha.className = `chat-bolha chat-bolha-${papel}`;
  bolha.textContent = texto;
  container.appendChild(bolha);
  container.scrollTop = container.scrollHeight;
  return bolha;
}

async function enviarMensagemTriagem(evento) {
  evento.preventDefault();
  if (triagemEncerrada) return;

  const entrada = document.getElementById('chat-entrada');
  const texto = entrada.value.trim();
  if (!texto) return;

  adicionarBolhaChat('usuario', texto);
  mensagensTriagem.push({ papel: 'usuario', texto });
  entrada.value = '';
  entrada.disabled = true;
  document.querySelector('#form-chat-triagem button').disabled = true;

  const bolhaCarregando = adicionarBolhaChat('assistente', 'Digitando...');

  try {
    const resultado = await api.conversarTriagem(mensagensTriagem);
    bolhaCarregando.textContent = resultado.resposta;
    mensagensTriagem.push({ papel: 'assistente', texto: resultado.resposta });

    if (resultado.emergencia) {
      triagemEncerrada = true;
      bolhaCarregando.classList.add('chat-bolha-emergencia');
    } else if (resultado.concluido && resultado.especialidadeId) {
      triagemEncerrada = true;
      const botaoVerHorarios = document.createElement('button');
      botaoVerHorarios.type = 'button';
      botaoVerHorarios.className = 'btn btn-acento btn-pequeno';
      botaoVerHorarios.style.marginTop = '0.5rem';
      botaoVerHorarios.textContent = `Ver horários de ${resultado.especialidadeRecomendada}`;
      botaoVerHorarios.addEventListener('click', () => usarEspecialidadeRecomendada(resultado.especialidadeId));
      document.getElementById('chat-mensagens').appendChild(botaoVerHorarios);
    }
  } catch (erro) {
    bolhaCarregando.textContent = erro.message;
  } finally {
    entrada.disabled = triagemEncerrada;
    document.querySelector('#form-chat-triagem button').disabled = triagemEncerrada;
    if (!triagemEncerrada) entrada.focus();
  }
}

function usarEspecialidadeRecomendada(especialidadeId) {
  document.getElementById('filtro-especialidade').value = especialidadeId;
  limparSelecaoProfissional();
  renderizarBuscaProfissionais();
  carregarHorarios();
  fecharTriagem();
  document.getElementById('cartao-horarios').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
