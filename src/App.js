import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";
import Papa from "papaparse";

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
  const [csvData, setCsvData] = useState([]);

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
    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict", {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        date,
      });
      if (response.status === 200 && response.data) {
        setPrediction({
          chlor_a: response.data["Chlorophyll-a"],
          date: response.data.dates?.["Sentinel-2"] || "Closest Available",
        });
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

  const handleMapClick = (event) => {
    const clickedLat = event.latLng.lat();
    const clickedLng = event.latLng.lng();
    setLatitude(clickedLat.toFixed(6));
    setLongitude(clickedLng.toFixed(6));
    setMarker({ lat: clickedLat, lng: clickedLng });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please upload a valid CSV file.");
      setFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200 && response.data.results) {
        setCsvData(response.data.results);
      } else {
        setError("Failed to process file.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (csvData.length === 0) {
      setError("No data available for download.");
      return;
    }
    const csv = Papa.unparse(csvData);
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
          <div style={{ marginTop: "20px" }}>
            <h2>Upload CSV File</h2>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <button onClick={handleFileUpload} disabled={loading}>{loading ? "Uploading..." : "Upload File"}</button>
          </div>
          {csvData.length > 0 && (
            <button onClick={handleDownloadCSV} style={{ marginTop: "20px", backgroundColor: "#28a745", color: "white" }}>Download CSV</button>
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
