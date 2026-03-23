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

Not yet configured. Use `/perf-profile` to set targets.

## Testing

- **Framework**: GUT (Godot Unit Testing)
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns / Allowed Libraries / ADRs

None configured. Use `/architecture-decision` to add entries as decisions are made.
