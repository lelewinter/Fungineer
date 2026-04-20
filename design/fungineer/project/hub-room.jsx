// hub-room.jsx — detailed interior rooms like Fallout Shelter

// Interior details drawn with divs — each room type has its own furnishings
function RoomInterior({ type, v, w, h }) {
  const items = [];
  const acc = v.warmLight;
  const cool = v.coolLight;

  switch(type) {
    case 'tech': {
      // monitors + desk
      items.push(<div key="d" style={{ position:'absolute', bottom: 10, left: 8, right: 8, height: 4, background: v.floorLine }}/>);
      for (let i=0; i<3; i++) items.push(
        <div key={'m'+i} style={{ position:'absolute', bottom: 14, left: 10+i*24, width: 18, height: 12,
          background: '#0D1420', border: `1px solid ${v.inkLow}` }}>
          <div style={{ position:'absolute', inset: 1, background: '#D14A3F', opacity: 0.7,
            animation: 'flicker 3s infinite' }}/>
        </div>
      );
      items.push(<div key="sign" style={{ position:'absolute', top: 3, right: 5, width: 5, height: 5,
          background: '#D14A3F', borderRadius: '50%', boxShadow: '0 0 8px #D14A3F'}}/>);
      break;
    }
    case 'storage': {
      // DEPÓSITO — prateleiras com componentes (sucata, IA, peças catalogadas)
      // Prateleiras horizontais
      items.push(<div key="sh1" style={{ position:'absolute', bottom: 12, left: 4, right: 4, height: 1, background: v.inkMuted }}/>);
      items.push(<div key="sh2" style={{ position:'absolute', bottom: 22, left: 4, right: 4, height: 1, background: v.inkMuted }}/>);
      items.push(<div key="sh3" style={{ position:'absolute', bottom: 32, left: 4, right: 4, height: 1, background: v.inkMuted }}/>);
      // Suportes verticais
      items.push(<div key="pv1" style={{ position:'absolute', bottom: 8, left: 4, width: 1, height: 28, background: v.inkMuted }}/>);
      items.push(<div key="pv2" style={{ position:'absolute', bottom: 8, right: 4, width: 1, height: 28, background: v.inkMuted }}/>);
      items.push(<div key="pv3" style={{ position:'absolute', bottom: 8, left: w/2, width: 1, height: 28, background: v.inkMuted, opacity: 0.6 }}/>);

      // Prateleira 1 (inferior): sucatas — parafusos, placas
      const scraps = [
        { x: 7,  w: 6, h: 4, c: '#8A6A48' },  // pilha
        { x: 15, w: 4, h: 6, c: '#6A4A32' },
        { x: 21, w: 8, h: 5, c: '#A88256' },
        { x: 31, w: 5, h: 7, c: '#6A4A32' },
        { x: 38, w: 7, h: 4, c: '#8A6A48' },
        { x: 47, w: 5, h: 6, c: '#A88256' },
        { x: 54, w: 6, h: 5, c: '#6A4A32' },
      ];
      scraps.forEach((s,i) => items.push(
        <div key={'sc'+i} style={{ position:'absolute', bottom: 13, left: s.x, width: s.w, height: s.h,
          background: s.c, border: `0.5px solid ${v.bg}`, opacity: 0.92 }}/>
      ));
      // rótulo prateleira 1
      items.push(<div key="lb1" style={{ position:'absolute', bottom: 7, left: 4,
        fontFamily:'JetBrains Mono', fontSize: 4, color: v.inkLow, letterSpacing: 0.5 }}>SUCATA</div>);

      // Prateleira 2 (meio): componentes IA — chips brilhantes
      const chips = [
        { x: 8,  c: v.neonGreen, bright: 1 },
        { x: 16, c: v.neonGreen, bright: 0.5 },
        { x: 24, c: '#00FFAA', bright: 1 },
        { x: 34, c: v.neonGreen, bright: 0.8 },
        { x: 44, c: '#4AD9A0', bright: 0.6 },
        { x: 52, c: v.neonGreen, bright: 1 },
      ];
      chips.forEach((ch,i) => items.push(
        <div key={'ch'+i} style={{ position:'absolute', bottom: 23, left: ch.x, width: 5, height: 7,
          background: '#0A1A14', border: `0.5px solid ${ch.c}`,
          boxShadow: `0 0 ${3*ch.bright}px ${ch.c}` }}>
          <div style={{ position:'absolute', top: 1, left: 1, right: 1, height: 1, background: ch.c, opacity: ch.bright }}/>
          <div style={{ position:'absolute', top: 3, left: 1, right: 1, height: 1, background: ch.c, opacity: ch.bright*0.6 }}/>
          <div style={{ position:'absolute', top: 5, left: 1, right: 1, height: 1, background: ch.c, opacity: ch.bright }}/>
        </div>
      ));
      items.push(<div key="lb2" style={{ position:'absolute', bottom: 17, left: 4,
        fontFamily:'JetBrains Mono', fontSize: 4, color: v.inkLow, letterSpacing: 0.5 }}>COMP.IA</div>);

      // Prateleira 3 (topo): peças especiais — caixas etiquetadas, bobinas
      const parts = [
        { x: 7,  w: 10, h: 7, c: v.wall, tag: '#E8943A' },  // caixa com fita âmbar
        { x: 19, w: 7,  h: 8, c: '#2A1F14', tag: v.neonGreen },
        { x: 28, w: 5,  h: 5, c: '#D14A3F', tag: null, round: true }, // bobina vermelha
        { x: 35, w: 8,  h: 7, c: v.wall, tag: '#4A5A8C' },
        { x: 45, w: 4,  h: 4, c: '#C87A2E', tag: null, round: true },
        { x: 51, w: 9,  h: 6, c: '#2A1F14', tag: '#FFB830' },
      ];
      parts.forEach((p,i) => items.push(
        <div key={'pt'+i} style={{ position:'absolute', bottom: 33, left: p.x, width: p.w, height: p.h,
          background: p.c, border: `0.5px solid ${v.floorLine}`,
          borderRadius: p.round ? '50%' : 1, opacity: 0.95 }}>
          {p.tag && <div style={{ position:'absolute', top: '50%', left: 0, right: 0, height: 1, background: p.tag, transform:'translateY(-50%)', opacity: 0.8 }}/>}
        </div>
      ));
      items.push(<div key="lb3" style={{ position:'absolute', bottom: 27, left: 4,
        fontFamily:'JetBrains Mono', fontSize: 4, color: v.inkLow, letterSpacing: 0.5 }}>PEÇAS</div>);

      // Clipboard na parede
      items.push(<div key="clip" style={{ position:'absolute', top: 4, right: 6, width: 8, height: 10,
        background: '#F4E4C8', border: `0.5px solid ${v.inkLow}`, opacity: 0.7 }}>
        <div style={{ position:'absolute', top: 1.5, left: 1, right: 1, height: 0.5, background: v.inkLow}}/>
        <div style={{ position:'absolute', top: 3, left: 1, right: 1, height: 0.5, background: v.inkLow}}/>
        <div style={{ position:'absolute', top: 4.5, left: 1, right: 2.5, height: 0.5, background: v.inkLow}}/>
        <div style={{ position:'absolute', top: 6, left: 1, right: 1, height: 0.5, background: v.inkLow}}/>
        <div style={{ position:'absolute', top: 7.5, left: 1, right: 3, height: 0.5, background: v.inkLow}}/>
      </div>);
      break;
    }
    case 'lab': {
      // benches + beakers
      items.push(<div key="b" style={{ position:'absolute', bottom: 10, left: 6, right: 6, height: 4, background: '#3A3A3A'}}/>);
      ['#4FB872','#B85AD9','#FFB830','#00D4FF'].forEach((c,i) => items.push(
        <div key={'f'+i} style={{ position:'absolute', bottom: 14, left: 10+i*18, width: 8, height: 12,
          background: c, opacity: 0.5, border: `1px solid ${v.ink}44`, borderRadius: 1 }}/>
      ));
      items.push(<div key="chart" style={{ position:'absolute', top: 4, left: 6, width: w-12, height: 8,
        background: `repeating-linear-gradient(90deg, ${v.inkLow}44 0 3px, transparent 3px 6px)` }}/>);
      break;
    }
    case 'medical': {
      // beds
      [0,1].forEach(i => items.push(
        <div key={'bd'+i} style={{ position:'absolute', bottom: 10, left: 8 + i*(w/2-4), width: w/2-10, height: 12,
          background: '#D0F0E0', border: `1px solid ${v.floorLine}`, borderRadius: 2 }}>
          <div style={{ position:'absolute', top: -4, left: 2, width: 4, height: 8, background: v.floorLine }}/>
        </div>
      ));
      items.push(<div key="cross" style={{ position:'absolute', top: 4, right: 6, width: 10, height: 10,
        background: v.bg, border: `1px solid ${v.neonGreen}`,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width: 1.5, height: 6, background: v.neonGreen, position:'absolute'}}/>
        <div style={{ width: 6, height: 1.5, background: v.neonGreen, position:'absolute'}}/>
      </div>);
      break;
    }
    case 'workshop': {
      // benches + tools
      items.push(<div key="b" style={{ position:'absolute', bottom: 10, left: 6, right: 6, height: 5, background: v.floorLine}}/>);
      for (let i=0; i<5; i++) items.push(
        <div key={'t'+i} style={{ position:'absolute', bottom: 15, left: 8+i*14, width: 3, height: 2+Math.random()*6,
          background: v.inkMuted }}/>
      );
      items.push(<div key="spark" style={{ position:'absolute', top: 8, right: 10, width: 4, height: 4, background: v.warmLight,
        borderRadius:'50%', boxShadow: `0 0 8px ${v.warmLight}`, animation:'flicker 1.5s infinite' }}/>);
      break;
    }
    case 'common': {
      // table + chairs + plant
      items.push(<div key="t" style={{ position:'absolute', bottom: 12, left: w/2-16, width: 32, height: 6, background: '#8C6A3E'}}/>);
      items.push(<div key="t2" style={{ position:'absolute', bottom: 10, left: w/2-14, width: 2, height: 8, background: '#5C3A1F'}}/>);
      items.push(<div key="plant" style={{ position:'absolute', bottom: 14, left: 8, width: 6, height: 8, background: '#5C7A4E', borderRadius: '2px 2px 0 0'}}/>);
      items.push(<div key="lamp" style={{ position:'absolute', top: 0, left: w/2-1, width: 2, height: 8, background: v.inkLow}}/>);
      items.push(<div key="lamp2" style={{ position:'absolute', top: 6, left: w/2-4, width: 8, height: 6, background: v.warmLight, opacity: 0.7,
        borderRadius: '0 0 50% 50%', boxShadow: `0 0 16px ${v.warmLight}` }}/>);
      break;
    }
    case 'kitchen': {
      // stove + counter + pots
      items.push(<div key="c" style={{ position:'absolute', bottom: 10, left: 6, right: 6, height: 10, background: v.floorLine, borderTop: `1px solid ${v.inkMuted}`}}/>);
      items.push(<div key="stove" style={{ position:'absolute', bottom: 12, left: 12, width: 16, height: 8, background: '#2A2A2A'}}>
        <div style={{ position:'absolute', top: 2, left: 2, width: 3, height: 3, background: '#FF6A1A', borderRadius:'50%'}}/>
        <div style={{ position:'absolute', top: 2, right: 2, width: 3, height: 3, background: '#FF6A1A', borderRadius:'50%', opacity: 0.5}}/>
      </div>);
      items.push(<div key="pot" style={{ position:'absolute', bottom: 18, left: 30, width: 8, height: 5, background: '#5A5A5A', borderRadius: '2px 2px 0 0'}}/>);
      break;
    }
    case 'archive': {
      // shelves w/ books + photo wall
      for (let r=0; r<2; r++) for (let c=0; c<8; c++) items.push(
        <div key={'bk'+r+c} style={{ position:'absolute', bottom: 10+r*10, left: 6+c*7, width: 5, height: 8,
          background: ['#8C3E3A','#3E5A8C','#5C7A4E','#C8A97E','#6A4A3A'][c%5] }}/>
      );
      items.push(<div key="cam" style={{ position:'absolute', top: 4, right: 8, width: 10, height: 7, background: v.bg, border: `1px solid ${v.inkMuted}`}}>
        <div style={{ position:'absolute', top: 1, left: 2, width: 4, height: 4, background: v.inkLow, borderRadius:'50%'}}/>
      </div>);
      break;
    }
    case 'server': {
      // tall server racks
      for (let i=0; i<4; i++) items.push(
        <div key={'s'+i} style={{ position:'absolute', bottom: 8, left: 6+i*12, width: 10, height: 26,
          background: '#0A0A0A', border: `1px solid ${v.neonGreen}44`}}>
          {[0,1,2,3].map(j => (
            <div key={j} style={{ position:'absolute', top: 2+j*6, left: 1, right: 1, height: 2, background: v.neonGreen, opacity: 0.4+Math.random()*0.5 }}/>
          ))}
        </div>
      );
      items.push(<div key="glow" style={{ position:'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 60%, ${v.neonGreen}22, transparent 70%)` }}/>);
      break;
    }
    case 'office': {
      // desk + monitor + clipboard
      items.push(<div key="d" style={{ position:'absolute', bottom: 10, left: 8, right: 8, height: 4, background: '#3D2B1F'}}/>);
      items.push(<div key="m" style={{ position:'absolute', bottom: 14, left: 14, width: 18, height: 12, background: '#0D1420',
        border: `1px solid ${v.inkLow}`}}>
        <div style={{ position:'absolute', inset: 1, background: '#4A7AA8', opacity: 0.5 }}/>
      </div>);
      items.push(<div key="paper" style={{ position:'absolute', bottom: 14, right: 12, width: 10, height: 10, background: '#F4E4C8', opacity: 0.8}}>
        <div style={{ position:'absolute', top: 2, left: 1, right: 1, height: 1, background: v.inkLow}}/>
        <div style={{ position:'absolute', top: 5, left: 1, right: 1, height: 1, background: v.inkLow}}/>
        <div style={{ position:'absolute', top: 8, left: 1, right: 3, height: 1, background: v.inkLow}}/>
      </div>);
      items.push(<div key="plant" style={{ position:'absolute', bottom: 14, left: 6, width: 4, height: 4, background: '#5C7A4E', opacity: 0.6}}/>);
      break;
    }
    case 'bedroom': {
      // bed + posters
      items.push(<div key="bed" style={{ position:'absolute', bottom: 10, left: 8, width: w-20, height: 10, background: '#8C3E5A', borderRadius: 2}}>
        <div style={{ position:'absolute', top: -3, left: 2, width: 8, height: 4, background: '#F4E4C8'}}/>
      </div>);
      items.push(<div key="poster" style={{ position:'absolute', top: 4, right: 6, width: 10, height: 14,
        background: `linear-gradient(180deg, ${v.neonGreen}88, ${v.bg})`, border: `1px solid ${v.ink}44` }}/>);
      items.push(<div key="toy" style={{ position:'absolute', bottom: 12, right: 14, width: 6, height: 6,
        background: '#D9B838', borderRadius:'50%' }}/>);
      break;
    }
    case 'tunnel-warm': {
      items.push(<div key="f" style={{ position:'absolute', bottom: 8, left: 0, right: 0, height: 8,
        background: `linear-gradient(90deg, ${v.warmLight}33, transparent)` }}/>);
      items.push(<div key="rail" style={{ position:'absolute', bottom: 10, left: 0, right: 0, height: 2,
        background: v.floorLine }}/>);
      // rail ties
      for (let i=0; i<6; i++) items.push(
        <div key={'rt'+i} style={{ position:'absolute', bottom: 8, left: 4+i*14, width: 8, height: 2, background: v.inkMuted }}/>
      );
      items.push(<div key="arr" style={{ position:'absolute', top: 4, left: 4,
        fontFamily:'JetBrains Mono', fontSize: 10, color: v.warmLight, letterSpacing: 1 }}>← HORDAS</div>);
      break;
    }
    case 'tunnel-cool': {
      items.push(<div key="f" style={{ position:'absolute', bottom: 8, left: 0, right: 0, height: 8,
        background: `linear-gradient(-90deg, ${v.neonGreen}33, transparent)` }}/>);
      items.push(<div key="rail" style={{ position:'absolute', bottom: 10, left: 0, right: 0, height: 2, background: v.floorLine }}/>);
      for (let i=0; i<6; i++) items.push(
        <div key={'rt'+i} style={{ position:'absolute', bottom: 8, left: 4+i*14, width: 8, height: 2, background: v.inkMuted }}/>
      );
      items.push(<div key="arr" style={{ position:'absolute', top: 4, right: 4,
        fontFamily:'JetBrains Mono', fontSize: 10, color: v.neonGreen, letterSpacing: 1 }}>STEALTH →</div>);
      break;
    }
    case 'transit': {
      items.push(<div key="door" style={{ position:'absolute', top: 6, left: w/2-10, width: 20, height: h-16,
        background: v.wall, border: `1px solid ${v.inkMuted}` }}>
        <div style={{ position:'absolute', top:'50%', left: 2, width: 3, height: 3, background: v.warmLight, borderRadius:'50%'}}/>
      </div>);
      break;
    }
    default:
      break;
  }
  return <>{items}</>;
}

// Light overlay per room lighting type
function lightColorFor(kind, v) {
  return ({
    'red':         '#D14A3F',
    'cool':        v.coolLight,
    'clinical':    '#C8D8D8',
    'hospital':    '#90E0B8',
    'amber':       v.warmLight,
    'amber-hot':   v.warmLight,
    'amber-dim':   '#C87A2E',
    'warm':        v.warmLight,
    'neon-green':  v.neonGreen,
    'office':      '#8FA8C8',
    'pink-dim':    '#D8889A',
    'dim':         v.inkMuted,
  })[kind] || v.ink;
}

function Room({ room, v, npcsInRoom, tickPhase, density, onOpen, onZoneRoom, cellW, cellH }) {
  const occupied = npcsInRoom.length > 0;
  const light = lightColorFor(room.light, v);
  const hasMission = npcsInRoom.some(n => n.trust >= 40 && n.trust < 100);
  const zone = window.ROOM_TO_ZONE?.[room.id];
  const isZoneRoom = !!zone;

  const handleClick = () => {
    if (isZoneRoom && onZoneRoom) onZoneRoom(room, zone);
    else if (occupied) onOpen(npcsInRoom[0]);
  };

  if (room.type === 'surface-exit') {
    // Campo aberto — saída da base · Zona Hordas
    return (
      <div onClick={isZoneRoom && onZoneRoom ? () => onZoneRoom(room, zone) : undefined} style={{
        gridColumn: `${room.col+1} / span ${room.w}`,
        background: `linear-gradient(180deg, #1A0E08 0%, #2A1810 50%, ${v.wall} 100%)`,
        borderBottom: `2px solid ${v.floorLine}`,
        position: 'relative', overflow: 'hidden',
        cursor: isZoneRoom ? 'pointer' : 'default',
      }}>
        {/* hazard sky — âmbar poluído pulsando */}
        <div style={{ position:'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 120%, ${v.warmLight}55 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #D14A3F44 0%, transparent 50%)`,
          animation: 'flicker 6s ease-in-out infinite'
        }}/>

        {/* camada 1 — montanhas distantes */}
        <svg width="100%" height="100%" style={{ position:'absolute', inset:0 }} viewBox="0 0 200 50" preserveAspectRatio="none">
          <path d="M0,40 L8,32 L18,36 L28,28 L40,34 L52,26 L65,32 L80,28 L95,34 L110,26 L125,30 L140,24 L155,32 L170,28 L185,34 L200,30 L200,50 L0,50 Z" fill="#0D0704" opacity="0.7"/>
          <path d="M0,44 L12,38 L25,42 L40,36 L55,40 L72,34 L90,40 L108,36 L125,42 L145,36 L165,40 L185,38 L200,42 L200,50 L0,50 Z" fill="#1A0E08" opacity="0.9"/>
        </svg>

        {/* enxame — silhuetas pequenas se movendo (indicador visual de perigo) */}
        {[...Array(14)].map((_, i) => {
          const xBase = (i * 7.5) + 2;
          return (
            <div key={'mob'+i} style={{
              position:'absolute', bottom: 8 + (i%3)*2, left: `${xBase}%`,
              width: 2, height: 3, background: '#0A0504',
              opacity: 0.8 - (i%3)*0.2,
              animation: `flicker ${2 + (i%4)*0.5}s ease-in-out infinite`,
              animationDelay: `${i*0.2}s`,
            }}/>
          );
        })}

        {/* ruína — estrutura quebrada em silhueta */}
        <div style={{ position:'absolute', bottom: 6, left: '12%', width: 10, height: 14,
          background: '#0A0504', clipPath: 'polygon(0 100%, 0 30%, 30% 0, 60% 40%, 100% 20%, 100% 100%)' }}/>
        <div style={{ position:'absolute', bottom: 6, right: '18%', width: 14, height: 18,
          background: '#0A0504', clipPath: 'polygon(0 100%, 0 60%, 20% 40%, 40% 50%, 50% 10%, 70% 30%, 100% 25%, 100% 100%)' }}/>

        {/* chão fraturado — linhas âmbar emergindo */}
        <div style={{ position:'absolute', bottom: 0, left: 0, right: 0, height: 6,
          background: `linear-gradient(0deg, ${v.warmLight}44, transparent), ${v.floorLine}` }}/>
        <div style={{ position:'absolute', bottom: 2, left: '20%', width: '15%', height: 1, background: v.warmLight, opacity: 0.5 }}/>
        <div style={{ position:'absolute', bottom: 3, left: '55%', width: '20%', height: 1, background: v.warmLight, opacity: 0.6 }}/>
        <div style={{ position:'absolute', bottom: 1, left: '75%', width: '10%', height: 1, background: '#D14A3F', opacity: 0.4 }}/>

        {/* glow de perigo próximo à saída */}
        <div style={{ position:'absolute', bottom: 0, left: 0, right: 0, height: 4,
          boxShadow: `0 -4px 12px ${v.warmLight}66, 0 -2px 6px #D14A3F44`,
          background: `linear-gradient(0deg, ${v.warmLight}, transparent)`, opacity: 0.6
        }}/>

        {/* label — tag vermelha de alerta */}
        <div style={{ position:'absolute', top: 3, left: 6,
          fontFamily:'JetBrains Mono', fontSize: 7, letterSpacing: 1.5, color: '#D14A3F', textTransform:'uppercase',
          textShadow: `0 0 4px #D14A3F66` }}>
          ▲ {room.label}
        </div>

        {/* pulse-dot badge como outras zonas */}
        {isZoneRoom && (
          <div style={{ position:'absolute', top: 4, right: 6,
            width: 8, height: 8, borderRadius: 1,
            background: zone.color,
            boxShadow: `0 0 6px ${zone.color}, 0 0 12px ${zone.color}66`,
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}/>
        )}
      </div>
    );
  }

  if (room.type === 'surface') {
    // Top surface strip: rocky, with silhouette of city
    return (
      <div style={{
        gridColumn: `${room.col+1} / span ${room.w}`,
        background: `linear-gradient(180deg, ${v.rock} 0%, ${v.wall} 100%)`,
        borderBottom: `2px solid ${v.floorLine}`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* jagged rock top */}
        <svg width="100%" height="10" style={{ position:'absolute', top:0, left:0 }} viewBox="0 0 100 10" preserveAspectRatio="none">
          <path d="M0,10 L0,4 L5,6 L12,2 L20,5 L28,1 L38,4 L48,2 L58,5 L68,1 L78,4 L88,2 L95,5 L100,3 L100,10 Z" fill={v.rock}/>
        </svg>
        {/* neon city silhouette */}
        <div style={{ position:'absolute', bottom: 0, left:0, right:0, display:'flex', alignItems:'flex-end', gap:1, opacity: 0.5 }}>
          {[6,10,4,14,8,12,6,10,14,7,11,5,9,12,6,10].map((h,i) => (
            <div key={i} style={{ flex:1, height: h, background: v.bg, borderTop: `1px solid ${v.neonGreen}33` }}>
              {i%3===0 && <div style={{ width:1, height: 1, background: v.neonGreen, marginTop: 2, marginLeft: 2, boxShadow: `0 0 2px ${v.neonGreen}`}}/>}
            </div>
          ))}
        </div>
        <div style={{ position:'absolute', top: 3, left: 8, fontFamily:'JetBrains Mono', fontSize: 7, letterSpacing: 1.5, color: v.inkMuted, textTransform:'uppercase' }}>
          ▲ {room.label}
        </div>
      </div>
    );
  }

  // rocket-related rooms: transparent, rocket overlay draws on top
  if (room.type === 'rocket-top' || room.type === 'rocket' || room.type === 'rocket-base') {
    return (
      <div style={{
        gridColumn: `${room.col+1} / span ${room.w}`,
        background: v.bgTint,
        borderRight: `2px solid ${v.floorLine}`,
        borderLeft: `2px solid ${v.floorLine}`,
        borderBottom: `2px solid ${v.floorLine}`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* scaffold grid */}
        <div style={{ position:'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg, ${v.floorLine}66 0 1px, transparent 1px 12px)`,
          opacity: 0.5
        }}/>
        <div style={{ position:'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 100%, ${v.warmLight}33, transparent 70%)` }}/>
      </div>
    );
  }

  return (
    <div onClick={handleClick} style={{
      gridColumn: `${room.col+1} / span ${room.w}`,
      background: occupied ? v.wall : v.bgTint,
      borderRight: `2px solid ${v.floorLine}`,
      borderLeft: `2px solid ${v.floorLine}`,
      borderBottom: `2px solid ${v.floorLine}`,
      position: 'relative', overflow: 'hidden',
      cursor: (occupied || isZoneRoom) ? 'pointer' : 'default',
      transition: 'background 300ms',
    }}>
      {/* tiled floor + wall tint */}
      <div style={{ position:'absolute', inset: 0,
        background: `linear-gradient(180deg, ${v.wall} 0%, ${v.floorFill} 100%)`,
        opacity: occupied ? 1 : 0.4
      }}/>

      {/* ceiling light */}
      {occupied && (
        <>
          <div style={{ position:'absolute', top: 0, left: '50%', transform:'translateX(-50%)',
            width: 2, height: 4, background: v.inkLow }}/>
          <div style={{ position:'absolute', top: 2, left: '50%', transform:'translateX(-50%)',
            width: 14, height: 6, background: light, opacity: 0.8,
            borderRadius: '0 0 50% 50%', boxShadow: `0 0 20px ${light}, 0 0 40px ${light}66` }}/>
          <div style={{ position:'absolute', top: 6, left: 0, right: 0, height: '60%',
            background: `radial-gradient(ellipse at 50% 0, ${light}22, transparent 80%)`,
            pointerEvents:'none' }}/>
        </>
      )}

      {/* interior furniture */}
      {occupied && <RoomInterior type={room.type} v={v} w={cellW*room.w} h={cellH}/>}

      {/* floor plate */}
      <div style={{ position:'absolute', bottom: 0, left: 0, right: 0, height: 6,
        background: v.floorLine, borderTop: `1px solid ${v.inkLow}` }}/>

      {/* label */}
      {density !== 'minimal' && room.label && (
        <div style={{
          position:'absolute', top: 3, left: 5,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 7,
          letterSpacing: 1.2,
          color: occupied ? v.inkMuted : v.inkLow,
          textTransform: 'uppercase', zIndex: 2,
        }}>
          ▸ {room.label}
        </div>
      )}

      {/* NPCs — standing on floor */}
      <div style={{
        position: 'absolute', bottom: 5, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        gap: 5, padding: '0 8px', zIndex: 3,
      }}>
        {npcsInRoom.map((npc, i) => {
          const walking = (tickPhase + i) % 4 < 2;
          const facing = (tickPhase + i) % 2 === 0 ? 1 : -1;
          return (
            <div key={npc.id} style={{ position: 'relative' }}>
              <NPC npc={npc} v={v} size={18} walking={walking} facing={facing}/>
              {hasMission && i === 0 && npc.trust >= 40 && npc.trust < 100 && <AttentionDot v={v}/>}
            </div>
          );
        })}
      </div>

      {/* dim overlay if empty */}
      {!occupied && (
        <div style={{ position:'absolute', inset: 0, background: v.bg, opacity: 0.55 }}/>
      )}

      {/* zone-enter badge */}
      {isZoneRoom && (
        <div style={{
          position:'absolute', bottom: 7, right: 4,
          width: 8, height: 8, borderRadius: 1,
          background: zone.color,
          boxShadow: `0 0 6px ${zone.color}, 0 0 12px ${zone.color}66`,
          animation: 'pulse-dot 2s ease-in-out infinite',
          zIndex: 5,
        }}/>
      )}
    </div>
  );
}

Object.assign(window, { Room });
