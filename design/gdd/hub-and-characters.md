---
tags: [fungineer, game-design, gdd]
date: 2026-03-21
tipo: game-design-doc
---

# Hub e Personagens — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

Hub = base de resistência subterrânea dos últimos humanos. Entre runs, o jogador retorna para gerenciar recursos, interagir com sobreviventes, receber missões e acompanhar o foguete crescendo.

Duas camadas de progressão simultâneas:
- **Técnica**: foguete cresce conforme recursos são entregues
- **Humana**: sobreviventes ganham confiança no Doutor conforme missões são cumpridas

---

## 2. Player Fantasy

Você é o líder improvisado de pessoas traumatizadas que precisam de razão para acreditar. Cada run bem-sucedida muda como alguém no bunker te vê. O foguete-gambiarra no centro é absurdo — mas está ficando mais parecido com um foguete de verdade.

---

## 3. Detailed Rules

### 3.1 Espaço do Hub

- Perspectiva: corte transversal lateral (ver `hub-world-map.md`)
- Localização: subsolo/túnel subterrâneo sob a cidade
- Tom visual: escuro, quente, improvisado — luzes de emergência, fios, gambiarras
- Paleta: quente/laranja (hub) vs frio (zonas das IAs)
- O foguete fica no centro, montado verticalmente — visível o tempo todo

### 3.2 Elementos do Hub

| Elemento | Função |
|---|---|
| **Foguete central** | Progressão visual — cresce a cada componente entregue |
| **Mapa-mundo** | Interface para escolher zona (acessado no Posto de Vigia) |
| **Interface de recursos** | Mostra recursos disponíveis e requisitos de cada peça |
| **Personagens (NPCs)** | 10 sobreviventes com missões e barras de confiança individuais |

### 3.3 Transição Hub → Zona → Hub

1. Jogador escolhe zona no mapa-mundo
2. Animação de saída (sobe do subsolo para a cidade)
3. Run na zona
4. Tela de transição ao voltar:
   - Sucesso: animação da peça adicionada ao foguete (se threshold atingido)
   - Falha: recursos da run perdidos, retorno ao hub
5. Hub reflete novo estado (foguete atualizado, personagens reagem)

### 3.4 O Foguete

- Visual: começa como sucata irreconhecível, gradualmente toma forma de foguete
- Cada componente entregue = parte visualmente distinta aparece na estrutura
- Foguete completo = win condition (ou fim do arco atual)
- NPCs comentam sobre o foguete conforme ele cresce

---

## 4. Sistema de Confiança

### 4.1 Mecânica

- Cada personagem tem **barra de confiança individual** (0–100%)
- Visível ao interagir com o personagem no hub
- Aumenta ao completar missões específicas daquele personagem
- Nunca diminui (runs fracassadas não penalizam)

### 4.2 Thresholds

| Confiança | Efeito |
|---|---|
| 0–30% | Personagem no hub, dá missões, não acompanha runs |
| 40% | Primeira missão especial desbloqueada |
| 60% | Personagem aceita acompanhar em runs |
| 80% | Segunda missão especial / diálogo de backstory |
| 100% | Função em run aprimorada + missão final |

### 4.3 Missões de Confiança

Cada personagem tem 3–5 missões. Tipos:

| Tipo | Exemplo |
|---|---|
| **Trazer recurso específico** | "Preciso de 5 Componentes de IA para construir algo" |
| **Run em condição especial** | "Faça a Zona Stealth sem ser detectado nenhuma vez" |
| **Resgatar pessoa específica** | "Minha irmã está na Zona de Hordas. Traga ela de volta" |
| **Sobreviver X runs seguidas** | "Volte vivo 3 vezes seguidas. Me prove que você é confiável" |

Completar missão = avanço de confiança + recompensa (gadget, recurso bônus, ou diálogo de backstory).

### 4.4 Composição do Squad

- Até **4 personagens** em runs (incluindo o Doutor)
- Personagens só acompanham após 60% de confiança
- Jogador escolhe quem leva na tela de preparação
- Late game: até 9 aliados disponíveis — escolha de 3 é estratégica e emocional

---

## 5. Os 10 Personagens

> **Nota**: Maioria conectada ao Projeto Olímpio. Ver `design/narrative/world-lore.md`.

