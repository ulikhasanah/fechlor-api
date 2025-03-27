import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";
import Papa from "papaparse";

const containerStyle = { width: "100%", height: "600px" };
const defaultCenter = { lat: 16.1, lng: 81.5 };

function App() {
  const [mode, setMode] = useState("single");
  const [singleInput, setSingleInput] = useState({ lat: "", lon: "", date: "" });
  const [multiInputs, setMultiInputs] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState([]);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: "AIzaSyAnurhZ7d1vZ3ai0jh64NebvzA-jliPWDU
" });

  const handlePredictSingle = async () => {
    const { lat, lon, date } = singleInput;
    if (!lat || !lon || !date) return setError("Please enter valid latitude, longitude, and date.");
    
    setError("");
    setLoading(true);
    setPredictions([]);

    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict", { lat, lon, date });
      setPredictions([{ ...response.data, lat, lon }]);
      setMarkers([{ lat: parseFloat(lat), lng: parseFloat(lon) }]);
    } catch (err) {
      setError("Failed to get prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictMulti = async () => {
    if (multiInputs.length === 0) return setError("Please add at least one coordinate.");
    
    setError("");
    setLoading(true);
    setPredictions([]);

    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict-multi", { locations: multiInputs });
      setPredictions(response.data.map((pred, index) => ({ ...pred, ...multiInputs[index] })));
      setMarkers(multiInputs.map(({ lat, lon }) => ({ lat: parseFloat(lat), lng: parseFloat(lon) })));
    } catch (err) {
      setError("Failed to get predictions.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const formattedData = result.data.map(row => ({
          lat: row.lat,
          lon: row.lon,
          date: row.date
        }));
        setMultiInputs(formattedData);
      },
      error: () => setError("Failed to read the CSV file.")
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <button onClick={() => setMode(mode === "single" ? "multi" : "single")}>
        Switch to {mode === "single" ? "Multi-Coordinates Mode" : "Single-Coordinate Mode"}
      </button>
      
      {mode === "single" ? (
        <div>
          <input type="number" placeholder="Latitude" value={singleInput.lat} onChange={(e) => setSingleInput({ ...singleInput, lat: e.target.value })} />
          <input type="number" placeholder="Longitude" value={singleInput.lon} onChange={(e) => setSingleInput({ ...singleInput, lon: e.target.value })} />
          <input type="date" value={singleInput.date} onChange={(e) => setSingleInput({ ...singleInput, date: e.target.value })} />
          <button onClick={handlePredictSingle} disabled={loading}>{loading ? "Predicting..." : "Predict"}</button>
        </div>
      ) : (
        <div>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
          <button onClick={handlePredictMulti} disabled={loading}>{loading ? "Predicting..." : "Predict Multi"}</button>
          <ul>
            {multiInputs.map((input, index) => (
              <li key={index}>{input.lat}, {input.lon} ({input.date})</li>
            ))}
          </ul>
        </div>
      )}
      
      {error && <p style={{ color: "red" }}>{error}</p>}
      {predictions.length > 0 && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
          <h2>Predictions</h2>
          <ul>
            {predictions.map((pred, index) => (
              <li key={index}>Lat: {pred.lat}, Lon: {pred.lon} - Chlorophyll-a: {pred.chl_a}</li>
            ))}
          </ul>
        </div>
      )}
      
      {isLoaded && (
        <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={5}>
          {markers.map((pos, index) => <Marker key={index} position={pos} />)}
        </GoogleMap>
      )}
    </div>
  );
}

export default App;
