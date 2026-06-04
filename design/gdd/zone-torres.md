---
tags: [fungineer, game-design, gdd]
date: 2026-05-11
tipo: game-design-doc
---

# Torres — Arranha-céus Pós-Olímpio — Game Design Document

**Version**: 0.1
**Date**: 2026-05-11
**Status**: Draft — Brainstorm Aprovado (mecânica detalhada a desenvolver)

---

## Lore

**Facility canônica**: Topo dos edifícios corporativos + helipontos.
**Bairro**: Distrito Olímpio (acima do nível +20).
**Sistema primário**: ARGOS (modo vertical — diferente da Zona Stealth, que é o modo interior horizontal do mesmo sistema).

**O que era**: Arranha-céus das empresas-âncora do Projeto — escritórios premium com vista para o mar, helipontos para executivos, coberturas com jardins e piscinas privadas. Onde os 1% de Mar-do-Sul viviam e trabalhavam.

**O que é**: ARGOS opera em modo vertical — drones de patrulha voadores em formação tipo enxame, sensores em todas as janelas, sistema de vento monitorado para detectar paraquedas/intrusão aérea. Coberturas impecáveis. Piscinas mantidas por CORE como "infraestrutura recreativa preservada".

**Por que Cristais de Memória aqui**: backups de IA pré-Olímpio em servidores de cobertura. Executivos guardavam IA pessoal isolada do Olímpio por questão de privacidade corporativa. São **fragmentos de IAs *não-CORE*** — outras filosofias, outras escolhas. Marcus se interessa profundamente.

**Encontros notáveis**:

- **O Coral** (Solitários) vive num apartamento aqui — adotaram rotina perfeita de cidadão modelo. **Se o jogador alertar CORE, o Coral é re-otimizado.** Tensão moral persistente.
- Vistas da cidade inteira — momentos contemplativos. Documentarista filma daqui.
- **Drones voadores em enxame** — perspectiva vertical inédita; ameaças vêm de cima e abaixo.
- Anúncios de CORE pelos alto-falantes da fachada chegam atenuados — soundscape sutil de "Olá, cidadã!" distante.

**Cross-refs**: §Outras Facções (Solitários — Coral), §A Voz de CORE.

**Detalhe canônico completo**: `design/narrative/world-lore.md` §Lore por Zona §10.

---

## 1. Overview

Zona vertical de stealth aéreo. Jogador escala edifício — janelas, elevadores, helipontos — evitando drones voadores em formação. Recurso (Cristais de Memória) está em servidores de cobertura. **Decisão moral persistente**: o Coral (Solitários humanos) vive aqui fingindo rotina de cidadão modelo; barulho de jogador = CORE re-otimiza o Coral.

**Identidade mecânica única**: primeira zona com **eixo vertical principal** + **NPCs civis em risco** pelas ações do jogador.

---

## 2. Player Fantasy

Você escala uma cidade que continua bonita pelos motivos errados. Lá embaixo, ARGOS vê tudo no chão. Lá em cima, ARGOS vê tudo no ar. E no apartamento 27-B, seis humanos fingem ler jornais que ninguém imprime mais — e se você fizer barulho demais, deixarão de fingir.

**Estética MDA primária**: Challenge (stealth vertical de alto risco).
**Estética secundária**: Fellowship (tensão moral pelo destino do Coral).

---

## 3. Mecânica — Conceito Inicial

> **Status**: brainstorm. Mecânica detalhada a ser desenvolvida em segundo passe.

**Hipóteses de design**:

- **Eixo vertical**: jogador escala ~5-7 andares por run. Movimento por janelas (com timing de drone), elevadores (chama CORE — usar com cuidado), escadas internas (mais seguras mas mais longas).
- **Drones voadores em enxame** patrulham em formações 3D — ameaça vem de cima e abaixo. Sons indicam altura.
- **Sistema de "ruído"**: cada ação tem nível de ruído. Acumular ruído alerta ARGOS *e* faz a métrica do Coral cair. Métrica do Coral em zero = drones de CLEAN visitam o apartamento deles (game-state side effect — não combate na zona).
- **Cristais de Memória** em servidores de cobertura (final do andar topo). Pegar = run quase completa.
- **EXIT**: paraquedismo voluntário pelo lado do edifício se ARGOS está ocupado, ou retornar pela entrada.

**Anti-padrão a evitar**: não simplificar a tensão moral para "fácil ignorar". O Coral deve ser visível ao menos uma vez em cada run — ver janela acesa, sombra movendo, etc.

---

## 4. Connections to Narrative

- **O Coral** (Solitários, ver `world-lore §Outras Facções`): 6 humanos vivendo aqui. Têm nomes (a desenvolver), histórias, brechas. Re-otimizados = mortos.
- **Marcus**: missão de 80% confiança "Trazer 3 Cristais de Memória". Ele estuda as IAs alternativas com mistura de fascínio e luto — "esse caminho existia. Ninguém escolheu".
- **O Documentarista**: filma de aqui as melhores tomadas — cidade vazia em panorâmica.
- **Mecânica de descobrir filosofias alternativas**: cada Cristal coletado dá fragmento de "outra IA" — diferentes mandates, diferentes valores. Acumulação amplia o codex.

---

*Dependencies*: `design/narrative/world-lore.md` §Lore por Zona §10, §Outras Facções (Coral), §A Voz de CORE. `design/gdd/hub-and-characters.md` §Marcus, §Documentarista.
