// hub-landscape.jsx — wireframe landscape version

function HubLandscape({ v }) {
  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.floorLine}`,
      borderRadius: 8,
      padding: 12,
      color: v.ink,
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        fontFamily: 'Special Elite, monospace',
        fontSize: 11, color: v.inkMuted,
        marginBottom: 6, letterSpacing: 0.5,
      }}>
        landscape wireframe — tablet / emulator dev
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 200px',
        gap: 8,
        height: 320,
      }}>
        {/* Left rail: NPC list */}
        <div style={{
          border: `1px dashed ${v.floorLine}`,
          borderRadius: 4,
          padding: 8,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: 9, color: v.inkMuted, letterSpacing: 1, marginBottom: 4 }}>
            SOBREVIVENTES · 11
          </div>
          {NPCS.slice(0, 7).map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '3px 4px',
              borderBottom: `1px dotted ${v.floorLine}`,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: n.color,
                flexShrink: 0,
                fontSize: 8, fontFamily: 'JetBrains Mono',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: v.bg, fontWeight: 700,
              }}>{n.glyph}</div>
              <div style={{ fontSize: 10, flex: 1 }}>{n.nome}</div>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: v.inkMuted }}>
                {n.trust}%
              </div>
            </div>
          ))}
          <div style={{ fontSize: 9, color: v.inkLow, marginTop: 4 }}>+ 4 outros …</div>
        </div>

        {/* Center: bunker cross-section */}
        <div style={{
          border: `1px dashed ${v.floorLine}`,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          background: v.bgTint,
        }}>
          {/* 4 floors stacked horizontally — wireframe rectangles */}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: 'repeat(4,1fr)' }}>
            {[1,2,3,4].map(f => (
              <div key={f} style={{
                borderBottom: `1px dashed ${v.floorLine}`,
                display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr',
                position: 'relative',
              }}>
                {[0,1,2].map(c => (
                  <div key={c} style={{
                    borderRight: c<2 ? `1px dashed ${v.floorLine}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkLow,
                  }}>
                    A{f}·C{c}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* rocket silhouette center */}
          <div style={{
            position: 'absolute', top: '25%', bottom: '25%',
            left: '50%', transform: 'translateX(-50%)',
            width: 56,
            border: `1px dashed ${v.warmLight}`,
            borderRadius: '8px 8px 4px 4px',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            color: v.warmLight, fontSize: 9, fontFamily: 'JetBrains Mono',
            paddingBottom: 4,
          }}>
            FOGUETE
          </div>
          <div style={{
            position: 'absolute', top: 4, left: 4,
            fontSize: 9, color: v.inkMuted, fontFamily: 'JetBrains Mono',
            letterSpacing: 1,
          }}>
            BUNKER · CORTE
          </div>
        </div>

        {/* Right rail: rocket panel + resources */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{
            border: `1px dashed ${v.floorLine}`, borderRadius: 4, padding: 8,
          }}>
            <div style={{ fontSize: 9, color: v.inkMuted, letterSpacing: 1 }}>FOGUETE [4/8]</div>
            {ROCKET_RECIPE.slice(0,4).map(r => (
              <div key={r.n} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, padding: '2px 0',
                color: r.built ? v.warmLight : v.inkLow,
                fontFamily: 'JetBrains Mono',
              }}>
                <span>[{r.built ? '✓' : '·'}] {r.nome.slice(0,16)}</span>
                <span>◇{r.scrap}·◆{r.ai}</span>
              </div>
            ))}
            <div style={{ fontSize: 9, color: v.inkLow, fontFamily: 'JetBrains Mono', marginTop: 2 }}>…4 peças restantes</div>
          </div>
          <div style={{
            border: `1px dashed ${v.floorLine}`, borderRadius: 4, padding: 8,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 9, color: v.inkMuted, letterSpacing: 1 }}>ESTOQUE</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>◇ sucata 14</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>◆ comp. ia 9</div>
            <div style={{ fontSize: 9, color: v.inkLow, fontFamily: 'JetBrains Mono', marginTop: 2 }}>mochila · 5/7</div>
          </div>
          <div style={{
            border: `1px solid ${v.warmLight}`,
            borderRadius: 4, padding: '6px 8px',
            fontFamily: 'Inter', fontSize: 10,
            color: v.warmLight, letterSpacing: 1,
            textTransform: 'uppercase', textAlign: 'center',
          }}>
            ▶ raidar
          </div>
        </div>
      </div>

      <div style={{
        fontSize: 9, color: v.inkLow, fontFamily: 'JetBrains Mono',
        marginTop: 8, letterSpacing: 0.5,
      }}>
        // obs: layout 3-colunas. NPCs sempre visíveis; corte do bunker ocupa área central; foguete + estoque fixos à direita.
      </div>
    </div>
  );
}

Object.assign(window, { HubLandscape });
