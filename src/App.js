import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = {
  width: "80%",
  height: "950px",
};

const defaultCenter = {
  lat: 16.1,
  lng: 81.5,
};

function App() {
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [date, setDate] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [predicted, setPredicted] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAnurhZ7d1vZ3ai0jh64NebvzA-jliPWDU",
  });

  const handlePredict = async () => {
    if (!latitude || !longitude || !date) {
      setError("Please enter valid latitude, longitude, and date.");
      return;
    }

    setError("");
    setLoading(true);
    setPrediction(null);
    setPredicted(false);

    try {
      const response = await axios.post(
        "https://chlorophyll-api.onrender.com/predict",
        { lat: parseFloat(latitude), lon: parseFloat(longitude), date },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 && response.data) {
        setPrediction({
          chlor_a: response.data["Chlorophyll-a"],
          date: response.data.dates?.["Sentinel-2"] || "Closest Available",
        });
        setMarker({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
        setPredicted(true);
      } else {
        setError("Invalid response from server.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to get prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (event) => {
    const clickedLat = event.latLng.lat();
    const clickedLng = event.latLng.lng();
    setLatitude(clickedLat.toFixed(6));
    setLongitude(clickedLng.toFixed(6));
    setMarker({ lat: clickedLat, lng: clickedLng });
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadMessage("Uploading...");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const response = await axios.get(
        "https://chlorophyll-api.onrender.com/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploadMessage(response.data.message || "File uploaded successfully!");
    } catch (error) {
      setUploadMessage("File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px" }}>
            <h2>Input Location</h2>
            <label>Latitude:</label>
            <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            <label>Longitude:</label>
            <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button onClick={handlePredict} disabled={loading || predicted}>
              {predicted ? "Predicted" : loading ? "Predicting..." : "Predict"}
            </button>
          </div>

          <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px", marginTop: "20px" }}>
            <h2>Upload Data File</h2>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} />
            {uploadMessage && <p style={{ color: "green" }}>{uploadMessage}</p>}
          </div>

          {prediction && (
            <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px", marginTop: "20px" }}>
              <h2>Prediction Result</h2>
              <p><strong>Date:</strong> {prediction.date}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
              <p><strong>Chlor-a Prediction:</strong> {prediction.chlor_a.toFixed(6)} µg/L</p>
              <a
                href={`data:text/csv;charset=utf-8,Date,Latitude,Longitude,Chlorophyll-a%0A${prediction.date},${latitude},${longitude},${prediction.chlor_a.toFixed(6)}`}
                download="prediction_result.csv"
                style={{ display: "block", marginTop: "10px", padding: "10px", backgroundColor: "#28a745", color: "white", textAlign: "center", borderRadius: "5px", textDecoration: "none" }}
              >
                Download Prediction
              </a>
            </div>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
        {isLoaded && (
          <GoogleMap mapContainerStyle={containerStyle} center={marker || defaultCenter} zoom={5} onClick={handleMapClick}>
            {marker && <Marker position={marker} />}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

export default App;
