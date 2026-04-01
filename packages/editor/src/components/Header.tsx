interface HeaderProps {
  title: string;
  slideCount: number;
  theme: string;
  connected: boolean;
}

export function Header({ title, slideCount, theme, connected }: HeaderProps) {
  return (
    <div style={{
      height: 48,
      background: 'rgba(15,15,35,0.95)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>SC</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 12, color: '#666' }}>
          {slideCount} slides · {theme}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#4ade80' : '#ef4444',
        }} />
        <span style={{ color: '#888' }}>
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}