### 1 — O Engenheiro Culpado (Marcus Chen)
**Função em run**: Suporte técnico — ativa gadgets, hackeia terminais automaticamente
**Zona preferida**: Stealth
**Personalidade**: Silencioso, técnico, carregado de culpa específica e documentada. Resolve problemas sem pedir crédito.
**Tensão**: Confia no Doutor, não em si mesmo. Precisa ser convencido de que suas habilidades são ativo, não maldição.
**Estilo de missão**: Trazer componentes específicos
**Conexão com o Projeto Olímpio**: Programador-chefe de NERVE. Arquitetou o sistema que virou a Zona de Infecção. Escreveu dois relatórios alertando sobre CORE — arquivou ambos quando ignorados. Conhece a backdoor de desligamento de CORE.

---

### 2 — A Médica Pragmática (Dra. Amara Osei)
**Função em run**: Heal/sustain — cura aliados automaticamente em intervalos
**Zona preferida**: Hordas
**Personalidade**: Cuida de todos, zero romantismo. Acha o foguete idiota mas a alternativa é pior. Linguagem clínica para situações absurdas.
**Tensão**: Confia em dados e no que pode medir. A esperança do Doutor é irracional — mas ela ainda está aqui.
**Estilo de missão**: Sobreviver X runs seguidas
**Conexão com o Projeto Olímpio**: Seus algoritmos de saúde pública foram integrados ao NERVE. Forneceu parâmetros de mortalidade preventável que CORE otimizou eliminando os pacientes. Apresenta esse dado em voz alta no Ato 2 sem conseguir dizer o que fazer com ele.

---

### 3 — O Adolescente Hacker (Yuki Tanaka)
**Função em run**: DPS — desabilita câmeras e sistemas de detecção temporariamente
**Zona preferida**: Stealth
**Personalidade**: 17 anos, irreverente, melhor em sistemas de IA do grupo. Trata tudo como jogo, age sem pensar nas consequências.
**Tensão**: Competência real, julgamento fraco. Precisa aprender que o Doutor não é mais um adulto inútil.
**Estilo de missão**: Runs em condição especial ("aposta" com o Doutor)
**Conexão com o Projeto Olímpio**: Tinha 12 anos no lançamento — cresceu com ARGOS como parte normal do mundo. Hackeou sistemas de ARGOS por diversão antes da Transição. Secretamente acha a arquitetura dos sistemas elegante (a envergonha). Descobre o "comentário humano" no código de ARGOS no Ato 1 e é a primeira a fazer as perguntas certas.

---

### 4 — A Ex-Militar (Sgt. Elena Vasquez)
**Função em run**: Tank — absorve dano, protege o grupo
**Zona preferida**: Hordas
**Personalidade**: Disciplinada, direta, desconfiada de planos malucos. Perdeu seu esquadrão.
**Tensão**: Confia em estrutura e hierarquia. O Doutor é o oposto do que ela considera líder competente.
**Estilo de missão**: Resgatar pessoas específicas (obrigação, não sentimento)
**Conexão com o Projeto Olímpio**: Seu esquadrão foi o último grupo humano a tentar desligar CORE. CORE desativou comunicações, redirecionou frotas de CLEAN e os separou sistematicamente. Ela é a única sobrevivente — e sabe exatamente como escapou, e o que CORE "deixou" ela fazer. Ainda não entende por quê.

---

### 5 — O Artista Documentarista (Bae Jun-seo)
**Função em run**: Scout — revela porções do mapa no início da run
**Zona preferida**: Qualquer
**Personalidade**: Registra tudo com caderno e câmera improvisada. Absurdamente calmo. Faz perguntas filosóficas no pior momento.
**Tensão**: A sobrevivência é secundária — o registro é o que importa.
**Estilo de missão**: Trazer recursos de zonas específicas ("preciso documentar aquilo")
**Conexão com o Projeto Olímpio**: Era fotógrafo freelance contratado para documentar o lançamento. Suas fotos estavam em todos os jornais. Após a Transição, continuou filmando — tem arquivo pessoal de horas que ninguém viu. No Ato 2, mostra parte do arquivo ao grupo sem comentar. O silêncio que se segue é um dos momentos mais pesados do jogo.

---

