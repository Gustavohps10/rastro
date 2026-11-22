<h2 align="center">
  <div align="center">
    <img height="100" src="./src/packages/ui/src/assets/logo.svg#gh-light-mode-only" alt="Rastro Logo" />
    <img height="100" src="./src/packages/ui/src/assets/logo-dark.svg#gh-dark-mode-only" alt="Rastro Logo" />
  </div>

Engine de produtividade e rastreamento de tempo local-first para desenvolvedores e equipes técnicas. Seus dados. Sua máquina. Seu tempo.

</h2>

<p align="center">
    <img src="https://img.shields.io/github/languages/top/Gustavohps10/rastro?label=TypeScript&color=4f94ee&style=flat-square&logoColor=ffffff&logo=typescript"/>
    <img src="https://img.shields.io/website?url=https://mistertick.com&label=Website&color=4f94ee&style=flat-square"/>
    <img src="https://img.shields.io/github/commit-activity/w/Gustavohps10/rastro?label=Commits&color=4f94ee&style=flat-square&logo=git&logoColor=ffffff"/>
    <img src="https://img.shields.io/github/created-at/gustavohps10/rastro?label=Created%20At&color=4f94ee&style=flat-square"/>
    <img src="https://img.shields.io/github/license/gustavohps10/rastro?label=License&color=4f94ee&style=flat-square"/>
</p>

---

## 💡 O que é o Rastro?

O **Rastro** é um aplicativo desktop focado em produtividade e apontamento de horas sem fricção, projetado para desenvolvedores que não querem perder tempo preenchendo planilhas ou alternando abas de navegadores.

- ⏱️ **Timer Ágil & Widget Flutuante:** Acompanhe o tempo em tempo real com um mini-player compacto e atalhos rápidos de teclado.
- 🔒 **100% Local-First (Zero-Cloud):** Seus dados ficam salvos na sua própria máquina. Integrações consultam os provedores configurados pelo usuário; sincronização remota depende da conexão escolhida.
- 📶 **Operação Offline:** Funciona perfeitamente sem internet. Suas tarefas e apontamentos são salvos localmente e sincronizados de forma transparente quando você se reconectar.
- 🧩 **Ecossistema Expansível:** Conecte ferramentas como Redmine, Jira, rastreadores de janelas e temas através de plugins via SDK.

---

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** 20 LTS ou superior
- **Yarn 4** habilitado

Para um guia completo de configuração no Windows, macOS ou Linux, consulte **[docs/como-rodar.md](docs/como-rodar.md)**.

### Início Rápido

```bash
# 1. Instalar as dependências do projeto
yarn install

# 2. Compilar os pacotes
yarn build

# 3. Iniciar o Rastro Desktop em desenvolvimento
yarn dev:desktop
```

---

## 📚 Documentação & Recursos

- 📖 **[Documentação do SDK](src/apps/landing-page/content/docs)**: Guias passo a passo para criar novos conectores de tarefas, watchers e temas visuais.
- 🔐 **[Contratos atuais de SDK e autenticação](docs/sdk.md)**: Capabilities, contribuições, conexões e providers.
- 🗺️ **[Roadmap do Projeto](docs/ROADMAP.md)**: Próximas fases e visão de evolução do Rastro.
- 🔌 **[Plugin de Exemplo (Redmine)](https://github.com/Gustavohps10/redmine-plugin)**: Implementação oficial de conector para Redmine.

---

## :adult: Autores

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://gustavohenrique.vercel.app/"><img src="https://avatars.githubusercontent.com/u/61752235?v=4?s=100" width="100px;" alt="Gustavo Henrique"/><br /><sub><b>Gustavo Henrique</b></sub></a><br /><a href="#code-Gustavohps10" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## 📄 Licença

Este projeto é software livre licenciado sob os termos da licença [Apache 2.0](LICENSE).
