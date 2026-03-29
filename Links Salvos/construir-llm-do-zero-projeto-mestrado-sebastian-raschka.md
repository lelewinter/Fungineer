---
tags: [llm, treinamento, deep-learning, sebastian-raschka, mestrado, hands-on]
source: https://www.linkedin.com/feed/update/urn:li:activity:7324180712985624578/
date: 2026-03-28
autor: "Victor Hugo Germano"
---

# Construir um LLM do Zero em 2 Semanas é Viável com o Livro de Sebastian Raschka

## Resumo
Em duas semanas de projeto pessoal, um dev construiu seu próprio LLM seguindo o livro "Build a Large Language Model From Scratch" de Sebastian Raschka, usando os recursos do 3Blue1Brown como complemento visual.

## Explicação
O projeto demonstra que o processo de construção de um LLM — de tokenização até treinamento — é acessível para quem tem base em Python e álgebra linear, sem necessidade de infraestrutura de alto custo.

**Analogia:** É como montar um motor de carro para entender como ele funciona — você não vai usar esse motor em produção, mas a partir daí nunca mais vê um motor como uma caixa preta.

Recursos usados na abordagem:
- **Livro**: "Build a Large Language Model From Scratch" (Sebastian Raschka) — cobre desde embeddings até fine-tuning
- **Vídeo complementar**: Série "Deep Learning" do 3Blue1Brown no YouTube (https://www.youtube.com/watch?v=wjZofJX0v4M) — visualização do fluxo de dados nos transformers
- **Infraestrutura**: Respondeu em comentário (não exibido), mas projetos similares usam Colab Pro ou uma GPU de consumidor

O ponto central do post: a diferença entre quem entende IA de verdade e quem apenas usa ferramentas de IA está em ter construído algo do zero pelo menos uma vez.

## Exemplos
- Implementar atenção (attention mechanism) à mão revela por que o custo quadrático por token é um problema real
- Treinar em um dataset pequeno mostra como hiperparâmetros como learning rate e batch size afetam diretamente a perda

## Relacionado
- [[local_llm_reddit_discussao]]
- [[mit-700-paginas-livro-algorithms-thinking]]

## Perguntas de Revisão
1. Qual é o papel dos embeddings no pipeline de um LLM construído do zero?
2. Por que o vídeo do 3Blue1Brown é especialmente útil para entender transformers?
3. O que você ganha ao construir um LLM do zero que não aprende consumindo APIs?
