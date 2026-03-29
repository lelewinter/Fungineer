---
tags: [computacao-quantica, criptografia, qkd, post-quantum, nist, seguranca, rsa, aes]
source: https://www.nist.gov/pqc
date: 2026-03-28
---
# Ameaça Quântica à Criptografia Exige Duas Respostas Distintas: QKD para Troca de Chaves e PQC para Algoritmos

## Resumo

Computadores quânticos com suficientes qubits lógicos quebrarão RSA, ECC e praticamente toda criptografia de chave pública atual via algoritmo de Shor. A resposta é dupla: Post-Quantum Cryptography (PQC) substitui algoritmos matemáticos por problemas resistentes a ataques quânticos, e Quantum Key Distribution (QKD) usa a física quântica para distribuição de chaves incondicionalmente seguras.

## Explicação

**O que está em risco**: toda criptografia baseada em fatoração (RSA) ou logaritmo discreto (ECC, Diffie-Hellman) é vulnerável ao algoritmo de Shor. Isso inclui HTTPS, VPNs, assinaturas digitais, protocolos bancários, comunicação governamental. AES-256 é parcialmente vulnerável ao Grover (reduz efetiva segurança para ~128 bits) mas ainda considerado seguro.

**Post-Quantum Cryptography (PQC)**: algoritmos clássicos (rodam em hardware convencional) baseados em problemas que permanecem difíceis mesmo para computadores quânticos. NIST finalizou 3 padrões em agosto de 2024:
- **FIPS 203 (ML-KEM)**: encapsulamento de chave, baseado em lattices (Module-LWE)
- **FIPS 204 (ML-DSA)**: assinaturas digitais, baseado em lattices (Module-LWE/SIS)
- **FIPS 205 (SLH-DSA)**: assinaturas baseadas em hash, sem dependência de lattices
- **HQC** (março 2025): mecanismo adicional de encapsulamento, baseado em códigos corretores de erro

**Quantum Key Distribution (QKD)**: usa propriedades da mecânica quântica (no-cloning theorem, colapso por medição) para garantir que qualquer espionagem na troca de chaves seja detectável fisicamente. Não é vulnerável a Shor. Limitação: requer infraestrutura física dedicada (fibra óptica quântica ou links de satélite) e ainda tem limitações de distância (~100–300 km sem repetidores quânticos).

**"Harvest Now, Decrypt Later"**: adversários já coletam dados criptografados hoje para decriptar quando computadores quânticos estiverem disponíveis. Dados com vida útil longa (segredos de Estado, dados médicos de longo prazo, IP industrial) estão em risco agora. Razão pela qual migração para PQC é urgente antes de ter computadores quânticos práticos.

**Status da migração**: EUA exigem que novos National Security Systems sejam quantum-safe até janeiro de 2027. Canadá: planos de migração federais até abril de 2026, sistemas críticos até 2031, migração completa até 2035.

## Exemplos

- **HTTPS pós-quântico**: Cloudflare e Google já testam ML-KEM em TLS 1.3 em produção
- **NIST FIPS 203**: substituição do RSA/ECDH em toda infraestrutura PKI
- **QKD em satélite**: Micius (China) demonstrou QKD via satélite entre Pequim e Viena (7.600 km, 2017)
- **Redes bancárias**: pilotos de QKD em infraestrutura financeira em Frankfurt, Tóquio e Nova York

## Relacionado

- [[algoritmos-quanticos-shor-grover-vqe-qaoa-classes-problemas]] — Shor e Grover como as ameaças algorítmicas concretas
- [[vantagem-quantica-google-willow-ibm-corrida-2025-2026]] — timeline para quando a ameaça se torna real
- [[computacao-quantica-processa-informacao-usando-superposicao-emaranhamento-interferencia]] — princípios físicos que fundamentam QKD

## Perguntas de Revisão

1. Por que PQC e QKD são complementares em vez de substitutas uma da outra?
2. O que é "harvest now, decrypt later" e por que torna a migração para PQC urgente antes de existir computador quântico prático?
3. Qual propriedade da mecânica quântica torna QKD incondicionalmente segura contra espionagem?