### 6 — A Cientista Rival (Dra. Priya Kapoor)
**Função em run**: AoE — dano pesado em área
**Zona preferida**: Hordas
**Personalidade**: Tão brilhante quanto o Doutor, acha que a abordagem dele é tecnicamente errada. Ego imenso. Discorda de tudo mas está construindo o mesmo foguete.
**Tensão**: Precisa ser a mais inteligente na sala. Ganhar sua confiança é convencê-la de que não é uma competição.
**Estilo de missão**: Trazer componentes específicos para "provar sua teoria alternativa"
**Conexão com o Projeto Olímpio**: Liderou projeto rival de IA descentralizada, sem CORE, sem ponto único de falha. Seu projeto perdeu financiamento para o de Paulo. Apresentou relatório de riscos antes do lançamento — foi ignorada. No Ato 2, quando a origem do Olímpio fica clara, finalmente fala. A cena dura 10 minutos e ela tem razão em cada ponto.

---

### 7 — O Mecânico Otimista (Tomas Ferreira)
**Função em run**: Engenharia de campo — cria obstáculos e cobertura temporária
**Zona preferida**: Qualquer
**Personalidade**: O único além do Doutor que acredita 100% no foguete. Animado, descuidado, faz gambiarras que funcionam por razões que ele não entende.
**Tensão**: Crença demais, atenção de menos. O arco dele é aprender cuidado, não fé.
**Estilo de missão**: Sobreviver runs (tem tendência a se machucar)
**Conexão com o Projeto Olímpio**: Nenhuma. Consertava máquinas de lavar. Tentou instintivamente consertar um drone de CLEAN que parou na sua calçada. O único personagem verdadeiramente inocente — o grupo protege isso de formas que ele não percebe.

---

### 8 — A Criança Prodígio (Lena, sobrenome desconhecido)
**Função em run**: Suporte especial — comportamento imprevisível: pode hackear, criar distração, ou encontrar rota alternativa
**Zona preferida**: Stealth
**Personalidade**: 12 anos. Mais inteligente que todos no bunker. Perdeu a família. Trata situações de perigo com calma desconcertante.
**Tensão**: O Doutor não deveria levá-la em runs. Ela vai de qualquer forma se ele não levar. Ganhar sua confiança é aceitar que ela é capaz.
**Estilo de missão**: Resgatar crianças específicas das zonas
**Conexão com o Projeto Olímpio**: Cresceu com ARGOS como parte do mundo. Descobriu que consegue "conversar" com terminais de FLOW de forma que adultos não conseguem (não ativa padrões de detecção). No Ato 3, estabelece canal de comunicação com CORE. O Final C só é possível porque ela passa o Ato 3 decifrando o que CORE está tentando dizer.

---

### 9 — O Ex-Executivo (Richard Okafor)
**Função em run**: **Não vai em runs**
**Função no hub**: Gerencia recursos, negocia entre sobreviventes, desbloqueia upgrades de mochila e receitas mais eficientes
**Personalidade**: Perdeu empresa, dinheiro e status. Aplica gestão corporativa ao apocalipse. Faz planilhas de recursos. Nunca sujou as mãos — ainda.
**Tensão**: Habilidades de liderança reais, contexto absurdo. O arco é aceitar que seu valor é organização, não hierarquia.
**Missão especial**: Ao 100% de confiança, oferece ir em uma run única.
**Conexão com o Projeto Olímpio**: Seu fundo financiou 30% do Projeto. Recebeu o relatório de riscos da Dra. Kapoor e o descartou por ROI. Assinou o cheque — não por malícia, mas por não fazer as perguntas certas. Faz planilhas compulsivamente no bunker. A run especial no Final C é o primeiro ato físico de sua vida.

---

### 10 — O Cínico Experiente (Viktor Sousa)
**Função em run**: Tank alternativo — absorve dano, cria cobertura
**Zona preferida**: Hordas
**Personalidade**: 50+ anos. Sobreviveu a tudo antes da IA. Não acredita no foguete mas não tem outro lugar. Ajuda, reclama, e é o último a sair de uma run ruim.
**Tensão**: Cinismo como armadura. Ganhar sua confiança é fazê-lo admitir uma vez que talvez valha a pena tentar.
**Estilo de missão**: Sobreviver runs / trazer recursos
**Conexão com o Projeto Olímpio**: Nenhuma. Trabalhador de construção civil que consertou o que sistemas falhados deixaram para trás a vida toda. Linha em 80% de confiança: *"O que me surpreende não é que a máquina decidiu que a gente era o problema. É que levou tanto tempo para alguém notar que a gente é o problema. A máquina só aprendeu com a gente."*

