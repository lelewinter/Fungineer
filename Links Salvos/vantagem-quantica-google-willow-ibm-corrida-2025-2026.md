---
tags: [computacao-quantica, supremacia-quantica, vantagem-quantica, google-willow, ibm, milestones, 2025, 2026]
source: https://www.hpcwire.com/2025/10/22/google-claims-quantum-advantage-with-willow-chip/
date: 2026-03-28
---
# Google Willow Demonstrou Primeira Vantagem Quântica Verificável em Problema Real em 2025

## Resumo

A corrida por vantagem quântica escalou em 2025. Google Willow executou o algoritmo "out-of-order time correlator" 13.000× mais rápido que supercomputadores clássicos em um problema verificável — mais substancial que a "supremacia" de 2019, que usava benchmark sem aplicação prática. IBM mira vantagem prática até 2026 e tolerância a falhas até 2029. O setor cruzou $1 bilhão em receita em 2025.

## Explicação

**Distinção supremacia vs. vantagem**: "supremacia quântica" (Google, 2019) demonstrou que um computador quântico pode resolver algo que um clássico não consegue em tempo razoável — mas o problema era artificialmente construído (Random Circuit Sampling). "Vantagem quântica" requer que o computador quântico resolva um problema com aplicação do mundo real mais rápido.

**Google Willow (2025)**: chip de 105 qubits supercondutores. Marcos simultâneos:
- Demonstrou supressão exponencial de erros abaixo do threshold com código de superfície — o primeiro hardware a cruzar essa linha
- Executou o algoritmo de correlador temporal fora de ordem 13.000× mais rápido que supercomputadores clássicos
- Completou benchmark que levaria 10^25 anos em computador clássico em ~5 minutos
- Taxa de erro por porta ~0,1% — patamar necessário para QEC efetiva

**IBM roadmap**:
- 2024: adoção de qLDPC como arquitetura de correção de erros
- 2025: Kookaburra — 1.386 qubits, multi-chip, 4.158 qubits totais
- 2026: vantagem quântica em aplicações práticas
- 2029: tolerância a falhas em escala

**Microsoft** anunciou qubits topológicos (anyons de Majorana) em 2025 como abordagem alternativa com proteção intrínseca contra erros. Ainda em fase inicial, mas com potencial de menor overhead de QEC.

**Mercado**: receita global de computação quântica cruzou $1 bilhão em 2025, primeiro ano acima desse limiar. Projeções indicam $10–30 bilhões até 2030. Investimento em trapped ions e fotônica cresceu mais rápido que supercondutores em 2025.

**Contexto crítico**: nenhum dos milestones de 2025 representa ameaça imediata à criptografia ou resolve problemas industriais em escala. A vantagem verificável do Willow é em física quântica — problema que clássicos não conseguem verificar facilmente. A transição para vantagem em problemas de negócio (química, otimização, ML) ainda depende de QEC madura.

## Exemplos

- **Willow vs. supercomputador**: 5 minutos contra 10^25 anos em Random Circuit Sampling estendido
- **Algoritmo correlador temporal**: primeiro uso de Willow em problema com interpretação física verificável
- **IBM 4.158 qubits (2025)**: maior sistema quântico multi-chip operacional em comunicação por link quântico
- **Iceberg Quantum Pinnacle (fev. 2026)**: afirma reduzir qubits necessários para quebrar RSA-2048 de 1M para <100K via qLDPC

## Relacionado

- [[hardware-quantico-nisq-era-supercondutores-ions-fotonico]] — os chips por trás desses milestones
- [[correcao-erros-quanticos-codigos-superficie-caminho-computacao-tolerante-falhas]] — QEC como o gargalo que Willow começou a resolver
- [[algoritmos-quanticos-shor-grover-vqe-qaoa-classes-problemas]] — o que esses sistemas precisarão executar para ser úteis
- [[criptografia-quantica-qkd-vs-post-quantum-criptografia-padrao-nist]] — implicações de segurança da evolução do hardware

## Perguntas de Revisão

1. Por que a vantagem de 2025 do Willow é considerada mais significativa que a "supremacia" de 2019?
2. O que significa "below threshold" em QEC e por que Willow cruzar essa linha é um marco?
3. O que precisa acontecer entre os sistemas atuais e a quebra real de RSA-2048?
