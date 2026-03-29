---
date: 2026-03-23
tags: [3d, open-source, editor, arquitetura, web, react, webgpu]
source: https://x.com/EHuanglu/status/2035783372463652970?s=20
autor: "@EHuanglu"
---

# Editor 3D Open Source para Cenas Arquitetônicas

## Resumo

Editor 3D open source completo chamado Pascal Editor (FileCity) que roda inteiramente no navegador, 100% gratuito. Permite criar cenas arquitetônicas intuitivamente usando React Three Fiber e WebGPU, com armazenamento local em IndexedDB. É como ter Blender profissional, mas rodando no navegador, gratuito, sem downloads, sem configurações — basicamente "democracia em 3D".

## Explicação

O editor é construído em React Three Fiber para framework, WebGPU para renderização 3D, IndexedDB para armazenamento de dados locais, e arquitetura completamente baseada em navegador. Funcionalidades incluem hierarquia de nós para estrutura organizacional de objetos 3D, ferramentas de desenho em tempo real para criar e modificar geometria ao vivo, grids espaciais para alinhamento e posicionamento preciso, histórico completo de undo/redo de modificações, mapa visual para visualização hierárquica do projeto, e armazenamento local com dados salvos em IndexedDB no navegador.

**Analogia:** Blender ou 3DS Max são como ter carro de corrida em garagem — poderosos, profissionais, mas pesados, caros, precisam de gasolina especial (computador potente). Pascal Editor é como ter bicicleta elétrica — menos poderosa, mas acessível, rápida de pegar, não precisa estacionar em garagem especial. Para arquitetura básica? Bicicleta elétrica é suficiente e infinitamente mais prática.

Casos de uso abrangem criação de cenas arquitetônicas, planejamento de espaços 3D, prototipagem de ambientes, visualização de designs arquitetônicos, projetos de interiores e planejamento urbano em escala pequena. O acesso é completamente open source, com zero peso de download (roda no navegador), 100% gratuito, compatível com qualquer navegador moderno com WebGPU.

**Profundidade:** Por que isso é revolucionário? Porque a barreira de entrada para 3D caía em custo ($3k pra Blender Pro) e complexidade (instalação, drivers, upgrade de PC). Pascal Editor elimina ambas. Agora cualquer pessoa com navegador consegue criar 3D. Isso democratiza arquitetura digital. Não é melhor que Blender, é diferente — mais acessível, mais rápido de começar, perfeito para 90% dos casos.

Vantagens incluem: sem instalação (roda direto no navegador), sem custos (completamente gratuito), open source (código disponível para modificações), local-first (dados armazenados localmente, sem servidor necessário), moderno (usa WebGPU de última geração), acessível (não requer configuração complexa). O projeto quebra a barreira de custo e instalação dos editores tradicionais como Blender ou 3DS Max.

## Exemplos

O editor inclui ferramenta de tour com walkthrough narrado do Pascal Editor. Pode ser acessado diretamente no navegador sem qualquer instalação ou download necessário. Dados de projetos são persistidos em IndexedDB para manutenção entre sessões.

## Relacionado

- [[openart-worlds-cena-3d-navegavel-5-minutos]]
- [[Micro-Handpose WebGPU Hand Tracking Browser]]
- [[mcp-unity-integracao-ia-editor-nativo]]

## Perguntas de Revisão

1. Como editor 3D no browser sem download muda barreiras de entrada?
2. Por que WebGPU permite funcionalidade complexa sem instalação pesada?
3. Qual é o impacto de "ferramenta profissional → 100% gratuita" em democratização?
