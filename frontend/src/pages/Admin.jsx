import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function Admin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const res = await api.get("/admin/activities");
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
        <h1>Admin Panel</h1>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.userId}</td>
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
