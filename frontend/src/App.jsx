import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DeclareActivity from "./pages/DeclareActivity.jsx";
import MyActivities from "./pages/MyActivities.jsx";
import StartProof from "./pages/StartProof.jsx";
import Admin from "./pages/Admin.jsx";

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/declare"
        element={
          <RequireAuth>
            <DeclareActivity />
          </RequireAuth>
        }
      />
      <Route
        path="/activities"
        element={
          <RequireAuth>
            <MyActivities />
          </RequireAuth>
        }
      />
      <Route
        path="/proof"
        element={
          <RequireAuth>
            <StartProof />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
