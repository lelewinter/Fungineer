// hub-zoom.jsx — cinematic zoom into a room, with 3 styles + zone panels

const { useState: useZState, useEffect: useZEffect } = React;

// Scene that's rendered INSIDE the zoom view — shows room at large scale
function RoomScene({ room, v, zone, portalStyle, onInspect, onPortal }) {
  // A big, detailed "diorama" of the room
  const items = (window.ROOM_ITEMS?.[room.id]) || [];
  const npcsHere = (room.occupants || []).map(id => NPCS.find(n => n.id === id)).filter(Boolean);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: `linear-gradient(180deg, ${v.wall} 0%, ${v.floorFill} 80%, ${v.floorLine} 100%)`,
      overflow: 'hidden',
    }}>
      {/* background: layered parallax */}
      <div style={{ position:'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 120%, ${v.warmLight}22 0%, transparent 55%)`
      }}/>
      {/* floor tiles */}
      <div style={{ position:'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: `repeating-linear-gradient(90deg, ${v.floorFill} 0 28px, ${v.wall} 28px 30px)`,
        borderTop: `3px solid ${v.floorLine}`,
      }}/>
      {/* ceiling lamp */}
      <div style={{ position:'absolute', top: 0, left: '30%', width: 2, height: 22, background: v.inkLow}}/>
      <div style={{ position:'absolute', top: 18, left: '28%', width: 30, height: 16,
        background: zone.color, opacity: 0.9,
        borderRadius: '0 0 60% 60%',
        boxShadow: `0 0 40px ${zone.color}, 0 0 80px ${zone.color}44`
      }}/>

      {/* big NPC on left */}
      {npcsHere.length > 0 && (
        <div onClick={onInspect} style={{
          position:'absolute', bottom: 32, left: '18%',
          cursor: 'pointer',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
        }}>
          <NPC npc={npcsHere[0]} v={v} size={60} walking={false}/>
          <div style={{
            position:'absolute', bottom: -14, left: '50%', transform:'translateX(-50%)',
            fontFamily: 'JetBrains Mono', fontSize: 9, color: v.warmLight,
            letterSpacing: 1, whiteSpace: 'nowrap',
          }}>▸ {npcsHere[0].nome}</div>
        </div>
      )}
      {npcsHere[1] && (
        <div onClick={onInspect} style={{ position:'absolute', bottom: 32, left: '34%', cursor:'pointer', opacity: 0.85,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}>
          <NPC npc={npcsHere[1]} v={v} size={48} walking={false} facing={-1}/>
        </div>
      )}

      {/* inspectable items — scattered on wall */}
      {items.map((it, i) => (
        <div key={i} onClick={() => onInspect(it)} style={{
          position:'absolute',
          top: 40 + (i%2)*50, right: 28 + (i%3)*10,
          fontFamily: 'JetBrains Mono', fontSize: 9,
          color: v.inkMuted,
          cursor: 'pointer',
          padding: '4px 6px',
          border: `1px dashed ${v.inkLow}`,
          background: v.bg+'aa',
          maxWidth: 120,
        }}
        onMouseEnter={e => e.currentTarget.style.color = v.ink}
        onMouseLeave={e => e.currentTarget.style.color = v.inkMuted}
        >
          <div style={{ color: v.warmLight, fontSize: 8, letterSpacing: 1 }}>◦ INSPEC</div>
          {it.name}
        </div>
      ))}

      {/* the portal — on right wall */}
      <div style={{
        position:'absolute', bottom: 40, right: 20,
        filter: 'drop-shadow(0 0 24px ' + zone.color + '66)'
      }}>
        <Portal style={portalStyle} v={v} zone={zone} size={1.4} onClick={onPortal}/>
        <div style={{
          textAlign:'center', marginTop: 4,
          fontFamily: 'Special Elite, monospace', fontSize: 12,
          color: zone.color, letterSpacing: 1, textShadow: `0 0 6px ${zone.color}66`,
        }}>
          {zone.nome.toUpperCase()}
        </div>
      </div>

      {/* dust particles */}
      {[...Array(8)].map((_,i) => (
        <div key={i} style={{
          position:'absolute',
          left: `${10 + i*12}%`,
          top: `${20 + (i%3)*20}%`,
          width: 2, height: 2,
          background: v.warmLight,
          borderRadius: '50%',
          opacity: 0.4,
          animation: `float-dust ${3+i*0.3}s ease-in-out infinite`,
          animationDelay: `${i*0.2}s`,
        }}/>
      ))}
    </div>
  );
}

