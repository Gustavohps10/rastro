---
"@rastrokit/desktop": patch
---

Reduz drasticamente o tamanho do pacote desktop (portable e instalador) removendo dependências não usadas (`sqlite3`, `lokijs`), movendo ferramentas de build/teste para `devDependencies`, desativando sourcemaps de produção no renderer, filtrando idiomas do Chromium (`en-US`, `pt-BR`) e excluindo pacotes exclusivos de dev/monorepo/renderer do `app.asar`.
