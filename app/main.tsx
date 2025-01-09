import React from 'react';
import ReactDOM from 'react-dom/client';
import CapacityPlanner from '../components/CapacityPlanner';
import '../app/globals.css';
import '../app/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CapacityPlanner />
  </React.StrictMode>
);
