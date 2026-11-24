---
"@rastrokit/desktop": patch
---

Inclui novamente `highlight.js` no empacotamento do desktop, pois `@rastrokit/sdk` (`MarkupConverter`) importa o módulo em runtime no processo principal.
