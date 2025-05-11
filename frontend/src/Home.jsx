import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// declare API url
const API_URL = 'http://127.0.0.1:3000/records';
const SOCKET_URL = 'http://127.0.0.1:3000';

function Home() {
  const [records, setRecords] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 10000,
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('db_change', (data) => {
      fetchRecords();
      setSuccess(`Record ${data.event} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRecords(res.data);
      setError(null);
    } catch (error) {
      setError(`Error fetching records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { name });
        setSuccess("Record updated successfully");
      } else {
        await axios.post(API_URL, { name });
        setSuccess("Record created successfully");
      }
      setName('');
      setEditingId(null);
      fetchRecords(); // Add this to ensure records are updated
    } catch (err) {
      setError(`Error saving record: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      // Note: We don't need to update records manually as the socket will trigger it
    } catch (err) {
      setError(`Error deleting record: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setName(record.name);
    setEditingId(record.id);
  };

  const cancelEdit = () => {
    setName('');
    setEditingId(null);
  };

  return (
    <div>
      <h1>React CRUD App</h1>
      <div>Status: {socketConnected ? '✅ Connected' : '❌ Disconnected'}</div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      {loading && <div>Loading...</div>}

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          style={{ marginRight: 10 }}
        />
        <button type="submit">{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button type="button" onClick={cancelEdit} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        )}
      </form>

      <ul style={{ marginTop: 20 }}>
        {records.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            {r.name}
            <button onClick={() => handleEdit(r)} style={{ marginLeft: 10 }}>
              Edit
            </button>
            <button onClick={() => handleDelete(r.id)} style={{ marginLeft: 5 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;