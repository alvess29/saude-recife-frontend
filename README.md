# Saude Recife - Frontend (PWA)

Projeto Integrador 3º Periodo &middot; Senac PE
**1ª Entrega: PWA + Backend + Banco de Dados**

**Integrantes:** Pedro Roberto e Taywan Francisco.

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
├── profissional.html    area do profissional (cadastrar e ajustar horarios, ver agenda)
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
| Gerenciamento Administrativo | `admin.html` (cadastro de clinicas, especialidades, profissionais, pacientes e administradores) |
| Cadastro de Disponibilidade do Profissional | `profissional.html`, aba "Cadastrar horários": calendário para marcar os dias e um horário de início/fim, dividido automaticamente em horários menores |
| Ajuste do Horário de um Dia | `profissional.html`, aba "Cadastrar horários", card "Ajustar o horário de um dia": o profissional escolhe a data e informa um novo início (chega mais tarde) e/ou um novo fim (sai mais cedo). Se houver consultas marcadas fora do novo horário, o sistema lista os pacientes e pede confirmação antes de cancelá-las |
| Consulta de Horários Disponíveis e Agendamento | `paciente.html` (só mostra horários de hoje em diante) |
| Pré-triagem de Sintomas por IA | `paciente.html`, aba "Agendar consulta" &rarr; "Começar pré-triagem": chat que pergunta os sintomas e recomenda a especialidade |
| Gerenciamento de Agendamentos | abas "Meus agendamentos" / "Minha agenda" / "Agendamentos" (admin) |
| Integracao Client-Server (API REST + JSON) | `js/api.js`, que consome as rotas do repositorio backend |
| Interface Responsiva e Acessivel | CSS com foco visivel, alvos de toque >= 44px, layout fluido, `prefers-reduced-motion` |
| PWA instalavel e com cache offline basico | `manifest.json` + `sw.js` |

Os requisitos de API e banco de dados estao documentados no README do
[repositorio do backend](https://github.com/alvess29/saude-recife-backend).

## 3. Configurar o Firebase

1. Use o mesmo projeto Firebase criado para o backend (veja o README de la).
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
para login, cadastros e agendamentos funcionarem. A "Pré-triagem com IA"
também depende do backend ter a variável `GEMINI_API_KEY` configurada
(veja a seção 4 do README do backend); sem ela, o resto do sistema
continua funcionando normalmente, só essa aba fica indisponível.

Entre com o e-mail/senha do administrador criado no backend para acessar
`admin.html` e cadastrar clinicas, especialidades e profissionais. Pacientes
se cadastram sozinhos em `cadastro.html`.

## 5. Teste manual (checklist)

Com o backend rodando e o front-end servido (passo 4), siga esta sequencia,
ela cobre todos os requisitos da 1ª Entrega nos dois repositorios:

1. Abra `admin.html`, entre com o administrador criado no bootstrap do backend.
2. Aba **Especialidades**: cadastre 1 ou 2 (ex.: "Ortopedia", "Clínica Geral").
3. Aba **Clinicas**: cadastre 1 clinica.
4. Aba **Profissionais**: cadastre 1 profissional, marcando a especialidade e a clinica.
5. Aba **Profissionais**: ao cadastrar, preencha tambem e-mail e senha provisoria para ja criar o login do profissional junto com o perfil.
6. Saia (Sair) e entre com o e-mail/senha dessa conta em `index.html` — deve cair em `profissional.html`.
7. Aba **Cadastrar horários**: no calendário, deixe marcado o dia de amanhã (ou desmarque os outros), defina um intervalo (ex.: 07:00 às 12:00) e clique em **Gerar horários para os dias marcados**. Em seguida, no card **Ajustar o horário de um dia**, informe o dia de amanhã com um novo fim mais cedo (ou um novo início mais tarde) e confirme que os horários fora do novo intervalo sumiram de "Meus horários cadastrados".
8. Saia e abra `cadastro.html` para criar um paciente novo.
9. Como paciente, em **Agendar consulta**, clique em **Começar pré-triagem** e descreva um sintoma relacionado à especialidade cadastrada (isso exige o `GEMINI_API_KEY` configurado no backend). Confirme que a IA recomenda a especialidade certa e que o botão "Ver horários de..." filtra a busca corretamente.
10. Filtre pela especialidade cadastrada (manualmente ou via pré-triagem) e confirme que o horario aparece. Clique em **Agendar**.
11. Va em **Meus agendamentos** e confirme que a consulta aparece como "Confirmado".
12. Clique em **Cancelar** e confirme que o status muda para "Cancelado".
13. Volte como administrador e confira, na aba **Agendamentos**, que o mesmo registro aparece com status "Cancelado".
14. Volte como profissional e confira que o horário voltou a aparecer como "Disponível" em **Cadastrar horários**.

## 6. Fluxo de uso sugerido

1. Administrador cadastra **especialidades**, **clinicas** e **profissionais**,
   ja informando e-mail e senha do profissional para criar o login junto.
2. Profissional entra e cadastra seus **horarios disponiveis**.
3. Paciente cria conta (ou o administrador cadastra por ele, na aba
   **Pacientes**). Se não souber qual especialidade procurar, pode fazer a
   **pré-triagem com IA** antes de buscar; senão, busca direto por
   especialidade/clínica e **agenda**.
4. Paciente ou administrador podem **cancelar** um agendamento; o horario
   volta a ficar disponivel automaticamente.
5. O administrador pode editar os dados de um paciente a qualquer momento
   pela aba **Pacientes**, e criar outras contas de administrador pela aba
   **Administradores**.
