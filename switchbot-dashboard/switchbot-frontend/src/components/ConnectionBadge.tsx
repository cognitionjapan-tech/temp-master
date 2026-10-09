export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

const STYLES: Record<ConnectionState, { label: string; className: string; dot: string }> = {
  connecting: { label: 'Connecting...', className: 'border-line text-fg-muted', dot: 'bg-fg-muted' },
  connected: { label: 'Connected', className: 'border-success/40 bg-success/10 text-success', dot: 'bg-success' },
  disconnected: { label: 'Disconnected', className: 'border-danger/40 bg-danger/10 text-danger', dot: 'bg-danger' },
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const style = STYLES[state];
  return (
    <span
      data-testid="connection-status"
      data-state={state}
      className={`inline-flex items-center gap-1.5 rounded-full border-theme px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot} ${state === 'connected' ? 'animate-pulse' : ''}`} />
      {style.label}
    </span>
  );
}
