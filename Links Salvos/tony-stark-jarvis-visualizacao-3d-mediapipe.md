---
date: 2025-07-21
tags: [3D visualization, Three.js, MediaPipe, web speech API, computer vision, hand tracking, real-time]
source: https://x.com/measure_plan/status/1947353805391077482
autor: "AA (measure_plan)"
tipo: zettelkasten
---

# Tony Stark & Jarvis — Visualização 3D Interativa com MediaPipe e Three.js

## Resumo

Um projeto de visualização de dados 3D que replica o conceito de Tony Stark e Jarvis fazendo análise de dados: captura movimento de mãos com MediaPipe (computer vision), renderiza grafo 3D com Three.js, e processa comandos de voz via Web Speech API — como uma interface futurista e imersiva para exploração de dados em tempo real.

## Explicação

**Componentes Principais:**

**1. Three.js para Renderização 3D**
- Renderiza grafos de dados em 3D
- Nodes (nós) como esferas coloridas representando entidades
- Conexões como linhas entre nós
- Interatividade: arrastar nós, rotacionar câmera

**2. MediaPipe para Hand Tracking**
- Biblioteca de computer vision do Google
- Detecta 21 pontos-chave em cada mão (dedos, pulso)
- Rastreia em tempo real via webcam
- Extrai coordenadas X,Y das mãos

**3. Web Speech API para Comandos de Voz**
- Reconhecimento de fala em tempo real
- Converte comandos falados em ações (ex: "zoom in", "mostrar conectados")
- Síntese de voz opcional (Jarvis respondendo)

**4. Grafo 3D Interativo**
- Força-grafo (force-graph) com Vasco Asturiano's 3D-force-graph
- Nós podem ser arrastados
- Mostra relacionamentos (edges) entre nós
- Cores e tamanhos significam propriedades

**Como Funciona:**

1. Webcam captura movimento das mãos
2. MediaPipe detecta posição das mãos em tempo real
3. Coordenadas (X,Y) controlam rotação/zoom da câmera 3D
4. User fala comando ("mostrar rede social")
5. Web Speech API recogniza e executa ação
6. Three.js renderiza mudanças no grafo 3D
7. Resultado: Interface de Tony Stark/Jarvis

## Exemplos

**Exemplo 1: Explorar Rede Social**
```
1. Câmera renderiza grafo de usuários e conexões em 3D
2. User levanta mão direita para "pinçar" e faz gesto de zoom
3. MediaPipe detecta distância entre dedos
4. Câmera faz zoom in/out no grafo
5. User diz "mostrar influenciadores"
6. Sistema destaca nós com mais conexões
```

**Exemplo 2: Análise de Cluster de Dados**
```
1. Grafo mostra milhares de pontos (papers, citações, autores)
2. User move mão esquerda para rotacionar visualização
3. MediaPipe rastreia movimento em tempo real
4. Câmera 3D acompanha movimento de mão
5. User diz "destacar cluster C1"
6. Sistema destaca visualmente aquele cluster
7. User arrasta cluster com mão para repositioná-lo
```

**Exemplo 3: Processamento de Pesquisa**
```
1. Visualiza rede de papers científicos
2. User gesticula zoom in para artigo específico
3. MediaPipe detecta distância de pinçamento
4. Three.js renderiza visualização detalhada
5. User diz "explicar conexões"
6. Sistema mostra caminho de citações mais importantes
```

## Componentes Técnicos

**Stack:**
- Frontend: Three.js (3D), MediaPipe (vision), Web Speech API (voice)
- Networking: Grafo com ~1000-100K nós renderizável em tempo real
- Performance: WebGL para aceleração GPU

**Uso Cases:**
- Visualização de redes sociais (influência, clusters)
- Exploração de conhecimento científico (papers, citações)
- Análise de dados corporativos (organogramas, relacionamentos)
- Gameplay baseado em gesto (games com hand tracking)

## Relacionado

[[Micro-Handpose WebGPU Hand Tracking Browser]]
[[MediaPipe Face Recognition Local Edge]]

## Perguntas de Revisão

1. Como MediaPipe permite hand tracking sem treinar modelo custom?
2. Qual é o trade-off entre número de nós no grafo e performance em tempo real?
3. Como você combinaria gesto de mão + voz para criar UI intuitiva para análise de dados?

## Links do Projeto
- GitHub: Disponível na thread original
- Live Demo: Linkado no tweet original
- Tutorial: Tutorial completo com explicações de MediaPipe e webcam hand tracking
