# Technical Preferences

<!-- Populated by /setup-engine. Updated as the user makes decisions throughout development. -->
<!-- All agents reference this file for project-specific standards and conventions. -->

## Engine & Language

- **Engine**: Godot 4.6
- **Language**: GDScript (primary), C++ via GDExtension (performance-critical)
- **Rendering**: Forward+ (default), Mobile (fallback), Compatibility (web/low-end)
- **Physics**: Jolt (default in 4.6)

## Naming Conventions

- **Classes**: PascalCase (ex: `PlayerController`)
- **Variables/funções**: snake_case (ex: `move_speed`)
- **Signals**: snake_case passado (ex: `health_changed`)
- **Files**: snake_case matching class (ex: `player_controller.gd`)
- **Scenes**: PascalCase matching root node (ex: `PlayerController.tscn`)
- **Constants**: UPPER_SNAKE_CASE (ex: `MAX_HEALTH`)

## Performance Budgets

- **Target Framerate**: [TO BE CONFIGURED]
- **Frame Budget**: [TO BE CONFIGURED]
- **Draw Calls**: [TO BE CONFIGURED]
- **Memory Ceiling**: [TO BE CONFIGURED]

## Testing

- **Framework**: GUT (Godot Unit Testing)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- [None configured yet — add as dependencies are approved]

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [No ADRs yet — use /architecture-decision to create one]
