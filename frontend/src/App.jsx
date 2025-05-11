import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import UpdatesWatcher from './UpdatesWatcher';

function App() {
  return (
    <Router>
      <div style={{ padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginRight: 10 }}>Home</Link>
          <Link to="/updates">🔁 Live Updates</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/updates" element={<UpdatesWatcher />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;