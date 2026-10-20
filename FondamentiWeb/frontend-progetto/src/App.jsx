import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

import HomePage from './components/HomePage';
import CalendarPage from './components/CalendarPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import TasksPage from './components/TasksPage'; 
import HabitTrackerPage from './components/HabitTrackerPage';
import TimerPage from './components/TimerPage';
import SocketDebugPanel from './components/SocketDebugPanel';

import { useModules } from './context/ModuleContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  const { activeModules } = useModules();
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const handleAuthSuccess = (data) => {
    setIsAuthenticated(true);
    const loggedInUser = data?.username || data?.user?.username || 'Utente';
    localStorage.setItem('username', loggedInUser);
    setUsername(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <SocketProvider token={isAuthenticated ? localStorage.getItem('token') : null}>
      <Router>
        <div className="min-vh-100 bg-light d-flex flex-column">

          {/* NAVBAR */}
          {isAuthenticated && (
            <Navbar bg="white" expand="lg" className="shadow-sm border-bottom">
              <Container>
                <Navbar.Brand as={NavLink} to="/" className="fw-bold text-primary">
                  Home
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                  <Nav className="me-auto">
                    <Nav.Link as={NavLink} to="/tasks">Le mie Liste</Nav.Link>

                    {activeModules.calendar && (
                      <Nav.Link as={NavLink} to="/calendar">Calendario</Nav.Link>
                    )}

                    {activeModules.habits && (
                      <Nav.Link as={NavLink} to="/habits">Abitudini</Nav.Link>
                    )}

                    {activeModules.timer && (
                      <Nav.Link as={NavLink} to="/timer">Timer</Nav.Link>
                    )}

                    <Nav.Link as={NavLink} to="/settings">Impostazioni</Nav.Link>
                  </Nav>

                  <div className="d-flex align-items-center gap-3">
                    <Navbar.Text className="fw-medium border-end pe-3">
                      Ciao, <span className="text-primary">{username}</span>
                    </Navbar.Text>
                    <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                      Esci
                    </Button>
                  </div>
                </Navbar.Collapse>
              </Container>
            </Navbar>
          )}

          <Container as="main" className="flex-grow-1 py-4">
            <Routes>
              <Route 
                path="/" 
                element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/tasks" 
                element={isAuthenticated ? <TasksPage /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/calendar" 
                element={isAuthenticated ? <CalendarPage /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/habits" 
                element={isAuthenticated ? <HabitTrackerPage /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/timer" 
                element={isAuthenticated ? <TimerPage /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/settings" 
                element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/login" 
                element={!isAuthenticated ? (
                  <LoginPage 
                    onLoginSuccess={handleAuthSuccess} 
                    onGoToRegister={() => window.location.pathname = '/register'} 
                  />
                ) : <Navigate to="/" />} 
              />

              <Route 
                path="/register" 
                element={!isAuthenticated ? (
                  <RegisterPage 
                    onRegisterSuccess={handleAuthSuccess}
                    onGoToLogin={() => window.location.pathname = '/login'}
                  />
                ) : <Navigate to="/" />} 
              />
            </Routes>
          </Container>

          {/* PANNELLO DI TEST E DEBUG REAL-TIME */}
          {isAuthenticated && <SocketDebugPanel />}

        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;