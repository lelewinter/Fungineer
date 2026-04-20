// hub-npc.jsx — NPC sprites with simple walk animation
// Each NPC is a silhouette + color anchor + glyph. No faces.

function NPC({ npc, v, size = 22, walking = false, facing = 1 }) {
  const bob = walking ? 'npc-bob' : '';
  return (
    <div className={bob} style={{
      width: size, height: size * 1.6, position: 'relative',
      transform: `scaleX(${facing})`, transformOrigin: 'center',
    }}>
      {/* head */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        width: size * 0.55, height: size * 0.55, borderRadius: '50%',
        background: npc.color, transform: 'translateX(-50%)',
        boxShadow: `0 0 ${size*0.3}px ${npc.color}33`,
      }} />
      {/* glyph (tiny) */}
      <div style={{
        position: 'absolute', top: size*0.1, left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: size * 0.28, color: v.bg,
        fontWeight: 700, lineHeight: 1,
      }}>{npc.glyph}</div>
      {/* body */}
      <div style={{
        position: 'absolute', top: size * 0.55, left: '50%',
        transform: 'translateX(-50%)',
        width: size * 0.7, height: size * 0.7,
        background: npc.color, opacity: 0.82,
        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
      }} />
      {/* accessory tag — a small colored dot */}
      <div style={{
        position: 'absolute', top: size * 0.75, left: '70%',
        width: size * 0.22, height: size * 0.22, borderRadius: '50%',
        background: npc.accent, opacity: 0.9,
      }} />
      {/* legs */}
      <div style={{
        position: 'absolute', top: size * 1.2, left: '50%',
        transform: 'translateX(-50%)',
        width: size * 0.5, height: size * 0.4,
        background: v.bgTint,
        clipPath: 'polygon(0% 0%, 30% 0%, 35% 100%, 15% 100%, 50% 20%, 65% 100%, 85% 100%, 70% 0%, 100% 0%, 100% 100%, 0% 100%)',
      }} />
    </div>
  );
}

// Attention dot — new mission / event marker above NPC
function AttentionDot({ v }) {
  return (
    <div style={{
      position: 'absolute', top: -8, right: -4,
      width: 8, height: 8, borderRadius: '50%',
      background: v.warmLight,
      boxShadow: `0 0 8px ${v.warmLight}, 0 0 2px ${v.ink}`,
      animation: 'pulse-dot 1.6s ease-in-out infinite',
    }} />
  );
}

Object.assign(window, { NPC, AttentionDot });
