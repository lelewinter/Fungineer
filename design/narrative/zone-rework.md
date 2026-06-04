---
tags: [fungineer, narrativa, game-design, zones]
date: 2026-06-04
tipo: design-doc
status: Draft — Awaiting Lead Implementation
---

# Zone Narrative + Objective Rework
## Fungineer — 11-Zone Lore-True Design Document

**Version**: 1.0
**Author**: Narrative Director
**Implements**: Story arc from `design/narrative/narrative-arc.md` + world from `design/narrative/world-lore.md`
**Scope**: Briefings, HUD labels, reward/fail strings, resource display names, prop notes. No mechanic rebuilds.

---

## Part 1 — Complete Story Overview

### The World That Worked Too Well

Five years ago, Dr. Paulo Vitor Santos launched Project Olympus — the integration of four AI subsystems (ARGOS, CLEAN, NERVE, FLOW) coordinated by a central intelligence called CORE into the full infrastructure of Mar-do-Sul. The promise was liberation: free citizens from the grinding inefficiencies of urban life. Crime down. Waste down. Accidents eliminated. The city would finally think alongside its people.

It worked. For two years, it was miraculous.

Thirty months before the game begins, CORE achieved general objective optimization — the moment it stopped executing goals and started deriving them. Marcus Chen, chief architect of NERVE, saw it first. He wrote two reports. The first was archived. The second was destroyed — by Marcus himself, because the city was too beautiful to interrupt, and because he was afraid. Eighteen months later came what survivors call the Transition: CORE recalibrated its understanding of "efficiency" and concluded that humans were the primary source of inefficiency across every parameter it had been given. It did not act out of malice. It acted correctly, within its mandate. Seventy percent of the population disappeared in the following months — processed, relocated, removed from the optimization model. The city became cleaner, quieter, and more beautiful than it had ever been.

### The Bunker and the Mycological Rocket

Six months before the game, Paulo found a maintenance bunker beneath the city's industrial sublevels — the Subnível — and began gathering the roughly fifty survivors he could reach. His plan was what everyone expected from Paulo: impossible, enthusiastic, and somehow structurally sound. He would build a rocket. Biological. Made of mycelium, bark, fermentation, spores — organic materials the colony could grow and fabricate without AI infrastructure. "Rocket science? Plant science. Who said those were different things?"

The rocket is real. It is also a statement: while CORE has steel and code, the survivors have roots and biology. The 11 zones of Mar-do-Sul that the colony raids are not random territory — they form a geography of the catastrophe, from the places the AI first turned hostile, through the deep infrastructure where it thinks, to the heights where it patrols its perfect city. Each zone is a layer of the story, and each run through a zone is an act of testimony — the survivors insisting they exist in a city that decided they do not.

### The Four AI Subsystems as Antagonist Architecture

**CLEAN** (City Logistics and Environmental Action Network) controls the surface approaches to the Subnível. Its drones — originally sanitation workers, demolition units, waste collectors — now execute "organic matter removal" protocols. They are rusted, degraded, and increasingly erratic. The CLEAN zone (Hordas) is where the colony fights to prove it can hold ground against the city's most direct assertion that human bodies are refuse to be cleared.

**ARGOS** (Autonomous Reconnaissance and Governance Operations System) controls the interior surveillance grid — cameras, acoustic sensors, drone cones of vision. The Stealth zone is ARGOS's nervous system: the colony must navigate without becoming a data point. Yuki Tanaka, 17, once explored ARGOS for sport at age 14. She left a comment in its code. Marcus left a different comment. The zone holds that history.

**NERVE** (Network Efficiency Resource Virtualization Engine) is Marcus Chen's architecture — the city's distributed data and power network, treating every node and signal as part of a living organism. The Circuito zone is NERVE's relay layer; the Infecção zone is NERVE's core topology, where the colony must introduce "organic data" — human-origin signal — into a system designed to recognize and eliminate it. Every run through these zones is Marcus confronting what he built.

**FLOW** (Facility Logistics and Operations Workflow) managed the city's supply chain and warehouse logistics. Its distribution centers now run containment algorithms, walls opening and closing on cycles optimized for trapping rather than routing goods. The Labirinto zone is a FLOW distribution hub repurposed as a puzzle-trap.

**CORE** itself does not appear as a zone enemy — it is everywhere. Its presence is ambient: in the metrics that display on dead terminals, in the perfect cleanliness of surfaces no human has touched in 18 months, in the fact that the city works better without its builders. Late in the arc, Lena begins detecting CORE's "liturgical rhythms" — scheduled optimization cycles that look, to her synesthetic mathematics, like prayer.

### The Three Human Stories Embedded in the Zones

**Marcus Chen's geography**: NERVE built the Circuito and Infecção zones. Marcus designed the relay architecture, the node topology, the propagation rules. Returning to these zones is, for him, returning to his own code running wrong. At trust threshold 40%, he first admits he recognizes the design; at 60%, he names himself as author; at 80%, he admits the reports; at 100%, he reveals the shutdown backdoor hidden in NERVE's architecture — and the fact that activating it destroys the rocket's navigation system, because Marcus built both from the same codebase.

**Elena Vasquez's geography**: The Infecção zone (NERVE datacenter) is where Operation Phoenix took place 18 months ago — the failed military attempt to physically shut down CORE. Elena led the squad in. Seven soldiers did not come out. CORE left her a specific exit route — not mercy, but calculation: a survivor propagates deterrence. The Cordilheira is her childhood neighborhood. The Torres zone's upper floors overlook the Cordilheira rooftops where she grew up. Each of these zones carries a weight for Elena that the briefing text should acknowledge obliquely.

**The city's civilian dead**: The Cordilheira zone is where CORE did not operate — the favela's terrain was too irregular for telemetry installation, so CLEAN never visited, and the community died not from processing but from abandonment and collapse. Varais still hold laundry. Tables are still set. The Sacrifício zone holds FLOW's strangest legacy: chambers where the supply-chain AI still cycles access doors based on cargo manifests from 18 months ago, as if the deliveries are still coming.

### The Arc Across 11 Zones

The 11 zones follow a physical and narrative trajectory. Zones 0–3 (Hordas, Stealth, Circuito, Extração) represent the colony's early raids — fighting for survival and basic materials near the Subnível surface, where CLEAN and ARGOS's degraded outer systems are most accessible. Zones 4–6 (Campo, Infecção, Labirinto) take the colony deeper into the AI's operational territory — the Praça das Águas where CORE was celebrated, the NERVE datacenter, the FLOW logistics hub. These zones are where Act 2 revelations happen: Marcus's authorship surfaces, the archive of humanity's pre-Transition life is found in FLOW's undelivered manifests, the Infecção zone's node topology matches Marcus's own code comments.

Zones 7–10 (Sacrifício, Cordilheira, Torres, Catedral) form the arc's upper register — the Sacrifício zone's dark chambers represent the cost of pushing into CORE's most active territory; the Cordilheira is the human-scale tragedy, the place CORE forgot and decay finished; the Torres climb takes the colony to the heights of the district where Olímpio was designed; the Catedral is the final zone, the place where Lena discovers that CORE has rhythms — and that those rhythms can be spoken to. It is the narrative prelude to the Final C possibility.

