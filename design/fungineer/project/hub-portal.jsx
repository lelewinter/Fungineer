// hub-portal.jsx — 3 visual styles for the "entrada de zona"

// Style 1: Rasgão — torn hole in the wall with particles escaping
function PortalRasgao({ v, zone, size = 1 }) {
  const col = zone.color;
  const W = 140 * size, H = 100 * size;
  return (
    <svg width={W} height={H} viewBox="0 0 140 100" style={{ display:'block' }}>
      <defs>
        <radialGradient id={`p-depth-${zone.id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="1"/>
          <stop offset="0.5" stopColor={col} stopOpacity="0.4"/>
          <stop offset="1" stopColor={col} stopOpacity="0"/>
        </radialGradient>
        <filter id={`p-blur-${zone.id}`}>
          <feGaussianBlur stdDeviation="1.5"/>
        </filter>
      </defs>
      {/* the hole */}
      <path d="M 30,50 Q 25,30 40,25 Q 55,10 70,18 Q 90,12 105,30 Q 120,40 115,60 Q 115,80 95,85 Q 75,95 55,88 Q 35,85 32,70 Z"
        fill={`url(#p-depth-${zone.id})`}/>
      {/* inner darkness */}
      <path d="M 42,50 Q 38,38 48,35 Q 60,25 72,32 Q 88,28 98,42 Q 108,52 102,64 Q 100,78 84,80 Q 68,85 55,78 Q 44,74 42,62 Z"
        fill="#000"/>
      {/* jagged tear edges */}
      <path d="M 30,50 Q 25,30 40,25 Q 55,10 70,18 Q 90,12 105,30 Q 120,40 115,60 Q 115,80 95,85 Q 75,95 55,88 Q 35,85 32,70 Z"
        fill="none" stroke={col} strokeWidth="1.5" strokeDasharray="3 1.5 1 2 4 1"/>
      {/* secondary cracks */}
      <path d="M 40,22 L 36,12 M 68,16 L 66,6 M 108,28 L 116,20 M 118,58 L 128,56 M 98,86 L 104,96 M 52,90 L 48,98 M 30,72 L 22,78"
        stroke={col} strokeWidth="1" opacity="0.7" fill="none" filter={`url(#p-blur-${zone.id})`}/>
      {/* escaping particles — animated */}
      {[...Array(14)].map((_,i) => {
        const angle = (i/14) * Math.PI * 2;
        const r = 38 + (i%3)*8;
        const x = 70 + Math.cos(angle)*r;
        const y = 50 + Math.sin(angle)*r*0.8;
        return (
          <circle key={i} cx={x} cy={y} r={1 + (i%2)*0.5} fill={col}>
            <animate attributeName="opacity" values="0;1;0" dur={`${1.5 + (i%5)*0.3}s`} begin={`${i*0.1}s`} repeatCount="indefinite"/>
            <animate attributeName="cx" values={`${x};${70 + Math.cos(angle)*(r+20)}`} dur={`${1.5 + (i%5)*0.3}s`} begin={`${i*0.1}s`} repeatCount="indefinite"/>
            <animate attributeName="cy" values={`${y};${50 + Math.sin(angle)*(r+20)*0.8}`} dur={`${1.5 + (i%5)*0.3}s`} begin={`${i*0.1}s`} repeatCount="indefinite"/>
          </circle>
        );
      })}
      {/* pulsing glow */}
      <ellipse cx="70" cy="50" rx="50" ry="40" fill="none" stroke={col} strokeWidth="0.5" opacity="0.3">
        <animate attributeName="rx" values="45;55;45" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2.4s" repeatCount="indefinite"/>
      </ellipse>
    </svg>
  );
}

// Style 2: Escotilha pulsando
function PortalEscotilha({ v, zone, size = 1 }) {
  const col = zone.color;
  const W = 140 * size, H = 100 * size;
  return (
    <svg width={W} height={H} viewBox="0 0 140 100">
      <defs>
        <radialGradient id={`p-esc-${zone.id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={col} stopOpacity="0.8"/>
          <stop offset="0.6" stopColor={col} stopOpacity="0.25"/>
          <stop offset="1" stopColor={col} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* frame */}
      <rect x="25" y="18" width="90" height="74" fill={v.wall} stroke={col} strokeWidth="2" rx="4"/>
      <rect x="30" y="23" width="80" height="64" fill="#000" stroke={col} strokeWidth="1" rx="2"/>
      {/* rivets */}
      {[[30,23],[110,23],[30,87],[110,87]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2" fill={col}/>)}
      {/* pulsing inner light */}
      <rect x="34" y="27" width="72" height="56" fill={`url(#p-esc-${zone.id})`}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
      </rect>
      {/* horizontal lines (blinds) */}
      {[34,44,54,64,74].map(y => <line key={y} x1="34" y1={y} x2="106" y2={y} stroke={col} strokeWidth="0.6" opacity="0.35"/>)}
      {/* status light */}
      <circle cx="70" cy="10" r="3" fill={col}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
      </circle>
      <text x="70" y="99" fontFamily="JetBrains Mono" fontSize="5" fill={col} textAnchor="middle" letterSpacing="1">[ OPEN ]</text>
    </svg>
  );
}

// Style 3: Terminal / mapa de zona
function PortalTerminal({ v, zone, size = 1 }) {
  const col = zone.color;
  const W = 140 * size, H = 100 * size;
  return (
    <svg width={W} height={H} viewBox="0 0 140 100">
      <rect x="15" y="15" width="110" height="80" fill="#000" stroke={col} strokeWidth="1.5" rx="2"/>
      <rect x="18" y="18" width="104" height="10" fill={col} opacity="0.15"/>
      <text x="22" y="25" fontFamily="JetBrains Mono" fontSize="5" fill={col} letterSpacing="1">&gt; {zone.nome.toUpperCase()}</text>
      {/* map */}
      <g transform="translate(22, 32)">
        <rect width="96" height="48" fill="none" stroke={col} strokeWidth="0.5" opacity="0.4" strokeDasharray="2 2"/>
        {/* grid */}
        {[12,24,36].map(y => <line key={y} x1="0" y1={y} x2="96" y2={y} stroke={col} strokeWidth="0.3" opacity="0.3"/>)}
        {[24,48,72].map(x => <line key={x} x1={x} y1="0" x2={x} y2="48" stroke={col} strokeWidth="0.3" opacity="0.3"/>)}
        {/* path nodes */}
        <circle cx="10" cy="10" r="2" fill={col}/>
        <circle cx="40" cy="24" r="2" fill={col}/>
        <circle cx="70" cy="12" r="2" fill={col}/>
        <circle cx="86" cy="38" r="3" fill={col}>
          <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <path d="M 10,10 L 40,24 L 70,12 L 86,38" stroke={col} strokeWidth="0.6" fill="none" strokeDasharray="2 1"/>
      </g>
      <text x="22" y="90" fontFamily="JetBrains Mono" fontSize="4.5" fill={col} opacity="0.7" letterSpacing="0.5">
        DIF {'★'.repeat(zone.difficulty)} · {zone.last}
      </text>
      <text x="118" y="90" fontFamily="JetBrains Mono" fontSize="5" fill={col} textAnchor="end" letterSpacing="1">
        [ENTER]
      </text>
    </svg>
  );
}

function Portal({ style = 'rasgao', v, zone, size = 1, onClick }) {
  const P = style === 'escotilha' ? PortalEscotilha : style === 'terminal' ? PortalTerminal : PortalRasgao;
  return (
    <div onClick={onClick} style={{
      cursor: 'pointer',
      transition: 'transform 200ms',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <P v={v} zone={zone} size={size}/>
    </div>
  );
}

Object.assign(window, { Portal, PortalRasgao, PortalEscotilha, PortalTerminal });
