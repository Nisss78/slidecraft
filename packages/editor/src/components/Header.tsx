interface HeaderProps {
  title: string;
  slideCount: number;
  theme: string;
  connected: boolean;
  editing: boolean;
  dirty: boolean;
  onEdit: () => void;
  onSave: () => void;
  deckId: string;
}

export function Header({ title, slideCount, theme, connected, editing, dirty, onEdit, onSave, deckId }: HeaderProps) {
  return (
    <header style={{
      height: 48,
      background: '#1a1a2e',
      borderBottom: '1px solid #2d2d44',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a
          href="/"
          style={{ textDecoration: 'none', color: '#94a3b8', fontSize: 14 }}
          title="ホームに戻る"
          onClick={(e) => {
            if (dirty && !window.confirm('未保存の変更があります。ページを離れますか？')) {
              e.preventDefault();
            }
          }}
        >
          ←
        </a>
        <h1 style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#e2e8f0',
          margin: 0,
          letterSpacing: '0.5px',
        }}>
          {title || 'Slide Harness'}
        </h1>
        <a
          href={`/preview/${deckId}`}
          style={{
            fontSize: 12,
            color: '#94a3b8',
            textDecoration: 'none',
            border: '1px solid #3d3d5c',
            borderRadius: 4,
            padding: '3px 10px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3d3d5c'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          プレビュー
        </a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {slideCount} slides
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
        }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: connected ? '#4ade80' : '#ef4444',
          }} />
          <span style={{ color: connected ? '#4ade80' : '#ef4444' }}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
        {editing ? (
          <button
            onClick={onSave}
            style={{
              padding: '5px 14px',
              background: '#22c55e',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            完了
          </button>
        ) : (
          <button
            onClick={onEdit}
            style={{
              padding: '5px 14px',
              background: '#6366f1',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            編集
          </button>
        )}
      </div>
    </header>
  );
}
