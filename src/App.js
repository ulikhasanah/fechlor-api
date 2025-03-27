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
  const [mode, setMode] = useState("single"); // "single" or "multi"
  const [coordinates, setCoordinates] = useState([{ lat: "", lon: "", date: "" }]);
  const [prediction, setPrediction] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAnurhZ7d1vZ3ai0jh64NebvzA-jliPWDU",
  });

  const handlePredict = async () => {
    if (coordinates.some(coord => !coord.lat || !coord.lon || !coord.date)) {
      setError("Please enter valid latitude, longitude, and date for all inputs.");
      return;
    }

    setError("");
    setLoading(true);
    setPrediction(null);

    try {
      const response = await axios.post(
        "https://chlorophyll-api.onrender.com/predict",
        { coordinates },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 && response.data) {
        setPrediction(response.data);
        setMarkers(coordinates.map(coord => ({ lat: parseFloat(coord.lat), lng: parseFloat(coord.lon) })));
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
    if (mode === "single") {
      setCoordinates([{ lat: event.latLng.lat().toFixed(6), lon: event.latLng.lng().toFixed(6), date: "" }]);
    } else {
      setCoordinates([...coordinates, { lat: event.latLng.lat().toFixed(6), lon: event.latLng.lng().toFixed(6), date: "" }]);
    }
    setMarkers([...markers, { lat: event.latLng.lat(), lng: event.latLng.lng() }]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <label>Mode:</label>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="single">Single Coordinate</option>
        <option value="multi">Multiple Coordinates</option>
      </select>
      <div style={{ border: "1px solid #000", padding: "20px", width: "400px", borderRadius: "8px", marginTop: "10px" }}>
        <h2>Input Coordinates</h2>
        {coordinates.map((coord, index) => (
          <div key={index}>
            <label>Latitude:</label>
            <input
              type="number"
              step="0.000001"
              value={coord.lat}
              onChange={(e) => {
                const newCoords = [...coordinates];
                newCoords[index].lat = e.target.value;
                setCoordinates(newCoords);
              }}
            />
            <label>Longitude:</label>
            <input
              type="number"
              step="0.000001"
              value={coord.lon}
              onChange={(e) => {
                const newCoords = [...coordinates];
                newCoords[index].lon = e.target.value;
                setCoordinates(newCoords);
              }}
            />
            <label>Date:</label>
            <input
              type="date"
              value={coord.date}
              onChange={(e) => {
                const newCoords = [...coordinates];
                newCoords[index].date = e.target.value;
                setCoordinates(newCoords);
              }}
            />
          </div>
        ))}
        {mode === "multi" && <button onClick={() => setCoordinates([...coordinates, { lat: "", lon: "", date: "" }])}>Add More</button>}
        <button onClick={handlePredict} disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>
      {prediction && (
        <div style={{ border: "1px solid #000", padding: "20px", width: "400px", borderRadius: "8px", marginTop: "20px" }}>
          <h2>Prediction Results</h2>
          {prediction.map((pred, idx) => (
            <p key={idx}><strong>Lat:</strong> {coordinates[idx].lat}, <strong>Lon:</strong> {coordinates[idx].lon}, <strong>Chlorophyll-a:</strong> {pred.chlor_a.toFixed(6)} µg/L</p>
          ))}
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isLoaded && (
        <GoogleMap mapContainerStyle={containerStyle} center={markers[0] || defaultCenter} zoom={5} onClick={handleMapClick}>
          {markers.map((marker, idx) => <Marker key={idx} position={marker} />)}
        </GoogleMap>
      )}
    </div>
  );
}

export default App;
