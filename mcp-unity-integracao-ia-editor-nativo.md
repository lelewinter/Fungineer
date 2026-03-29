---
date: 2026-03-28
tags: [ia, ferramentas, unity, mcp, desenvolvimento-de-jogos, automação]
source: https://github.com/CoderGamester/mcp-unity, https://x.com/ErickSky/status/2036234646397051336?s=20
autor: CoderGamester, "@ErickSky"
tipo: zettelkasten
---

# MCP Unity: Integração de IA no Editor Unity com 100+ Ferramentas Nativas

## Resumo

Plugin que implementa Model Context Protocol (MCP) para Unity Editor, permitindo que assistentes de IA como Claude Code, Cursor, Windsurf e Gemini interajam diretamente com projetos Unity. Fornece 100+ ferramentas para manipular GameObjects, componentes, cenas e assets. Uma única linha de código expõe QUALQUER método C# como tool de IA, revolucionando game development com automação de construção, testes e debugging.

## Explicação

### Arquitetura e Funcionamento

MCP Unity funciona como uma ponte entre o Unity Editor e um servidor Node.js que implementa protocolo MCP. Assistentes de IA executam operações dentro do Editor através de integração automática com IDEs (VSCode, Cursor, Windsurf, Google Antigravity), adicionando pasta Library/PackedCache do Unity ao workspace e melhorando autocompletar e informações de tipo para pacotes Unity.

### Capacidades Revolucionárias

O maior diferencial: com UMA ÚNICA LINHA você converte QUALQUER método C# em tool que IA pode usar. Não requer reescrita de métodos existentes — seus sistemas C# viram tools automaticamente. Isto é não-invasivo, universal e poderoso: acesso total à lógica do jogo sem modificação.

### Ferramentas Disponíveis (100+)

**Operações de menu e seleção:** execute_menu_item, select_gameobject

**Operações de GameObject:** update_gameobject, duplicate_gameobject, delete_gameobject, reparent_gameobject, get_gameobject

**Transformações:** move_gameobject, rotate_gameobject, scale_gameobject, set_transform

**Componentes:** update_component, create_material, assign_material, modify_material, get_material_info

**Pacotes e assets:** add_package, add_asset_to_scene

**Cenas:** create_scene, load_scene, delete_scene, save_scene, get_scene_info, unload_scene

**Testes:** run_tests

**Utilitários:** send_console_log, get_console_logs, recompile_scripts, batch_execute

### Recursos de Inteligência Contextual

- **unity://menu-items**: lista itens de menu
- **unity://scenes-hierarchy**: lista GameObjects na hierarquia
- **unity://gameobject/{id}**: informações detalhadas
- **unity://logs**: logs do console
- **unity://packages**: pacotes instalados
- **unity://assets**: assets no AssetDatabase
- **unity://tests/{testMode}**: informações sobre testes

### Aplicações Práticas

**Em AAA Game Development:** ajustes rápidos de gameplay, testes de balance, prototipagem de mechanics

**Em Indie Development:** aceleração dramática do pipeline, menos necessidade de equipe grande, foco em criatividade versus codificação

**Em Live Service Games:** hot fixes automáticos, testes de patches antes de deploy, balance adjustments rápidos

**NPCs Inteligentes:** tomam decisões complexas, respondem a situações dinâmicas, aprendem com ambiente

**Debugging em Runtime:** IA debugga jogo enquanto roda, identifica problemas em tempo real, corrige certos issues automaticamente

### Impacto na Produtividade

Workflow completo: IA constrói feature/código → IA testa automaticamente → IA encontra e corrige bugs → você trabalha em outros contextos. Velocidade de desenvolvimento pode ser multiplicada por 5-10x com IA construindo, testando e corrigindo enquanto você trabalha.

## Exemplos

### Requisitos e Compatibilidade

**Requisitos Técnicos:**
- Unity 6 ou posterior
- Node.js 18 ou posterior
- npm 9 ou posterior

**IDEs Compatíveis:** Cursor, Windsurf, Claude Desktop, Claude Code, Codex CLI, GitHub Copilot, Google Antigravity

### Instalação via Unity Package Manager

1. Window > Package Manager
2. Clicar "+" no canto superior esquerdo
3. Selecionar "Add package from git URL..."
4. Inserir: `https://github.com/CoderGamester/mcp-unity.git`
5. Clicar "Add"

### Configuração Cliente LLM via Editor

1. Tools > MCP Unity > Server Window
2. Clicar "Configure" para cliente de IA
3. Confirmar instalação

### Configuração Manual para Cursor/Windsurf/Claude Code

```json
{
  "mcpServers": {
    "mcp-unity": {
      "command": "node",
      "args": ["ABSOLUTE/PATH/TO/mcp-unity/Server~/build/index.js"]
    }
  }
}
```

### Iniciar Servidor

1. Abrir Unity Editor
2. Navegar para Tools > MCP Unity > Server Window
3. Clicar "Start Server"
4. Abrir IDE de codificação IA e começar a executar ferramentas

### Configurações Opcionais

- Porta WebSocket (padrão 8090)
- Timeout (padrão 10 segundos)
- Conexões remotas

### Build Manual do Servidor Node.js

```bash
cd ABSOLUTE/PATH/TO/mcp-unity/Server~
npm install
npm run build
node build/index.js
```

### Depuração com MCP Inspector

```bash
npx @modelcontextprotocol/inspector node Server~/build/index.js
```

### Exemplo de Exposição de Método C#

Com uma única linha de atributo, qualquer método C# vira tool:

```csharp
[MCPTool("myCustomMethod")]
public void MyCustomMethod(string parameter)
{
    // Seu código aqui
}
```

## Relacionado

- [[ComfyUI Posicionamento Agent Wave]]
- [[Claude Code - Melhores Práticas]]
- [[Indexacao de Codebase para Agentes IA]]
- [[Editor 3D Open Source para Construcao Arquitetonica]]

## Perguntas de Revisão

1. Como uma única linha de código pode expor QUALQUER método C# como tool de IA?
2. Por que a capacidade de expor métodos sem reescrita é transformadora para game development?
3. Qual é a conexão entre MCP Unity e o padrão MCP em geral (ComfyUI, outros)?
