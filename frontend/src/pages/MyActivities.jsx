import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function MyActivities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const res = await api.get("/api/activities");
        const data = res?.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Failed";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <div className="card">
        <h1>My Activities</h1>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.activityType}</td>
                  <td>{a.declaredQuantity}</td>
                  <td>{a.status}</td>
                  <td>{a.verificationFlag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
