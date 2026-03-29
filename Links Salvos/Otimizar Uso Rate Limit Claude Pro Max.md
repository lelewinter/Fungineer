---
date: 2026-03-24
tags: [claude, rate-limits, otimizacao, api, automacao]
source: https://x.com/aaronjmars/status/2036230574822580675?s=20
autor: "@aaronjmars"
---

# Maximizar 100% da Sua Assinatura Claude Pro/Max com Automação de Rate Limits

## Resumo

Estratégia de Aaron Mars para maximizar completamente assinatura Claude Pro ou Max usando automação baseada em monitoramento de rate limits. Sistema alerta quando perto de atingir limite e dispara tarefas automaticamente para aproveitar janela de 5 horas ao máximo. Projeto Aeon em github.com/aaronjmars/aeon implementa essa estratégia. É como ter bilhete de cinema válido por 5 horas — maioria das pessoas trabalha, aproveita 2 horas, desperdiça 3. Aeon é: monitora quanto tempo falta, quando há 30min, coloca os 3 filmes mais importantes na fila.

## Explicação

Os rate limits do Claude funcionam em janelas deslizantes de 5 horas, não por mês ou semana. Anthropic fornece endpoint API em `GET /api/oauth/usage` para consultar uso atual usando Claude Code API key para acesso programático ao uso real-time.

**Analogia:** Sem Aeon: você usa cota manualmente, espera ficar perto de limite, recomeça — é como bater batida de corredor sem planejamento. Com Aeon: sistema sabe que a cada 5 horas você tem "janela de ouro", monitora automaticamente, quando faltam 30 minutos dispara tarefas que já tem na fila — é corrida com timing perfeito.

Projeto Aeon implementa automação que: monitora continuamente quando sua janela de 5 horas está terminando, quando há menos de 30 minutos restantes na janela dispara automaticamente todas as skills agendadas (fix PRs, fazer research, tarefas agendadas), continua executando tarefas até atingir 100% do limite disponível.

**Profundidade:** Por que isso é poderoso? Porque elimina overhead de decisão. Você não tem que pensar "é hora de usar cota?". Sistema pensa por você. Você só prepara lista de tarefas (fila) que executam quando janela está perto de fechar. Isso libera você de gerenciamento operacional para decisão estratégica.

Fluxo de execução: monitorar uso → verificar limite → 30min restantes? → SIM → dispara todas as skills → até 100% de uso.

Vantagens incluem: nenhuma cota desperdiçada, uso de 100% do que você paga, completamente automático sem intervenção manual, flexibilidade para configurar quaisquer skills (correção de código, research, documentação, refatoração, testes, qualquer tarefa que aceite automação), sem custo extra (usa apenas cota já adquirida, nenhuma API adicional, nenhuma cobrança extra).

Em vez de ver rate limits como limitação, tornam-se: oportunidade de planejamento, janela previsível de oportunidade, gatilho para automação inteligente.

## Exemplos

Stack técnico necessário: Claude Code com API key ativo, projeto Aeon (ou reimplementação), skills configuradas para tarefas desejadas, agendamento do monitoramento.

Monitoramento programático: Polling `GET /api/oauth/usage` → Parse JSON → Verificar threshold → Executar lógica.

Casos de uso em desenvolvimento: revisar e corrigir automaticamente PRs quando há tempo disponível, refatorar código em background, melhorar documentação. Em pesquisa: executar análises extensas de código, fazer research de bibliotecas e dependências, gerar relatórios. Em manutenção: update dependencies, security audits, code quality improvements.

## Relacionado

- [[Maestri Orquestrador Agentes IA Canvas 2D]]
- [[Claude Code Subconscious Letta Memory Layer]]
- [[Claude Code - Melhores Práticas]]
- [[450_skills_workflows_claude]]

## Perguntas de Revisão

1. Como janelas deslizantes de 5 horas mudam estratégia de otimização comparado a limites mensais?
2. Por que automação de rate limits é mais eficiente que gerenciamento manual?
3. Qual é o synergy entre múltiplos agentes coordenados e maximização de rate limits?
