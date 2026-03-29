---
tags: [computacao-quantica, algoritmos, shor, grover, vqe, qaoa, otimizacao, criptografia]
source: https://codnestx.com/quantum-algorithms-in-2025-shors-grovers-and-the-future-of-computing/
date: 2026-03-28
---
# Algoritmos Quânticos Existem em Duas Famílias: Exatos com Vantagem Exponencial e Híbridos para NISQ

## Resumo

Algoritmos quânticos não são universalmente mais rápidos que clássicos — eles são exponencialmente melhores em classes específicas de problemas. A primeira família (Shor, Grover) oferece ganhos teóricos provados. A segunda família (VQE, QAOA) é híbrida quântico-clássica, projetada para hardware NISQ atual e resolve problemas de otimização e química.

## Explicação

**Algoritmo de Shor** (fatoração): resolve fatoração de inteiros em tempo polinomial O(log³ N) contra O(exp(N^(1/3))) do melhor clássico. A implicação prática é a quebra de RSA, ECC e toda criptografia de chave pública baseada em problemas matemáticos difíceis. Requer ~4.000 qubits lógicos para quebrar RSA-2048 — hoje ainda inatingível, mas o alvo do roadmap de 2030.

**Algoritmo de Grover** (busca): encontra item em banco não estruturado com N itens em O(√N) contra O(N) clássico. Vantagem quadrática, não exponencial — menor impacto que Shor, mas universal. Aplicações: busca em banco de dados, quebra de chaves simétricas por força bruta (reduz segurança do AES-256 para nível equivalente ao AES-128).

**VQE (Variational Quantum Eigensolver)**: estima energia do estado fundamental de moléculas. Arquitetura híbrida: o circuito quântico prepara o estado da molécula, o otimizador clássico ajusta os parâmetros. Aplicações imediatas: descoberta de fármacos, design de catalisadores, materiais de bateria. Vantagem sobre clássicos já é demonstrável para moléculas com >50 elétrons correlacionados.

**QAOA (Quantum Approximate Optimization Algorithm)**: aborda problemas combinatórios NP-difíceis (Max-Cut, TSP, alocação de portfólio). Híbrido como VQE: profundidade do circuito p determina qualidade da aproximação. Resiliente a ruído — por isso é o algoritmo de otimização favorito para era NISQ.

**Trotterization / Simulação Hamiltoniana**: simula evolução temporal de sistemas quânticos. Base para simulação molecular e de materiais. Diretamente aplicável a problemas de física da matéria condensada e química de alta precisão.

## Exemplos

- Shor aplicado a RSA-2048: quebraria a criptografia que protege HTTPS, bancos e governos
- Grover em AES-256: efetivamente reduz segurança para 128 bits — razão pela qual NIST recomenda AES-256 como seguro pós-quântico
- VQE para cafeína e aspirina: energias calculadas com precisão quântica para entender reatividade
- QAOA para logística: UPS e DHL testam otimização de rotas em hardware quântico

## Relacionado

- [[computacao-quantica-processa-informacao-usando-superposicao-emaranhamento-interferencia]] — superposição e interferência são o mecanismo por trás de todos esses algoritmos
- [[criptografia-quantica-qkd-vs-post-quantum-criptografia-padrao-nist]] — Shor como ameaça concreta a sistemas existentes
- [[simulacao-quantica-molecular-quimica-farmacos-materiais]] — VQE em aplicações práticas
- [[quantum-machine-learning-circuitos-variaclionais-aplicacoes-hibridas]] — QAOA como ancestral dos circuitos variacionais de QML

## Perguntas de Revisão

1. Por que Shor é mais ameaçador à criptografia atual do que Grover?
2. O que torna VQE e QAOA adequados para hardware NISQ quando Shor não é?
3. Qual a relação entre profundidade do circuito QAOA (parâmetro p) e qualidade da solução?
