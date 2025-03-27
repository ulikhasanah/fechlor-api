import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = { width: "80%", height: "950px" };
const defaultCenter = { lat: 16.1, lng: 81.5 };

function App() {
  const [mode, setMode] = useState("single"); // 'single' or 'multi'
  const [singleInput, setSingleInput] = useState({ lat: "", lon: "", date: "" });
  const [multiInputs, setMultiInputs] = useState([]);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAnurhZ7d1vZ3ai0jh64NebvzA-jliPWDU",
  });

  const handlePredictSingle = async () => {
    const { lat, lon, date } = singleInput;
    if (!lat || !lon || !date) {
      setError("Please enter valid latitude, longitude, and date.");
      return;
    }
    setError("");
    setLoading(true);
    setPrediction(null);

    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict", { lat, lon, date });
      setPrediction(response.data);
      setMarker({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } catch (err) {
      setError("Failed to get prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setMultiInputs([...multiInputs, { lon: "", lat: "", date: "" }]);
  };

  const handleRemoveRow = (index) => {
    setMultiInputs(multiInputs.filter((_, i) => i !== index));
  };

  const handleInputChange = (index, field, value) => {
    const newInputs = [...multiInputs];
    newInputs[index][field] = value;
    setMultiInputs(newInputs);
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = e.target.result.split("\n").map((row) => row.split(","));
      const formattedData = rows.slice(1).map(([lon, lat, date]) => ({ lon, lat, date }));
      setMultiInputs(formattedData);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chlorophyll-a Prediction Model</h1>
      <button onClick={() => setMode(mode === "single" ? "multi" : "single")}>
        Switch to {mode === "single" ? "Multi-Coordinates Mode" : "Single-Coordinate Mode"}
      </button>

      {mode === "single" ? (
        <div>
          <label>Latitude:</label>
          <input
            type="number"
            value={singleInput.lat}
            onChange={(e) => setSingleInput({ ...singleInput, lat: e.target.value })}
          />
          <label>Longitude:</label>
          <input
            type="number"
            value={singleInput.lon}
            onChange={(e) => setSingleInput({ ...singleInput, lon: e.target.value })}
          />
          <label>Date:</label>
          <input
            type="date"
            value={singleInput.date}
            onChange={(e) => setSingleInput({ ...singleInput, date: e.target.value })}
          />
          <button onClick={handlePredictSingle}>Predict</button>
        </div>
      ) : (
        <div>
          <input type="file" accept=".csv" onChange={handleUpload} />
          <button onClick={handleAddRow}>Add Row</button>
          <table>
            <thead>
              <tr>
                <th>Longitude</th>
                <th>Latitude</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {multiInputs.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="number"
                      value={row.lon}
                      onChange={(e) => handleInputChange(index, "lon", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.lat}
                      onChange={(e) => handleInputChange(index, "lat", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleInputChange(index, "date", e.target.value)}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleRemoveRow(index)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isLoaded && <GoogleMap mapContainerStyle={containerStyle} center={marker || defaultCenter} zoom={5}></GoogleMap>}
    </div>
  );
}

export default App;