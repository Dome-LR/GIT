const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Cerchiamo il token nell'intestazione della richiesta
  const authHeader = req.header('Authorization');
  
  // Se non c'è, blocchiamo l'accesso
  if (!authHeader) {
    return res.status(401).json({ message: 'Accesso negato. Nessun token fornito.' });
  }

  // 2. Il formato standard è "Bearer <token>", quindi estraiamo solo il token
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Accesso negato. Formato del token non valido.' });
  }

  try {
    // 3. Verifichiamo la firma del token con la nostra chiave segreta
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Se è valido, "attacchiamo" i dati dell'utente (userId e groupId) alla richiesta
    req.user = verified;
    
    // 5. Diamo il via libera per passare all'API vera e propria
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token non valido o scaduto.' });
  }
};

module.exports = verifyToken;