// Zone info side-panel content
function ZoneInfoPanel({ v, zone, room, onClose, onStart, squadMode }) {
  const [tab, setTab] = useZState('brief');
  const npcsHere = (room.occupants || []).map(id => NPCS.find(n => n.id === id)).filter(Boolean);
  const npc = npcsHere[0];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: v.panelBg,
      border: `1px solid ${v.panelBorder}`,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: `1px solid ${v.floorLine}`,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <div style={{
          width: 24, height: 24,
          background: zone.color+'22',
          border: `1px solid ${zone.color}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: zone.color, fontFamily:'JetBrains Mono', fontSize: 14, fontWeight: 700,
        }}>{zone.glyph}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Special Elite, monospace', fontSize: 14, color: v.ink,
          }}>{zone.nome}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkMuted, letterSpacing: 1 }}>
            DIF {'★'.repeat(zone.difficulty)}{'·'.repeat(5-zone.difficulty)} · DROP {zone.drop === 'scrap' ? '◇ SUCATA' : '◆ COMP.IA'} · {zone.last}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${v.inkLow}`,
          color: v.inkMuted, width: 22, height: 22, borderRadius: 2, cursor: 'pointer',
          fontFamily: 'JetBrains Mono', fontSize: 10,
        }}>×</button>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', gap: 0, borderBottom: `1px solid ${v.floorLine}`}}>
        {[['brief','BRIEFING'],['npc','NPC'],['hist','HISTÓRICO'],['items','ITENS']].map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: '7px 2px',
            background: tab===k ? v.bgTint : 'transparent',
            border: 'none',
            borderBottom: tab===k ? `2px solid ${zone.color}` : `2px solid transparent`,
            color: tab===k ? v.ink : v.inkMuted,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1,
            cursor: 'pointer',
          }}>{lbl}</button>
        ))}
      </div>

      {/* tab content */}
      <div style={{ flex: 1, padding: 12, overflowY: 'auto', fontSize: 11, color: v.ink, lineHeight: 1.5 }}>
        {tab === 'brief' && (
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 13, marginBottom: 8, color: v.ink }}>
              {zone.lore}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: v.inkMuted, letterSpacing: 0.5 }}>
              <div>· entrada pela <span style={{ color: v.ink }}>{room.label || room.id}</span></div>
              <div>· squad: <span style={{ color: zone.squad ? v.ink : '#D14A3F' }}>{zone.squad ? 'até 3 sobreviventes' : 'solo'}</span></div>
              <div>· risco: <span style={{ color: zone.color }}>{zone.difficulty >= 4 ? 'ALTO' : 'MÉDIO'}</span></div>
            </div>
          </div>
        )}
        {tab === 'npc' && npc && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: npc.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono', fontWeight: 700, color: v.bg, fontSize: 14,
              }}>{npc.glyph}</div>
              <div>
                <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 14 }}>{npc.nome}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkMuted, letterSpacing: 1 }}>
                  {npc.hint.toUpperCase()} · {npc.trust}% CONFIANÇA
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 12, marginBottom: 10, color: v.ink }}>
              {(window.dialogueFor || (() => ''))(npc)}
            </div>
            <div style={{ padding: 8, background: v.bg, border: `1px dashed ${v.panelBorder}66`, borderRadius: 4 }}>
              <div style={{ fontSize: 8, letterSpacing: 1.5, color: v.warmLight, textTransform: 'uppercase', marginBottom: 2 }}>▸ missão</div>
              <div style={{ fontSize: 11 }}>{(window.missionFor || (() => '—'))(npc)}</div>
            </div>
          </div>
        )}
        {tab === 'npc' && !npc && (
          <div style={{ color: v.inkMuted, fontStyle: 'italic' }}>Ninguém aqui agora.</div>
        )}
        {tab === 'hist' && (
          <div>
            {zone.history.length === 0 && <div style={{ color: v.inkMuted, fontStyle:'italic'}}>Nunca visitada.</div>}
            {zone.history.map((h,i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '6px 0',
                borderBottom: `1px dashed ${v.floorLine}`,
                fontFamily: 'JetBrains Mono', fontSize: 10,
              }}>
                <div style={{ color: v.inkMuted, minWidth: 32 }}>R{h.r}</div>
                <div style={{ color: h.res === 'SUCESSO' ? v.neonGreen : '#D14A3F', minWidth: 68 }}>
                  {h.res}
                </div>
                <div style={{ color: v.ink, flex: 1 }}>{h.drop}</div>
                <div style={{ color: v.inkMuted }}>{h.loss}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'items' && (
          <div>
            {(window.ROOM_ITEMS[room.id] || []).map((it, i) => (
              <div key={i} style={{
                padding: '8px 0',
                borderBottom: `1px dashed ${v.floorLine}`,
              }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: v.warmLight, letterSpacing: 1.5 }}>◦ INSPEC</div>
                <div style={{ color: v.ink, fontSize: 12, marginTop: 2 }}>{it.name}</div>
                <div style={{ color: v.inkMuted, fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>{it.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* start button (only if not showing squad prep) */}
      {!squadMode && (
        <button onClick={onStart} style={{
          margin: 10,
          padding: '10px 12px',
          background: zone.color + '22',
          border: `1px solid ${zone.color}`,
          color: zone.color,
          fontFamily: 'Special Elite, monospace',
          fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{zone.squad ? 'PREPARAR SQUAD →' : 'ENTRAR SOLO →'}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>{zone.glyph}</span>
        </button>
      )}
    </div>
  );
}

// Squad prep mini-screen — only for Hordas
function SquadPrep({ v, zone, onBack, onConfirm }) {
  const candidates = NPCS.filter(n => n.id !== 'doutor' && n.id !== 'lena' && n.trust >= 40);
  const [picked, setPicked] = useZState([candidates[0]?.id, candidates[1]?.id].filter(Boolean));
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x=>x!==id) : (p.length<3 ? [...p, id] : p));
  return (
    <div style={{
      width: '100%', height: '100%',
      background: v.panelBg,
      border: `1px solid ${zone.color}`,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${v.floorLine}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={onBack} style={{
          background:'transparent', border: `1px solid ${v.inkLow}`,
          color: v.inkMuted, padding: '2px 8px', cursor: 'pointer',
          fontFamily: 'JetBrains Mono', fontSize: 9,
        }}>← voltar</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 13, color: v.ink }}>
            montar squad · {zone.nome}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkMuted, letterSpacing: 1 }}>
            {picked.length}/3 SOBREVIVENTES
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        {candidates.map(c => {
          const on = picked.includes(c.id);
          return (
            <div key={c.id} onClick={() => toggle(c.id)} style={{
              display:'flex', alignItems:'center', gap: 10, padding: 8, marginBottom: 6,
              border: `1px solid ${on ? zone.color : v.floorLine}`,
              background: on ? zone.color+'15' : 'transparent',
              cursor: 'pointer', borderRadius: 3,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: c.color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 12, color: v.bg,
              }}>{c.glyph}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: v.ink, fontSize: 12, fontWeight: 500 }}>{c.nome}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkMuted, letterSpacing: 1 }}>
                  {c.hint.toUpperCase()} · {c.trust}%
                </div>
              </div>
              <div style={{
                width: 14, height: 14, borderRadius: 2,
                border: `1px solid ${on ? zone.color : v.inkLow}`,
                background: on ? zone.color : 'transparent',
              }}/>
            </div>
          );
        })}
      </div>
      <button onClick={() => onConfirm(picked)} style={{
        margin: 10,
        padding: '10px 12px',
        background: zone.color + '22',
        border: `1px solid ${zone.color}`,
        color: zone.color,
        fontFamily: 'Special Elite, monospace',
        fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase',
        cursor: 'pointer',
        opacity: picked.length === 0 ? 0.4 : 1,
      }} disabled={picked.length === 0}>
        INICIAR RUN →
      </button>
    </div>
  );
}

