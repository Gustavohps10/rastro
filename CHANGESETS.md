# Guia de Publicação e Versionamento com Changesets

Este documento explica o fluxo simples e passo a passo para versionar e publicar pacotes do monorepo Rastro no **NPM** usando o **Changesets**.

---

## 🚀 Fluxo Rápido de Publicação (Passo a Passo)

### 1. Criar um Registro de Mudança (Changeset)

Após fazer alterações no código (ex: no `@rastrokit/sdk`), rode na raiz:

```bash
yarn changeset
```

1. **Selecione os pacotes alterados**: Use as setas do teclado e a barra de espaço para marcar (ex: `[x] @rastrokit/sdk`) e aperte `Enter`.
2. **Escolha o tipo de versão**:
   - `patch` (correções de bugs / melhorias internas).
   - `minor` (novas funcionalidades compatíveis).
   - `major` (mudanças que quebram compatibilidade).
3. **Escreva o resumo da mudança**: Digite a mensagem que aparecerá no `CHANGELOG.md`.

---

### 2. Versionar e publicar pelo GitHub Actions

Ao receber changesets em `main`, o workflow `release.yml` abre o PR de release com as versões e os changelogs atualizados. Após o merge desse PR, o pipeline compila e publica os pacotes com o Changesets.

A primeira publicação de `@rastrokit/sdk` mantém a versão `0.15.0`. O workflow usa o secret `NPM_TOKEN` apenas quando o pacote ainda não existe no registro. Os changesets pendentes entram na release seguinte.

Depois da primeira publicação, configure o [Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) no pacote `@rastrokit/sdk` com o repositório `Gustavohps10/rastro`, o arquivo `release.yml` e a permissão **Allow npm publish**. As próximas releases usam OIDC.

---

## 🛠️ Resumo de Comandos Úteis

| Comando                  | Descrição                                                         |
| :----------------------- | :---------------------------------------------------------------- |
| `yarn changeset`         | Cria um novo arquivo de changeset com as alterações feitas.       |
| `yarn changeset status`  | Mostra quais pacotes foram alterados e estão pendentes de versão. |
