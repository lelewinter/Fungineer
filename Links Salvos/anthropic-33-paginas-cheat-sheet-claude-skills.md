---
date: 2026-03-08
tags: [Claude, skills, Anthropic, cheat sheet, building skills, guia oficial, documentação]
source: https://x.com/RoundtableSpace/status/2030595632998580328
autor: "Anthropic (via 0xMarioNawfal)"
tipo: zettelkasten
---

# Cheat Sheet Oficial de 33 Páginas — Como Construir Claude Skills

## Resumo

Anthropic lançou um cheat sheet oficial de 33 páginas dedicado exclusivamente à construção de Claude skills. Este documento consolida as melhores práticas, padrões de design, e exemplos práticos para criar skills que se integrem com Claude Code, workflows, e o ecossistema completo da plataforma — como um manual de referência rápida que evita armadilhas comuns.

## Explicação

O cheat sheet de 33 páginas cobre:

**Fundamentação de Claude Skills**
- O que é um skill (blocos de funcionalidade reutilizáveis)
- Arquitetura de skills no Claude Code
- Diferença entre skills, workflows, e prompts

**Design Patterns**
- Padrões para entrada/saída de dados
- Estrutura recomendada de arquivos
- Nomeação e versionamento

**Casos de Uso Comuns**
- Skills para automação de tarefas
- Skills para análise de dados
- Skills para geração de conteúdo
- Skills para integração com APIs externas

**Boas Práticas**
- Tratamento de erros em skills
- Validação de entrada
- Documentação efetiva
- Testes e debugging

**Exemplos Práticos**
- Skill de processamento de texto
- Skill de análise de imagens
- Skill de chamadas HTTP
- Skill de manipulação de banco de dados

**Integração com Workflows**
- Como conectar skills a workflows
- Passagem de variáveis entre skills
- Composição de múltiplos skills
- Orquestração complexa

**Publicação e Compartilhamento**
- Como publicar skills no marketplace
- Documentação para outras pessoas usarem
- Versionamento e compatibilidade
- Monetização (se aplicável)

## Exemplos

**Exemplo de Estrutura de Skill (do cheat sheet):**

```
my-skill/
├── SKILL.md          # Metadata e documentação
├── skill.json        # Configuração
├── src/
│   ├── main.ts       # Lógica principal
│   └── utils.ts      # Funções auxiliares
├── tests/
│   └── main.test.ts  # Testes
└── README.md         # Documentação para usuários
```

**Exemplo de SKILL.md:**
```markdown
---
name: "Process CSV File"
description: "Lê um arquivo CSV e transforma em formato JSON estruturado"
author: "seu-nome"
version: "1.0.0"
tags: ["data-processing", "csv", "transformation"]
---

# Process CSV File Skill

Descrição detalhada do que o skill faz...
```

**Exemplo de Input/Output Padrão:**
```
INPUT:
- file: File (arquivo CSV)
- delimiter: string (padrão: ",")
- hasHeader: boolean (padrão: true)

OUTPUT:
- data: Array<Object>
- rowCount: number
- columnNames: Array<string>
```

## Relacionado

[[Claude Code - Melhores Práticas]]
[[450_skills_workflows_claude]]
[[plan-mode-claude-code-previne-execucao-prematura]]

## Perguntas de Revisão

1. Qual é a diferença estrutural entre um skill e um workflow, segundo o cheat sheet?
2. Como o cheat sheet recomenda estruturar erros e exceções em skills para reutilização?
3. Qual seria o primeiro skill que você criaria usando as práticas do documento?
