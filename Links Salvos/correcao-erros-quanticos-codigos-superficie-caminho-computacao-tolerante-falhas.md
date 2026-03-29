---
tags: [computacao-quantica, correcao-de-erros, qec, surface-codes, qldpc, fault-tolerant, qubits-logicos]
source: https://www.riverlane.com/blog/quantum-error-correction-our-2025-trends-and-2026-predictions
date: 2026-03-28
---
# Correção de Erros Quânticos Requer Muitos Qubits Físicos por Qubit Lógico, mas qLDPC Reduz Esse Custo Drasticamente

## Resumo

Qubits físicos erram com frequência. Para fazer computação útil e longa, é preciso codificar qubits lógicos usando muitos qubits físicos com redundância. Isso é correção de erros quântica (QEC). Os códigos de superfície dominaram a última década, mas em 2024–2026 os códigos qLDPC emergem como alternativa radicalmente mais eficiente.

## Explicação

**O problema fundamental**: qubits físicos têm taxas de erro de 0,1–1% por operação. Algoritmos úteis (como Shor quebrando RSA-2048) precisam de milhões de operações sem erros acumulados. Sem QEC, o resultado é ruído incontrolável.

**Qubits lógicos vs. físicos**: um qubit lógico é codificado em N qubits físicos, de forma que erros em qualquer subconjunto sejam detectáveis e corrigíveis sem colapsar a superposição. O limiar de erro (threshold) é a taxa de erro por porta abaixo da qual escalar o código efetivamente reduz a taxa de erro lógico.

**Códigos de superfície**: arranjo 2D de qubits com verificações locais de paridade. Distance d requer d² qubits físicos por qubit lógico. Google Willow (2024) demonstrou suppression de erros abaixo do threshold com distance-7 — marco histórico. Problema: razão física/lógico ainda é ~1.000:1 para algoritmos práticos.

**Códigos qLDPC (Quantum Low-Density Parity-Check)**: verificações de paridade não locais mas esparsas. IBM adotou em 2024 como estratégia principal. Razão física/lógico cai para ~10:1 a ~100:1. Iceberg Quantum (fev. 2026) anunciou arquitetura Pinnacle que reduz qubits necessários para quebrar RSA-2048 de 1 milhão para <100.000.

**Decoders**: o gargalo computacional de QEC está no decoder — software que interpreta medições de síndrome e determina quais erros ocorreram, em tempo real, a taxa de clock do hardware (~1 µs). 95% dos profissionais do setor (pesquisa 2025) identificam QEC como prioridade número um para utilidade quântica em escala.

**Timeline do setor**: 2028 é o prazo informal para os primeiros sistemas com QEC integrada em escala útil. IBM prevê fault tolerance para 2029.

## Exemplos

- **Google Willow distance-7**: qubit lógico vive 2,4× mais que o melhor qubit físico individual — primeiro sistema a cruzar esse limiar
- **IBM Kookaburra (2026)**: primeiro processador capaz de armazenar informação em memória qLDPC
- **Arquitetura Pinnacle (Iceberg Quantum, 2026)**: RSA-2048 quebrável com <100.000 qubits físicos via qLDPC
- **Riverlane**: startup focada exclusivamente em decoders para QEC em tempo real

## Relacionado

- [[hardware-quantico-nisq-era-supercondutores-ions-fotonico]] — hardware que implementa QEC
- [[algoritmos-quanticos-shor-grover-vqe-qaoa-classes-problemas]] — Shor precisa de QEC para ser executável
- [[vantagem-quantica-google-willow-ibm-corrida-2025-2026]] — QEC é o milestone central da corrida atual

## Perguntas de Revisão

1. Por que não é possível simplesmente copiar qubits para fazer backup como em computação clássica?
2. Qual a diferença entre threshold de erro e taxa de erro lógico após correção?
3. Por que qLDPC é mais eficiente que códigos de superfície em razão de qubits físicos por lógico?
