---
date: 2026-03-23
tags: [claude, produtividade, setup-otimizacao, ia, prompts]
source: https://x.com/itsolelehmann/status/2036065138147471665?s=20
autor: "@itsolelehmann"
---

# Simplificar seu Setup do Claude: Como Deletar Metade das Regras e Melhorar os Resultados

## Resumo

Ole Lehmann descobriu que deletar metade do setup do Claude resultou em outputs melhores, não piores. A equipe Anthropic explicou exatamente por que, oferecendo prompt auditável para identificar exatamente o que remover. Objetivo é encontrar "minimum viable setup" que produz outputs desejados. É como descobrir que sua caixa de ferramentas é melhor com metade das ferramentas — menos peso, menos confusão, trabalho melhor.

## Explicação

Problema comum com setup: acúmulo de regras ao longo do tempo. Semana 1 recebe output ruim, adiciona regra "seja mais conciso". Semana 2 outro output ruim, adiciona "use um tom casual". Mês 1 algo quebra, adiciona "sempre explique termos técnicos". Mês 3 tem 30 regras empilhadas com consequências: regras contraditórias (ex: "seja conciso" conflita com "sempre explique seu raciocínio"), problemas obsoletos (algumas regras corrigem problemas que o modelo não tem mais), sobrecarga cognitiva (modelo tenta seguir tudo, significa que não faz nada bem).

Analogia: é como dar a um chef uma receita com 47 passos quando ele só precisa de 12. Os 35 passos extras desaceleram o chef, fazem-no duvidar do que já sabe, prato sai pior. A equipe Anthropic descobriu que seu próprio scaffolding estava piorando a IA, significando que suas custom instructions provavelmente estão fazendo exatamente a mesma coisa.

**Profundidade:** Por que menos regras é melhor? Porque regras competem por "budget de atenção". Cada regra diz "lembre disso!" — com 30 regras, Claude está dividido. Remove 20 regras? Claude pode realmente focar nas 10 que importam. Matemática de atenção: menos input = mais depth.

Filosofia: "addition by subtraction" — você não melhora Claude adicionando mais regras. Você melhora removendo o ruído e deixando o modelo fazer o que já faz bem. O setup ótimo é o mais simples que ainda produz os resultados desejados.

## Exemplos

Para fazer auditoria automática, abra Claude Code/Cowork no Claude Desktop e execute prompt que pede ao Claude para: ler seu setup inteiro, verificar claude.md, skills folder, context folder, arquivos de instruções, para cada regra avalie se é algo que Claude já faz por default, se contradiz outras regras, se repete algo já coberto, se parece adicionado para corrigir um output específico, se é tão vago que seria interpretado diferentemente cada vez.

Claude retorna lista de tudo a cortar com razão de uma linha, lista de conflitos entre arquivos, versão limpa do claude.md com peso morto removido.

Processo de implementação: NÃO delete tudo cegamente. Siga: Leia o que foi sinalizado e por quê, Delete as regras sinalizadas, Execute seus 3 tarefas mais comuns com setup reduzido, Verifique se output ficou igual ou melhor (se sim, essas regras eram peso morto), Restaure seletivamente se algo específico quebrou.

## Relacionado

- [[Claude Code - Ativar Resumo de Pensamentos]]
- [[Claude Code - Melhores Práticas]]
- [[Otimizar Preferencias Claude Chief of Staff]]
- [[Livro You and Your Research Richard Hamming]]

## Perguntas de Revisão

1. Por que deletar regras frequentemente melhora outputs em vez de piorar?
2. Como "addition by subtraction" se aplica a setup de Claude?
3. Qual é a filosofia de "minimum viable setup" e por que ela importa?