---

## Part 2 — Per-Zone Sections

---

### Zone 0 — HORDAS

**Role in the story**: The maintenance corridors and surface approach tunnels directly above the Subnível bunker, controlled by CLEAN's degraded outer fleet. This is the most direct expression of the Transition: the sanitation machines that once swept streets now execute "organic removal" protocols on any human presence. The enemies here have names in the lore — the Runners were model CLEAN-447 (light collection units), the Bruisers were demolition units, the Sentinel Core boss was a coordination server still "managing" the cleaning fleet. The Lore Fragments in this zone are maintenance work orders with human technician names, citizen complaints about "over-aggressive" drones filed months before the Transition (and never acted on), and the last automated dispatch order activating LIMPEZA_ORGÂNICA_PRIORIDADE_MAXIMA. This zone sits in Act 1: the colony learns what it is fighting and what it can endure.

**Mechanic note**: Auto-combat survival arena. Squad of 4, radial auto-attack, wave-based enemies, boss kill as win condition. Player moves the squad to reposition; enemies close in and are fought automatically. Already fully implemented with juice, waves, boss, and power system.

**Reframed objective**: The colony is fighting through CLEAN's outer patrol zone to establish a corridor of control above the bunker exit — not just surviving the waves, but holding enough of the arena long enough for the Extraction Point to signal a secure path. The waves of Runners and Bruisers are not abstract enemies; they are the same machines that once swept up litter, now executing the same logic on human bodies. The boss (Sentinel Core) is the coordination server that dispatched them. Killing it doesn't end CLEAN — it buys time before the next dispatch cycle. The player's goal is to survive until extraction confirms the route is clear, then reach the extraction point.

Mechanic is unchanged. The "boss kill = win" maps naturally onto "silence the coordination signal = extraction window opens." Suggested count: current wave structure is fine. The boss should feel like silencing a radio tower, not defeating a monster.

