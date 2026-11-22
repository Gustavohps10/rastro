---
"@rastrokit/desktop": patch
"@rastrokit/adapters": patch
"@rastrokit/application": patch
"@rastrokit/domain": patch
"@rastrokit/ui": patch
---

Unifica o protocolo do desktop empacotado em `rastro:` para OAuth, ativação e avatares. O retorno de OAuth em desenvolvimento usa `electron:`. Os endereços HTTPS cadastrados nos provedores continuam iguais.

Restaura a entrega do retorno OAuth à instância do desktop em desenvolvimento no Windows. Usa um UUID como `state` padrão e remove referências a integrações específicas das configurações do core.
