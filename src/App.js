import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";
import Papa from "papaparse";

const containerStyle = { width: "80%", height: "950px" };
const defaultCenter = { lat: 16.1, lng: 81.5 };

function App() {
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [date, setDate] = useState("");
  const [prediction, setPrediction] = useState([]);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict", {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        date,
      });
      if (response.status === 200 && response.data) {
        const result = {
          lat: latitude,
          lon: longitude,
          "chlorophyll-a": response.data["Chlorophyll-a"],
          "date_sentinel": response.data.dates?.["Sentinel-2"] || "Closest Available",
          "date_sst": response.data.dates?.["SST"] || "N/A",
        };
        setPrediction([result]);
        setMarker({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
      } else {
        setError("Invalid response from server.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to get prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (prediction.length === 0) {
      setError("No data available for download.");
      return;
    }
    const csv = Papa.unparse(prediction);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prediction_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px" }}>
            <h2>Input Location</h2>
            <label>Latitude:</label>
            <input type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            <label>Longitude:</label>
            <input type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button onClick={handlePredict} disabled={loading}>{loading ? "Predicting..." : "Predict"}</button>
          </div>
          {prediction.length > 0 && (
            <button onClick={handleDownloadCSV} style={{ marginTop: "20px", backgroundColor: "#28a745", color: "white" }}>Download CSV</button>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
        {isLoaded && (
          <GoogleMap mapContainerStyle={containerStyle} center={marker || defaultCenter} zoom={5}>
            {marker && <Marker position={marker} />}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

export default App;