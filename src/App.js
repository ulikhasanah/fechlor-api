import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = { width: "100%", height: "600px" };
const defaultCenter = { lat: 16.1, lng: 81.5 };

function App() {
  const [mode, setMode] = useState("single");
  const [singleInput, setSingleInput] = useState({ lat: "", lon: "", date: "" });
  const [multiInputs, setMultiInputs] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: "AIzaSyAnurhZ7d1vZ3ai0jh64NebvzA-jliPWDU" });

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
      setMarkers([{ lat: parseFloat(lat), lng: parseFloat(lon) }]);
    } catch (err) {
      setError("Failed to get prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictMulti = async () => {
    if (multiInputs.length === 0) {
      setError("Please add at least one coordinate.");
      return;
    }
    setError("");
    setLoading(true);
    setPrediction(null);

    try {
      const response = await axios.post("https://chlorophyll-api.onrender.com/predict-multi", { coordinates: multiInputs });
      setPrediction(response.data);
      setMarkers(multiInputs.map(({ lat, lon }) => ({ lat: parseFloat(lat), lng: parseFloat(lon) })));
    } catch (err) {
      setError("Failed to get predictions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chlorophyll-a Prediction Model</h1>
      <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setMode(mode === "single" ? "multi" : "single")}>
        Switch to {mode === "single" ? "Multi-Coordinates Mode" : "Single-Coordinate Mode"}
      </button>

      {mode === "single" ? (
        <div className="mt-4">
          <input type="number" placeholder="Latitude" value={singleInput.lat} onChange={(e) => setSingleInput({ ...singleInput, lat: e.target.value })} className="border p-2 m-2 w-full" />
          <input type="number" placeholder="Longitude" value={singleInput.lon} onChange={(e) => setSingleInput({ ...singleInput, lon: e.target.value })} className="border p-2 m-2 w-full" />
          <input type="date" value={singleInput.date} onChange={(e) => setSingleInput({ ...singleInput, date: e.target.value })} className="border p-2 m-2 w-full" />
          <button onClick={handlePredictSingle} className="px-4 py-2 bg-green-500 text-white rounded">Predict</button>
        </div>
      ) : (
        <div className="mt-4">
          <button onClick={handlePredictMulti} className="px-4 py-2 bg-green-500 text-white rounded" disabled={loading}>{loading ? "Predicting..." : "Predict"}</button>
          {multiInputs.map((row, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <input type="number" placeholder="Lat" value={row.lat} onChange={(e) => setMultiInputs(multiInputs.map((r, i) => i === index ? { ...r, lat: e.target.value } : r))} className="border p-2 w-1/3" />
              <input type="number" placeholder="Lon" value={row.lon} onChange={(e) => setMultiInputs(multiInputs.map((r, i) => i === index ? { ...r, lon: e.target.value } : r))} className="border p-2 w-1/3" />
              <input type="date" value={row.date} onChange={(e) => setMultiInputs(multiInputs.map((r, i) => i === index ? { ...r, date: e.target.value } : r))} className="border p-2 w-1/3" />
            </div>
          ))}
          <button onClick={() => setMultiInputs([...multiInputs, { lat: "", lon: "", date: "" }])} className="px-4 py-2 bg-gray-500 text-white rounded mt-2">Add Row</button>
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {prediction && <p className="text-green-500 mt-2">Prediction: {JSON.stringify(prediction)}</p>}
      
      {isLoaded && <GoogleMap mapContainerStyle={containerStyle} center={markers.length ? markers[0] : defaultCenter} zoom={5}>
        {markers.map((marker, index) => <Marker key={index} position={marker} />)}
      </GoogleMap>}
    </div>
  );
}

export default App;
