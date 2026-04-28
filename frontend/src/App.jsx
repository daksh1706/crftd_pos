import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import POS from './pages/POS';
import InventoryDashboard from './pages/InventoryDashboard';
import MenuManager from './pages/MenuManager';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import OrderLedger from './pages/OrderLedger';
import ActiveOrders from './pages/ActiveOrders';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<InventoryDashboard />} />
            <Route path="/menu" element={<MenuManager />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ledger" element={<OrderLedger />} />
            <Route path="/orders" element={<ActiveOrders />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
