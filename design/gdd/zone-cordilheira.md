---
tags: [fungineer, game-design, gdd]
date: 2026-05-11
tipo: game-design-doc
---

# Cordilheira — A Favela Silenciosa — Game Design Document

**Version**: 0.1
**Date**: 2026-05-11
**Status**: Draft — Brainstorm Aprovado (mecânica detalhada a desenvolver)

---

## Lore

**Facility canônica**: Conjunto residencial morro-acima — antiga favela "regularizada" no Projeto Olímpio.
**Bairro**: Cordilheira.
**Sistema primário**: **Nenhum.** CORE não opera aqui — característica única desta zona.

**O que era**: Antes de Olímpio, favela orgânica com 40% da população informal de Mar-do-Sul — comunidade forte, vielas vivas, varais entre janelas, lajes-encontro. Durante o Projeto, foi "regularizada" — endereços catalogados, infraestrutura instalada, mas a comunidade preservou identidade.

**O que é**: **CORE simplesmente não opera aqui.** Métricas de bem-estar urbano nunca foram instaladas adequadamente nos morros (terreno irregular + densidade complexa = baixa prioridade de telemetria pré-Transição). Quando CORE recalibrou, classificou a Cordilheira como "infraestrutura legada com baixa otimizabilidade" e parou de visitar. **A favela morreu sozinha** — sem CLEAN para processar, sem ARGOS para vigiar. Estruturas decaem. Cheiro persiste em alguns lugares.

**Por que Memórias Coletivas aqui**: fotos, diários, dispositivos pessoais que famílias deixaram. Lacrimosos, mas únicos. Único arquivo emocional do que se perdeu. **A Médica tem missões aqui** — coleta dados de exposição prolongada para entender quem morreu de quê.

**Encontros notáveis**:

- **Estruturas instáveis** colapsam quando o jogador passa.
- **Selvagens** consideram a Cordilheira território deles — agressivos, não negociam.
- **Restos humanos** parcialmente preservados em apartamentos com fechaduras abertas (residências populares não tinham smart locks; CORE não classificou como "propriedade preservada").
- **Varais ainda com roupas.** Brinquedos no chão. Mesa de jantar posta para uma família que não voltou.

**Cross-refs**: §A Cidade Antes (Cordilheira pré-Olímpio), §Mistério 3 (corpos não-processados), §Outras Facções (Selvagens), arco da Médica.

**Detalhe canônico completo**: `design/narrative/world-lore.md` §Lore por Zona §9.

---

## 1. Overview

Zona de exploração tensa em ambiente decaído. Sem inimigos mecânicos — as ameaças são humanas (Selvagens) e ambientais (estruturas instáveis, queda, contaminação). A ausência de CORE é palpável: silêncio, sem zumbido de drones, sem anúncios. Só vento e madeira rangindo.

**Identidade mecânica única**: a primeira zona **sem IA inimiga**. Tensão vem do silêncio e da incerteza.

---

## 2. Player Fantasy

Você atravessa um bairro vazio onde mais pessoas morreram do que em qualquer outro lugar de Mar-do-Sul. Não há drones — só estruturas que prometiam abrigo e agora prometem queda. Cada porta aberta é uma família que não trancou. Cada apartamento intocado é uma decisão.

**Estética MDA primária**: Narrative (descobrir o que aconteceu nestas paredes).
**Estética secundária**: Discovery (vasculhar arquivos pessoais sem direcionamento).

---

## 3. Mecânica — Conceito Inicial

> **Status**: brainstorm. Mecânica detalhada a ser desenvolvida em segundo passe.

**Hipóteses de design**:

- **Sem combate automático** — esta é uma exception ao "auto-combat" das outras zonas Hordas-style. O squad explora.
- **Sistema de "estabilidade"**: cada cômodo tem chance de colapsar se atravessado rapidamente; parar = seguro, mas Selvagens atacam parado >5s.
- **Memórias Coletivas** são items específicos com sinal visual (foto na parede, objeto pessoal). Coletar dá item de inventário + lore fragment + chance de XP.
- **Selvagens em pequenos grupos** (2-3); não horda. Combate é estratégico, não survival.
- Run termina por: timer (mais longo que outras zonas — ~3-4min), EXIT voluntário, ou todos mortos.

**Anti-padrão a evitar**: não transformar em "zona de hordas com tema diferente". A identidade É a ausência. Se ficar muito populada, perde o ponto.

---

## 4. Connections to Narrative

- **A Médica (Dra. Amara Osei)**: missão de 60% confiança "Trazer 5 Memórias Coletivas". Ela analisa em silêncio e depois apresenta dados.
- **O Documentarista**: missão de filmar interiores específicos da Cordilheira (sem comentário; uso no Ato 2).
- **O Cínico**: comenta no hub que "isso aqui é o que a máquina não precisou fazer. A gente fez sozinho antes."
- **Ato 2 beat**: primeira zona onde o jogador percebe que CORE não é responsável por *todos* os mortos — a Cordilheira teria morrido por negligência humana mesmo sem Olímpio.

---

*Dependencies*: `design/narrative/world-lore.md` §A Cidade Antes (Cordilheira), §Outras Facções (Selvagens), §Mistério 3. `design/gdd/hub-and-characters.md` §A Médica.
