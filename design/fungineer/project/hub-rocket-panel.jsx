// hub-rocket-panel.jsx — blueprint diagram with parts as concentric rings

const { useState: useRpState, useEffect: useRpEffect, useRef: useRpRef } = React;

// Map each recipe part to a radial position (angle, ring)
// 8 parts arranged around the rocket silhouette
const PART_POSITIONS = {
  1: { angle: 180, ring: 0, label: 'Base Estrutural' },      // bottom
  2: { angle: 220, ring: 1, label: 'Casco Externo' },        // bottom-left
  3: { angle: 140, ring: 1, label: 'Suporte Interno' },      // bottom-right
  4: { angle: 270, ring: 2, label: 'Sistema Elétrico' },     // left
  5: { angle: 90,  ring: 2, label: 'Painel de Controle' },   // right
  6: { angle: 315, ring: 3, label: 'Motor Principal' },      // upper-left
  7: { angle: 45,  ring: 3, label: 'Sist. Navegação' },      // upper-right
  8: { angle: 0,   ring: 4, label: 'Blindagem Final' },      // top
};

const DESIGNERS = {
  1: 'Marcus',  2: 'Marcus',  3: 'Tomás',  4: 'Marcus',
  5: 'Doutor',  6: 'Tomás',   7: 'Yuki',   8: 'Priya',
};
const DESIGNER_QUOTES = {
  1: '"Tem que aguentar o empuxo. Ponto."',
  2: '"Chapa de aço soldada. Não é bonito mas funciona."',
  3: '"Arranjei no ferro-velho. Falta uma peça."',
  4: '"Voltagem instável. Cuidado com curto."',
  5: '"Os componentes de IA precisam ser puros."',
  6: '"Motor é coração. Cuidem dele como se cuidassem de mim."',
  7: '"Sem navegação, é um caixão lançado ao nada."',
  8: '"Quando terminar, ninguém mais vai precisar de você."',
};

