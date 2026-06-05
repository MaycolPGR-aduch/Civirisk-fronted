import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import MapPage from './pages/MapPage';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import NotFound from './pages/NotFound';

// Layouts & Protection
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect to App Dashboard */}
          <Route path="/" element={<Navigate to="/app" replace />} />

          {/* Secure App Sub-routes */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="reportar" element={<ReportForm />} />
              <Route path="mapa" element={<MapPage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="alertas" element={<Alerts />} />
            </Route>
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
