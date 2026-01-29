import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function StartProof() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const locationState = useLocation();
  const [activityId, setActivityId] = useState("");
  const [proofId, setProofId] = useState("");
  const [stream, setStream] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  const startSession = async (id) => {
    setError("");
    setMessage("");
    try {
      const res = await api.post(`/api/proof/start?activityId=${id}`);
      const data = res?.data?.data || res?.data;
      const receivedProofId = data?.id || data?.proofId || "";
      if (!receivedProofId) {
        throw new Error("Proof session ID not found");
      }
      setProofId(receivedProofId);
      sessionStorage.setItem(
        "proofSession",
        JSON.stringify({ activityId: id, proofId: receivedProofId })
      );
      setMessage("Verification started");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed";
      setError(msg);
    }
  };

  const openCamera = async () => {
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err) {
      setError("Unable to access camera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video.videoWidth || !video.videoHeight) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setPhotoDataUrl(dataUrl);
    const file = dataUrlToFile(dataUrl, "proof.jpg");
    setImageFile(file);
  };

  const getLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => setError("Unable to get location")
    );
  };

  const submitProof = async () => {
    setError("");
    setMessage("");
    if (!proofId || !photoDataUrl || !location.lat || !location.lon) {
      setError("Capture photo and location before submitting proof");
      return;
    }

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append("proofImageFile", imageFile);
      } else {
        formData.append("proofImage", photoDataUrl);
      }
      formData.append("latitude", String(location.lat));
      formData.append("longitude", String(location.lon));
      formData.append("proofTime", new Date().toISOString().replace("Z", ""));

      await api.post(`/api/activities/${activityId}/proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage("Proof submitted successfully! Redirecting...");
      sessionStorage.removeItem("proofSession");
      setTimeout(() => navigate("/my-activities"), 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit proof";
      setError(msg);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("proofSession");
    const parsed = stored ? JSON.parse(stored) : null;
    const state = locationState?.state || {};
    const id = state.activityId || parsed?.activityId || "";
    const pid = state.proofId || parsed?.proofId || "";
    if (!id) {
      setError("Start a new activity to begin proof.");
      return;
    }
    setActivityId(id);
    if (pid) {
      setProofId(pid);
    } else {
      startSession(id);
    }
    openCamera();
    getLocation();
  }, []);

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-kicker">Step 2</div>
            <h1>Verify Your Activity</h1>
          </div>
          <div className="card-hint">
            Capture a quick photo and confirm your location.
          </div>
        </div>
        {error && (
          <div className="error">
            {error} {activityId ? "" : <Link to="/submit-activity">Submit activity</Link>}
          </div>
        )}
        <div className="proof-grid">
          <div className="proof-panel">
            <div className="proof-status">
              <div className="status-item">
                <span>Verification</span>
                <strong>{proofId ? "In progress" : "Starting..."}</strong>
              </div>
              <div className="status-item">
                <span>Location</span>
                <strong>{location.lat ? "Captured" : "Waiting..."}</strong>
              </div>
              <div className="status-item">
                <span>Photo</span>
                <strong>{photoDataUrl ? "Captured" : "Waiting..."}</strong>
              </div>
            </div>
            <div className="row">
              <button className="btn" onClick={openCamera}>
                Reopen Camera
              </button>
              <button className="btn" onClick={capturePhoto} disabled={!stream}>
                Capture Photo
              </button>
              <button className="btn" onClick={getLocation}>
                Refresh GPS
              </button>
            </div>
            {message && <div className="success">{message}</div>}
            <button
              className="primary-btn"
              onClick={submitProof}
              disabled={!proofId || !imageFile || !location.lat || !location.lon}
            >
              Submit Verification
            </button>
          </div>
          <div className="proof-preview">
            <video ref={videoRef} autoPlay playsInline className="video" />
            <canvas ref={canvasRef} className="hidden" />
            {photoDataUrl && (
              <img src={photoDataUrl} alt="proof preview" className="preview" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function dataUrlToFile(dataUrl, filename) {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], filename, { type: mime });
}