// Confirm-run splash (when portal clicked)
function RunConfirm({ v, zone, squad, onCancel, onGo }) {
  return (
    <div style={{
      position:'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation: 'fade-in 200ms ease-out',
    }}>
      <div style={{
        width: '85%',
        background: v.panelBg,
        border: `1px solid ${zone.color}`,
        padding: 16,
        boxShadow: `0 0 40px ${zone.color}44`,
      }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 16, color: v.ink, marginBottom: 4 }}>
          entrar em {zone.nome}?
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: v.inkMuted, marginBottom: 12, letterSpacing: 1 }}>
          DIF {'★'.repeat(zone.difficulty)} · {zone.squad ? `${squad?.length||0} SOBREVIVENTE(S)` : 'SOLO'}
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', background:'transparent',
            border: `1px solid ${v.inkLow}`, color: v.inkMuted,
            fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 1, cursor:'pointer',
          }}>CANCELAR</button>
          <button onClick={onGo} style={{
            flex: 2, padding: '10px',
            background: zone.color + '22',
            border: `1px solid ${zone.color}`,
            color: zone.color,
            fontFamily: 'Special Elite, monospace',
            fontSize: 13, letterSpacing: 1.5, cursor:'pointer',
          }}>GO</button>
        </div>
      </div>
    </div>
  );
}

