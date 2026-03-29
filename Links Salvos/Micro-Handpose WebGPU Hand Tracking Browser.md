---
date: 2026-03-24
tags: [computer-vision, webgpu, hand-tracking, browser, performance, lightweight]
source: https://x.com/nsthorat/status/2036287147179651477?s=20
autor: "@nsthorat"
---

# Micro-Handpose: Hand Tracking em Browser com WebGPU

## Resumo

Reimplementação extremamente otimizada de hand tracking que roda inteiramente no browser usando WebGPU compute shaders. É 4x menor que MediaPipe (74KB JS + 7.7MB weights vs 34MB) e 2x mais rápido em desktop (2.2ms latência), 35% mais rápido em mobile. É como pegar código que funciona bem e perguntar "mas qual é o mínimo que realmente preciso?" — resposta: "praticamente nada se otimizar certo".

## Explicação

Micro-handpose utiliza 15 shaders WGSL (WebGPU Shading Language) para execução pura na GPU com zero CPU overhead. Arquitetura funciona em duas etapas em paralelo na GPU: palm detection (detecta palma da mão) e landmark inference (infere 21 keypoints da mão).

**Analogia:** MediaPipe é como carro com motor bom, mas tem 500kg de equipamento que não precisa — som system de 100W, assentos em couro, everything. Micro-handpose é carro sem nada disso — motor é o mesmo, ele roda 2x mais rápido porque não carrega peso desnecessário. Para hand tracking? Você não precisa do som system.

Tamanho do pacote é apenas 74KB JS (17KB gzip) mais 7.7MB weights, comparado aos 34MB do MediaPipe, tornando-o ~4x menor. Performance em M4 Pro Chrome: micro-handpose 2.2ms (454 FPS) versus MediaPipe GPU 4.0ms (250 FPS), com micro-handpose 82% mais rápido. Performance em iPhone Safari: micro-handpose 72ms (13.9 FPS) versus MediaPipe 97ms (10.3 FPS), com micro-handpose 35% mais rápido.

**Profundidade:** Por que reescrever do zero conseguiu 4x redução e 2x speedup? Porque abstração tem custo. MediaPipe foi escrito para ser flexível (múltiplos tasks), genérico (múltiplos hardwares), compatível (múltiplos browsers). Micro-handpose diz "forget flexibility, só quero hand tracking no browser". Resultado: no especial caso, é 4x mais eficiente. Isso é tradeoff fundamental em software.

Características incluem zero dependências externas, funciona em qualquer browser moderno com WebGPU, simples de integrar. Detecta todos os 21 pontos de referência da mão acessíveis por nome.

Comparação técnica: MediaPipe é bem estabelecido e estável mas pesado (34MB) e mais lento (WASM + WebGL/WebGPU). Micro-handpose é leve, rápido e puro WebGPU mas mais novo com menos histórico de ecosystem.

Ideal para web apps com hand tracking, AR experiences em browser, real-time gesture recognition, limited bandwidth scenarios. Requer browser com WebGPU support. Em mobile, MediaPipe fica abaixo de 30 FPS (choppy), enquanto micro-handpose mantém performance.

Demonstra que WebGPU está pronto para production, otimização importa (reescrever crítico resultou em 2x ganho), browser capabilities crescem (o que era impossível agora é rápido), open source inovação oferece alternatives viáveis aos proprietary solutions.

## Exemplos

API clara de uso:

```javascript
npm install @svenflow/micro-handpose

const handpose = await createHandpose()
const hands = await handpose.detect(video)
console.log(hands[0].keypoints.thumb_tip)
```

Casos de uso emergentes: video calls com gesture recognition, VR interactions em browser, sign language detection, game controls via hand, accessibility features. Com essa performance, 2.2ms de latência em desktop abre possibilidades que antes eram impossíveis no browser.

## Relacionado

- [[MediaPipe Face Recognition Local Edge]]
- [[Editor 3D Open Source para Construcao Arquitetonica]]
- [[Pretext - Layout de Texto Sem CSS]]

## Perguntas de Revisão

1. Por que reescrever em WebGPU puro conseguiu 2x speedup comparado a MediaPipe?
2. Como tamanho 4x menor + 2x mais rápido muda viabilidade de AR em browser?
3. Qual é a tendência de problema (otimização) que Micro-handpose exemplifica?
