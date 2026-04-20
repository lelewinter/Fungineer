// hub-rocket.jsx — VERTICAL rocket, spans 4 floors inside a central shaft

function Rocket({ v, progress = 0.55, floorHeight = 64 }) {
  // The rocket occupies 4 floors (rocket_top..rocket_4) + rocket_base bottom
  const totalH = floorHeight * 4;
  const W = 120;
  const H = totalH;
  const buildY = H * (1 - progress);
  const warm = v.rocketLight;
  const accent = v.neonGreen;
  const dim = v.inkLow;

  // Geometry values
  const noseTop = 12;
  const noseEnd = 42;
  const finTop = H - 60;
  const rocketBase = H - 18;
  const bodyLeft = W/2 - 22;
  const bodyRight = W/2 + 22;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="rk-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={warm} stopOpacity="0.25"/>
          <stop offset="0.5" stopColor={warm} stopOpacity="0.55"/>
          <stop offset="1" stopColor={warm} stopOpacity="0.2"/>
        </linearGradient>
        <radialGradient id="rk-flame" cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor={warm} stopOpacity="0.95"/>
          <stop offset="0.6" stopColor={warm} stopOpacity="0.3"/>
          <stop offset="1" stopColor={warm} stopOpacity="0"/>
        </radialGradient>
        <clipPath id="rk-built">
          <rect x="0" y={buildY} width={W} height={H-buildY}/>
        </clipPath>
      </defs>

      {/* base platform glow */}
      <ellipse cx={W/2} cy={H-4} rx={54} ry={14} fill="url(#rk-flame)">
        <animate attributeName="rx" values="50;58;50" dur="2.4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Scaffolding both sides, every floor */}
      {[0,1,2,3].map(i => {
        const y = i*floorHeight + 20;
        return (
          <g key={i} stroke={dim} strokeWidth="1" fill="none" opacity="0.85">
            <line x1="4"  y1={y} x2="4"  y2={y+floorHeight-4}/>
            <line x1={W-4} y1={y} x2={W-4} y2={y+floorHeight-4}/>
            <line x1="4"  y1={y+floorHeight/2} x2={bodyLeft-2} y2={y+floorHeight/2}/>
            <line x1={W-4} y1={y+floorHeight/2} x2={bodyRight+2} y2={y+floorHeight/2}/>
          </g>
        );
      })}

      {/* full wireframe silhouette */}
      <g stroke={dim} strokeWidth="1.2" strokeDasharray="2 2.5" fill="none">
        <path d={`M ${W/2} ${noseTop} L ${bodyRight} ${noseEnd} L ${bodyLeft} ${noseEnd} Z`}/>
        <path d={`M ${bodyLeft} ${noseEnd} L ${bodyLeft} ${finTop+20} L ${bodyLeft-12} ${rocketBase} L ${bodyRight+12} ${rocketBase} L ${bodyRight} ${finTop+20} L ${bodyRight} ${noseEnd} Z`}/>
        <path d={`M ${bodyLeft} ${finTop} L ${bodyLeft-20} ${rocketBase-4} L ${bodyLeft} ${rocketBase-10} Z`}/>
        <path d={`M ${bodyRight} ${finTop} L ${bodyRight+20} ${rocketBase-4} L ${bodyRight} ${rocketBase-10} Z`}/>
        <circle cx={W/2} cy={noseEnd+40} r="11"/>
        <circle cx={W/2} cy={noseEnd+90} r="9"/>
      </g>

      {/* built portion */}
      <g clipPath="url(#rk-built)">
        {/* nose */}
        <path d={`M ${W/2} ${noseTop} L ${bodyRight} ${noseEnd} L ${bodyLeft} ${noseEnd} Z`} fill={warm} opacity="0.9"/>
        <path d={`M ${W/2} ${noseTop} L ${bodyRight} ${noseEnd} L ${bodyLeft} ${noseEnd} Z`} fill="url(#rk-body)"/>
        {/* body */}
        <path d={`M ${bodyLeft} ${noseEnd} L ${bodyLeft} ${finTop+20} L ${bodyLeft-12} ${rocketBase} L ${bodyRight+12} ${rocketBase} L ${bodyRight} ${finTop+20} L ${bodyRight} ${noseEnd} Z`}
              fill={v.bgTint} stroke={warm} strokeWidth="1.4"/>
        {/* plating stripes */}
        <g stroke={warm} strokeWidth="0.8" opacity="0.9" fill="none">
          {[70, 110, 150, 190, 220, 245].map(y => <line key={y} x1={bodyLeft} y1={y} x2={bodyRight} y2={y}/>)}
          <line x1={W/2-10} y1={noseEnd} x2={W/2-10} y2={finTop+20}/>
          <line x1={W/2+10} y1={noseEnd} x2={W/2+10} y2={finTop+20}/>
        </g>
        {/* portholes — AI green */}
        <circle cx={W/2} cy={noseEnd+40} r="11" fill={accent} opacity="0.22"/>
        <circle cx={W/2} cy={noseEnd+40} r="11" stroke={accent} fill="none"/>
        <circle cx={W/2} cy={noseEnd+40} r="4" fill={accent}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx={W/2} cy={noseEnd+90} r="9" fill={accent} opacity="0.22"/>
        <circle cx={W/2} cy={noseEnd+90} r="9" stroke={accent} fill="none"/>
        {/* fins */}
        <path d={`M ${bodyLeft} ${finTop} L ${bodyLeft-20} ${rocketBase-4} L ${bodyLeft} ${rocketBase-10} Z`} fill={warm} opacity="0.4"/>
        <path d={`M ${bodyLeft} ${finTop} L ${bodyLeft-20} ${rocketBase-4} L ${bodyLeft} ${rocketBase-10} Z`} stroke={warm} fill="none"/>
        <path d={`M ${bodyRight} ${finTop} L ${bodyRight+20} ${rocketBase-4} L ${bodyRight} ${rocketBase-10} Z`} fill={warm} opacity="0.4"/>
        <path d={`M ${bodyRight} ${finTop} L ${bodyRight+20} ${rocketBase-4} L ${bodyRight} ${rocketBase-10} Z`} stroke={warm} fill="none"/>
      </g>

      {/* welding line */}
      <g>
        <line x1="10" y1={buildY} x2={W-10} y2={buildY} stroke={v.rocketGlow} strokeWidth="0.6" opacity="0.5" strokeDasharray="1 2"/>
        <circle cx={W/2-8} cy={buildY} r="1.5" fill={v.rocketGlow}>
          <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx={W/2+10} cy={buildY+1} r="1" fill={v.rocketGlow}>
          <animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* ground platform */}
      <rect x="4" y={rocketBase} width={W-8} height="4" fill={dim}/>
      <rect x="0" y={rocketBase+4} width={W} height="2" fill={dim} opacity="0.5"/>
    </svg>
  );
}

Object.assign(window, { Rocket });
