import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Flavours from './pages/Flavours';
import CreateReceipt from './pages/CreateReceipt';
import Receipts from './pages/Receipts';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/flavours" element={
          <ProtectedRoute><Flavours /></ProtectedRoute>
        } />
        <Route path="/create-receipt" element={
          <ProtectedRoute><CreateReceipt /></ProtectedRoute>
        } />
        <Route path="/receipts" element={
          <ProtectedRoute><Receipts /></ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;