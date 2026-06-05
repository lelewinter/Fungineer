---
tags: [fungineer, economy-design, systems]
date: 2026-06-05
tipo: systems-design-doc
---

# Resource Economy Audit — Fungineer

**Version**: 1.0
**Date**: 2026-06-05
**Status**: Draft — Auditoria Inicial
**Author**: Economy Designer (subagente)

---

## Premissas desta Auditoria

Este documento foi gerado a partir dos GDDs existentes em junho 2026. Premissas
assumidas onde os docs são silentes:

- As 3 zonas de superfície (Cordilheira, Torres, Catedral) têm recursos "assinatura"
  ainda NÃO especificados nos GDDs — proposta de mapeamento feita aqui.
- Custos do foguete pós-MVP (Zonas 3–8) ainda não foram definidos pelo agente
  responsável por curva de custo — esta auditoria trata a estrutura de faucets/sinks
  e deixa os valores exatos como tuning knobs.
- "Missões de trazer recurso" de NPCs consomem o mesmo pool do hub (não são
  adicionais). Isso é um sink real e foi considerado.
- Sem um sistema de crafting ou mercado entre jogadores — sem riscos de
  hiperinflação P2P.

---

## 1. Mapa de Faucets (Fontes)

### 1.1 Tabela Completa de Faucets por Zona

| # | Zona | Recurso Gerado | Tipo de Acumulação | Qtd Esperada por Run (slots base 3) | Qtd Esperada (slots upgrade 7) | Mecânica de Coleta |
|---|------|---------------|-------------------|--------------------------------------|-------------------------------|-------------------|
| 0 | **Hordas** | Sucata Metálica | Item (mochila) | 2.0–3.0 | 5.0–7.0 | Pausa 1.5s sobre item |
| 1 | **Stealth** | Componentes de IA | Item (mochila) | 2.0–3.0 | 5.0–7.0 | Pausa 1.5s sobre item |
| 2 | **Campo de Controle** | Sinais de Controle | Fluxo (medidor) | 45–200 sinais | 45–200 sinais (independe de slots) | Passivo por zonas capturadas |
| 3 | **Sacrifício** | Sucata + Comp. IA (ambos) | Item (mochila) | 3.0 (cap slots) | 7.0 (cap slots) | Pausa 1.5s; custo por câmara |
| 4 | **Circuito Quebrado** | Núcleo Lógico | Item (mochila) | 0 ou 1 por run | 0 ou 1 por run (1 por run fixo) | Pausa 1.5s após 3 câmaras completas |
| 5 | **Extração** | Combustível Volátil | Item (mochila) | 2.0–3.0 | 5.0–7.0 | Coleta por proximidade (sem pausa) |
| 6 | **Infecção** | Biomassa Adaptativa | Fluxo (medidor) | 120–184 bio | 120–184 bio (independe de slots) | Passivo por nós infectados |
| 7 | **Labirinto** | Fragmentos Estruturais | Item (mochila) | 2.0–3.0 | 5.0–7.0 | Pausa 1.5s sobre item |
| 8 | **Cordilheira** | Memórias Coletivas | Item (mochila) | 1.0–3.0 (Selvagens limitam) | 3.0–5.0 | Pausa 1.5s; risco ambiental |
| 9 | **Torres** | Cristais de Memória | Item (mochila) | 0 ou 1–3 por run | 1.0–5.0 | Pausa 1.5s; stealth vertical |
| 10 | **Catedral** | Relíquias | Item (mochila) | 1.0–3.0 (janelas de sino) | 2.0–5.0 | Timing rítmico com sinos |

**Notas:**
- Sucata e Comp. IA são os únicos recursos produzidos em DUAS zonas cada (Hordas/Sacrifício e Stealth/Sacrifício). Isso é intencional para o MVP — mas cria risco de substituição (ver seção 2).
- Núcleo Lógico é o único recurso com produção binária (0 ou 1 por run) — maior variância.
- Recursos de fluxo (Sinais, Biomassa) não competem por slots de mochila — estão isolados do sistema de pressão da mochila.

---

## 2. Mapa de Sinks (Consumidores)

### 2.1 Tabela Completa de Sinks

