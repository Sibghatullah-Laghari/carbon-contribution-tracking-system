import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";

export default function StartProof() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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

  const startSession = async () => {
    setError("");
    setMessage("");
    try {
      const res = await api.post(`/api/proof/start?activityId=${activityId}`);
      const data = res?.data?.data || res?.data;
      const receivedProofId = data?.id || data?.proofId || "";
      if (!receivedProofId) {
        throw new Error("Proof session ID not found");
      }
      setProofId(receivedProofId);
      setMessage("Proof session started");
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

  return (
    <div className="page">
      <div className="card">
        <h1>Start Proof</h1>
        <label>
          Activity ID
          <input
            type="number"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            min="1"
          />
        </label>
        <div className="row">
          <button className="btn" onClick={startSession} disabled={!activityId}>
            Start Proof Session
          </button>
          <button className="btn" onClick={openCamera}>
            Open Camera
          </button>
          <button className="btn" onClick={capturePhoto} disabled={!stream}>
            Capture Photo
          </button>
          <button className="btn" onClick={getLocation}>
            Get GPS
          </button>
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="section">
          <div>Proof ID: {proofId || "-"}</div>
          <div>Latitude: {location.lat ?? "-"}</div>
          <div>Longitude: {location.lon ?? "-"}</div>
        </div>

        <div className="media">
          <video ref={videoRef} autoPlay playsInline className="video" />
          <canvas ref={canvasRef} className="hidden" />
          {photoDataUrl && (
            <img src={photoDataUrl} alt="preview" className="preview" />
          )}
        </div>

        <div className="section">
          <strong>Prepared Payload (not submitted)</strong>
          <pre className="code">
{JSON.stringify(
  {
    proofId,
    imageFile: imageFile ? imageFile.name : null,
    latitude: location.lat,
    longitude: location.lon
  },
  null,
  2
)}
          </pre>
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
