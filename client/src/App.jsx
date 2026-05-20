import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth(response.data);
      } catch (error) {
        console.error('API connection failed:', error);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Task Management Platform</h1>

      <h2>Backend Health Status</h2>

      {health ? (
        <div>
          <p>Status: {health.status}</p>
          <p>Message: {health.message}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;