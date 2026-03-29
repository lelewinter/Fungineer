---
date: 2025-04-13
tags: [MCP, agents, RAG, Anthropic, projetos, workflow, book writer, audio RAG, multi-agent]
source: https://x.com/_avichawla/status/1911306413932163338
autor: "Avi Chawla"
tipo: zettelkasten
---

# 10 Projetos de MCP, AI Agents, e RAG — Com Código Completo

## Resumo

Avi Chawla compilou 10 projetos production-ready demonstrando padrões modernos de IA: MCP (Model Context Protocol) servers, agentes multi-step, e RAG (Retrieval-Augmented Generation). Cada projeto inclui código completo, explicações passo-a-passo, e workflows visuais. Serve como blueprint para construir sistemas IA escaláveis e compostos.

## Explicação

**Os 10 Projetos:**

**1. MCP-Powered Agentic RAG**
- Tipo: RAG + MCP + Agentes
- Descrição: Sistema que combina busca em base de vetores com MCP servers
- Use case: Busca documentos relevantes + cai back para web search se necessário
- Stack: Vector DB, MCP Client, LLM
- Aprendizado: Como orquestrar fallbacks em sistemas RAG

**2. Book Writer - Agentic Workflow**
- Tipo: Multi-agent workflow
- Descrição: Escrever livro de 20K palavras a partir de título de 3-5 palavras
- Arquitetura:
  - Planning Agent: Cria outline do livro
  - Research Agent: Pesquisa capítulos
  - Writing Agent: Escreve cada capítulo
  - Review Agent: Revisa e refina
- Stack: DeepMind's Gemma 3, Agentic loop
- Aprendizado: Como decompor tarefas grandes em subtarefas

**3. RAG over Audio**
- Tipo: RAG para conteúdo de áudio
- Descrição: Ingesta podcasts, palestras, aulas, faz busca semântica
- Pipeline:
  - Transcrição: AssemblyAI converte áudio em texto
  - Embedding: DeepSeek chunking + embedding
  - Search: Busca vetorial no conteúdo
  - Retrieval: Retorna transcrição + timestamp
- Aprendizado: Como lidar com contexto longo (podcasts 2-3 horas)

**4-10. Outros Projetos Mencionados (Implícitos na Thread)**
A thread menciona mais 7 projetos cobrindo:
- Multi-agent systems (orquestração)
- RAG avançado (com feedback loops)
- MCP server customizado
- Integração com ferramentas externas
- Fine-tuning workflows

**Padrões Comuns:**

**MCP (Model Context Protocol) Pattern**
- Define schemas para inputs/outputs
- Server expõe tools via MCP
- Agent descobre e usa tools automaticamente
- Permite composição modular

**Agentic Pattern**
- Agent recebe tarefa
- Planeja steps ou pensa em voz alta
- Usa tools/MCP servers para executar
- Itera até atingir objetivo

**RAG Pattern**
- Query entra
- Busca em knowledge base (vetorial, BM25, etc.)
- Retrieves documentos relevantes
- LLM sintetiza resposta com contexto
- Fallback para fontes alternativas se necessário

## Exemplos

**MCP-Powered RAG (Projeto 1):**
```
User: "O que disse o CEO sobre estratégia 2025?"

1. Query embedda e busca em vector store
2. Se pontuação confiança > threshold: retorna documentos
3. Se não: MCP server faz web search por "CEO strategy 2025"
4. LLM sintetiza ambas as fontes
5. Retorna resposta com citações
```

**Book Writer Workflow (Projeto 2):**
```
User Input: "Inteligência Artificial em Saúde"

Planning Agent Output:
- Capítulo 1: Fundamentos de IA
- Capítulo 2: Aplicações em Diagnóstico
- Capítulo 3: Ética e Regulação
- ... (30 capítulos total)

Research Agent: Pesquisa cada capítulo
Writing Agent: Escreve 600-800 palavras por capítulo
Review Agent: Refina prosa, fact-checks

Output: Livro de 20K palavras pronto
```

**RAG over Audio (Projeto 3):**
```
Input: Podcast 3 horas sobre Machine Learning

1. AssemblyAI transcreve em tempo real
2. Documento chunked em 500-token segments
3. Cada chunk embedda e armazenado com timestamp
4. Query: "Qual framework o expert recomendou?"
5. Busca encontra chunk relevante
6. Retrieves transcrição + "Jump to 1:23:45"

Output: Resposta + link para exato momento no podcast
```

## Relacionado

[[Claude Code - Melhores Práticas]]
[[Indexacao de Codebase para Agentes IA]]
[[6-melhores-mcp-servers-assistente-ia-local]]

## Perguntas de Revisão

1. Como o MCP Protocol simplifica a composição de ferramentas em agentes?
2. Qual é a vantagem de um multi-agent workflow vs. um single agent com muitas tools?
3. Como você estruturaria RAG para conteúdo multimodal (texto + imagem + áudio)?

## Arquivos & Links
Todos os 10 projetos incluem:
- Código-fonte completo (GitHub)
- Walk-through passo-a-passo
- Diagramas de arquitetura
- Instruções setup
