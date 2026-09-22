# Saude Recife - Frontend (PWA)

Projeto Integrador 3º Periodo &middot; Senac PE
**1ª Entrega: PWA + Backend + Banco de Dados**

**Integrantes:** Pedro Roberto e Taywan Francisco

Este repositorio contem apenas o front-end (PWA). A API fica em um
repositorio separado: [saude-recife-backend](https://github.com/alvess29/saude-recife-backend).
Os dois precisam estar rodando ao mesmo tempo para o sistema funcionar.

Stack: **HTML + CSS + JavaScript** puro (PWA, sem framework) e
**Firebase Authentication** para login.

---

## 1. Estrutura do projeto

```
frontend/
├── index.html          login
├── cadastro.html        cadastro de paciente
├── paciente.html        area do paciente (buscar, agendar, cancelar)
├── profissional.html    area do profissional (cadastrar horarios, ver agenda)
├── admin.html           painel administrativo (cadastros e gestao)
├── manifest.json / sw.js  configuracao PWA
├── css/style.css
└── js/                   firebase-config.js, firebase-init.js, api.js, auth-guard.js + 1 js por pagina
```

## 2. Requisitos da 1ª Entrega atendidos por este repositorio

| Requisito do slide | Onde esta implementado |
|---|---|
| Login e Autenticacao | `index.html` (Firebase Authentication, e-mail/senha) |
| Cadastro de Pacientes | `cadastro.html` |
| Gerenciamento Administrativo | `admin.html` (cadastro de clinicas, especialidades, profissionais e contas da equipe) |
| Cadastro de Disponibilidade do Profissional | `profissional.html` |
| Consulta de Horarios Disponiveis e Agendamento | `paciente.html` |
| Gerenciamento de Agendamentos | abas "Meus agendamentos" / "Minha agenda" / "Agendamentos" (admin) |
| Integracao Client-Server (API REST + JSON) | `js/api.js`, que consome as rotas do repositorio backend |
| Interface Responsiva e Acessivel | CSS com foco visivel, alvos de toque >= 44px, layout fluido, `prefers-reduced-motion` |
| PWA instalavel e com cache offline basico | `manifest.json` + `sw.js` |

Os requisitos de API e banco de dados estao documentados no README do
[repositorio do backend](https://github.com/alvess29/saude-recife-backend).

## 3. Configurar o Firebase

1. Use o mesmo projeto Firebase criado para o backend (veja o README de lá).
2. Em *Configuracoes do projeto > Geral > Seus apps*, crie um app Web e copie
   as chaves para `js/firebase-config.js`.

As credenciais de administrador do Firebase (Admin SDK) ficam apenas no
repositorio do backend, nao aqui.

## 4. Rodar o frontend

O front-end e HTML/CSS/JS puro. Basta servir a pasta com qualquer servidor
estatico, por exemplo:

```bash
npx serve .
# ou: python3 -m http.server 5500
```

Abra o endereco indicado no navegador. E necessario que o backend esteja
rodando em `http://localhost:3000` (veja o README do repositorio backend)
para login, cadastros e agendamentos funcionarem.

Entre com o e-mail/senha do administrador criado no backend para acessar
`admin.html` e cadastrar clinicas, especialidades e profissionais. Pacientes
se cadastram sozinhos em `cadastro.html`.

## 5. Teste manual (checklist)

Com o backend rodando e o front-end servido (passo 4), siga esta sequencia,
ela cobre todos os requisitos da 1ª Entrega nos dois repositorios:

1. Abra `admin.html`, entre com o administrador criado no bootstrap do backend.
2. Aba **Especialidades**: cadastre 1 ou 2 (ex.: "Ortopedia", "Clinica Geral").
3. Aba **Clinicas**: cadastre 1 clinica.
4. Aba **Profissionais**: cadastre 1 profissional, marcando a especialidade e a clinica.
5. Aba **Contas da equipe**: crie uma conta de login vinculada a esse profissional.
6. Saia (Sair) e entre com o e-mail/senha dessa conta em `index.html` — deve cair em `profissional.html`.
7. Aba **Cadastrar horarios**: cadastre um horario para amanha.
8. Saia e abra `cadastro.html` para criar um paciente novo.
9. Como paciente, va em **Agendar consulta**, filtre pela especialidade cadastrada e confirme que o horario aparece. Clique em **Agendar**.
10. Va em **Meus agendamentos** e confirme que a consulta aparece como "Confirmado".
11. Clique em **Cancelar** e confirme que o status muda para "Cancelado".
12. Volte como administrador e confira, na aba **Agendamentos**, que o mesmo registro aparece com status "Cancelado".
13. Volte como profissional e confira que o horario voltou a aparecer como "Disponivel" em **Cadastrar horarios**.

## 6. Fluxo de uso sugerido

1. Administrador cadastra **especialidades**, **clinicas** e **profissionais**.
2. Administrador cria uma **conta de acesso** para cada profissional (aba
   "Contas da equipe"), vinculando-a ao cadastro do profissional.
3. Profissional entra e cadastra seus **horarios disponiveis**.
4. Paciente cria conta, busca horarios por especialidade/clinica e **agenda**.
5. Paciente ou administrador podem **cancelar** um agendamento; o horario
   volta a ficar disponivel automaticamente.
