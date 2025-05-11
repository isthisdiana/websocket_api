const express = require('express');
const mysql2 = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create Express app and HTTP Server
const app = express();
const server = http.createServer(app);

// Configure socket.io with cors
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Configure express middleware
app.use(cors());
app.use(express.json());

// DB connection
const db = mysql2.createConnection({
  host: 'localhost', 
  user: 'root',
  password: '',      
  database: 'testdb',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// WebSocket notification function
function notifyClients(eventType, data) {
  console.log(`Emitting ${eventType} event`, data);
  io.emit('db_change', { event: eventType, ...data });
}

// Setup socket.io connection
io.on('connection', (socket) => {
  console.log('Client is connected:', socket.id);
  
  // Listen for events from the client
  socket.on('disconnect', () => {
    console.log('Client is disconnected:', socket.id);
  });
});

// Get all records
app.get('/records', (req, res) => {
  db.query('SELECT * FROM records', (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(results);
  });
});

// Get single record by ID
app.get('/records/:id', (req, res) => {
  const id = req.params.id;  // Fixed to use params.id
  
  db.query('SELECT * FROM records WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(results[0]);
  });
});

// Create a new record
app.post('/records', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  console.log('Adding new record:', { name });
  
  db.query('INSERT INTO records (name) VALUES (?)', [name], (err, results) => {
    if (err) {
      console.error('Error adding record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const newRecord = { id: results.insertId, name };
    notifyClients('added', newRecord);
    res.status(201).json(newRecord);
  });
});

// Update a record
app.put('/records/:id', (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  console.log('Updating record:', { id, name });
  
  db.query('UPDATE records SET name = ? WHERE id = ?', [name, id], (err, results) => {
    if (err) {
      console.error('Error updating record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const updatedRecord = { id: parseInt(id), name };
    notifyClients('updated', updatedRecord);
    res.json(updatedRecord);
  });
});

// Delete a record
app.delete('/records/:id', (req, res) => {
  const id = req.params.id;
  
  console.log('Deleting record:', { id });
  
  db.query('DELETE FROM records WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error deleting record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    notifyClients('deleted', { id: parseInt(id) });
    res.json({ id: parseInt(id) });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});