import React, { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";

export default function RegisterPage({ onRegisterSuccess, onGoToLogin }) {
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
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Errore durante la registrazione");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (onRegisterSuccess) {
        data.username = formData.username;
        onRegisterSuccess(data);
      } else {
        alert("Registrazione completata con successo! Ora puoi accedere.");
        if (onGoToLogin) onGoToLogin();
      }

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
            <h2 className="h3 text-center mb-4">Crea un Account</h2>

            {error && <Alert variant="danger" className="text-center py-2 small">{error}</Alert>}

            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Scegli un username"
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
                placeholder="Scegli una password sicura"
              />
            </Form.Group>

            <Button type="submit" variant="success" disabled={loading} className="w-100 mt-2">
              {loading ? "Creazione in corso..." : "Registrati"}
            </Button>

            {/* Link per tornare indietro */}
            <div className="mt-4 text-center small text-muted">
              Hai già un account?{" "}
              <Button variant="link" size="sm" className="p-0 align-baseline" onClick={onGoToLogin}>
                Accedi qui
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
