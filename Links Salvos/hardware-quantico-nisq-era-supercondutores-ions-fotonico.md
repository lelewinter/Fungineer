---
tags: [computacao-quantica, hardware, qubits, supercondutores, ions-aprisionados, fotonico, nisq]
source: https://thequantuminsider.com/2026/02/23/understanding-the-quantum-computing-hardware-landscape/
date: 2026-03-28
---
# Hardware Quântico Existe em Quatro Modalidades Principais com Trade-offs Distintos de Escala e Fidelidade

## Resumo

O campo atual de hardware quântico opera na era NISQ (Noisy Intermediate-Scale Quantum): sistemas com dezenas a milhares de qubits, mas ainda com taxas de erro que limitam cálculos longos. As quatro modalidades principais — supercondutores, íons aprisionados, fotônica e átomos neutros — competem com trade-offs diferentes em velocidade, estabilidade, temperatura operacional e escalabilidade.

## Explicação

**Supercondutores** (IBM, Google, Rigetti, IQM): tecnologia mais industrializada hoje. Qubits são circuitos de Josephson que vivem a ~10–20 mK em refrigeradores de diluição. Portas rápidas (nanosegundos), mas coerência curta (~100 µs). Google Willow (105 qubits, 2024) foi o primeiro a demonstrar supressão exponencial de erros com aumento de código. IBM roadmap prevê 4.158 qubits (Kookaburra, 2025) via multi-chip com links de comunicação quântica.

**Íons aprisionados** (IonQ, Quantinuum): átomos carregados suspensos por campos eletromagnéticos. Coerência longa (segundos a minutos), fidelidade de porta altíssima (>99,9%). Desvantagem: portas lentas (microssegundos) e escalabilidade desafiadora. São a tecnologia favorita quando precisão supera velocidade.

**Fotônica** (PsiQuantum, Xanadu): qubits são fótons. Opera em temperatura ambiente, integra com infraestrutura óptica existente e é natural para redes quânticas. Desafio: perda de fótons e dificuldade de criar interações fóton-fóton. Esquemas de computação baseados em medição (MBQC) foram projetados para tolerar essa perda.

**Átomos neutros** (QuEra, Pasqal): átomos em redes ópticas manipulados por lasers. Combinam longa coerência de íons com potencial de escalabilidade maior. QuEra demonstrou sistemas com centenas de qubits programáveis.

A era NISQ termina quando sistemas alcançarem correção de erros em escala suficiente para computação tolerante a falhas. O consenso do setor aponta 2028–2030 como janela provável para os primeiros sistemas verdadeiramente fault-tolerant.

## Exemplos

- **Google Willow**: 105 qubits supercondutores, primeiro a demonstrar redução de erros abaixo do limiar com código de superfície distance-7
- **IBM Kookaburra (2025)**: 1.386 qubits, configuração multi-chip com links quânticos, total de 4.158 qubits
- **IonQ**: sistema de íons com fidelidade de porta >99,9%, alvo de redes quânticas
- **PsiQuantum**: aposta em fotônica integrada com silício para escalabilidade a milhões de qubits físicos

## Relacionado

- [[computacao-quantica-processa-informacao-usando-superposicao-emaranhamento-interferencia]] — fundamentos físicos que cada hardware implementa
- [[correcao-erros-quanticos-codigos-superficie-caminho-computacao-tolerante-falhas]] — por que hardware precisa de QEC para ser útil
- [[vantagem-quantica-google-willow-ibm-corrida-2025-2026]] — milestones recentes de hardware

## Perguntas de Revisão

1. Qual a principal vantagem dos íons aprisionados sobre supercondutores, e qual o trade-off?
2. Por que fotônica é atrativa para redes quânticas mas difícil para computação local?
3. O que define a era NISQ e quais condições marcam sua superação?
