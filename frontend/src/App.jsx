import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ConnectivityProvider } from "./context/ConnectivityContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ReportsAnalytics from "./pages/ReportsAnalytics.jsx";
import SimulatorLab from "./pages/SimulatorLab.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ConnectivityProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <ReportsAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulator"
              element={
                <ProtectedRoute>
                  <SimulatorLab />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ConnectivityProvider>
    </AuthProvider>
  );
}

