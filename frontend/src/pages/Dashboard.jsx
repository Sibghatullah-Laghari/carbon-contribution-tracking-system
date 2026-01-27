import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <div className="page">
      <div className="card">
        <h1>Dashboard</h1>
        <div className="grid">
          <Link className="btn" to="/declare">Declare Activity</Link>
          <Link className="btn" to="/activities">My Activities</Link>
          <Link className="btn" to="/proof">Start Proof</Link>
          <Link className="btn" to="/admin">Admin Panel</Link>
        </div>
        <button className="btn danger" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
