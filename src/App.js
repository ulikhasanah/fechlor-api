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
  const [coordinates, setCoordinates] = useState([]);
  const [date, setDate] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAnurhZ7d1vZ3ai0jh64NebvzA-jliPWDU",
  });

  const handleAddCoordinate = () => {
    setCoordinates([...coordinates, { lat: "", lng: "" }]);
  };

  const handleCoordinateChange = (index, field, value) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index][field] = value;
    setCoordinates(newCoordinates);
  };

  const handlePredict = async () => {
    if (!date || coordinates.length === 0 || coordinates.some(coord => !coord.lat || !coord.lng)) {
      setError("Please enter valid coordinates and date.");
      return;
    }

    setError("");
    setLoading(true);
    setPredictions([]);

    try {
      const formattedCoordinates = coordinates.map(coord => ({
        lat: parseFloat(coord.lat),
        lon: parseFloat(coord.lng),
      }));

      const response = await axios.post(
        "https://chlorophyll-api.onrender.com/predict-multi",
        { coordinates: formattedCoordinates, date },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 && response.data) {
        setPredictions(response.data.predictions);
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
    setCoordinates([...coordinates, { lat: clickedLat.toFixed(6), lng: clickedLng.toFixed(6) }]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px" }}>
            <h2>Input Locations</h2>
            {coordinates.map((coord, index) => (
              <div key={index}>
                <label>Latitude:</label>
                <input type="number" step="0.000001" value={coord.lat} onChange={(e) => handleCoordinateChange(index, "lat", e.target.value)} style={{ width: "100%", padding: "5px" }} />
                <label>Longitude:</label>
                <input type="number" step="0.000001" value={coord.lng} onChange={(e) => handleCoordinateChange(index, "lng", e.target.value)} style={{ width: "100%", padding: "5px" }} />
              </div>
            ))}
            <button onClick={handleAddCoordinate} style={{ marginTop: "10px", padding: "10px", cursor: "pointer", backgroundColor: "#28A745", color: "white", border: "none", borderRadius: "5px", width: "100%" }}>
              Add Coordinate
            </button>
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "5px" }} />
            <button onClick={handlePredict} disabled={loading} style={{ marginTop: "10px", padding: "10px", cursor: "pointer", backgroundColor: loading ? "#ccc" : "#007BFF", color: "white", border: "none", borderRadius: "5px", width: "100%" }}>
              {loading ? "Predicting..." : "Predict"}
            </button>
          </div>
          {predictions.length > 0 && (
            <div style={{ border: "1px solid #000", padding: "20px", width: "300px", borderRadius: "8px", marginTop: "20px" }}>
              <h2>Prediction Results</h2>
              {predictions.map((pred, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <p><strong>Coordinate {index + 1}:</strong></p>
                  <p><strong>Date:</strong> {pred.date || "Closest Available"}</p>
                  <p><strong>Latitude:</strong> {coordinates[index].lat}</p>
                  <p><strong>Longitude:</strong> {coordinates[index].lng}</p>
                  <p><strong>Chlor-a Prediction:</strong> {pred.chlor_a.toFixed(6)} µg/L</p>
                </div>
              ))}
            </div>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
        {isLoaded && (
          <GoogleMap mapContainerStyle={containerStyle} center={coordinates[0] || defaultCenter} zoom={5} onClick={handleMapClick}>
            {coordinates.map((coord, index) => (
              <Marker key={index} position={{ lat: parseFloat(coord.lat), lng: parseFloat(coord.lng) }} />
            ))}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

export default App;
