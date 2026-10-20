import { Badge, Button } from 'react-bootstrap';

// Barra di stato Socket.IO riutilizzata da tutte le pagine
export default function RealtimeStatusBar({ label, isConnected, onReload, reloadLabel, extra }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white border rounded p-2 mb-3 small">
      <div className="d-flex align-items-center gap-2">
        <strong className="text-secondary">{label}</strong>
        <Badge bg={isConnected ? 'success' : 'danger'}>
          {isConnected ? 'Connesso' : 'Disconnesso'}
        </Badge>
        {extra && <span className="text-muted">{extra}</span>}
      </div>
      <Button variant="light" size="sm" className="border fw-semibold" onClick={onReload}>
        {reloadLabel}
      </Button>
    </div>
  );
}
