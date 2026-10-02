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
| Gerenciamento Administrativo | `admin.html` (cadastro de clinicas, especialidades, profissionais, pacientes e administradores) |
| Cadastro de Disponibilidade do Profissional | `profissional.html`, aba "Cadastrar horários": calendário para marcar os dias (com botões "Marcar tudo" e "Desmarcar tudo" para o mês exibido) e um horário de início/fim, dividido automaticamente em horários menores |
| Lista de Horários Agrupada por Dia | `profissional.html`, seção "Meus horários cadastrados": um bloco por dia (data, dia da semana, faixa de horário, clínica e contagem de disponíveis/reservados) que abre para mostrar os horários em botões compactos; horários livres têm um `×` para remover. Horários livres cujo início já passou somem da lista automaticamente (a tela se atualiza a cada minuto) |
| Consulta de Clínicas e de Especialidades | `paciente.html`, aba "Clínicas e especialidades": clínicas ativas com endereço, telefone (link para ligar), e-mail, horário de funcionamento e especialidades, com busca por nome (ignora acentos) e filtro por especialidade; especialidades ativas com descrição e número de profissionais. O botão "Ver profissionais" leva à aba "Agendar consulta" já filtrada |
| Consulta de Horários Disponíveis e Agendamento | `paciente.html` (só mostra horários de hoje em diante e que ainda não começaram). Os horários vêm agrupados por dia e, dentro do dia, por profissional e clínica; o primeiro dia abre por padrão e cada horário é um botão que pede confirmação antes de agendar |
| Pré-triagem de Sintomas por IA | `paciente.html`, aba "Agendar consulta" &rarr; "Começar pré-triagem": chat que pergunta os sintomas e recomenda a especialidade |
| Cancelamento de Agendamento | `paciente.html`, aba "Meus agendamentos": mostra até quando o cancelamento é permitido; depois do prazo (24 horas antes da consulta) o botão Cancelar some e o paciente é orientado a falar com a clínica |
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
7. Aba **Cadastrar horários**: no calendário, deixe marcado um dia daqui a 2 dias ou mais, para poder testar o cancelamento, que só é permitido até 24 horas antes (use **Desmarcar tudo** e clique só nesse dia, ou desmarque os outros um a um), defina um intervalo (ex.: 07:00 às 12:00) e clique em **Gerar horários para os dias marcados**. Em "Meus horários cadastrados", confirme que aparece um bloco por dia, que abre ao clicar na data, e que o `×` remove um horário livre.
8. Saia e abra `cadastro.html` para criar um paciente novo.
9. Como paciente, abra a aba **Clínicas e especialidades**: confira endereço, telefone, horário e especialidades da clínica, teste a busca por nome e o filtro por especialidade, e clique em **Ver profissionais**. Depois, em **Agendar consulta**, clique em **Começar pré-triagem** e descreva um sintoma relacionado à especialidade cadastrada (isso exige o `GEMINI_API_KEY` configurado no backend). Confirme que a IA recomenda a especialidade certa e que o botão "Ver horários de..." filtra a busca corretamente.
10. Filtre pela especialidade cadastrada (manualmente ou via pré-triagem) e confirme que os horários aparecem agrupados por dia. Abra o dia, clique no horário e confirme o aviso de agendamento.
11. Va em **Meus agendamentos** e confirme que a consulta aparece como "Confirmado".
12. Confira o aviso "Você pode cancelar até ..." e clique em **Cancelar**; confirme que o status muda para "Cancelado". Para testar o prazo, agende um horário que comece em menos de 24 horas (por exemplo, amanhã cedo): o botão Cancelar não deve aparecer.
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
   volta a ficar disponivel automaticamente. O paciente só cancela até
   24 horas antes da consulta.
5. O administrador pode editar os dados de um paciente a qualquer momento
   pela aba **Pacientes**, e criar outras contas de administrador pela aba
   **Administradores**.
