// hub-app.jsx — main app, variant selector, tweaks panel, edit-mode wiring

const { useState, useEffect, useRef } = React;

const TWEAKS = /*EDITMODE-BEGIN*/{
  "variant": "balanced",
  "density": "balanced",
  "specialElite": true,
  "showLandscape": false,
  "neonBoost": 0,
  "zoomStyle": "cinematic",
  "portalStyle": "rasgao"
}/*EDITMODE-END*/;

// CSS keyframes
const globalCSS = `
  @keyframes npc-bob {
    0%, 100% { transform: translateY(0) scaleX(var(--sx,1)); }
    50%      { transform: translateY(-1.5px) scaleX(var(--sx,1)); }
  }
  .npc-bob { animation: npc-bob 0.6s ease-in-out infinite; }
  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50%      { transform: scale(1.3); opacity: 0.5; }
  }
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    47%      { opacity: 1; }
    50%      { opacity: 0.85; }
    53%      { opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cine-zoom {
    from { opacity: 0.3; transform: scale(1.15); filter: blur(8px); }
    to   { opacity: 1;   transform: scale(1);    filter: blur(0); }
  }
  @keyframes bars-in {
    from { transform: translateY(-100%); }
    to   { transform: translateY(0); }
  }
  @keyframes float-dust {
    0%,100% { transform: translateY(0); opacity: 0.2; }
    50%     { transform: translateY(-8px); opacity: 0.6; }
  }
  .hub-blurred { filter: blur(3px) brightness(0.55); transition: filter 350ms ease-out; pointer-events: none; }
`;

function App() {
  const [tweaks, setTweaks] = useState(TWEAKS);
  const [editMode, setEditMode] = useState(false);
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [zoomed, setZoomed] = useState(null); // { room, zone }
  const [rocketOpen, setRocketOpen] = useState(false);
  const [tickPhase, setTickPhase] = useState(0);

  // tick for simulated movement
  useEffect(() => {
    const id = setInterval(() => setTickPhase(t => (t+1) % 8), 900);
    return () => clearInterval(id);
  }, []);

  // edit-mode host wiring
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const updateTweak = (key, value) => {
    setTweaks(t => {
      const next = { ...t, [key]: value };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
      return next;
    });
  };

  // Build the current variant (with optional neon boost layered on)
  const baseV = VARIANTS[tweaks.variant] || VARIANTS.balanced;
  const v = {
    ...baseV,
    specialElite: tweaks.specialElite,
    density: tweaks.density,
    neonGreen: tweaks.neonBoost > 0 ? '#00FFAA' : baseV.neonGreen,
  };

  const allVariants = ['warm','balanced','blueprint'];

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0e0a07',
      backgroundImage: 'radial-gradient(ellipse at center, #17110b 0%, #050302 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, gap: 20, overflow: 'auto',
      fontFamily: 'Inter, sans-serif',
    }}>
      <style dangerouslySetInnerHTML={{__html: globalCSS}}/>

      {/* Portrait: Android frame with the active variant */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <VariantLabel v={v}/>
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'center top' }}>
          <AndroidDevice width={380} height={760} dark>
            <HubScreen v={v} tickPhase={tickPhase}
              onNPC={setSelectedNPC}
              onZoneRoom={(room, zone) => setZoomed({ room, zone })}
              density={v.density}
              selectedNPC={selectedNPC}
              onCloseNPC={() => setSelectedNPC(null)}
              zoomed={zoomed}
              onCloseZoom={() => setZoomed(null)}
              zoomStyle={tweaks.zoomStyle}
              portalStyle={tweaks.portalStyle}
              rocketOpen={rocketOpen}
              onOpenRocket={() => setRocketOpen(true)}
              onCloseRocket={() => setRocketOpen(false)}
            />
          </AndroidDevice>
        </div>
      </div>

      {/* Two smaller comparison frames (the other variants) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {allVariants.filter(k => k !== tweaks.variant).map(k => {
          const cv = { ...VARIANTS[k], specialElite: tweaks.specialElite, density: tweaks.density };
          return (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <VariantLabel v={cv} small/>
              <div onClick={() => updateTweak('variant', k)} style={{
                cursor: 'pointer', transform: 'scale(0.48)', transformOrigin: 'center top',
                marginBottom: -220,
              }}>
                <AndroidDevice width={380} height={760} dark>
                  <HubScreen v={cv} tickPhase={tickPhase} density={cv.density} onNPC={()=>{}}/>
                </AndroidDevice>
              </div>
            </div>
          );
        })}
      </div>

      {/* Landscape wireframe (optional) */}
      {tweaks.showLandscape && (
        <div style={{ width: 620 }}>
          <VariantLabel v={v} tag="LANDSCAPE · WIREFRAME"/>
          <div style={{ marginTop: 10 }}>
            <HubLandscape v={v}/>
          </div>
        </div>
      )}

      {/* Tweaks panel — visible only in edit mode */}
      {editMode && (
        <TweaksPanel tweaks={tweaks} update={updateTweak}/>
      )}

      {/* Hint when edit mode off */}
      {!editMode && (
        <div style={{
          position: 'fixed', bottom: 12, right: 12,
          fontFamily: 'JetBrains Mono', fontSize: 10,
          color: '#A89070', opacity: 0.7, letterSpacing: 1,
        }}>
          ▸ ative Tweaks pra alternar variações
        </div>
      )}
    </div>
  );
}

