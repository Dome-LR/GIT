import React, { useState } from 'react';
import { Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { useSocket } from '../context/SocketContext';

export default function SocketDebugPanel() {
  const { isConnected, activeRooms, recentEvents, joinList, leaveList, clearEvents } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [manualListId, setManualListId] = useState('');

  const handleManualJoin = (e) => {
    e.preventDefault();
    if (!manualListId.trim()) return;
    joinList(manualListId.trim());
    setManualListId('');
  };

  const handleManualLeave = (listId) => {
    leaveList(listId);
  };

  return (
    <div
      className="position-fixed bottom-0 end-0 m-3 font-monospace small"
      style={{ zIndex: 1050, width: '100%', maxWidth: '24rem' }}
    >
      <div className="bg-dark text-white border border-secondary rounded-top shadow p-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span
            className={`d-inline-block rounded-circle ${isConnected ? 'bg-success' : 'bg-danger'}`}
            style={{ width: 10, height: 10 }}
          />
          <span className="fw-bold">
            TEST SOCKET: {isConnected ? 'CONNESSO' : 'DISCONNESSO'}
          </span>
        </div>
        <Button variant="secondary" size="sm" className="py-0" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Riduci' : 'Espandi'}
        </Button>
      </div>

      {isOpen && (
        <div
          className="bg-dark text-light border border-top-0 border-secondary rounded-bottom shadow-lg p-3 d-flex flex-column gap-3"
          style={{ maxHeight: '24rem', overflowY: 'auto' }}
        >
          <div>
            <div className="text-secondary text-uppercase fw-semibold mb-1">
              Stanze Attive ({activeRooms.length})
            </div>
            {activeRooms.length === 0 ? (
              <p className="text-secondary fst-italic mb-0">Nessuna stanza attiva.</p>
            ) : (
              <div className="d-flex flex-wrap gap-1">
                {activeRooms.map((room) => (
                  <Badge key={room} bg="secondary" className="d-flex align-items-center gap-1 fw-normal">
                    <span>list_{room.slice(-6)}</span>
                    <button
                      type="button"
                      onClick={() => handleManualLeave(room)}
                      className="btn btn-link btn-sm p-0 text-danger fw-bold text-decoration-none"
                      title="Esci dalla stanza"
                    >
                      X
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Form onSubmit={handleManualJoin}>
            <InputGroup size="sm">
              <Form.Control
                type="text"
                placeholder="listId per join test..."
                value={manualListId}
                onChange={(e) => setManualListId(e.target.value)}
                className="bg-dark text-white border-secondary"
              />
              <Button type="submit" variant="primary">
                Entra
              </Button>
            </InputGroup>
          </Form>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary text-uppercase fw-semibold">
                Eventi Realtime ({recentEvents.length})
              </span>
              {recentEvents.length > 0 && (
                <Button variant="link" size="sm" className="p-0 text-secondary" onClick={clearEvents}>
                  Svuota
                </Button>
              )}
            </div>

            {recentEvents.length === 0 ? (
              <p className="text-secondary fst-italic mb-0">In attesa di eventi dal server...</p>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '12rem', overflowY: 'auto' }}>
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="border border-secondary rounded p-1">
                    <div className="d-flex justify-content-between text-secondary mb-1">
                      <span className="fw-bold text-warning">{evt.event}</span>
                      <span>{evt.timestamp}</span>
                    </div>
                    <pre className="text-light bg-black rounded p-1 mb-0 overflow-x-auto" style={{ fontSize: '0.65rem' }}>
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