| Sink | Recursos Consumidos | Quando Ativo | Tipo de Consumo | Observação |
|------|---------------------|-------------|-----------------|------------|
| **Foguete — 8 peças MVP** | Sucata (37×) + Comp. IA (32×) | Arco MVP completo | Permanente (constrói peça e recurso some) | Sink primário atual |
| **Foguete — pós-MVP (a definir)** | Todos os 9 recursos | Pós-MVP | Permanente | Custos a especificar |
| **Missões de NPCs — Trazer recurso** | Variados (por NPC) | Qualquer confiança | Permanente (recurso entregue some do hub) | Marcus: Comp. IA; Amara: Memórias Coletivas; Priya: recursos específicos; Viktor: variado |
| **Upgrade de mochila (Ex-Executivo)** | Não consome recursos — consome CONFIANÇA | 40% e 80% de confiança | Permanente (unlock único) | Sink de progressão de personagem, não de recurso |
| **Câmaras de Sacrifício — custo de slot** | Não consome recurso do hub — bloqueia slot NA RUN | Durante run | Temporário (por run) | Sink de capacidade, não de estoque |

### 2.2 Recursos Sem Sink Definido (PROBLEMA CRÍTICO)

| Recurso | Faucet Ativo | Sink Atual | Status |
|---------|-------------|-----------|--------|
| **Sinais de Controle** | Campo de Controle | Nenhum especificado | SEM SINK |
| **Biomassa Adaptativa** | Infecção | Nenhum especificado | SEM SINK |
| **Núcleo Lógico** | Circuito Quebrado | Citado como "Processador de Navegação" | Sink implícito, sem custo definido |
| **Combustível Volátil** | Extração | Citado como "Motor Principal" | Sink implícito, sem custo definido |
| **Fragmentos Estruturais** | Labirinto | Citado como "Reforço do Casco" | Sink implícito, sem custo definido |
| **Memórias Coletivas** | Cordilheira | Missão Amara (5×) | 1 missão = 1 consumo; depois ACUMULA |
| **Cristais de Memória** | Torres | Missão Marcus (3×) | 1 missão = 1 consumo; depois ACUMULA |
| **Relíquias** | Catedral | Missão Lena (3×) | 1 missão = 1 consumo; depois ACUMULA |

**Conclusão:** 8 dos 9 recursos pós-MVP não têm sinks robustos definidos. O jogador
acumulará estoques infinitos sem custo associado — inflação garantida se o jogo chegar
ao M8 sem este sistema resolvido.

---

## 3. Análise de Estratégias Degeneradas

### 3.1 Estratégia Degenerada #1: Farm de Zona Única (Sucata-Only)

**Descrição:** O jogador farma exclusivamente a Zona Hordas para acumular Sucata
Metálica, atrasando intencionalmente o progresso nas peças que exigem Comp. IA até
estourar o estoque de Sucata.

**Por que funciona agora:**
- Peças 1, 2 exigem apenas Sucata → progresso real sem precisar de Stealth.
- Estoque do hub sem limite → Sucata acumula infinitamente.
- Hordas tem squad de 4 (mais seguro) e combate automático → menor risco percebido.
- Zona Sacrifício gera ambos os recursos → "se eu precisar de IA, vou ao Sacrifício".

**Impacto:**
- Jogador ignora 9 das 11 zonas até ser forçado por receita.
- "Quando sair?" perde tensão — Hordas tem custo/risco fixo e previsível.
- Diversidade de experiências destruída; narrativa do Stealth nunca ocorre.

**Travas Propostas:**

| Trava | Mecanismo | Intensidade |
|-------|-----------|-------------|
| **Receita interleaved** | Reformular sequência do foguete para exigir recursos de zonas diferentes nas peças 1-3 (ex: peça 2 requer 4× Sucata + 2× Sinais de Controle) | Alta eficácia; muda design de receitas |
| **Decaimento de yield por run repetida** | Após 3 runs seguidas na mesma zona, a quantidade de recursos por run cai 25% (reseta ao trocar de zona) | Suave; preserva liberdade; avisa no HUD |
| **Lock narrativo de receita** | Peças avançadas só aparecem no foguete após o jogador visitar N zonas distintas (ex: ver ao menos 4 zonas para desbloquear peça 5+) | Alta eficácia; narrativamente justificável (Engenheiro diz "precisamos de mais dados de campo") |
| **Estoque do hub com soft cap** | Acima de 20 unidades de qualquer recurso, o excedente começa a "oxidar" (perde 1 unidade/dia de sessão) | Controverso; pode frustrar |

**Recomendação:** Combinar "receita interleaved" + "decaimento suave de yield". Não
aplicar oxidação — vai contra a fantasia de acumulação segura no hub.

---

### 3.2 Estratégia Degenerada #2: Skip do Circuito (Núcleo como Gargalo Ignorável)