function VariantLabel({ v, small, tag }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      color: v.ink,
    }}>
      <div style={{
        width: small ? 8 : 12, height: small ? 8 : 12, borderRadius: '50%',
        background: v.warmLight,
        boxShadow: `0 0 ${small?6:10}px ${v.warmLight}`,
      }}/>
      <div>
        <div style={{
          fontFamily: 'Special Elite, monospace',
          fontSize: small ? 11 : 14, letterSpacing: 0.5,
        }}>{tag || v.name}</div>
        {!small && !tag && (
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 9, color: v.inkMuted,
            letterSpacing: 1,
          }}>{v.tagline}</div>
        )}
      </div>
    </div>
  );
}

function HubScreen({ v, tickPhase, onNPC, onZoneRoom, density, selectedNPC, onCloseNPC, zoomed, onCloseZoom, zoomStyle, portalStyle, rocketOpen, onOpenRocket, onCloseRocket }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: v.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      color: v.ink,
      overflow: 'hidden',
    }}>
      <div className={(zoomed || rocketOpen) ? 'hub-blurred' : ''} style={{
        display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
      }}>
        <HubCrossSection v={v} tickPhase={tickPhase} onNPC={onNPC} onZoneRoom={onZoneRoom} density={density} onOpenRocket={onOpenRocket}/>
      </div>
      {selectedNPC && onCloseNPC && !zoomed && !rocketOpen && (
        <NPCPopover npc={selectedNPC} v={v} onClose={onCloseNPC}/>
      )}
      {zoomed && !rocketOpen && (
        <ZoomView style={zoomStyle || 'cinematic'} v={v} room={zoomed.room} zone={zoomed.zone}
          portalStyle={portalStyle || 'rasgao'} onClose={onCloseZoom}/>
      )}
      {rocketOpen && window.RocketPanel && (
        <RocketPanel v={v} recipe={ROCKET_RECIPE} inventory={INVENTORY} onClose={onCloseRocket} onBuild={()=>{}}/>
      )}
    </div>
  );
}

function TweaksPanel({ tweaks, update }) {
  const row = {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
    fontFamily: 'Inter', fontSize: 11,
  };
  const btn = (active) => ({
    padding: '4px 10px',
    border: `1px solid ${active ? '#E8943A' : '#3D2B1F'}`,
    background: active ? '#E8943A22' : 'transparent',
    color: active ? '#E8943A' : '#A89070',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10, letterSpacing: 1,
    textTransform: 'uppercase',
  });
  return (
    <div style={{
      position: 'fixed', right: 16, top: 16,
      width: 240,
      background: 'rgba(14,10,7,0.96)',
      border: '1px solid #3D2B1F',
      borderRadius: 6, padding: 12,
      boxShadow: '0 8px 32px rgba(232,148,58,0.15)',
      color: '#F4E4C8',
      fontFamily: 'Inter, sans-serif',
      zIndex: 100,
    }}>
      <div style={{
        fontFamily: 'Special Elite, monospace', fontSize: 14,
        marginBottom: 10, color: '#F4E4C8',
        borderBottom: '1px dashed #3D2B1F', paddingBottom: 6,
      }}>Tweaks</div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>variação</div>
      <div style={{...row, flexWrap: 'wrap'}}>
        {['warm','balanced','blueprint'].map(k => (
          <button key={k} style={btn(tweaks.variant === k)} onClick={() => update('variant', k)}>
            {k.slice(0,6)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>densidade UI</div>
      <div style={{...row, flexWrap: 'wrap'}}>
        {['minimal','balanced','informative'].map(k => (
          <button key={k} style={btn(tweaks.density === k)} onClick={() => update('density', k)}>
            {k.slice(0,6)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>special elite (tipografia)</div>
      <div style={row}>
        <button style={btn(tweaks.specialElite)} onClick={() => update('specialElite', true)}>on</button>
        <button style={btn(!tweaks.specialElite)} onClick={() => update('specialElite', false)}>off</button>
      </div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>boost neon</div>
      <div style={row}>
        <button style={btn(tweaks.neonBoost === 0)} onClick={() => update('neonBoost', 0)}>0</button>
        <button style={btn(tweaks.neonBoost === 1)} onClick={() => update('neonBoost', 1)}>+1</button>
      </div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>estilo de zoom</div>
      <div style={{...row, flexWrap: 'wrap'}}>
        {[['cinematic','cine'],['modal','modal'],['split','split']].map(([k, lbl]) => (
          <button key={k} style={btn(tweaks.zoomStyle === k)} onClick={() => update('zoomStyle', k)}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>estilo de portal</div>
      <div style={{...row, flexWrap: 'wrap'}}>
        {[['rasgao','rasgão'],['escotilha','escot.'],['terminal','term.']].map(([k, lbl]) => (
          <button key={k} style={btn(tweaks.portalStyle === k)} onClick={() => update('portalStyle', k)}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: '#A89070', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>wireframe landscape</div>
      <div style={row}>
        <button style={btn(tweaks.showLandscape)} onClick={() => update('showLandscape', true)}>mostrar</button>
        <button style={btn(!tweaks.showLandscape)} onClick={() => update('showLandscape', false)}>ocultar</button>
      </div>

      <div style={{
        fontSize: 9, color: '#6B5A48',
        marginTop: 10, lineHeight: 1.4, fontFamily: 'JetBrains Mono',
      }}>
        // clique nos frames menores para trocar a variação principal. clique em um cômodo habitado para ver diálogo do NPC.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
