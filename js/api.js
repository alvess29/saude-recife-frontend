import { API_BASE_URL } from './firebase-config.js';
import { tokenAtual } from './firebase-init.js';

async function chamar(caminho, { metodo = 'GET', corpo, autenticado = true } = {}) {
  const cabecalhos = { 'Content-Type': 'application/json' };

  if (autenticado) {
    const token = await tokenAtual();
    if (token) cabecalhos.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const mensagem = dados.erro || `Erro na requisicao (HTTP ${resposta.status}).`;
    const erro = new Error(mensagem);
    erro.status = resposta.status;
    erro.dados = dados;
    throw erro;
  }
  return dados;
}

export const api = {
  
  registrarPaciente: (dados) => chamar('/auth/registrar-paciente', { metodo: 'POST', corpo: dados, autenticado: false }),
  registrarEquipe: (dados) => chamar('/auth/registrar-equipe', { metodo: 'POST', corpo: dados }),
  resolverLogin: (identificador) => chamar('/auth/resolver-login', { metodo: 'POST', corpo: { identificador }, autenticado: false }),
  perfil: () => chamar('/auth/perfil'),
  atualizarPerfil: (dados) => chamar('/auth/perfil', { metodo: 'PUT', corpo: dados }),
  listarPacientes: () => chamar('/auth/pacientes'),
  atualizarPaciente: (id, dados) => chamar(`/auth/pacientes/${id}`, { metodo: 'PUT', corpo: dados }),

  
  listarClinicas: () => chamar('/clinicas'),
  criarClinica: (dados) => chamar('/clinicas', { metodo: 'POST', corpo: dados }),
  atualizarClinica: (id, dados) => chamar(`/clinicas/${id}`, { metodo: 'PUT', corpo: dados }),
  removerClinica: (id) => chamar(`/clinicas/${id}`, { metodo: 'DELETE' }),
  removerClinicaDefinitivo: (id) => chamar(`/clinicas/${id}/permanente`, { metodo: 'DELETE' }),
  ativarClinica: (id) => chamar(`/clinicas/${id}`, { metodo: 'PUT', corpo: { ativo: true } }),

  
  listarEspecialidades: () => chamar('/especialidades'),
  criarEspecialidade: (dados) => chamar('/especialidades', { metodo: 'POST', corpo: dados }),
  removerEspecialidade: (id) => chamar(`/especialidades/${id}`, { metodo: 'DELETE' }),
  removerEspecialidadeDefinitivo: (id) => chamar(`/especialidades/${id}/permanente`, { metodo: 'DELETE' }),
  ativarEspecialidade: (id) => chamar(`/especialidades/${id}`, { metodo: 'PUT', corpo: { ativo: true } }),

  
  listarProfissionais: () => chamar('/profissionais'),
  criarProfissional: (dados) => chamar('/profissionais', { metodo: 'POST', corpo: dados }),
  removerProfissional: (id) => chamar(`/profissionais/${id}`, { metodo: 'DELETE' }),
  removerProfissionalDefinitivo: (id) => chamar(`/profissionais/${id}/permanente`, { metodo: 'DELETE' }),
  ativarProfissional: (id) => chamar(`/profissionais/${id}`, { metodo: 'PUT', corpo: { ativo: true } }),

  
  listarDisponibilidades: (filtros = {}) => {
    const query = new URLSearchParams(filtros).toString();
    return chamar(`/disponibilidades${query ? `?${query}` : ''}`);
  },
  criarDisponibilidade: (dados) => chamar('/disponibilidades', { metodo: 'POST', corpo: dados }),
  criarDisponibilidadesEmLote: (dados) => chamar('/disponibilidades/lote', { metodo: 'POST', corpo: dados }),
  conversarTriagem: (mensagens) => chamar('/triagem', { metodo: 'POST', corpo: { mensagens } }),
  ajustarDiaDisponibilidade: (dados) => chamar('/disponibilidades/dia', { metodo: 'PATCH', corpo: dados }),
  removerDisponibilidade: (id) => chamar(`/disponibilidades/${id}`, { metodo: 'DELETE' }),

  
  listarAgendamentos: () => chamar('/agendamentos'),
  criarAgendamento: (dados) => chamar('/agendamentos', { metodo: 'POST', corpo: dados }),
  cancelarAgendamento: (id) => chamar(`/agendamentos/${id}/cancelar`, { metodo: 'PATCH' }),
};
