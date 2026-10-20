import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { useModules } from '../context/ModuleContext';

const MODULI = [
  {
    key: 'calendar',
    titolo: '[Calendario] Calendario & Scadenze',
    descrizione: 'Assegna una data di scadenza ai task, visualizzali nella pagina Calendario e traccia gli impegni futuri.',
  },
  {
    key: 'timer',
    titolo: '[Timer] Timer Focus',
    descrizione: 'Imposta un timer in minuti per i tuoi task. Ideale per la tecnica del Pomodoro o sessioni di lavoro profondo.',
  },
  {
    key: 'habits',
    titolo: '[Abitudini] Tracker Abitudini',
    descrizione: 'Crea task ricorrenti (giornalieri, settimanali, mensili) per costruire e mantenere nel tempo le tue nuove routine.',
  },
];

export default function SettingsPage() {
  const { activeModules, toggleModule } = useModules();

  return (
    <Row className="justify-content-center">
      <Col lg={8} xl={7}>
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <h1 className="h2 fw-bold mb-2">Impostazioni Moduli</h1>
            <p className="text-muted mb-4">
              Personalizza la tua esperienza attivando solo le funzionalità che ti servono realmente per mantenere l'interfaccia pulita.
            </p>

            <div className="d-flex flex-column gap-3">
              {MODULI.map((modulo) => (
                <Card key={modulo.key} className="bg-light shadow-sm">
                  <Card.Body className="d-flex justify-content-between align-items-center gap-3">
                    <div>
                      <h3 className="h6 fw-semibold mb-1">{modulo.titolo}</h3>
                      <p className="small text-muted mb-0">{modulo.descrizione}</p>
                    </div>
                    <Button
                      variant={activeModules[modulo.key] ? 'outline-danger' : 'outline-success'}
                      className="flex-shrink-0"
                      onClick={() => toggleModule(modulo.key)}
                    >
                      {activeModules[modulo.key] ? 'Disattiva' : 'Attiva'}
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
