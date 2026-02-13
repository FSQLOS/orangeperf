import React from 'react';
import './App.css';
import MobileDashboard from './MobileDashboard';
import { config } from './config';

export default function App() {
  return <MobileDashboard config={config} />;
}
