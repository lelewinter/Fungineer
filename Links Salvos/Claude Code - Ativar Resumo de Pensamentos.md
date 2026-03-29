---
date: 2026-03-28
tags: [claude-code, dicas, configuração, debug]
source: https://x.com/Butanium_/status/2037575095569269201
autor: "@Butanium_"
---

# Claude Code - Restaurar Resumo de Pensamentos

## Resumo

A partir da versão 2.1.69, Claude Code oculta silenciosamente todo o pensamento interno sem constar no changelog. A funcionalidade pode ser restaurada através de uma configuração não documentada no arquivo settings.json.

## Explicação

Desde a versão v2.1.69 do Claude Code, o resumo de pensamentos foi desativado por padrão sem anúncio oficial. Esta é uma configuração não documentada que foi descoberta pela comunidade. A solução envolve editar manualmente o arquivo de configuração do Claude para restaurar a visibilidade dos resumos de pensamento.

O arquivo settings.json está localizado em `C:\Users\leeew\AppData\Roaming\Claude\settings.json`. A configuração específica que controla este comportamento é `showThinkingSummaries`, que quando definida como `true`, restaura a exibição dos resumos de pensamento internos.

## Exemplos

Para restaurar o resumo de pensamentos, adicione a seguinte configuração no arquivo settings.json:

```json
{
  "showThinkingSummaries": true
}
```

Após adicionar esta linha ao arquivo, Claude Code voltará a exibir os resumos de pensamento em seu painel de debug.

## Relacionado

- [[Claude Code - Melhores Práticas]]
- [[Simplificar Setup Claude Deletar Regras Extras]]
- [[Otimizar Preferencias Claude Chief of Staff]]

## Perguntas de Revisão

1. Por que uma configuração não documentada foi necessária para restaurar uma feature?
2. Como visibilidade de raciocínio interno muda a forma como você trabalha com Claude?
3. Qual é a relação entre resumo de pensamentos e qualidade de output?
