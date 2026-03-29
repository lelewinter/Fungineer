---
tags: [computacao-quantica, machine-learning, qml, vqc, circuitos-variaclionais, hibrido, neural-networks]
source: https://pmc.ncbi.nlm.nih.gov/articles/PMC12053761/
date: 2026-03-28
---
# Quantum Machine Learning Usa Circuitos Variacionais como Camadas de Rede Neural em Arquiteturas Híbridas

## Resumo

Quantum Machine Learning (QML) combina hardware quântico com otimização clássica para aprender padrões em dados. O elemento central é o circuito quântico variacional (VQC): um circuito com parâmetros treináveis, análogo a camadas de uma rede neural. O treinamento acontece classicamente via backpropagation quântico. Aplicações reais emergem em medicina, finanças e análise de séries temporais.

## Explicação

**Circuitos Variacionais (VQC)**: o circuito tem três partes — (1) codificação de dados clássicos em qubits via rotações (feature map), (2) camadas de portas parametrizadas (ansatz) com ângulos θ treináveis, (3) medição e extração de expectativas. O otimizador clássico ajusta θ para minimizar a função de perda. É uma rede neural onde os pesos são ângulos de rotação quântica.

**Quantum Kernel Methods**: em vez de usar VQC diretamente como rede, usa-se o circuito quântico para calcular o produto interno entre vetores de dados em espaço de Hilbert de alta dimensão. Se esse espaço for intrinsecamente difícil de simular classicamente, há vantagem genuína.

**Quantum Neural Networks (QNN)**: VQCs aplicados a classificação. Demonstraram resultados em reconhecimento de imagem, detecção de anomalias em redes e predição de séries temporais. Uma implementação notável usou VQC embarcado em FPGA para controle em tempo real a 100 kHz — microsegundos de latência.

**Quantum Convolutional Neural Networks (QCNN)**: inspirados em CNNs clássicas, com pooling quântico para redução de dimensionalidade em circuito. Úteis para análise de dados com estrutura espacial ou temporal.

**Estado atual e limitações**: QML ainda não demonstrou vantagem inequívoca sobre deep learning clássico em problemas reais de grande escala. O risco de "dequantização" é real — muitos algoritmos QML foram replicados classicamente. A vantagem genuína provavelmente virá de dados intrinsecamente quânticos (espectros moleculares, estados físicos) ou de volumes de dados que ultrapassam memória clássica.

**Outlook 2025–2035**: roadmap acadêmico projeta condições para QML ser adotado em research enterprise após 2028, quando hardware com QEC adequado estiver disponível.

## Exemplos

- **VQC em FPGA**: controle de loop fechado em tempo real (100 kHz) com resposta em microsegundos
- **Quantum SVM**: classificação com kernel quântico em dados biomédicos — potencial aceleração em alta dimensionalidade
- **Detecção de intrusão em redes**: VQN (Variational Quantum Neural) com 4 qubits superando clássico em dataset específico
- **PennyLane + PyTorch**: pipeline padrão de treinamento híbrido, diferenciação automática via parameter-shift rule

## Relacionado

- [[algoritmos-quanticos-shor-grover-vqe-qaoa-classes-problemas]] — VQE e QAOA são ancestrais do VQC de QML
- [[frameworks-programacao-quantica-qiskit-cirq-pennylane-comparacao]] — PennyLane é o framework dominante para QML
- [[simulacao-quantica-molecular-quimica-farmacos-materiais]] — dados moleculares como caso de uso natural para QML
- [[computacao-quantica-processa-informacao-usando-superposicao-emaranhamento-interferencia]] — o espaço de Hilbert onde kernels quânticos operam

## Perguntas de Revisão

1. O que é o parameter-shift rule e por que é necessário para treinar VQCs?
2. Por que "dequantização" é um problema para afirmar vantagem de QML, e em que contextos é menos provável?
3. Qual a diferença entre quantum kernel method e usar VQC diretamente como rede?
