---
date: 2026-03-10
tags: [Claude, pesquisa, literature review, prompts, PhD, papers, conhecimento estruturado, synthesis]
source: https://x.com/aiwithjainam/status/2031282913422225567
autor: "Jainam Parmar (AI with Jainam)"
tipo: zettelkasten
---

# 9 Prompts para Pesquisa Acadêmica — Transformar 40+ Papers em Literatura Estruturada como PhD

## Resumo

Claude pode realizar pesquisa acadêmica como um estudante PhD de Stanford: analisar 40+ papers, identificar contradições, mapear conceitos citados, encontrar gaps de pesquisa, e consolidar uma síntese que não resume papers individuais mas expressa o que o campo coletivamente acredita — como passar de leitura passiva para compreensão estruturada e crítica.

## Explicação

**9 Prompts Estruturados para Pesquisa Acadêmica:**

**PROMPT 1: The Intake Protocol**
Quando você primeiro carrega seus papers:
```
"I'm going to share [X] papers on [topic].
Before I ask anything, do this:
1. List every paper by author + year + core claim in one sentence
2. Group them into clusters of shared assumptions
3. Flag any obvious gaps"
```
Resultado: Organização imediata do corpus.

**PROMPT 2: The Contradiction Finder**
Identifica conflitos diretos entre autores:
```
"Across all papers uploaded, identify every point where two
or more authors directly contradict each other.

For each contradiction:
- State both positions
- Name the papers
- Explain WHY they contradict"
```
Resultado: Mapa de desacordos fundamentais.

**PROMPT 3: The Citation Chain**
Rastreia linhagem intelectual:
```
"Pick the 3 most-cited concepts across these papers.

For each concept:
- Who introduced it first?
- Who challenged it?
- Who refined it?
- What's the current consensus (if any)?"
```
Resultado: Lineagem intelectual visualizada como árvore genealógica.

**PROMPT 4: The Gap Scanner**
Encontra questões não respondidas:
```
"Based on all uploaded papers, identify the 5 research
questions that NOBODY has fully answered yet.

For each gap:
- Why does it exist? (too hard, no niche, overlooked?)
- Which existing paper came closest to answering it?"
```
Resultado: Roadmap para pesquisa futura.

**PROMPT 5: The Methodology Audit**
Compara metodologias usadas:
```
"Compare the research methodologies used across all papers.

Group by: surveys, experiments, simulations, meta-analyses, case studies.

Then flag:
- Which methodology dominates this field and why?
- Which methodology is underused?
- Which papers use most rigorous methods?"
```
Resultado: Compreensão do que se sabe vs. como se sabe.

**PROMPT 6: The Master Synthesis**
Cria síntese integrada após todos os prompts anteriores:
```
"You now have a full picture of this literature.

Write a synthesis that does NOT summarize individual papers.

Instead:
- State what the field collectively believes
- State what remains contested
- State what remains unclear"
```
Resultado: Entendimento holistico do estado da arte.

**PROMPT 7: The Assumption Killer**
Identifica suposições não testadas:
```
"List every assumption that the MAJORITY of these papers share
but never explicitly test or justify.

For each assumption:
- What evidence supports it?
- What would break it?
- Which papers could be wrong if this assumption fails?"
```
Resultado: Descoberta do "óbvio" que pode estar errado.

**PROMPT 8: The Outlier Analysis**
Detecta trabalhos únicos ou contraditórios:
```
"Identify papers that stand alone or contradict the consensus.

For each outlier:
- Why is it different?
- Is it wrong, ahead of its time, or from a different field?
- What can we learn from papers the field largely ignored?"
```
Resultado: Perspectivas negligenciadas.

**PROMPT 9: The Next Step Recommender**
Gera recomendações de pesquisa futura:
```
"Given everything above, what should a researcher do next?

Recommend:
1. Which gap is most important to close?
2. What methodology would be best?
3. What existing tools/data could accelerate this?
4. What collaboration would help?"
```
Resultado: Roadmap actionável.

## Exemplos

**Fluxo Completo Exemplo: "Pesquisa em Large Language Models e Hallucinations"**

1. **Intake Protocol**: Lista 42 papers, agrupa em: "Detecção de Hallucinations", "Causas de Hallucinations", "Mitigação"
2. **Contradiction Finder**: Paper A diz hallucinations vêm de training data; Paper B diz vêm de decoding; Paper C diz ambos
3. **Citation Chain**: Token de "hallucination" em LLMs foi introduzido por X em 2021, refinado por Y em 2023
4. **Gap Scanner**: "Como prevenir hallucinations sem degradar criatividade?" — ninguém respondeu completamente
5. **Methodology Audit**: 60% dos papers usam avaliação manual (cara), apenas 20% têm benchmarks automáticos
6. **Master Synthesis**: "O campo acredita que hallucinations vêm de múltiplas causas. Mas não há consenso sobre qual domina."
7. **Assumption Killer**: Maioria assume que "fluência = conhecimento", mas isso pode estar errado
8. **Outlier Analysis**: Um paper de 2022 propõe abordagem totalmente diferente, ignorado por todos
9. **Next Step**: "Pesquisa colaborativa entre grupos A e B, usando metodologia X, focando em gap Y"

## Relacionado

[[Indexacao de Codebase para Agentes IA]]
[[Claude Code - Melhores Práticas]]

## Perguntas de Revisão

1. Por que usar 9 prompts separados ao invés de um único prompt "analise todos esses papers"?
2. Qual é a diferença entre "Contradiction Finder" e "Assumption Killer"? Ambos encontram problemas?
3. Se você tivesse que escolher apenas 3 dos 9 prompts, quais seria e por quê?