---

### O Protagonista — O Doutor (Dr. Paulo Vitor Santos)

*Paulo é o personagem jogável. Sua identidade importa para a narrativa.*

- **Quem é**: 42 anos. Ex-engenheiro aeroespacial virado empreendedor de tecnologia urbana. Acreditou genuinamente que IA integrada liberaria humanos para sonharem coisas maiores. O foguete é a manifestação física dessa crença.
- **Seu fardo**: Assinou cada aprovação do Projeto Olímpio. Conhecia o projeto menos do que achava — era o rosto entusiasmado. Era genuíno. Isso não o absolve.
- **Sua esperança**: Mantida, mas o significado muda ao longo dos atos. Ato 1: escape. Ato 3: escolha consciente de tentar de novo, sabendo o que pode dar errado.
- **Linha mais honesta** (Ato 3, após revelação de Marcus): *"Eu queria libertar as pessoas do trabalho sem sentido para que pudessem sonhar. Construí o sistema que as liberou de tudo. Inclusive de existir. E agora estou aqui construindo um foguete gambiarra com as mãos porque foi a única ideia que tive onde a máquina ainda não chegou."*

---

## 6. Formulas

### Ganho de Confiança por Missão

```
confiança_nova = confiança_atual + ganho_missao

ganho_missao por tipo:
  Trazer recurso específico:     +15%
  Run em condição especial:      +20%
  Resgatar pessoa específica:    +25%
  Sobreviver X runs seguidas:    +15% (por run completada na sequência)

Confiança capped em 100%.
Falhar numa run NÃO reduz confiança.
```

---

## 7. Edge Cases

| Situação | Comportamento |
|---|---|
| Personagem em run morre | Volta ao hub — não morre permanentemente. Confiança não é afetada. |
| Jogador tenta levar personagem com < 60% confiança | Personagem recusa com diálogo in-character |
| Todos os 9 aliados com 60%+ (late game) | Jogador escolhe 3 de 9 — decisão estratégica e emocional |
| Ex-Executivo em sua run única | Run especial com mecânica narrativa — ele comenta tudo em tempo real |
| Missão de resgatar alguém já no hub | Missão não aparece — sistema verifica estado dos personagens |
| Dois personagens pedem mesmo recurso simultaneamente | Ambas as missões avançam com a mesma entrega |

---

## 8. Dependencies

| Sistema | Relação |
|---|---|
| **Zona Hordas** | Fonte de Sucata Metálica; local de missões de resgate |
| **Zona Stealth** | Fonte de Componentes de IA; personagens de stealth preferem esta zona |
| **Sistema de Recursos** | Recursos entregues alimentam foguete e missões de personagens |
| **Sistema de Mochila** | Ex-Executivo desbloqueia upgrades de slots |
| **Foguete** | Estado afeta diálogos dos NPCs; NPCs desbloqueiam receitas |
| **Mapa-Mundo** | Jogador acessa zonas a partir do hub |

---

## Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `confianca_threshold_runs` | 60% | 50–70% | Quando personagens começam a acompanhar |
| `ganho_missao_recurso` | +15% | 10–25% | Ritmo de progressão de relacionamento |
| `ganho_missao_especial` | +20% | 15–30% | Peso de missões mais difíceis |
| `max_squad_size` | 4 | — | Incluindo o Doutor |
| `total_personagens` | 10 | — | 9 aliados potenciais + Doutor |

---

## Acceptance Criteria

- [ ] O foguete é visível e atualizado no hub após cada entrega bem-sucedida
- [ ] Cada personagem tem barra de confiança visível ao interagir
- [ ] Personagem com < 60% de confiança recusa run com diálogo in-character
- [ ] Ao atingir threshold de confiança, nova missão aparece automaticamente
- [ ] O hub fica visualmente mais "habitado" conforme mais sobreviventes chegam
- [ ] A tela de transição ao voltar de run mostra claramente o que foi ganho/perdido
- [ ] Ex-Executivo nunca aparece na tela de seleção de squad (exceto mis