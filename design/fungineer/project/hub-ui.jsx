// hub-ui.jsx — shared HUD chrome: top bar, resource counters, rocket readout, zone cards

function ResourceChip({ kind, count, v, density }) {
  const color = kind === 'scrap' ? '#9CA3AF' : v.neonGreen;
  const sym = kind === 'scrap' ? '◇' : '◆';
  const label = kind === 'scrap' ? 'SUCATA' : 'COMP. IA';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 9px',
      background: v.bgTint,
      border: `1px solid ${v.floorLine}`,
      borderRadius: 4,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
    }}>
      <span style={{ color, fontSize: 13 }}>{sym}</span>
      <span style={{ color: v.ink, fontWeight: 600, minWidth: 16 }}>{count}</span>
      {density !== 'minimal' && (
        <span style={{ color: v.inkMuted, fontSize: 9, letterSpacing: 1 }}>{label}</span>
      )}
    </div>
  );
}

function BackpackSlots({ slots, max, v }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({length: max}).map((_, i) => (
        <div key={i} style={{
          width: 12, height: 12,
          border: `1px ${i < slots ? 'solid' : 'dashed'} ${i < slots ? v.warmLight : v.inkLow}`,
          background: i < slots ? v.warmLight+'33' : 'transparent',
          borderRadius: 1,
        }}/>
      ))}
    </div>
  );
}

function TopBar({ v, inv, specialElite, density }) {
  return (
    <div style={{
      padding: '10px 12px 8px',
      borderBottom: `1px solid ${v.floorLine}`,
      background: v.bg,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: specialElite ? 'Special Elite, monospace' : 'Inter, sans-serif',
          fontSize: specialElite ? 13 : 12,
          fontWeight: specialElite ? 400 : 600,
          letterSpacing: specialElite ? 0.5 : 1.5,
          color: v.ink,
          textTransform: specialElite ? 'none' : 'uppercase',
        }}>
          {specialElite ? 'Base de Resistência' : 'BASE DE RESISTÊNCIA'}
        </div>
        {density !== 'minimal' && (
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, color: v.inkMuted, marginTop: 2,
            letterSpacing: 1,
          }}>
            SUBSOLO · SESSÃO 04 · {inv.slots}/{inv.slotsMax} SLOTS
          </div>
        )}
      </div>
      <ResourceChip kind="scrap" count={inv.scrap} v={v} density={density}/>
      <ResourceChip kind="ai" count={inv.ai} v={v} density={density}/>
    </div>
  );
}

function RocketReadout({ v, recipe, density, onClick }) {
  const built = recipe.filter(r => r.built).length;
  const current = recipe.find(r => !r.built);
  return (
    <div onClick={onClick} style={{
      padding: '8px 12px',
      background: v.bgTint,
      borderTop: `1px solid ${v.floorLine}`,
      borderBottom: `1px solid ${v.floorLine}`,
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, color: v.warmLight, fontWeight: 600,
      }}>
        [{built}/8]
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: v.inkMuted, letterSpacing: 0.5 }}>
          próxima peça
        </div>
        <div style={{ fontSize: 13, color: v.ink, fontWeight: 500 }}>
          {current?.nome || 'Foguete completo'}
        </div>
      </div>
      {current && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: v.inkMuted }}>
            <span style={{ color: '#9CA3AF' }}>◇</span>{current.scrap} · <span style={{ color: v.neonGreen }}>◆</span>{current.ai}
          </span>
        </div>
      )}
    </div>
  );
}

