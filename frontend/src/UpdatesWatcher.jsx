import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = 'http://127.0.0.1:3000/records';
const SOCKET_URL = 'http://127.0.0.1:3000';

function UpdatesWatcher() {
  const [events, setEvents] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    
    socket.on('db_change', async (data) => {
      console.log("New DB change event:", data);
      
      let recordName = "(Unknown)";
      
      if (data.event !== "deleted") {
        try {
          const response = await axios.get(`${API_URL}/${data.id}`);
          recordName = response.data.name;
        } catch (error) {
          console.error("Failed to fetch name for ID:", data.id);
        }
      } else {
        // If deleted event, use the name provided in the data or fallback
        recordName = data.name || "(Deleted Record)";
      }
      
      setEvents((prev) => [...prev, { ...data, name: recordName }]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h1>Live Database Updates</h1>
      <div>Status: {socketConnected ? '✅ Connected' : '❌ Disconnected'}</div>
      
      <div style={{ marginTop: 20 }}></div>
      
      {events.length === 0 ? (
        <p>No events received yet.</p>
      ) : (
        <ul>
          {events.map((event, index) => (
            <li key={index} style={{ color: event.event === 'deleted' ? 'red' : 'black' }}>
              Event: <b>{event.event}</b> | ID: {event.id} | Name: <b>{event.name}</b> | 
              Time: {new Date().toLocaleTimeString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UpdatesWatcher;