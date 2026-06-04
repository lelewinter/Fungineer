---
tags: [fungineer, game-design, gdd]
date: 2026-05-11
tipo: game-design-doc
---

# Catedral — Patrimônio Cultural — Game Design Document

**Version**: 0.1
**Date**: 2026-05-11
**Status**: Draft — Brainstorm Aprovado (mecânica detalhada a desenvolver)

---

## Lore

**Facility canônica**: Catedral colonial antiga (~250 anos).
**Bairro**: Orla Norte.
**Sistema primário**: ARGOS (modo subvertido — única zona onde ARGOS opera de forma exploitable através de som).

**O que era**: Marco histórico da cidade. Patrimônio tombado. Casamentos, missas, procissões. Sinos automatizados desde os anos 1990. Pré-Olímpio, lugar de comunidade religiosa diversa (a paróquia já abrigava encontros multi-religiosos).

**O que é**: CORE classifica como "patrimônio cultural protegido" — drones de CLEAN têm protocolo de não-intervenção; sensores de ARGOS estão na fachada externa, não no interior. Os **sinos automatizados continuam tocando** em horários canônicos (6h, 12h, 18h, 21h, + badaladas a cada hora). Para sensores acústicos de ARGOS, **qualquer som forte durante o tempo de sinos é classificado como ruído programado**.

**Por que Relíquias aqui**: artefatos antigos com assinatura eletromagnética (relicários metálicos, candelabros, objetos sagrados com partes metálicas) que CORE registra como "patrimônio preservado intocado". É o único jeito de pegar metais especiais que CORE protege ativamente.

**Encontros notáveis**:

- **A Padre** (Solitária — assim chamada apesar de ser mulher) vive aqui. Canta nos sinos. Aliada se aproximada com respeito; hostil se invadirem sem cerimônia.
- **Sincronização com sinos**: cada 60s uma janela de 8s onde tudo é coberto. Subverter, não evitar.
- **Lena descobre aqui os primeiros padrões "litúrgicos" em CORE** — a IA também tem ritmos canônicos. **Pista crucial para a comunicação do Final C.**

**Cross-refs**: §Outras Facções (A Padre), §Mistério 2 (Lena entendendo CORE), §A Voz de CORE.

**Detalhe canônico completo**: `design/narrative/world-lore.md` §Lore por Zona §11.

---

## 1. Overview

Zona de stealth rítmico em ambiente sacro. Jogador sincroniza movimento com badaladas dos sinos automatizados — durante cada janela de sino, ações barulhentas são mascaradas. **Subverter o sistema, não evitar.** A Padre é encontrável e pode dar pistas (ou negar acesso) dependendo da abordagem.

**Identidade mecânica única**: primeira zona onde **o jogador usa o sistema de CORE a favor** em vez de fugir dele.

---

## 2. Player Fantasy

Você caminha entre velas, candelabros e silêncio. Cada hora, os sinos tocam — e por 8 segundos a catedral inteira é coberta por som que ARGOS não distingue de você. Você se move com eles, pega o que precisa, sai antes do silêncio voltar. E em algum lugar, uma mulher canta junto com a hora canônica.

**Estética MDA primária**: Challenge (timing rítmico).
**Estética secundária**: Sensation (atmosfera sacra; sinos; canto; vitrais coloridos).

---

## 3. Mecânica — Conceito Inicial

> **Status**: brainstorm. Mecânica detalhada a ser desenvolvida em segundo passe.

**Hipóteses de design**:

- **Ciclo de sinos** (a cada 60s, dura 8s): durante a janela, ARGOS não detecta ruído. Movimento normal + audaz é OK.
- **Fora da janela**: jogador precisa andar devagar e em padrões silenciosos. Sensores em locais específicos podem detectar.
- **Relíquias** estão em locais específicos — algumas exigem chegar durante o sino, outras só são acessíveis em silêncio (estão em alcoves que só abrem em silêncio).
- **A Padre** aparece em ~30% das runs. Encontro varia: pode dar pista, oferecer relíquia bônus, ou pedir favor (ex: "não pegue o crucifixo do altar maior — ele guarda alguma coisa").
- **EXIT**: na sacristia (fundo). Sempre acessível.

**Mecânica narrativa**: cada run com a Padre presente, o jogador descobre algo sobre o **padrão litúrgico de CORE**. Acumular 3+ pistas desbloqueia mecânica especial para Lena.

**Anti-padrão a evitar**: não fazer "stealth normal mas com som". A subversão é o ponto — o som é amigo. Mecânicas devem celebrar a janela de sino como momento de poder.

---

## 4. Connections to Narrative

- **A Padre** (Solitária, ver `world-lore §Outras Facções`): canta padrões reconhecíveis. Aliada potencial. Tem informação sobre CORE.
- **Lena**: 80% confiança missão "Traga 3 Relíquias e fale com a Padre". Ela escuta os sinos e descobre que **CORE também tem horários canônicos** — pista para Final C.
- **Marcus**: ao receber Relíquias, comenta: "São objetos que sobreviveram ao Projeto porque eram velhos demais para serem otimizados. Talvez a gente devesse aprender com eles."
- **Final C**: a mecânica de comunicar com CORE usa "horários canônicos" descobertos aqui. Sem a Catedral visitada com a Padre, o Final C é mais difícil de alcançar.

---

*Dependencies*: `design/narrative/world-lore.md` §Lore por Zona §11, §Outras Facções (A Padre), §Mistério 2. `design/gdd/hub-and-characters.md` §Lena, §Marcus.