// ——— THE ZOOM CONTAINER — 3 styles ———

function ZoomView({ style = 'cinematic', v, room, zone, portalStyle, onClose }) {
  const [stage, setStage] = useZState('view'); // view | squad | confirm
  const [squad, setSquad] = useZState(null);

  const inspect = (it) => {
    // simple flash — real feature could open a sub-panel
    console.log('INSPECT', it);
  };

  const clickPortal = () => {
    if (zone.squad) setStage('squad');
    else setStage('confirm');
  };
  const confirmSquad = (picked) => { setSquad(picked); setStage('confirm'); };
  const go = () => {
    alert(`→ Iniciando run: ${zone.nome}${squad ? ` com ${squad.length} sobreviventes` : ' (solo)'}`);
    onClose();
  };

  // Content area: either the scene+panel OR squad prep
  const content = stage === 'squad'
    ? <SquadPrep v={v} zone={zone} onBack={() => setStage('view')} onConfirm={confirmSquad}/>
    : null;

  // Render per style
  if (style === 'modal') {
    return (
      <div style={{ position:'absolute', inset: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 8,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        animation: 'fade-in 250ms ease-out',
      }}>
        <div style={{
          width: '100%', maxHeight: '94%',
          background: v.panelBg,
          border: `1px solid ${v.panelBorder}`,
          display: 'flex', flexDirection: 'column',
          animation: 'scale-in 280ms ease-out',
        }}>
          {stage === 'squad' ? content : (
            <>
              <div style={{ height: 240, position:'relative' }}>
                <RoomScene room={room} v={v} zone={zone} portalStyle={portalStyle} onInspect={inspect} onPortal={clickPortal}/>
              </div>
              <div style={{ flex: 1, minHeight: 260 }}>
                <ZoneInfoPanel v={v} zone={zone} room={room} onClose={onClose} onStart={clickPortal}/>
              </div>
            </>
          )}
        </div>
        {stage === 'confirm' && <RunConfirm v={v} zone={zone} squad={squad} onCancel={() => setStage(zone.squad ? 'squad' : 'view')} onGo={go}/>}
      </div>
    );
  }

  if (style === 'split') {
    return (
      <div style={{ position:'absolute', inset: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
        display:'flex', flexDirection: 'column',
        animation: 'fade-in 200ms',
      }}>
        {/* top: full-bleed scene */}
        <div style={{ flex: 1, minHeight: 280, position:'relative',
          borderBottom: `2px solid ${zone.color}`,
          animation: 'slide-down 320ms ease-out',
        }}>
          {stage !== 'squad' && <RoomScene room={room} v={v} zone={zone} portalStyle={portalStyle} onInspect={inspect} onPortal={clickPortal}/>}
          <button onClick={onClose} style={{
            position:'absolute', top: 8, right: 8, zIndex: 3,
            background: v.panelBg, border: `1px solid ${v.panelBorder}`,
            color: v.ink, width: 26, height: 26, cursor:'pointer',
            fontFamily: 'JetBrains Mono', fontSize: 14,
          }}>×</button>
        </div>
        {/* bottom: panel */}
        <div style={{ height: 280, animation: 'slide-up 320ms ease-out' }}>
          {stage === 'squad'
            ? content
            : <ZoneInfoPanel v={v} zone={zone} room={room} onClose={onClose} onStart={clickPortal}/>}
        </div>
        {stage === 'confirm' && <RunConfirm v={v} zone={zone} squad={squad} onCancel={() => setStage(zone.squad ? 'squad' : 'view')} onGo={go}/>}
      </div>
    );
  }

  // Default: 'cinematic' — scene fills almost everything; panel is a floating card
  return (
    <div style={{ position:'absolute', inset: 0, zIndex: 40,
      animation: 'fade-in 200ms ease-out',
    }}>
      {/* Scene — big */}
      <div style={{
        position:'absolute', inset: 0,
        animation: 'cine-zoom 450ms cubic-bezier(.22,1,.36,1)',
      }}>
        {stage !== 'squad' && <RoomScene room={room} v={v} zone={zone} portalStyle={portalStyle} onInspect={inspect} onPortal={clickPortal}/>}
        {/* cinematic bars */}
        <div style={{ position:'absolute', top: 0, left: 0, right: 0, height: 28, background: '#000', animation: 'bars-in 350ms ease-out'}}/>
        <div style={{ position:'absolute', bottom: 0, left: 0, right: 0, height: 28, background: '#000', animation: 'bars-in 350ms ease-out'}}/>
        {/* vignette */}
        <div style={{ position:'absolute', inset: 0, pointerEvents:'none',
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)` }}/>
        {/* top bar: room label */}
        <div style={{ position:'absolute', top: 7, left: 12, right: 50, zIndex: 3,
          fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkMuted, letterSpacing: 2,
        }}>▸ {(room.label || '').toUpperCase()}</div>
        <button onClick={onClose} style={{
          position:'absolute', top: 4, right: 8, zIndex: 3,
          background: 'transparent', border: `1px solid ${v.inkMuted}`,
          color: v.ink, width: 22, height: 22, cursor:'pointer',
          fontFamily: 'JetBrains Mono', fontSize: 11,
        }}>×</button>
      </div>

      {/* floating info card — bottom sheet */}
      <div style={{
        position:'absolute', left: 8, right: 8, bottom: 36,
        maxHeight: '50%',
        boxShadow: `0 -8px 32px rgba(0,0,0,0.7)`,
        animation: 'slide-up 400ms cubic-bezier(.22,1,.36,1)',
      }}>
        {stage === 'squad'
          ? content
          : <ZoneInfoPanel v={v} zone={zone} room={room} onClose={onClose} onStart={clickPortal}/>}
      </div>

      {stage === 'confirm' && <RunConfirm v={v} zone={zone} squad={squad} onCancel={() => setStage(zone.squad ? 'squad' : 'view')} onGo={go}/>}
    </div>
  );
}

Object.assign(window, { ZoomView, RoomScene, ZoneInfoPanel, SquadPrep, RunConfirm });
