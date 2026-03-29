---
date: 2025-09-15
tags: [GitHub, computer vision, tutoriais, MediaPipe, OpenCV, hand tracking, object detection, 3D]
source: https://github.com/collidingScopes/fun-with-cv-tutorials
autor: "collidingScopes"
tipo: zettelkasten
---

# Fun with CV Tutorials — Repositório Completo de Computer Vision

## Resumo

Repositório comprehensive com 40+ tutoriais práticos de Computer Vision, desde hand tracking (rastreamento de mão) até guitar hero detection e arpeggiator, usando MediaPipe, OpenCV, e Three.js. É uma coleção viva de experimentos de visão computacional com demos ao vivo, explicações detalhadas, e código aberto para aprender e reutilizar.

## Explicação

**Estrutura do Repositório:**

O repositório contém 40+ diretórios, cada um sendo um tutorial completo com:
- Código-fonte bem documentado
- Live demo link (quando aplicável)
- README explicando o conceito
- Assets (modelos, texturas, etc.)

**Categorias Principais de Tutoriais:**

**1. 3D Graphics & Visualization**
- 3d-editor: Editor 3D completo
- 3d-graph: Visualização de grafos em 3D
- 3d-model-playground: Exploração de modelos 3D
- planet-explorer: Visualização de planetas

**2. Hand & Gesture Recognition**
- hand-tracking-101: Tutorial de rastreamento de mão
- handcrafted-shader: Shaders customizados para mão
- guitar-hero: Reconhecimento de acordes de guitarra

**3. Face & Facial Features**
- face detection (implícito em vários projetos)
- chimup: Detecção de queixo/postura
- cat-cam: Detecção de gatos via câmera

**4. Object Detection & Tracking**
- blob-tracking: Rastreamento de blobs coloridos
- laser-kitten: Detecção de laser e interação
- seefood: Classificação de comida via câmera

**5. Audio & Music**
- piano: Game de piano interativo
- arpeggiator: Arpeggiador controlado por gesto

**6. Special Effects & Tools**
- oia: Compressão de GIF com IA
- chainup: Detecção de corrente/postura
- depth: Captura de profundidade via câmera

**7. Desktop & UI**
- launcher: Electron launcher para tutoriais
- marbles: Simulação de aquário com mármores

**Tecnologias Usadas:**

- Frontend: JavaScript, Three.js, HTML5 Canvas
- Vision: MediaPipe, OpenCV.js
- Backend: Node.js (alguns projetos)
- Build: Webpack (alguns projetos)
- Languages: 65.9% JavaScript, 20.2% HTML, 5.7% CSS, 1.3% Python

**Estatísticas:**
- 124 Stars
- 13 Watching
- 75 Forks
- 11 Contributors
- 6 Active Deployments (Netlify)

**Como Usar Cada Tutorial:**

1. Clone o repositório
2. Navegue para o diretório do tutorial
3. Abra o live demo link (se disponível)
4. Estude o código-fonte
5. Experimente modificar e extensões

## Exemplos

**Hand Tracking 101:**
- Detecta 21 pontos-chave em cada mão via MediaPipe
- Renderiza esqueleto da mão em tempo real
- Permite interação com elementos 3D

**Guitar Hero:**
- Reconhece posição dos dedos na guitarra
- Classifica acordes em tempo real
- Feedback visual e sonoro

**3D Graph:**
- Carrega dados de grafo (JSON)
- Renderiza força-grafo em 3D com Three.js
- Permite arrastar nós e explorar relacionamentos

**Piano Game:**
- Interpreta hand landmarks como posições de teclas
- Reconhece quando mão atinge "tecla"
- Produz som correspondente

## Relacionado

[[Micro-Handpose WebGPU Hand Tracking Browser]]
[[MediaPipe Face Recognition Local Edge]]
[[tony-stark-jarvis-visualizacao-3d-mediapipe]]

## Perguntas de Revisão

1. Qual é a arquitetura comum entre todos os tutoriais de hand tracking?
2. Como Three.js e MediaPipe trabalham juntos nestes projetos?
3. Qual tutorial seria mais fácil de estender ou remixar para seu próprio caso de uso?

## Links Úteis
- GitHub: https://github.com/collidingScopes/fun-with-cv-tutorials
- Website: www.funwithcomputervision.com
- Live Demos: Disponíveis em cada pasta do repositório
