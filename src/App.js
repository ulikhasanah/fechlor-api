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
    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict", {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        date,
      });
      if (response.status === 200 && response.data) {
        setPrediction(response.data);
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
      const response = await axios.post("https://chlorophyll-api.onrender.com/upload", formData);
      if (response.status === 200 && Array.isArray(response.data)) {
        setCsvData(response.data);
      } else {
        setError("Failed to process file. Invalid response format.");
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
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ textAlign: "center" }}>Chlorophyll-a Prediction Model</h1>
    
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* Input Section */}
      <div>
        <div 
          style={{ 
            border: "1px solid #ccc", 
            padding: "20px", 
            width: "320px", 
            borderRadius: "10px", 
            boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)", 
            backgroundColor: "#f9f9f9"
          }}
        >
          <h2 style={{ textAlign: "center" }}>Input Location</h2>

          <label style={{ fontWeight: "bold" }}>Latitude:</label>
          <input 
            type="number" 
            value={latitude} 
            onChange={(e) => setLatitude(e.target.value)} 
            style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          />

          <label style={{ fontWeight: "bold" }}>Longitude:</label>
          <input 
            type="number" 
            value={longitude} 
            onChange={(e) => setLongitude(e.target.value)} 
            style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          />

          <label style={{ fontWeight: "bold" }}>Date:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            style={{ width: "100%", padding: "8px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc" }}
          />

          <button 
            onClick={handlePredict} 
            disabled={loading} 
            style={{ 
              width: "100%", 
              padding: "10px", 
              backgroundColor: loading ? "#ccc" : "#007bff", 
              color: "#fff", 
              border: "none", 
              borderRadius: "5px", 
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading ? "Predicting..." : "Predict"}
          </button>

          {prediction && (
            <div style={{ marginTop: "20px" }}>
              <h3>Prediction Result:</h3>
              <p><strong>Chlorophyll-a:</strong> {prediction["Chlorophyll-a"]} µg/L</p>
              <p><strong>Date (Sentinel-2):</strong> {prediction.dates?.["Sentinel-2"] || "Closest Available"}</p>
              <p><strong>Date (SST):</strong> {prediction.sst_date || "Closest Available"}</p>
            </div>
          )}
        </div>

        {/* Upload CSV Section */}
        <div 
          style={{ 
            marginTop: "20px", 
            padding: "20px", 
            border: "1px solid #ccc", 
            borderRadius: "10px", 
            backgroundColor: "#f9f9f9",
            boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)"
          }}
        >
          <h2 style={{ textAlign: "center" }}>Upload CSV File</h2>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            style={{ width: "100%", marginBottom: "10px" }} 
          />

          <button 
            onClick={handleFileUpload} 
            disabled={loading} 
            style={{ 
              width: "100%", 
              padding: "10px", 
              backgroundColor: loading ? "#ccc" : "#007bff", 
              color: "#fff", 
              border: "none", 
              borderRadius: "5px", 
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>

          {csvData.length > 0 && (
            <button 
              onClick={handleDownloadCSV} 
              style={{ 
                marginTop: "10px", 
                width: "100%", 
                padding: "10px", 
                backgroundColor: "#28a745", 
                color: "white", 
                border: "none", 
                borderRadius: "5px", 
                fontWeight: "bold"
              }}
            >
              Download CSV
            </button>
          )}
        </div>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>

      {/* Map Section */}
      {isLoaded && (
        <GoogleMap 
          mapContainerStyle={containerStyle} 
          center={marker || defaultCenter} 
          zoom={5}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      )}
    </div>
  </div>
);


export default App;