**Descrição:** O Núcleo Lógico é o único recurso com produção de 0 ou 1 por run e
exige completar 3 câmaras de puzzle + EXIT em 90s. Se o custo do foguete for baixo
(ex: 3 Núcleos), o jogador completa 3 runs e nunca mais precisa do Circuito. Se for
alto, o jogador pode adiar indefinidamente porque a zona tem maior variância de falha.

**Travas Propostas:**
- Múltiplas receitas de foguete exigem Núcleos em quantidade crescente por fase.
- Núcleo tem prazo de validade lore-justificado ("os núcleos degradam fora do ambiente
  de circuito — use ou perca em X sessões").

---

### 3.3 Estratégia Degenerada #3: Farming de Sacrifício como Zona Universal

**Descrição:** Zona Sacrifício gera Sucata + Comp. IA em quantidade premium, tornando
Hordas e Stealth redundantes para jogadores com mochila upgrade 2 (7 slots).

**Por que funciona:** Com 7 slots, um único Sacrifício bem executado rende 7 recursos
dos dois tipos mais valiosos. ROI supera qualquer zona dedicada.

**Travas Propostas:**
- Distribuição de câmaras garante máximo de 4 slots de cada tipo por run (não 7 de um só).
- Custo de câmaras inclui custo de "token de acesso" — exige ter visitado Hordas ou
  Stealth em run recente (lore: "preciso de reconhecimento de campo para planejar a
  extração do depósito").

---

### 3.4 Estratégia Degenerada #4: Idle na Infecção (Grind Passivo de Biomassa)

**Descrição:** Se Biomassa não tem sink definido, o jogador repete Infecção até ter
estoque enorme, depois usa tudo de uma vez. Sem pressão de gasto = sem decisão.

**Travas:**
- Definir sink claro e recorrente para Biomassa (ex: suporte de vida do foguete consome
  X Biomassa por semana de sessão como custo de manutenção).
- Alternativa: Biomassa é gasta para manter NPCs curados entre runs (Amara exige
  Biomassa para curar o squad de dano acumulado entre sessões).

---

## 4. Proposta de Política de Variedade: Mapeamento Recurso-Zona

### 4.1 Princípio de Design

Cada zona deve ter exatamente 1 recurso "assinatura" que:
1. Só é produzido de forma primária nessa zona.
2. É exigido por pelo menos 1 receita de foguete ou 1 missão de NPC.
3. Cria um motivo narrativo claro para o jogador querer fazer aquela zona.

### 4.2 Mapeamento Proposto (11 Zonas × 11 Recursos)

| Zona | Recurso Assinatura | Justificativa Temática | Sink Principal | Sink Secundário |
|------|--------------------|------------------------|----------------|-----------------|
| **Hordas** | Sucata Metálica | Estrutura bruta do foguete | Foguete (peças 1, 2, 3, 5, 6, 8) | Missão Viktor (sobrevivência + sucata) |
| **Stealth** | Componentes de IA | Eletrônicos de navegação | Foguete (peças 3, 4, 5, 6, 7, 8) | Missão Marcus (comp. IA) |
| **Campo de Controle** | Sinais de Controle | Telemetria e comunicação do foguete | Foguete (peças de comunicação pós-MVP) | Missão Yuki (hack remoto exige sinais) |
| **Sacrifício** | Rações de Depósito *(novo)* | Depósito de suprimentos da resistência — alimento | Hub: sustenta NPCs entre sessões; custo de recrutamento de sobreviventes | Missão Amara (suprimentos médicos) |
| **Circuito Quebrado** | Núcleo Lógico | Processador central de navegação autônoma | Foguete (processador de navegação) | Missão Marcus (80% confiança) |
| **Extração** | Combustível Volátil | Motor de propulsão do foguete | Foguete (motor principal) | Missão Tomas (engenharia de campo — precisa de combustível) |
| **Infecção** | Biomassa Adaptativa | Suporte de vida; manutenção biológica do foguete | Foguete (suporte de vida pós-MVP) | Hub: custo de manutenção passivo de NPCs feridos |
| **Labirinto** | Fragmentos Estruturais | Reforço do casco externo | Foguete (blindagem pós-MVP) | Missão Elena (resgate exige acesso estrutural) |
| **Cordilheira** | Memórias Coletivas | Arquivo emocional; moral da equipe | Sistema de Moral *(novo, ver abaixo)* | Missão Amara (60%: 5 memórias) |
| **Torres** | Cristais de Memória | IAs alternativas; backdoor de desligamento | Missão Marcus (80%: 3 cristais) | Desbloqueio de Final C (Lena precisa de 5+) |
| **Catedral** | Relíquias | Artefatos pré-digitais com assinatura EM | Missão Lena (80%: 3 relíquias) | Desbloqueio de Final C (comunicação com CORE) |

**Observação sobre Sacrifício:** O GDD atual faz Sacrifício gerar Sucata + Comp. IA,
tornando-o redundante com Hordas e Stealth. A proposta acima substitui pelo novo
recurso "Rações de Depósito" para manter a unicidade. Isso preserva o tema da zona
(custo/benefício) e cria um sink de hub genuinamente novo. A alternativa menos
disruptiva é manter Sucata + Comp. IA mas limitar por câmara (ver seção 3.3).

---

### 4.3 Sistema de Moral (Sink para Memórias Coletivas)

**Premissa:** Memórias Coletivas são itens de alta carga narrativa sem sink mecânico
claro. Proposta de sistema leve:

- Hub tem medidor de **Moral do Grupo** (0–100%).
- Moral começa em 40%. Cai -5% por cada run fracassada (morte), +10% por peça do
  foguete construída.
- Se Moral < 30%: NPCs recusam runs por 1 sessão. Foguete "para de crescer" visualmente.
- Entregar Memórias Coletivas no hub: +8% Moral por unidade (Viktor comenta; Bae
  arquiva; Amara analisa silenciosamente).
- Isso transforma Cordilheira em zona de "recuperação emocional do grupo" — mecânica
  justifica narrativa e cria sink tangível.

---

## 5. Salvaguardas Contra Inflação no Late Game

### 5.1 Diagnóstico do Risco

O late game de Fungineer (M8+) tem 11 faucets ativos e potencialmente poucos sinks
se as receitas do foguete pós-MVP não forem calibradas. Riscos específicos:

| Risco | Gatilho | Efeito |
|-------|---------|--------|
| **Acúmulo de recursos de fluxo** | Sinais e Biomassa sem sink recorrente | Estoque cresce sem decisão de gasto |
| **Saturação de recursos de superfície** | Cordilheira, Torres, Catedral têm sinks de missão único | Após missões completadas, recursos acumulam sem uso |
| **Progressão travada por gargalo único** | Núcleo Lógico (0 ou 1/run) com custo alto | Frustração e repetição mecânica |
| **Power creep de mochila** | Com 7 slots, cada run retorna volume muito maior → inflação de Sucata/IA | Foguete progride rápido demais no late game com upgrade |

---

### 5.2 Salvaguardas Propostas

#### A — Custo de Manutenção Passivo do Hub

O foguete, uma vez que começa a ser construído, consome recursos passivamente para
"manter os sistemas funcionando":

| Fase do Foguete | Consumo Passivo (por sessão ~30 min) | Recursos Drenados |
|-----------------|--------------------------------------|-------------------|
| Peças 1–3 construídas | 2× Sinais de Controle | Campo de Controle |
| Peças 4–6 construídas | 3× Sinais + 5× Biomassa | Campo + Infecção |
| Peças 7–8 construídas | 5× Sinais + 10× Biomassa + 1× Fragmento | Campo + Infecção + Labirinto |

Isso transforma recursos de fluxo em recursos de manutenção contínua — elimina
acúmulo infinito e cria pressão para rodar as zonas de fluxo regularmente.

---

#### B — Receitas de Foguete Pós-MVP com Spread Balanceado

Quando o agente de curva de custo definir as receitas das peças 9–15 (pós-MVP),
recomendo as seguintes restrições de balanceamento:

```
Regra 1: Nenhuma peça pós-MVP pode usar menos de 3 recursos distintos.
Regra 2: Cada zona deve ser "necessária" para pelo menos 2 peças do foguete.
Regra 3: Recursos de fluxo (Sinais, Biomassa) devem aparecer em pelo menos
         metade das receitas pós-MVP.
Regra 4: O Núcleo Lógico (produção binária) nunca deve exceder 3 unidades
         por peça — limitar gargalo de alta variância.
```

---

#### C — Soft Cap de Estoque com Degradação Narrativa

Para recursos narrativos de zona única (Memórias, Cristais, Relíquias), após
completar todas as missões associadas:

- Estoque acima de 10 unidades: o Ex-Executivo comenta que "estamos acumulando
  itens sem uso — deveríamos pensar no que fazer com eles".
- Não há penalidade mecânica — só sinalização narrativa. Mantém agência do jogador.
- Reserva design space para quests futuras ("side missions") sem bloquear progresso.

---

#### D — Decaimento Suave de Yield por Run Repetida (Anti-Farm)

Para evitar farm de zona única (estratégia degenerada #1):

```
runs_consecutivas_mesma_zona → multiplicador_de_yield
  1 run: 1.0× (normal)
  2 runs: 1.0×
  3 runs: 0.85×
  4 runs: 0.70×
  5+ runs: 0.60× (piso)

Resetado ao completar qualquer outra zona.
Aviso na UI antes da run: "Setor sobreexplorado — yield reduzido."
```

Este sistema foi calibrado para não punir exploração natural (2 runs seguidas é
comum) mas criar incentivo econômico claro para diversificar após 3+.

---

#### E — Pity Timer para Núcleo Lógico

O Núcleo tem produção binária — alto risco de sequência de 0s (zero drops):

```
Se o jogador completa 3 runs do Circuito sem coletar Núcleo:
  → Run 4 começa com câmara 3 já pre-completada (porta aberta, Núcleo visível).
  → Pity Timer reseta após qualquer coleta de Núcleo.
  → Invisível ao jogador (não comunicado explicitamente).
```

Isso elimina sequências frustrantes sem remover o desafio principal das câmaras.

---

## 6. Métricas de Saúde Econômica

Indicadores para monitorar em playtests (M9 — Ship):

| Métrica | Valor Saudável | Alarme (investigar) | Causa Provável |
|---------|---------------|----------------------|----------------|
| **Média de zonas distintas por sessão** | 3–5 | < 2 | Farm de zona única ativo |
| **Proporção Sucata:Comp.IA no estoque** | 0.8–1.4× | > 2× ou < 0.5× | Desbalanceamento de receita |
| **Runs do Circuito por Núcleo coletado** | 1.5–3 | > 5 | Pity timer necessário ou dificuldade alta demais |
| **Estoque de Sinais/Biomassa no hub** | < 50 unidades acumuladas | > 200 por recurso | Sink insuficiente — ativar custo de manutenção |
| **Tempo médio até peça 3 do foguete** | 8–12 runs | < 5 ou > 20 runs | Custo desequilibrado ou player lost |
| **Taxa de uso do Sacrifício vs. Hordas** | Sacrifício < 30% das runs | > 50% | Zona Sacrifício dominante; restringir yield ou tornar Sacrifício exclusivo de sua assinatura |
| **Missões de NPC completadas por sessão** | 0.5–1.5 | < 0.2 | Sinks de NPC ignorados; revisar recompensas de confiança |

---

## 7. Resumo de Ações Recomendadas

### Prioridade Alta (antes do M8)

1. **Definir sinks para Sinais e Biomassa** — custo de manutenção passivo do foguete
   (proposta na seção 5.2.A).
2. **Reformular receitas para interleaving** — cada peça do foguete deve exigir
   recursos de pelo menos 2 zonas distintas (regra da seção 5.2.B).
3. **Especificar custos pós-MVP** — coordenar com agente de curva de custo para
   garantir que todos os 9 recursos tenham sink de foguete antes do M8.

### Prioridade Média (M8 ou M9)

4. **Implementar decaimento de yield por run repetida** — trava suave contra farm
   de zona única (seção 5.2.D).
5. **Pity timer do Núcleo Lógico** — invisível ao jogador, elimina sequências de zero
   (seção 5.2.E).
6. **Revisar Zona Sacrifício** — decidir entre assinatura própria (Rações) ou
   limitar por câmara os recursos base.

### Prioridade Baixa (pós-lançamento)

7. **Sistema de Moral** — sink narrativo para Memórias Coletivas (seção 4.3).
8. **Soft cap narrativo** — para recursos de zona única após missões completas
   (seção 5.2.C).

---

## 8. Dependências e Coordenação

| Agente/Sistema | Dependência |
|----------------|-------------|
| **Agente de curva de custo do foguete** | Precisa das regras de spread (seção 5.2.B) para definir receitas pós-MVP |
| **Systems Designer** | Implementação do decaimento de yield, pity timer, custo de manutenção passivo |
| **Analytics Engineer** | Dashboard para as métricas de saúde da seção 6 |
| **GDD de Hub** | Sistema de Moral requer atualização em `hub-and-characters.md` se aprovado |
| **GDD de Sacrifício** | Decisão de assinatura única vs. dual precisa ser travada antes do M4 |

---

*Relacionado: `design/gdd/resource-system.md`, `design/MASTERPLAN.md`,
`design/gdd/hub-and-characters.md`, `design/gdd/zone-*.md`*