function RocketPanel({ v, recipe, inventory, onClose, onBuild }) {
  const current = recipe.findIndex(r => !r.built);
  const [selected, setSelected] = useRpState(current >= 0 ? current : 0);
  const [building, setBuilding] = useRpState(false);
  const [partials, setPartials] = useRpState(recipe.map(r => r.partial || (r.built ? 1 : 0)));

  const sel = recipe[selected];
  const selState = partials[selected] >= 1 ? 'built'
                  : partials[selected] > 0 ? 'in-progress'
                  : selected === current ? 'ready'
                  : 'future';

  const canBuild = selState !== 'built' && inventory.scrap >= sel.scrap && inventory.ai >= sel.ai;

  const startBuild = () => {
    if (!canBuild || building) return;
    setBuilding(true);
    let step = 0;
    const id = setInterval(() => {
      step++;
      setPartials(p => {
        const next = [...p];
        next[selected] = Math.min(1, (p[selected] || 0) + 0.15);
        return next;
      });
      if (step >= 7) {
        clearInterval(id);
        setBuilding(false);
        if (onBuild) onBuild(selected);
      }
    }, 260);
  };

  const built = partials.filter(p => p >= 1).length;
  const progress = partials.reduce((a,b) => a+b, 0) / 8;

  return (
    <div style={{
      position:'absolute', inset: 0, zIndex: 60,
      background: '#020610',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Blueprint grid background */}
      <div style={{ position:'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(#3E6FA822 1px, transparent 1px),
          linear-gradient(90deg, #3E6FA822 1px, transparent 1px)
        `,
        backgroundSize: '16px 16px',
      }}/>
      {/* subtle radial vignette */}
      <div style={{ position:'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)'
      }}/>

      {/* Header */}
      <div style={{
        position:'relative', padding: '10px 12px',
        display:'flex', alignItems:'center', gap: 8,
        borderBottom: '1px solid #3E6FA844',
        background: 'rgba(8,16,28,0.8)',
      }}>
        <button onClick={onClose} style={{
          background:'transparent', border: '1px solid #3E6FA8',
          color: '#8AB4D8', width: 24, height: 24, cursor:'pointer',
          fontFamily: 'JetBrains Mono', fontSize: 11,
        }}>×</button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Special Elite, monospace', fontSize: 14, color: '#D8E8F0',
          }}>Projeto Êxodo · Foguete</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#6A8FB4', letterSpacing: 2 }}>
            BLUEPRINT · REV. 04 · DR. PAULO
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00FF88', letterSpacing: 1 }}>
          [{built}/8]
        </div>
      </div>

      {/* Blueprint diagram — rocket + rings */}
      <div style={{
        position:'relative', height: 340,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <BlueprintDiagram
          recipe={recipe}
          partials={partials}
          selected={selected}
          onSelect={setSelected}
          building={building}
        />
      </div>

      {/* Overall progress ring + current part info */}
      <div style={{ position:'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(4,10,18,0.96)',
        borderTop: '1px solid #3E6FA866',
        padding: 12,
      }}>
        <PartDetail
          part={sel}
          partIdx={selected}
          state={selState}
          partial={partials[selected]}
          inventory={inventory}
          canBuild={canBuild}
          building={building}
          onBuild={startBuild}
        />
      </div>

      {/* Faíscas / weld sparks when building */}
      {building && <WeldingOverlay />}
    </div>
  );
}

function BlueprintDiagram({ recipe, partials, selected, onSelect, building }) {
  const W = 360, H = 340;
  const cx = W/2, cy = H/2 + 8;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 400 }}>
      <defs>
        <linearGradient id="rk-panel-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8AB4D8" stopOpacity="0.2"/>
          <stop offset="0.5" stopColor="#8AB4D8" stopOpacity="0.5"/>
          <stop offset="1" stopColor="#8AB4D8" stopOpacity="0.15"/>
        </linearGradient>
      </defs>

      {/* concentric measurement rings */}
      {[60, 95, 130, 165].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#3E6FA844" strokeWidth="0.5" strokeDasharray="2 3"/>
      ))}
      {/* crosshair */}
      <line x1={cx-170} y1={cy} x2={cx+170} y2={cy} stroke="#3E6FA844" strokeWidth="0.5" strokeDasharray="4 4"/>
      <line x1={cx} y1={cy-160} x2={cx} y2={cy+160} stroke="#3E6FA844" strokeWidth="0.5" strokeDasharray="4 4"/>

      {/* ROCKET — wireframe, partials fill in */}
      <g>
        {/* full wireframe */}
        <g stroke="#3E6FA888" strokeWidth="1" fill="none" strokeDasharray="2 2">
          <path d={`M ${cx} ${cy-90} L ${cx+22} ${cy-60} L ${cx-22} ${cy-60} Z`}/>
          <path d={`M ${cx-22} ${cy-60} L ${cx-22} ${cy+50} L ${cx-36} ${cy+80} L ${cx+36} ${cy+80} L ${cx+22} ${cy+50} L ${cx+22} ${cy-60} Z`}/>
          <path d={`M ${cx-22} ${cy+28} L ${cx-46} ${cy+82} L ${cx-22} ${cy+62} Z`}/>
          <path d={`M ${cx+22} ${cy+28} L ${cx+46} ${cy+82} L ${cx+22} ${cy+62} Z`}/>
          <circle cx={cx} cy={cy-30} r="10"/>
          <circle cx={cx} cy={cy+5} r="8"/>
        </g>

        {/* built portion — show by % progress */}
        {recipe.map((r, i) => {
          if ((partials[i] || 0) <= 0) return null;
          const alpha = Math.min(1, partials[i]);
          return <BuiltPart key={i} idx={i+1} cx={cx} cy={cy} alpha={alpha}/>;
        })}
      </g>

      {/* 8 parts as nodes around */}
      {recipe.map((part, i) => {
        const pos = PART_POSITIONS[i+1];
        const ringR = 62 + pos.ring * 16;
        const rad = (pos.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad - Math.PI/2) * ringR;
        const y = cy + Math.sin(rad - Math.PI/2) * ringR;
        // place labels outside that radius
        const labelR = ringR + 38;
        const lx = cx + Math.cos(rad - Math.PI/2) * labelR;
        const ly = cy + Math.sin(rad - Math.PI/2) * labelR;

        const p = partials[i] || 0;
        const state = p >= 1 ? 'built' : p > 0 ? 'ip' : i === recipe.findIndex(r => !r.built) ? 'ready' : 'future';
        const color = state === 'built' ? '#00FF88' : state === 'ip' ? '#FFB830' : state === 'ready' ? '#E8943A' : '#3E6FA8';
        const isSel = selected === i;

        return (
          <g key={i} style={{ cursor: 'pointer' }} onClick={() => onSelect(i)}>
            {/* connector line to rocket */}
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="0.5" opacity={isSel ? 1 : 0.4} strokeDasharray="3 2"/>
            {/* node */}
            <circle cx={x} cy={y} r={isSel ? 10 : 7} fill="#020610" stroke={color} strokeWidth={isSel ? 2 : 1.2}/>
            <text x={x} y={y+3} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill={color} fontWeight="700">
              {i+1}
            </text>
            {/* in-progress arc */}
            {state === 'ip' && (
              <circle cx={x} cy={y} r={isSel ? 12 : 9} fill="none" stroke={color} strokeWidth="1.5"
                strokeDasharray={`${p*60} 60`} transform={`rotate(-90 ${x} ${y})`}/>
            )}
            {/* pulsing ring if selected and ready/ip */}
            {isSel && state !== 'built' && state !== 'future' && (
              <circle cx={x} cy={y} r="16" fill="none" stroke={color} strokeWidth="0.8">
                <animate attributeName="r" values="12;20;12" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite"/>
              </circle>
            )}
            {/* label */}
            <text x={lx} y={ly} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7.5"
              fill={isSel ? '#D8E8F0' : '#6A8FB4'} letterSpacing="1">
              {pos.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* annotations */}
      <text x="12" y="16" fontFamily="JetBrains Mono" fontSize="7" fill="#6A8FB4" letterSpacing="2">
        FIG. 01 · ELEVAÇÃO
      </text>
      <text x={W-12} y="16" textAnchor="end" fontFamily="JetBrains Mono" fontSize="7" fill="#6A8FB4" letterSpacing="2">
        ESCALA 1:48
      </text>
      <text x="12" y={H-8} fontFamily="JetBrains Mono" fontSize="7" fill="#6A8FB4" letterSpacing="2">
        PROJETO ÊXODO
      </text>
    </svg>
  );
}

function BuiltPart({ idx, cx, cy, alpha }) {
  const col = '#00C878';
  const stroke = '#00FF88';
  // reveal-as-you-build: opacity follows alpha
  const op = alpha;
  switch(idx) {
    case 1: // base
      return <path d={`M ${cx-36} ${cy+80} L ${cx+36} ${cy+80} L ${cx+22} ${cy+62} L ${cx-22} ${cy+62} Z`} fill={col} stroke={stroke} strokeWidth="1" opacity={op}/>;
    case 2: // casco externo — sides
      return <g opacity={op}>
        <rect x={cx-22} y={cy-60} width="6" height="120" fill={col} stroke={stroke} strokeWidth="0.8"/>
        <rect x={cx+16} y={cy-60} width="6" height="120" fill={col} stroke={stroke} strokeWidth="0.8"/>
      </g>;
    case 3: // suporte interno — fins
      return <g opacity={op}>
        <path d={`M ${cx-22} ${cy+28} L ${cx-46} ${cy+82} L ${cx-22} ${cy+62} Z`} fill={col} stroke={stroke} strokeWidth="0.8"/>
        <path d={`M ${cx+22} ${cy+28} L ${cx+46} ${cy+82} L ${cx+22} ${cy+62} Z`} fill={col} stroke={stroke} strokeWidth="0.8"/>
      </g>;
    case 4: // sistema elétrico — inside lines
      return <g opacity={op*0.7} stroke={stroke} strokeWidth="0.6" fill="none">
        <line x1={cx-14} y1={cy-40} x2={cx-14} y2={cy+40}/>
        <line x1={cx+14} y1={cy-40} x2={cx+14} y2={cy+40}/>
        <line x1={cx-14} y1={cy-10} x2={cx+14} y2={cy-10}/>
        <line x1={cx-14} y1={cy+20} x2={cx+14} y2={cy+20}/>
      </g>;
    case 5: // painel de controle — center circle
      return <g opacity={op}>
        <circle cx={cx} cy={cy-30} r="10" fill={col} stroke={stroke} strokeWidth="1"/>
        <circle cx={cx} cy={cy-30} r="4" fill="#020610"/>
      </g>;
    case 6: // motor — bottom
      return <ellipse cx={cx} cy={cy+78} rx="28" ry="5" opacity={op} fill={col} stroke={stroke} strokeWidth="1"/>;
    case 7: // nav — porthole 2
      return <g opacity={op}>
        <circle cx={cx} cy={cy+5} r="8" fill={col} stroke={stroke} strokeWidth="1"/>
        <circle cx={cx} cy={cy+5} r="3" fill="#020610"/>
      </g>;
    case 8: // blindagem + nose
      return <path d={`M ${cx} ${cy-90} L ${cx+22} ${cy-60} L ${cx-22} ${cy-60} Z`} fill={col} stroke={stroke} strokeWidth="1" opacity={op}/>;
    default: return null;
  }
}

function PartDetail({ part, partIdx, state, partial, inventory, canBuild, building, onBuild }) {
  const stateInfo = {
    built:       { label: 'CONSTRUÍDA',   color: '#00FF88' },
    'in-progress':{ label: 'EM CONSTRUÇÃO', color: '#FFB830' },
    ready:       { label: 'PRÓXIMA',      color: '#E8943A' },
    future:      { label: 'FUTURA',       color: '#6A8FB4' },
  }[state] || { label: '', color: '#6A8FB4' };

  const designer = DESIGNERS[partIdx+1];
  const quote = DESIGNER_QUOTES[partIdx+1];

  const enoughScrap = inventory.scrap >= part.scrap;
  const enoughAI = inventory.ai >= part.ai;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems:'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 22, height: 22, display:'flex', alignItems:'center', justifyContent:'center',
            border: `1px solid ${stateInfo.color}`, color: stateInfo.color,
            fontFamily:'JetBrains Mono', fontSize: 11, fontWeight: 700,
          }}>{partIdx+1}</div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 14, color: '#D8E8F0' }}>
            {part.nome}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 8, letterSpacing: 1.5,
            color: stateInfo.color, padding: '1px 5px',
            border: `1px solid ${stateInfo.color}66`,
          }}>{stateInfo.label}</div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#6A8FB4', letterSpacing: 1, marginBottom: 4 }}>
          PROJETADO POR {designer.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: '#8AB4D8', fontStyle:'italic', marginBottom: 8 }}>
          {quote}
        </div>
        {state === 'in-progress' && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ height: 3, background:'#1a2838', borderRadius:1, overflow:'hidden' }}>
              <div style={{ height: '100%', background:'#FFB830', width: `${(partial*100)|0}%`, transition:'width 260ms' }}/>
            </div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize: 8, color:'#FFB830', marginTop: 2, letterSpacing: 1 }}>
              {(partial*100)|0}% SOLDADO
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign:'right' }}>
        <div style={{ display:'flex', gap: 8, justifyContent:'flex-end', marginBottom: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
            <span style={{ color: enoughScrap ? '#9CA3AF' : '#D14A3F' }}>◇{part.scrap}</span>
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
            <span style={{ color: enoughAI ? '#00FF88' : '#D14A3F' }}>◆{part.ai}</span>
          </span>
        </div>
        <button onClick={onBuild} disabled={!canBuild || building || state === 'built' || state === 'future'} style={{
          padding: '8px 14px',
          background: state === 'built' ? 'transparent' : (canBuild ? '#E8943A22' : '#1a2838'),
          border: `1px solid ${state === 'built' ? '#00FF88' : (canBuild ? '#E8943A' : '#3E6FA8')}`,
          color: state === 'built' ? '#00FF88' : (canBuild ? '#E8943A' : '#6A8FB4'),
          fontFamily: 'Special Elite, monospace',
          fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
          cursor: canBuild && !building ? 'pointer' : 'not-allowed',
          minWidth: 110,
        }}>
          {state === 'built' ? '✓ pronto'
            : building ? 'soldando…'
            : state === 'future' ? 'bloqueada'
            : canBuild ? 'soldar →'
            : 'sem recursos'}
        </button>
      </div>
    </div>
  );
}

function WeldingOverlay() {
  return (
    <div style={{
      position:'absolute', inset: 0, pointerEvents:'none', zIndex: 100,
    }}>
      <div style={{ position:'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 45%, #FFB83022 0%, transparent 30%)',
        animation: 'flicker 0.15s infinite',
      }}/>
      {[...Array(14)].map((_,i) => {
        const left = 40 + Math.random()*20;
        const top = 35 + Math.random()*20;
        return (
          <div key={i} style={{
            position:'absolute',
            left: left+'%', top: top+'%',
            width: 2, height: 2, background: '#FFE890',
            boxShadow: '0 0 6px #FFB830',
            borderRadius:'50%',
            animation: `spark-${i%5} ${0.5 + Math.random()*0.6}s ease-out infinite`,
            animationDelay: `${i*0.08}s`,
          }}/>
        );
      })}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spark-0 { from { transform: translate(0,0); opacity:1 } to { transform: translate(20px,20px); opacity:0 } }
        @keyframes spark-1 { from { transform: translate(0,0); opacity:1 } to { transform: translate(-18px,22px); opacity:0 } }
        @keyframes spark-2 { from { transform: translate(0,0); opacity:1 } to { transform: translate(24px,-16px); opacity:0 } }
        @keyframes spark-3 { from { transform: translate(0,0); opacity:1 } to { transform: translate(-22px,-20px); opacity:0 } }
        @keyframes spark-4 { from { transform: translate(0,0); opacity:1 } to { transform: translate(8px,26px); opacity:0 } }
      `}}/>
    </div>
  );
}

Object.assign(window, { RocketPanel });
