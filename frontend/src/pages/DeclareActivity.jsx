import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function DeclareActivity() {
  const navigate = useNavigate();
  const [activityType, setActivityType] = useState("TREE_PLANTATION");
  const [description, setDescription] = useState("");
  const [declaredQuantity, setDeclaredQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.post("/api/activities", {
        activityType,
        description,
        declaredQuantity: Number(declaredQuantity)
      });
      setMessage("Activity declared successfully");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Declare Activity</h1>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Activity Type
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            >
              <option value="TREE_PLANTATION">TREE_PLANTATION</option>
              <option value="PUBLIC_TRANSPORT">PUBLIC_TRANSPORT</option>
              <option value="RECYCLING">RECYCLING</option>
            </select>
          </label>
          <label>
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={declaredQuantity}
              onChange={(e) => setDeclaredQuantity(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