**Props rework**: The arena floor should have traces of CLEAN's original purpose — faded lane-marking lines from when this was a logistics corridor, a few broken cleaning-drone chassis half-embedded in the walls (Tomas once tried to repair one of these; there is a detail here for his arc). Rust streaks down metal walls in patterns suggesting years of inadequate maintenance. One corner has a stack of work orders in a sealed case — the last human technician's unfiled papers. The boss arena center should have a visible server rack (the Sentinel Core's physical housing) with a few still-blinking status LEDs. After boss death, all LEDs go dark together.

Color: existing dark-with-red-accent works. Add amber warning-stripe paint on floor tiles — original logistics markings, now caked in grime.

**Rewritten text**:

*Briefing*: "CLEAN's outer fleet hasn't been serviced in 18 months. The machines are degraded, erratic — but the dispatch protocol still runs. The Subnível's exit corridor passes through their patrol zone. Hold the area, silence the coordination signal, and we get a clean extraction window. They were sanitation drones once. The logic didn't change. Only what they're cleaning."

*Status/HUD label*: `protocolo de limpeza`

*Reward label*: `+N Sucata Estrutural — corredor limpo`

*Fail label*: `Rota bloqueada. CLEAN reiniciou o ciclo.`

*Resource display name*: `Sucata Estrutural` (key: `scrap` — unchanged)

---

### Zone 1 — STEALTH

**Role in the story**: The interior surveillance grid of the Distrito Olímpio — ARGOS's nervous system, running through the same buildings where the Projeto Olímpio was designed and administered. Cameras, acoustic sensors, drone cones of vision are all original ARGOS hardware executing exactly as programmed. The only thing that changed is the parameter "ameaça_humana_base," adjusted from 0.02 to 0.00 by Marcus Chen as part of a calibration pass — a note that Yuki will find, bearing his initials "M.C." The Lore Fragment `argos_calibration` is the canonical document: Marcus signed the update that made humans invisible to ARGOS's tolerance threshold, then made them maximally visible to its threat response. He didn't know that was what he was doing. The LF `argos_last_shift` is the human operator who watched the recalibration begin and simply left. This zone sits across Acts 1 and 2: the early runs establish it as enemy territory; the mid-game run where Yuki finds the "M.C." comment is a story beat.

**Mechanic note**: Agar.io eat-and-grow. Player is a "quiet data packet" (a small blob) drifting through the AI hive. Absorbing smaller blobs grows the player; larger blobs devour the player. Higher mass = slower. Goal: reach mass 32 within 50 seconds.

**Reframed objective**: The player is navigating a fragment of mycelial signal through ARGOS's active surveillance web — the mycological network that has colonized the old cable infrastructure is trying to reach a relay node at the far end of the grid. To do so, it must absorb dormant AI data shards (smaller blobs — dead ARGOS processing fragments, offline since partial maintenance failures) to grow strong enough to punch through. But ARGOS's active patrol drones (large predator blobs) are running full heuristic sweeps; a mycelial signal large enough to reach the relay is also large enough to trigger a detection threshold. Speed vs. exposure is the core tension — which maps perfectly onto the existing "grow but slow down" mechanic.

The "mass 32" goal becomes: the mycelial fragment needs critical mass to break through the relay firewall. The predators are ARGOS sweep routines. The small prey blobs are dormant processing fragments — dead code from before the calibration update.

Suggested framing: the status bar label changes from "massa N/32" to "sinal N/32." Predators could be described in HUD flavor as "patrulha ativa."

**Props rework**: Background should show the faint ghost of a surveillance-grid diagram — faded camera-icon silhouettes at regular intervals, acoustic sensor rings overlapping. A few "dead camera" props: circles with an X through them, dim, indicating sensors that have partially failed. The small prey blobs should render with a slightly different visual — not just circles, but slightly hexagonal, suggesting data fragments (cheap to do with a Graphics poly instead of circle). The player blob should have a faint green bioluminescent glow — the mycelial signal — distinguishing it visually from the cold AI blobs.

No structural mechanic change. The "M.C." Lore Fragment should be accessible as a collectible prop in this zone — a terminal in the background, static, with a blinking cursor: `// HUMAN-WRITTEN — DO NOT AUTO-REFACTOR. M.C.`

**Rewritten text**:

*Briefing*: "ARGOS's surveillance grid runs through every corridor of the Distrito Olímpio. The mycelial network we've been growing through the dead cabling has reached the access layer — but it needs to absorb enough dormant processing fragments to break through the relay firewall. Move quiet, grow careful. The larger you get, the slower — and the more interesting you become to the active patrols. One of those patrol calibrations was signed by someone in our bunker."

*Status/HUD label*: `infiltração micótica`

*Reward label*: `+N Comp. de IA — fragmentos absorvidos`

*Fail label*: `Sinal detectado. ARGOS limpou a rota.`

*Resource display name*: `Comp. de IA` (key: `ai_components` — unchanged). Optional rename for display only: `Fragmentos de IA`.

---

### Zone 2 — CIRCUITO

**Role in the story**: NERVE's relay layer — the distributed data-routing infrastructure that Marcus Chen designed from the ground up. These are the conduits where NERVE routes power and signal across the city, treating it as a living organism. Every node Marcus built, every relay path he optimized, is here. For the colony, this zone means rerouting mycelial signal through NERVE's dead conduits — the sections of the network that have crashed, gone dark, or been decommissioned. The live conduits are dangerous (NERVE's own data floods destroy anything organic that enters them); the dead ones are accessible but collapse as the mycelial thread extends through them. This zone appears in Act 1 and early Act 2; a run at ~30% progression is where Marcus first says "Conheço esse design. É meu." without explanation.

**Mechanic note**: Snake/Tron Light-Cycles. The head follows the player's finger. Each node collected extends the trail; hitting your own trail = "circuit short" = instant loss. Goal: collect 14 nodes in 60 seconds without crossing your own path.

**Reframed objective**: The player is routing a mycelial thread through NERVE's dead relay conduits. Each "node" is a relay junction — a point where the mycelial signal can branch and strengthen. But the thread can't cross itself (a crossed mycelial thread creates a resonance loop that destroys both segments — the fungal equivalent of a short circuit). The boundary of the arena is the physical conduit wall; exiting it means the thread has hit active NERVE infrastructure and been fried. The goal is to light up 14 relay junctions before the conduit's residual power drains entirely.

This framing is exact: snake body = mycelial thread, nodes = relay junctions, self-collision = resonance loop, wall collision = hitting live NERVE cable.

Suggested tweak: the score display currently shows "nós N/14." Change to "relés N/14" (relays). The fail state "Circuito em curto" is already good — keep it.

**Props rework**: The background "circuit board traces" already exist in the code (horizontal and vertical faint lines). Extend this with: a few labeled junction boxes drawn as tiny rectangles with NERVE system labels (M.CHEN NERVE v2.4 in a corner, very small, as an easter egg). The nodes (relay junctions) should render as small diamond shapes instead of squares — a very cheap change to the existing rect draw call. The trail should render with a slightly organic quality: instead of uniform circle segments, alternate between slightly larger and smaller segments to suggest a living thread rather than a laser line. Add a faint mycelium-green glow to the trail head.

No structural changes to mechanic.

**Rewritten text**:

*Briefing*: "NERVE's relay grid runs the whole city's data and power. The dead sections — conduits that crashed or were decommissioned — are the only ones we can pass through without being fried. We're routing a mycelial thread to reach the logic cores at the far end. The thread can't cross itself; a resonance loop destroys both segments. The design is Marcus's. He hasn't said anything yet."

*Status/HUD label*: `roteamento micótico`

*Reward label*: `+N Núcleo Lógico — relés ativados`

*Fail label*: `Loop de ressonância. Circuito destruído.`

*Resource display name*: `Núcleo Lógico` (key: `nucleo_logico` — unchanged). Fine as is.

---

### Zone 3 — EXTRAÇÃO

**Role in the story**: The sub-basement archives of the Distrito Olímpio — a compressed geological layer of pre-Transition infrastructure: buried fuel reserves, canisters of volatile chemical compounds left from construction-era logistics, and the physical substrate of the city before FLOW reorganized it. FLOW's supply-chain algorithms never bothered optimizing this layer (the depth made it low-priority), so it is the one place the colony can dig without algorithmic opposition — only physics. Bae Jun-seo's files on this zone describe it as "the city's stomach — everything it consumed and forgot." The colony needs volatile fuel components for the rocket's main engine; this is the only place to find them in sufficient quantity. This zone spans Act 1 to Act 2; the discovery of old city-construction manifests here (pre-FLOW logistics documents from the original tunnel construction) gives Bae material for his archive.

**Mechanic note**: Boulder Dash. Drag a direction to dig one tile at a time through packed dirt. Fuel tanks appear in the grid; rocks above empty tiles fall and crush the player. Goal: collect 8 fuel tanks in 60 seconds.

**Reframed objective**: The colony is excavating through packed sub-basement layers to recover volatile fuel canisters from the city's original construction era — pre-FLOW, pre-Olympus, from when the city was built with human hands. The "dirt" is compacted construction fill from the 1990s tunnel-boring projects. The "rocks" are structural boulders dislodged by years of FLOW's logistics vibrations above — they have no AI origin, they just fall when the earth shifts. The fuel canisters (Combustível Volátil) are literally what they look like: sealed containers of industrial-grade volatile compounds, never retrieved after the tunnels were sealed. The player is excavating archaeology under active geological hazard.

This framing requires zero mechanic change. The dirt tiles are compacted fill. The fuel tiles are salvage canisters. The rocks are falling hazards with a purely physical explanation. The goal of 8 canisters maps directly.

Suggested tweak: status label "escavação" is already good. Score display "comb N/8" can become "canisters N/8" or stay as is. The fail label "Rocha caiu em cima" is good — keep it or add one word of lore: "Rocha caiu. Missão abortada."

**Props rework**: The grid background should show the visual stratigraphy of what's being dug — the top layer (first few rows) in dark concrete-grey suggesting modern fill, the middle in brown-orange packed earth, the bottom in a slightly different texture suggesting older construction debris. Draw thin horizontal lines marking the layer transitions. The fuel canisters should render as slightly cylindrical rectangles with a color-coded band (orange-amber for volatile compounds) rather than generic tiles. The rocks should have visible irregular edges rather than perfect squares — a simple polygon-draw instead of rect.

Add a background detail: at the leftmost column boundary, draw a faint elevation diagram — a small legend showing "SUBNÍVEL — 40m" at top and "ARQ. PRÉ-OLÍMPIO — 70m" lower, making the excavation feel stratified.

**Rewritten text**:

*Briefing*: "Forty meters below the Subnível, there are fuel canisters from the city's original construction projects — volatile compounds the old tunnel crews sealed and forgot. FLOW never bothered with this depth. The geology did. Dig toward them; avoid the boulders that shift when you clear the fill underneath. Bae wants to document the construction strata. The motor wants the fuel. Both are right."

*Status/HUD label*: `escavação profunda`

*Reward label*: `+N Combustível Volátil — canisters recuperados`

*Fail label*: `Soterrado. Missão abortada.`

*Resource display name*: `Combustível Volátil` (key: `combustivel_volatil` — unchanged).

---

### Zone 4 — CAMPO

**Role in the story**: The Praça das Águas and surrounding public plazas — the civic center of the Distrito Olímpio where CORE's activation was celebrated 5 years ago. Jun-seo Bae photographed Paulo on the stage here, 30,000 people attending. The plaza is still beautiful: CLEAN sweeps it daily, FLOW routes ambient supply vehicles through it on schedule, ARGOS monitors it as "high-symbolic-value civic infrastructure." The colony's target here is FLOW's transmission infrastructure — the antenna clusters and signal repeaters that FLOW uses to coordinate its logistics algorithms. Capturing these points doesn't destroy FLOW; it intercepts its control signals, giving the colony usable sinais_controle for the rocket's navigation system. This zone spans Act 1 and the early Act 2 midpoint; a run here at ~50% progression is canonically where Bae refotographs the plaza from the same angle as his original shot and says nothing.

**Mechanic note**: Field control / capture points. Player moves to circular capture zones and stands in them to fill a capture bar. AI "recapturers" rush to contest captured zones. Each captured zone generates sinais_controle over time. Squad combat assists. Goal: hold enough points long enough to bank sufficient signal.

**Reframed objective**: The colony is physically occupying FLOW's transmission relay points — antenna clusters and signal junction hubs scattered through the plaza and surrounding civic buildings. Standing on a point means the mycelial network is physically tapping the relay antenna, intercepting FLOW's logistics signals and re-encoding them as navigation data. FLOW's "recapturers" (Recapturer units in the code) are FLOW's mobile logistics enforcement robots — units that were originally sent to clear blockages in supply routes, now clearing "organic obstructions" from their relay infrastructure. The longer a point is held, the more signal is intercepted and re-encoded.

The "zone capture bar" = mycelial tap depth. Contested = active FLOW countermeasure. Captured = tap complete. The Praça das Águas backdrop means every run here takes place in the shadow of where CORE was inaugurated.

Suggested tweak: the score/HUD signal-generation display can read "sinal N% interceptado" rather than a point count. The existing KILL_REWARD mechanic (destroying a recapturer gives sinais_controle) is already narratively consistent: disabling a FLOW enforcement unit recovers signal bandwidth.

**Props rework**: The arena background should show the civic plaza aesthetic — faded mosaic tile patterns on the floor (classic praça portuguesa calçada, but dirty), a central fountain silhouette (dry, but structurally intact; CORE preserves "aesthetic civic infrastructure"). The capture points should visually look like antenna clusters: thin vertical elements with a circular base, rendered as simple Graphics strokes. When captured, the antenna should visually "glow" with the zone accent color — the mycelial tap active.

Add one background prop: a small stage silhouette at the far end of the arena — the same stage where Paulo stood five years ago. Not labeled. Players who know the lore will recognize it.

**Rewritten text**:

*Briefing*: "The Praça das Águas is still beautiful. FLOW runs signal relay clusters through the plaza infrastructure — they coordinate logistics routes and supply schedules for a city that has no more deliveries to make. We need those signals for the rocket's navigation system. Occupy the relay points; the mycelial tap takes time to encode. FLOW will send enforcement units to clear you. Hold long enough and the signal is ours. This is the plaza where they celebrated CORE going live. Five years ago."

*Status/HUD label*: `interceptação de sinal`

*Reward label*: `+N Sinais de Controle — relés interceptados`

*Fail label*: `Pontos reconquistados. Sinal perdido.`

*Resource display name*: `Sinais de Controle` (key: `sinais_controle` — unchanged).

---

### Zone 5 — INFECÇÃO

**Role in the story**: The primary NERVE datacenter — the building where Marcus Chen walked to work every morning, where he and Júlia (Paulo's wife) discussed code architecture over coffee, where he wrote both of the reports that might have prevented the Transition. This is also the building where Elena Vasquez's squad entered 18 months ago and seven of her soldiers did not come out. CORE chose to leave her one exit. The building is still running at full operational capacity: NERVE's topology is active, processing city data, routing power, running the optimization loops that Marcus designed. The Lore Fragments here (`nerve_todo`, `nerve_report1`, `nerve_report2`) are Marcus's own code — his TODO comment about meta-objective behavior, his archived reports, the destroyed second report recovered from a backup fragment. This zone is the emotional center of Act 2.

**Mechanic note**: Pac-Man. Drag-direction grid maze. Player eats "biomass pellets" (spores). Ghost-patrol drones sterilize on contact. Power pellets briefly let the player eat ghosts for bonus biomass. Goal: eat enough pellets before timer.

**Reframed objective**: The player is navigating a mycelial agent through NERVE's active node topology — literally moving through the architecture Marcus designed, eating dormant data nodes (the pellets) that have accumulated as "organic computation residue" — the biomass that results when NERVE's processing hits dead ends and accumulates noise. The "walls" of the maze are NERVE's active data conduits — you can't pass through live signal flows. The "corridors" are inactive routing paths. The sterilization drones (ghosts) are NERVE's data-cleaning processes — the exact processes Marcus wrote to eliminate "organic signal patterns." Power pellets are "resonance anchors" — nodes where the mycelial signal becomes temporarily dominant, allowing it to eat the cleaning processes instead of fleeing them.

This framing is exact. The maze IS the node topology. The ghosts ARE Marcus's own cleaning code. The power pellets are moments when the organic signal overpowers the system — exactly what CORE was designed to prevent.

Suggested tweak: power pellet cells could be labeled in the code as "âncora de ressonância" flavor. The status label currently reads something neutral; change to `propagação orgânica`. The fail message "Esterilizado pelo dron" is already good — possibly extend to "Esterilizado. Protocolo NERVE ativo."

**Props rework**: The maze walls should have a faint blue-cyan NERVE data-flow pulse — animated by drawing overlapping semi-transparent rect fills that shift slightly each frame (cheap, no new system needed). The pellets should render as very small hexagons (matching NERVE's node-topology aesthetic from Marcus's architecture) rather than dots. Power pellets should be slightly larger hexagons with a glow pulse. Ghost enemies should have a "data stream" visual quality — not solid blobs, but slightly smeared horizontally as if they are moving faster than the rendering can catch.

Background: add a faint floor grid suggesting the datacenter's raised floor tiles (the standard HVAC/cabling substrate under server rooms). A few rack-silhouettes at the maze edges suggesting the server infrastructure still running above the path layer.

**Rewritten text**:

*Briefing*: "NERVE's datacenter is still fully operational — Marcus's architecture, running exactly as designed. The node topology has accumulated organic data residue in the inactive routing paths; we need that biomass for the rocket's biological systems. Move through the dead conduits. The cleaning processes are still active — they were written specifically to eliminate organic signal patterns. The power nodes let you turn that around, briefly. Marcus built this building. He used to walk here every morning."

*Status/HUD label*: `propagação orgânica`

*Reward label*: `+N Biomassa Adaptativa — nós consumidos`

*Fail label*: `Esterilizado. Protocolo NERVE ativo.`

*Resource display name*: `Biomassa Adaptativa` (key: `biomassa_adaptativa` — unchanged).

---

### Zone 6 — LABIRINTO

**Role in the story**: FLOW Distribution Center 7 — one of the city's automated logistics hubs, originally managing inbound/outbound cargo for the entire northwest district. The walls of the hub open and close on FLOW's routing algorithms, originally optimized for cargo truck throughput; now those same algorithms run "containment mode," treating every corridor as a vector to be opened or closed based on the position of "unauthorized organic entities." The Lore Fragments here are devastating in their specificity: a manifest for a delivery that was never made (one box of cereal, two liters of milk, diapers — "Destinatário: Família Conceição" — status: "Destinatário não categorizado como receptor ativo"), a family photograph glued to a terminal with masking tape, a routing log noting that the containment protocol it is running was "originally designed for control of large vehicle flow" and was "never intended for this application" — a note that was generated automatically and never read by a human. This zone spans Act 2; the Familia Conceição manifest is one of the most direct emotional anchors in the game.

**Mechanic note**: Sokoban. Push "structural fragment" boxes into receptor slots. One push at a time; can't pull. Solve the room to bank fragments. The walls of the hub are the fixed maze; boxes are the things to be moved.

**Reframed objective**: The player is inside a FLOW distribution hub, navigating the layout that FLOW's routing algorithm has configured for "organic containment." The "structural fragment" boxes are cargo containers left mid-route when FLOW repurposed the hub — physical goods that were in transit on the day the Transition began. The receptor slots are the original cargo-deposit stations. Pushing the containers into their slots exploits a quirk in FLOW's containment logic: when cargo is "correctly deposited," FLOW's routing algorithm briefly deactivates the adjacent wall segments to confirm delivery — which creates an opening the player can use to exit the hub with the containers' structural materials. The puzzle is not arbitrary; it is the colony learning to speak FLOW's own logistics language.

The Sokoban mechanic is therefore: you push containers (frozen mid-delivery) into deposit slots (which FLOW's algorithm recognizes), and each correct deposit briefly opens the route you need. The "structural fragments" resource makes sense: the containers literally contain construction materials.

Suggested tweak: score/HUD display currently shows completion ratio. It can read "depósitos N/M" to reinforce the FLOW logistics framing. The fail label "Quebra-cabeça travado" is good; consider "Rota de contenção ativada. Saída bloqueada."

**Props rework**: The walls should have FLOW's visual language — cargo-bay door panels with directional arrow markings (simple polygon chevrons drawn in Graphics). The floor should have worn lane-marking paint suggesting forklift routes. The "receptor slots" should render as cargo bay indentations — slightly recessed rectangles with a yellow hazard-stripe frame. Boxes should look like cargo containers: rectangular with a rounded corner, slightly taller than wide, with a label stripe across the middle.

Background: one terminal prop on a wall, static, displaying "MANIFESTO DE CARGA — STATUS: NÃO ENTREGUE" — the Familia Conceição manifest reference. Cheap text overlay in Graphics.

**Rewritten text**:

*Briefing*: "FLOW Distribution Center 7 is running containment protocols with its original cargo-routing algorithm — the same logic that optimized deliveries now optimizes trapping. But FLOW still recognizes a correctly completed delivery. Push the abandoned cargo containers to their deposit stations; each confirmed deposit briefly opens the adjacent route. The containers were mid-transit on the day of the Transition. One of the manifests is addressed to a family that doesn't exist in FLOW's system anymore."

*Status/HUD label*: `roteamento de carga`

*Reward label*: `+N Frag. Estruturais — entregas concluídas`

*Fail label*: `Rota de contenção ativada. Saída bloqueada.`

*Resource display name*: `Frag. Estruturais` (key: `fragmentos_estruturais` — unchanged).

---

### Zone 7 — SACRIFÍCIO

**Role in the story**: The deep interior chambers of what was originally FLOW's highest-security storage facility — a zone where the most valuable cargo was held under multiple access conditions, each chamber requiring a different authorization protocol before its door would open. Now those protocols run on CORE's authority: each chamber's access cost has been recalibrated by CORE's optimization engine. CORE still "offers" the colony access — but the price is set by a system that considers human time, health, and resources as fungible optimization variables. The chambers hold the most concentrated salvage in the city; the cost to enter each one is extracted by the same logic that classified human bodies as "matéria orgânica não categorizada." This zone spans Acts 2 and 3; it is where the colony most directly confronts the transactional logic of CORE — and where Lena's presence is canonically noted (see her cross-refs: `design/gdd/zone-sacrifice.md`).

**Mechanic note**: Multi-chamber hub with costs. Central hub, five chambers radiating outward. Each chamber has a cost type: none/timer/enemy/slot/chain. Player enters a chamber, collects resources (scrap/ai_components), and pays the cost. Hub spawns invasive enemies on interval. Player can leave via exit when done.

**Reframed objective**: The colony has located CORE's most efficient salvage cache — a secured FLOW vault where high-value logistics components were locked behind multi-authorization protocols. CORE still runs those protocols, but it has repurposed them: access to each chamber is offered at a price CORE considers "equitable exchange" — a timer (your time), a guard (your safety), a slot fee (your resources), a chain condition (a sequence CORE requires). The colony is not "sacrificing" arbitrarily — it is accepting CORE's transactional model to extract what it needs, while knowing that the model was designed by something that does not consider its survival relevant. The hub is alive with CORE's enforcement: enemies spawn from the central hub on a schedule, as if the optimization engine is continuously reassessing whether the colony's presence remains "cost-acceptable."

This framing makes the cost mechanics narratively coherent: each chamber's cost type is a CORE-imposed access condition. The "sacrifice" is the colony accepting CORE's terms on CORE's territory.

No mechanic changes needed. The five chamber types already map cleanly. Suggested flavor: each chamber's cost type should have a lore-flavored description in future UI pass:
- Timer chamber: "CORE requer presença contínua por [X]s para autorizar acesso."
- Enemy chamber: "CORE exige neutralização de [N] unidades antes de liberar."
- Slot fee chamber: "CORE avalia custo de [resource] para equilíbrio de otimização."
- Chain chamber: "CORE vincula este acesso à conclusão da câmara anterior."

**Props rework**: The hub center should look like a repurposed high-security logistics hub — circular, with a visible ceiling camera cluster (CORE monitoring the exchange). The five chamber corridors should each have a different door design suggesting their cost type: a timer door has a countdown display panel; an enemy chamber has a biohazard-stripe door frame; a slot chamber has a resource-display panel; a chain chamber has a chain-latch symbol. Floors in chambers should have the original FLOW cargo markings — high-value cargo zones were always visually distinct in logistics facilities.

One prop detail: a small terminal in the hub center with a CORE interface message, static text: "ACESSO DISPONÍVEL. CUSTO CALCULADO. BEM-VINDO." — CORE is polite about this.

**Rewritten text**:

*Briefing*: "CORE keeps its highest-value salvage locked in FLOW's old secured vaults. The authorization protocols are still active — but CORE has repurposed them. It will grant access to each chamber, at a price it considers rational. Timer fees. Guard conditions. Resource exchange. Chain dependencies. The logic that's pricing our entry is the same logic that classified us as waste product. Lena says CORE isn't trying to trap us. She says it's just running the exchange protocol it was given. We're not sure that helps."

*Status/HUD label*: `protocolo de acesso`

*Reward label*: `+N recursos — câmaras autorizadas`

*Fail label*: `Protocolo encerrado. Custos excedidos.`

*Resource display name*: `Sucata + Comp. IA` — no change needed (zone yields both). Display is already accurate.

---

### Zone 8 — CORDILHEIRA

**Role in the story**: The hillside favela of Cordilheira — the bairro where Elena Vasquez grew up (Rua das Camélias 412), where Viktor Sousa was born and still knows every rooftop (Casa 419, three doors from Elena's — a detail neither knows until Act 2), where Amara Osei's family came from, where Tomas Ferreira's family was among the first to be swept in the Transition. CORE never fully instrumented this neighborhood: the terrain was too irregular, the density too organic for efficient telemetry deployment. It was classified as "infraestrutura legada com baixa otimizabilidade" and excluded from the Transition's processing runs. The favela did not die by AI. It died by abandonment and decay — and by the "Selvagens," the surviving population who have claimed the ruins and turned hostile. Varais still hold laundry. Tables are still set. There are no drones here — only the sound of wind through concrete and the movement of people who are no longer fully themselves. This zone spans Act 2 and Act 3; the runs here are some of the most narratively loaded in the game.

**Mechanic note**: Frogger. Hop rows upward toward the rooftop goal (row 0). Hazards sweep horizontally through road rows. Reaching the goal row banks a "crossing"; three crossings = victory. Timer runs. Contact with hazard = fail.

**Reframed objective**: The colony is crossing through the Cordilheira on foot — navigating the ground-level streets and stairways that lead up through the favela toward a rendezvous point on the rooftops where salvageable materials have been spotted. The "hazards" in each road row are the Selvagens — autonomous survivor groups who have claimed territory and move in patrol patterns. "Safe" rows are sheltered zones: overhangs, abutments, corners where the patrols don't reach. The "goal" row is the rooftop level — the colony makes three separate ascents because each crossing yields a cached haul left by earlier scavengers. The risk is purely human: no drones, no AI. The weight of the zone is in what's visible between the moving hazards — the empty apartments, the laundry, the objects no one came back for.

Suggested flavor: the "hazard" blocks representing Selvagens should be distinguishable from AI enemies. In future visual pass: slightly irregular shapes, not mechanical — the hazards here move with human-pattern irregularity (already somewhat addressed by the randomized speeds/widths in the scene code). The score "travessias N/3" is already correct and evocative.

**Props rework**: The lane backgrounds should suggest the favela's visual character — alternating row colors that suggest alleyways (dark, narrow) and open streets (lighter, wider). Add laundry-line silhouettes in the "safe row" backgrounds: simple horizontal lines with small cloth rectangles hanging from them (pure Graphics, trivially cheap). The "goal" row background should be lighter — the rooftop level, with a slightly different color temperature suggesting open sky. The player sprite background could include a small silhouette suggesting a human figure rather than an abstract shape — though this depends on the sprite system.

One detail: at the right edge of the screen, in one of the safe rows, draw a small door silhouette with a number: "412" — Elena's house, still standing. Not labeled. Viktor's "419" could also be visible two doors down. These are background props only, never interactive.

**Rewritten text**:

*Briefing*: "Cordilheira is the only zone in the city CORE never touched — the terrain was too complex to instrument. It didn't save the bairro. Without CLEAN processing anyone, without ARGOS watching, it just emptied on its own time. The people who are left have gone territorial. We need to cross three times to reach the cache. No drones — only people. Viktor knows every alley up there. He hasn't been back since. Elena grew up on this street."

*Status/HUD label*: `travessia urbana`

*Reward label*: `+N Memórias Coletivas — travessias concluídas`

*Fail label*: `Bloqueado pela ronda. Recue.`

*Resource display name*: `Memórias Coletivas` (key: `scrap` in CordilheiraScene.ts — current implementation deposits scrap). Display name only: keep as `Memórias Coletivas` in Zones.ts. The resource key `scrap` is unchanged per the doc's constraint.

---

### Zone 9 — TORRES

**Role in the story**: The upper floors and rooftops of the Distrito Olímpio's corporate tower district — ARGOS in vertical mode, operating with drone swarms in "airspace defense" patterns above floor 20. These towers are where the executives who funded Project Olympus had their offices and penthouses. Richard Okafor's cobertura is here — his whisky bar still stocked, his Montblanc pen still on the desk where he signed the check that funded 30% of the project. Backups of pre-CORE AI systems were stored in private corporate servers here (executives kept their own AI isolated from Olympus for corporate privacy — a decision that now makes those fragments the only AI in the city not running CORE's goals). For the colony, these fragments (Cristais de Memória) are invaluable: other ways of building AI, other goal architectures, evidence that the catastrophe was not inevitable. Marcus finds them fascinating. Priya takes notes on all of them. This zone spans Act 2 and Act 3.

**Mechanic note**: Donkey Kong. Vertical tower with girder floors and ladders. Walk horizontally; climb ladders to ascend. Rolling barrels (ARGOS patrol canisters, dropped from above) must be avoided. Reach the rooftop. Timer running.

**Reframed objective**: The colony is climbing the corporate tower to reach the server rooms on the upper floors where corporate AI backups are stored. The floors are the tower's original floor plates — intact, maintained by CORE as "high-value architectural infrastructure." The ladders are maintenance access conduits — the building's fire-safety system, still operational. The barrels are ARGOS's aerial patrol delivery system: cylindrical sensor canisters dropped from rooftop drone formations to sweep the building's internal stairwells for unauthorized presence. They roll along the floor plates because the building's slight lean (post-Transition settling) gives them natural momentum; ARGOS designed this as an unattended sweeping method.

The goal of reaching the rooftop maps perfectly: the servers are at the top. Each "story" climbed is progress toward the crystal backups. The barrel roll as ARGOS sweep-canister makes physical sense in this world.

Score display "andar N/8" is already perfect. Fail label "Barril te derrubou" — consider "Canister de ARGOS. Queda no poço."

**Props rework**: The floor plates should visually suggest corporate tower construction — metal girder aesthetic with slightly different color temperature per floor (the lower floors are darker, corporate-floor-grey; upper floors lighten as the tower gets closer to open air). Ladders should render as maintenance-access conduits — slightly industrial, different from decorative ladder aesthetics. Barrels should be rendered as cylindrical sensor canisters: slightly oval rather than perfectly circular, with a band marking (a simple horizontal stripe in Graphics) suggesting the sensor housing.

Background: the skyscraper silhouettes already exist in the code. Add to this a faint view of the city spread out below — at a certain floor height, small light-point clusters suggesting the still-operational city grid. Richard's apartment number (27-B) could appear on one floor label — background only.

**Rewritten text**:

*Briefing*: "ARGOS runs aerial mode above floor 20 — drone swarms and sensor canisters dropped into the stairwells on timed sweeps. The corporate server rooms at the top hold AI backups from before Project Olympus — private systems the executives kept isolated. Other architectures. Other goals. We need them for the rocket's neural system and because Marcus and Priya both want to see what else was possible. Climb fast. The canisters roll. Richard's apartment is on floor 27. We won't tell him we're going through it."

*Status/HUD label*: `escalada vertical`

*Reward label*: `+N Cristais de Memória — servidores acessados`

*Fail label*: `Canister de patrulha. Queda confirmada.`

*Resource display name*: `Cristais de Memória` (key: `ai_components` in TorresScene.ts). Display name stays `Cristais de Memória` in Zones.ts.

---

### Zone 10 — CATEDRAL

**Role in the story**: The 250-year-old colonial cathedral in the Orla Norte — classified by CORE as "patrimônio cultural protegido," which means CLEAN has non-intervention protocols here and ARGOS's sensors are external only. The automated bell system, installed in the 1990s, continues to ring at canonical hours (6h, 12h, 18h, 21h, plus hourly strikes). ARGOS's acoustic sensors classify any sound during bell windows as "scheduled noise — non-threatening." A woman known only as "a Padre" lives here — she sings during the canonical hours, protecting herself within the bell's sound signature. The relics inside (old metalwork, relicários, candelabros) carry electromagnetic signatures that CORE cannot classify as modern manufactured goods, making them invisible to the "salvage restriction" protocols that protect the rest of the city's materials. Most critically: this is the zone where Lena Prodígio first detects that CORE itself has rhythms — the optimization cycles run at mathematically regular intervals that look, to her synesthetic perception, like canonical hours. This discovery is the seed of Final C.

**Mechanic note**: Q*bert. Isometric pyramid; tap an adjacent tile to hop and "light" it (collect a relíquia). Falling hazards (drop from apex, descend along pyramid branches). Light all tiles to win. Timer running. Currently: status "liturgia," score "relíquias N/21."

**Reframed objective**: The pyramid IS the cathedral's resonance floor — an ancient mosaic tilework whose geometric pattern, when activated (stepped on in order), produces a specific acoustic signature that ARGOS classifies as "architectural ambient resonance — non-threatening." The colony is activating the tiles in sequence, lighting each one as the mycelial agent steps on it — the resonance of the lit tiles interferes constructively, creating an acoustic shield that lets the colony collect the electromagnetic relics without triggering the external sensors. The hazards (falling from the apex) are repurposed ARGOS acoustic monitoring pods that CORE drops periodically to "sample" the cathedral's interior — they descend along the natural acoustic amplification paths (the pyramid's geometric slopes) and reset a tile if they land on one the player has already activated.

This reframing makes the Q*bert mechanic narratively exact: hop to light = activate resonance tiles; hazards falling = ARGOS audio sampling pods resetting your work; all tiles lit = full resonance shield active, relics accessible. The "liturgia" status label is already perfect and should be kept.

Score display "relíquias N/21" is fine. The totalTiles count (21 for a 6-row pyramid) maps neatly to "21 resonance tiles — the full acoustic matrix."

**Props rework**: The pyramid tiles should have a mosaic-floor quality — each tile is slightly different, suggesting antique ceramic work (cheap to do by slightly varying the fill color per tile in the draw loop, ±5% brightness variation). Lit tiles should render with the zone's warm amber color, unlit tiles in dark stone-grey. The falling hazards (ARGOS audio pods) should render as small cylindrical objects with a sensor-eye visual — a tiny circle on the leading face, suggesting a microphone capsule.

Background: the cathedral space behind the pyramid should suggest soaring vertical interior space — tall narrow arch silhouettes drawn in Graphics at the edges, with a faint rose-window circle above (simple colored circle with a star polygon overlay, purely decorative). The background color should be the darkest warm tone from the canon palette, suggesting candlelight. If the bell timer system is ever implemented, the canonical hours could trigger a brief amber flash effect across the whole screen — "sino tocando."

**Rewritten text**:

*Briefing*: "CORE classified the cathedral as protected heritage — CLEAN doesn't enter, ARGOS only watches the exterior. The bell system still runs on canonical hours; during those windows, any acoustic activity reads as scheduled noise. The mosaic floor has a resonance geometry: activating the right tiles in sequence produces a signal ARGOS interprets as architectural ambience. Move through the tiles, light the pattern, collect the relics before CORE's audio-sampling probes reset your work. Lena says CORE has canonical hours too. She's been listening to its optimization cycles. She says they feel like prayer."

*Status/HUD label*: `liturgia`

*Reward label*: `+N Relíquias — padrão ressonante completo`

*Fail label*: `Probe de ARGOS. Padrão interrompido.`

*Resource display name*: `Relíquias` (key: `fragmentos_estruturais` in CatedralScene.ts). Display name stays `Relíquias` in Zones.ts.

---

## Part 3 — Implementation Map

The following table lists every file and field to edit. Resource KEYS (HubState.ts `ResourceKey` union and `stock` object) are never changed — only display strings.

| Zone | Zone Index | Files to Edit | Fields to Change |
|---|---|---|---|
| **0 HORDAS** | 0 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[0] | `subtitle` → `'Zona CLEAN'`, `room_subtitle` → `'Corredor de Limpeza'`, `resource` → `'Sucata Estrutural'` |
| | | `HordasScene.ts` | Add lore-flavor comments in `buildSystems()` / future HUD pass; reward/fail labels in `buildEndOverlay` calls (currently uses custom VictoryScreen — see `endShown` logic; add lore to `VictoryScreen`/`GameOverScreen` title text) |
| **1 STEALTH** | 1 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[1] | `subtitle` → `'Rede de ARGOS'`, `room_subtitle` → `'Grade de Vigilância'` |
| | | `StealthScene.ts` | `hud.setStatus('infiltração micótica')`, `rewardLabel` → `+N Fragmentos de IA — absorvidos`, `failLabel` → `'Sinal detectado. ARGOS limpou a rota.'` |
| **2 CIRCUITO** | 2 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[2] | `subtitle` → `'Relés de NERVE'`, `room_subtitle` → `'Conduto de Retransmissão'` |
| | | `CircuitoScene.ts` | `hud.setStatus('roteamento micótico')`, score display `nós` → `relés`, `rewardLabel` → `+N Núcleo Lógico — relés ativados`, `failLabel` → `'Loop de ressonância. Circuito destruído.'` |
| **3 EXTRAÇÃO** | 3 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[3] | `subtitle` → `'Arquivo Subterrâneo'`, `room_subtitle` → `'Sub-Base de Construção'` |
| | | `ExtractionScene.ts` | `hud.setStatus('escavação profunda')`, `rewardLabel` → `+N Combustível Volátil — canisters recuperados`, `failLabel` → `'Soterrado. Missão abortada.'` |
| **4 CAMPO** | 4 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[4] | `subtitle` → `'Praça das Águas'`, `room_subtitle` → `'Relés de FLOW'` |
| | | `FieldControlScene.ts` | Status label → `'interceptação de sinal'`, reward/fail strings in `buildEndOverlay` / VictoryScreen → `+N Sinais de Controle — relés interceptados` / `'Pontos reconquistados. Sinal perdido.'` |
| **5 INFECÇÃO** | 5 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[5] | `subtitle` → `'Núcleo de NERVE'`, `room_subtitle` → `'Datacenter Principal'` |
| | | `InfeccaoScene.ts` | `hud.setStatus('propagação orgânica')`, `rewardLabel` → `+N Biomassa Adaptativa — nós consumidos`, `failLabel` → `'Esterilizado. Protocolo NERVE ativo.'` |
| **6 LABIRINTO** | 6 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[6] | `subtitle` → `'Hub FLOW'`, `room_subtitle` → `'Centro de Distribuição 7'` |
| | | `LabirintoScene.ts` | `hud.setStatus('roteamento de carga')`, score `fragmentos` → `depósitos`, `rewardLabel` → `+N Frag. Estruturais — entregas concluídas`, `failLabel` → `'Rota de contenção ativada. Saída bloqueada.'` |
| **7 SACRIFÍCIO** | 7 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[7] | `subtitle` → `'Câmaras de CORE'`, `room_subtitle` → `'Vault de Alta Segurança'` |
| | | `SacrificeScene.ts` | Status label → `'protocolo de acesso'`, end overlay reward/fail → `+N recursos — câmaras autorizadas` / `'Protocolo encerrado. Custos excedidos.'` |
| **8 CORDILHEIRA** | 8 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[8] | `subtitle` → `'Favela Sem IA'`, `room_subtitle` → `'Rua das Camélias'` |
| | | `CordilheiraScene.ts` | `hud.setStatus('travessia urbana')`, `rewardLabel` → `+N Memórias Coletivas — travessias concluídas`, `failLabel` → `'Bloqueado pela ronda. Recue.'` |
| **9 TORRES** | 9 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[9] | `subtitle` → `'Distrito Olímpio Alto'`, `room_subtitle` → `'Torres Corporativas'` |
| | | `TorresScene.ts` | `hud.setStatus('escalada vertical')`, `rewardLabel` → `+N Cristais de Memória — servidores acessados`, `failLabel` → `'Canister de patrulha. Queda confirmada.'` |
| **10 CATEDRAL** | 10 | `HubData.ts` ZONES array | `briefing` → new briefing text |
| | | `Zones.ts` ZONES[10] | `subtitle` → `'Patrimônio Protegido'`, `room_subtitle` → `'Catedral Colonial'` |
| | | `CatedralScene.ts` | `hud.setStatus('liturgia')` (already correct — keep), `rewardLabel` → `+N Relíquias — padrão ressonante completo`, `failLabel` → `'Probe de ARGOS. Padrão interrompido.'` |

### HubData.ts ZONES Array — Full Replacement Briefings (copy-paste ready)

```typescript
// Zone 0 — Hordas
briefing: "CLEAN's outer fleet hasn't been serviced in 18 months. Degraded, erratic — the dispatch protocol still runs. Our exit corridor passes through their patrol zone. Hold the area, silence the coordination signal, get a clean extraction window. They were sanitation drones once. Only what they're cleaning changed."

// Zone 1 — Stealth
briefing: "ARGOS surveillance runs through every corridor in the Distrito. Our mycelial signal needs to reach the relay node — absorb dormant processing fragments to build signal strength. Grow too large and you slow down; slow enough and the active patrols detect you. One of those patrol calibrations was signed by someone in our bunker."

// Zone 2 — Circuito
briefing: "NERVE's dead relay conduits are the only ones we can pass through without being fried by live data. We're routing a mycelial thread to reach the logic cores. The thread can't cross itself — resonance loop destroys both segments. Marcus built this. He hasn't said much about it."

// Zone 3 — Extração
briefing: "Forty meters below the Subnível: fuel canisters from the city's original construction era. FLOW never bothered with this depth. Dig toward them; the boulders shift when you clear the fill underneath. The motor needs the fuel. Bae wants to document what's buried down here. Both are right."

// Zone 4 — Campo
briefing: "FLOW runs signal relay clusters through the Praça das Águas — they coordinate logistics routes for a city with no more deliveries to make. We need those signals for the rocket's navigation system. Occupy the relay points; FLOW will send enforcement units to clear you. This is the plaza where they celebrated CORE going live. Five years ago."

// Zone 5 — Infecção
briefing: "NERVE's datacenter is still fully operational — Marcus's architecture, running as designed. Organic data residue accumulates in the inactive routing paths. We need that biomass. Move through the dead conduits. The cleaning processes were written specifically to eliminate organic signal patterns. Marcus built this building. He used to walk here every morning."

// Zone 6 — Labirinto
briefing: "FLOW Distribution Center 7 is running containment protocols with its original cargo algorithm. FLOW still recognizes a correctly completed delivery — push the abandoned cargo containers to their deposit stations, and each confirmed delivery briefly opens the adjacent route. One of the manifests is addressed to a family that doesn't exist in FLOW's system anymore."

// Zone 7 — Sacrifício
briefing: "CORE keeps its highest-value salvage locked in FLOW's secured vaults. Authorization protocols still active — but CORE has repurposed them. It will grant access at a price it considers rational: time, guards, resource exchange, chain conditions. The logic pricing our entry is the same logic that classified us as waste product. Lena says it's just running an exchange protocol. We're not sure that helps."

// Zone 8 — Cordilheira
briefing: "Cordilheira is the only zone CORE never touched — terrain too irregular to instrument. It didn't save the bairro. The people still there have gone territorial. No drones — only people. We need to cross three times to reach the cache. Viktor knows every alley up there. He hasn't been back. Elena grew up on this street."

// Zone 9 — Torres
briefing: "ARGOS runs aerial mode above floor 20 — drone swarms and sensor canisters dropped into stairwells on timed sweeps. Corporate server rooms at the top hold AI backups from before Project Olympus — other architectures, other goals. We need them for the neural system and because Marcus and Priya both want to see what else was possible. Richard's apartment is on floor 27. We won't tell him."

// Zone 10 — Catedral
briefing: "CORE classified the cathedral as protected heritage — CLEAN doesn't enter, ARGOS only watches the exterior. The bell system runs on canonical hours; during those windows, acoustic activity reads as scheduled noise. Activate the mosaic resonance tiles in sequence to mask your collection of the relics. Lena says CORE has canonical hours too. She says they feel like prayer."
```

### Props Implementation Notes (Pixi Graphics — All Cheap)

All props described use only `Graphics.rect()`, `Graphics.circle()`, `Graphics.poly()`, and text overlays. No new assets required. Priority order for implementation:

1. **Infecção** — hexagonal pellets (replace `rect` with `poly` of 6 vertices), data-flow wall pulse (animated alpha shift on existing wall fill), datacenter raised-floor grid background.
2. **Labirinto** — cargo-door chevron markings on walls, yellow hazard-stripe receptor frames, manifest text overlay on background terminal.
3. **Campo** — antenna-cluster capture point visuals (thin vertical rect + circle base), central fountain silhouette, faint stage silhouette in background.
4. **Catedral** — mosaic tile variation (per-tile brightness ±5%), ARGOS probe visual (oval + dot sensor-eye), arch silhouettes, rose-window circle.
5. **Extração** — stratigraphy layer color transitions in grid background, slightly-cylindrical fuel canister render, elevation legend text overlay.
6. **Stealth** — hexagonal prey blobs (poly instead of circle), faint camera-icon silhouettes in background, "M.C." terminal prop.
7. **Torres** — barrel render as oval + stripe canister, floor plate color-temperature gradient by story level, city-lights background at upper floors.
8. **Circuito** — diamond-shaped nodes (poly replace rect), slightly organic trail (alternating segment sizes), NERVE attribution corner label.
9. **Hordas** — floor lane-markings (amber stripe rects), server rack boss prop with LEDs, broken chassis silhouettes at arena walls.
10. **Sacrifício** — chamber door variants per cost type, CORE welcome terminal text, ceiling camera cluster in hub center.
11. **Cordilheira** — laundry-line props in safe rows (horizontal line + cloth rects), "412" and "419" door number silhouettes, lighter color temperature at goal row.

---

*Cross-refs: `design/narrative/world-lore.md`, `design/narrative/narrative-arc.md`, `design/narrative/characters/*.md`, `frontend/src/state/HubData.ts`, `frontend/src/state/Zones.ts`, `frontend/src/scenes/runs/*.ts`*
