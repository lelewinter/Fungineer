// hub-variants.jsx — the cross-section grid (Fallout Shelter style, many rooms)

function HubCrossSection({ v, tickPhase, onNPC, onZoneRoom, density, onOpenRocket }) {
  const byFloor = {};
  ROOMS.forEach(r => {
    if (!byFloor[r.floor]) byFloor[r.floor] = [];
    byFloor[r.floor].push(r);
  });

  // NPCs by room id
  const npcInRoom = (roomId) => {
    const r = ROOMS.find(x => x.id === roomId);
    if (!r?.occupants) return [];
    return r.occupants.map(id => NPCS.find(n => n.id === id)).filter(Boolean);
  };

  // Floor heights: floor 1 (surface/saída) is a campo aberto, maior
  const floorHeights = { 1: '110px' };
  const normalH = '1fr';

  return (
    <div style={{
      position: 'relative', flex: 1,
      background: v.bg,
      overflow: 'hidden',
    }}>
      {/* Dirt/rock side walls — only on underground floors */}
      <div style={{ position:'absolute', top: 110, bottom: 0, left: 0, width: 10, background: v.rock, zIndex: 4,
        borderRight: `2px solid ${v.floorLine}`
      }}/>
      <div style={{ position:'absolute', top: 110, bottom: 0, right: 0, width: 10, background: v.rock, zIndex: 4,
        borderLeft: `2px solid ${v.floorLine}`
      }}/>

      {/* grid of floors */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid',
        gridTemplateRows: [1,2,3,4,5,6].map(f => floorHeights[f] || normalH).join(' '),
      }}>
        {[1,2,3,4,5,6].map(f => (
          <div key={f} style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            position: 'relative',
          }}>
            {byFloor[f]?.map(r => (
              <Room key={r.id} room={r} v={v}
                npcsInRoom={npcInRoom(r.id)}
                tickPhase={tickPhase}
                density={density}
                onOpen={onNPC}
                onZoneRoom={onZoneRoom}
                cellW={58} cellH={58}
              />
            ))}
            {/* floor-number on left (apenas andares subterrâneos) */}
            {f > 1 && (
              <div style={{ position:'absolute', left: 1, top: 2,
                fontFamily: 'JetBrains Mono', fontSize: 6, color: v.inkLow, zIndex: 5,
                letterSpacing: 1 }}>
                A{f-1}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* rocket overlay: spans floors 2..5 (4 of 5 underground floors), centered */}
      <RocketOverlay v={v} onOpenRocket={onOpenRocket}/>
    </div>
  );
}

function RocketOverlay({ v, onOpenRocket }) {
  // Surface floor é 110px; depois 5 andares iguais (floors 2..6). Foguete ocupa floors 2..5 (4 de 5).
  return (
    <div style={{
      position: 'absolute',
      top: '110px',
      bottom: 0,
      left: `${(2/6)*100}%`,
      width: `${(2/6)*100}%`,
      display: 'grid',
      gridTemplateRows: '1fr 1fr 1fr 1fr 1fr', // 5 andares underground
      pointerEvents: 'none',
      zIndex: 3,
    }}>
      {/* rocket ocupa linhas 1..4, alinhado no chão */}
      <div style={{
        gridRow: '1 / span 4',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        padding: '4px 4px 0',
        pointerEvents: 'auto',
        cursor: onOpenRocket ? 'pointer' : 'default',
      }} onClick={onOpenRocket}>
        <Rocket v={v} progress={0.55} floorHeight={56}/>
      </div>
    </div>
  );
}

Object.assign(window, { HubCrossSection });