// Bottom bar — legend pointing out that rooms are zone entries
function BottomBar({ v, density, onAction }) {
  const zones = window.ZONES;
  return (
    <div style={{
      padding: '8px 12px',
      borderTop: `1px solid ${v.floorLine}`,
      background: v.bg,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 8, color: v.inkMuted,
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
        }}>▸ toque numa sala com luz piscando</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {zones.map(z => (
            <div key={z.id} style={{
              display:'flex', alignItems:'center', gap: 3,
              fontFamily:'JetBrains Mono', fontSize: 8,
              color: v.inkMuted, letterSpacing: 0.5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: z.color,
                boxShadow: `0 0 4px ${z.color}` }}/>
              {z.nome.replace('Zona ','')}
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => onAction('rocket')} style={{
        background: v.warmLight + '1a',
        border: `1px solid ${v.warmLight}`,
        borderRadius: 3,
        color: v.warmLight,
        fontFamily: 'Inter, sans-serif',
        fontSize: 10, fontWeight: 600, letterSpacing: 1,
        cursor: 'pointer',
        textTransform: 'uppercase',
        padding: '8px 10px',
        whiteSpace: 'nowrap',
      }}>
        ◈ Foguete
      </button>
    </div>
  );
}

// Interaction popover — when an NPC is clicked
function NPCPopover({ npc, v, onClose }) {
  if (!npc) return null;
  const pct = npc.trust;
  const threshold = pct >= 60 ? 'aceita runs' : pct >= 40 ? 'missão disponível' : 'desconfiado';
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0,
      background: 'rgba(7,11,17,0.72)',
      zIndex: 20,
      display: 'flex', alignItems: 'flex-end',
      padding: 12,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        background: v.panelBg,
        border: `1px solid ${v.panelBorder}`,
        borderRadius: 8,
        padding: 14,
        boxShadow: `0 8px 32px ${v.warmLight}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: npc.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono', fontWeight: 700, color: v.bg,
            position: 'relative',
          }}>
            {npc.glyph}
            <svg width="48" height="48" style={{ position: 'absolute', top: -4, left: -4 }}>
              <circle cx="24" cy="24" r="22" fill="none" stroke={v.floorLine} strokeWidth="2"/>
              <circle cx="24" cy="24" r="22" fill="none" stroke={npc.color} strokeWidth="2"
                strokeDasharray={`${(pct/100)*138} 138`} transform="rotate(-90 24 24)" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 16, color: v.ink }}>
              {npc.nome}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: v.inkMuted, letterSpacing: 1 }}>
              {npc.hint.toUpperCase()} · {pct}% · {threshold}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${v.inkLow}`,
            color: v.inkMuted, width: 24, height: 24, borderRadius: 2, cursor: 'pointer',
          }}>×</button>
        </div>
        <div style={{
          fontFamily: 'Special Elite, monospace', fontSize: 13,
          color: v.ink, lineHeight: 1.4, marginBottom: 10,
        }}>
          {dialogueFor(npc)}
        </div>
        <div style={{
          padding: 10, background: v.bg,
          border: `1px dashed ${v.panelBorder}66`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: v.warmLight, textTransform: 'uppercase', marginBottom: 4 }}>
            ▸ missão ativa
          </div>
          <div style={{ fontSize: 12, color: v.ink }}>{missionFor(npc)}</div>
        </div>
      </div>
    </div>
  );
}

function dialogueFor(npc) {
  return ({
    doutor:  '"Ainda não acabou. O Painel de Controle está a 3 componentes. Vai."',
    marcus:  '"Se for na Stealth, me avisa. Achei um atalho pelo setor leste."',
    amara:   '"Traga 3 Componentes de IA. Preciso testar uma coisa."',
    yuki:    '"Quer intel? Aposto uma run: faz Stealth sem detectar."',
    elena:   '"Fica no cone 4 segundos e você vira dado. Entendeu?"',
    bae:     '"Registre isto: o foguete está crescendo mais do que nós."',
    priya:   '"Não. Sua receita está errada. Mas eu não impeço."',
    tomas:   '"Ó, arrumei a escotilha. Funciona mais ou menos. Vai dar certo!"',
    lena:    '"Eu posso ir. Eu sei que pode. Me leva."',
    richard: '"Slot 6 já está pago. Quando quiser, desbloqueio."',
    viktor:  '"Vai sem mim. Volta com as pernas. Depois a gente vê."',
  })[npc.id] || '—';
}

function missionFor(npc) {
  return ({
    doutor:  'Concluir o Painel de Controle',
    marcus:  'Trazer 5× Componentes de IA',
    amara:   'Sobreviver 3 runs consecutivas',
    yuki:    'Completar Stealth sem ser detectado',
    elena:   'Resgatar 1 sobrevivente na Zona Hordas',
    bae:     'Trazer recurso de zona ainda não visitada',
    priya:   'Entregar 4× Comp. IA para sua "teoria"',
    tomas:   'Sobreviver 1 run com HP cheio',
    lena:    'Desbloquear permissão (não disponível)',
    richard: 'Entregar 12× Sucata para upgrade de mochila',
    viktor:  'Completar 2 runs consecutivas de Hordas',
  })[npc.id] || '—';
}

Object.assign(window, { TopBar, RocketReadout, BottomBar, NPCPopover, BackpackSlots, ResourceChip, dialogueFor, missionFor });
