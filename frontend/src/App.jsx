import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import POS from './pages/POS';
import InventoryDashboard from './pages/InventoryDashboard';
import MenuManager from './pages/MenuManager';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import OrderLedger from './pages/OrderLedger';
import ActiveOrders from './pages/ActiveOrders';
import PaymentSuccess from './pages/PaymentSuccess';
import Sidebar from './components/Sidebar';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: '2rem', color: 'red' }}><h1>App Level Error</h1><pre>{this.state.error.toString()}</pre><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children; 
  }
}

function AppInner() {
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
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;
