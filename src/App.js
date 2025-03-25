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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY",
  });

  const handlePredict = async () => {
    if (!latitude || !longitude || !date) {
      setError("Please enter valid latitude, longitude, and date.");
      return;
    }

    setError("");
    setLoading(true);
    setPrediction(null);

    try {
      const latNum = parseFloat(latitude);
      const lonNum = parseFloat(longitude);

      const response = await axios.post(
        "https://chlorophyll-api.onrender.com/predict",
        { lat: latNum, lon: lonNum, date },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 && response.data) {
        setPrediction({
          chlor_a: response.data["Chlorophyll-a"],
          date: response.data.dates?.["Sentinel-2"] || "Closest Available",
        });
        setMarker({ lat: latNum, lng: lonNum });
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px" }}>
            <h2>Input Location</h2>
            <label>Latitude:</label>
            <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: "100%", padding: "5px" }} />
            <label>Longitude:</label>
            <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: "100%", padding: "5px" }} />
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "5px" }} />
            <button onClick={handlePredict} disabled={loading} style={{ marginTop: "10px", padding: "10px", cursor: "pointer", backgroundColor: loading ? "#ccc" : "#007BFF", color: "white", border: "none", borderRadius: "5px", width: "100%" }}>
              {loading ? "Predicting..." : "Predict"}
            </button>
          </div>
          {prediction && (
            <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px", marginTop: "20px" }}>
              <h2>Prediction Result</h2>
              <p><strong>Date:</strong> {prediction.date}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
              <p><strong>Chlor-a Prediction:</strong> {prediction.chlor_a.toFixed(6)} µg/L</p>
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
