import React, { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";

export default function LoginPage({ onLoginSuccess, onGoToRegister}) {
  // 1. MODIFICA: Cambiato 'email' in 'username' per rispettare il Backend
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 2. MODIFICA: Inserito l'URL esatto della nostra API
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Ora invierà { username: '...', password: '...' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Credenziali non valide o errore del server");
      }

      // 3. Il Token viene salvato correttamente!
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }

      alert("Login effettuato con successo!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: "70vh" }}>
      <Card className="w-100 shadow" style={{ maxWidth: "400px" }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <h2 className="h3 text-center mb-4">Accedi</h2>

            {error && <Alert variant="danger" className="text-center py-2 small">{error}</Alert>}

            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              {/* 4. MODIFICA: Aggiornato id, name e value a 'username' */}
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Inserisci il tuo username"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Inserisci la password"
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading} className="w-100 mt-2">
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>

            <div className="mt-4 text-center small text-muted">
              Non hai un account?{" "}
              <Button variant="link" size="sm" className="p-0 align-baseline" onClick={onGoToRegister}>
                Registrati qui
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
