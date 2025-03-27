import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [date, setDate] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [csvResults, setCsvResults] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);

  // Single prediction form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://chlorophyll-api.onrender.com/predict', {
        lat,
        lon,
        date,
      });

      setPrediction(response.data);
    } catch (err) {
      setError('Error fetching prediction.');
    } finally {
      setLoading(false);
    }
  };

  // CSV file upload handler
  const handleCsvChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    setCsvLoading(true);
    setCsvError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.get('https://chlorophyll-api.onrender.com/upload', {
        params: { file: formData },
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCsvResults(response.data);
    } catch (err) {
      setCsvError('Error processing CSV file.');
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Chlorophyll-a Prediction</h1>

      {/* Individual Prediction Form */}
      <div>
        <h2>Single Prediction</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Latitude: </label>
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Longitude: </label>
            <input
              type="number"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Date: </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Get Prediction'}
          </button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {prediction && (
          <div>
            <h3>Prediction Result:</h3>
            <p>Latitude: {prediction.lat}</p>
            <p>Longitude: {prediction.lon}</p>
            <p>Chlorophyll-a: {prediction["Chlorophyll-a"]} µg/L</p>
            <p>SST Date: {prediction.sst_date}</p>
            <p>Sentinel-2 Data Date: {prediction.dates["Sentinel-2"]}</p>
          </div>
        )}
      </div>

      {/* CSV Upload Form */}
      <div>
        <h2>CSV Upload</h2>
        <form onSubmit={handleCsvSubmit}>
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              required
            />
          </div>
          <button type="submit" disabled={csvLoading}>
            {csvLoading ? 'Processing...' : 'Upload CSV'}
          </button>
        </form>

        {csvError && <p style={{ color: 'red' }}>{csvError}</p>}

        {csvResults.length > 0 && (
          <div>
            <h3>CSV Prediction Results:</h3>
            <ul>
              {csvResults.map((result, index) => (
                <li key={index}>
                  <p>Latitude: {result.lat}</p>
                  <p>Longitude: {result.lon}</p>
                  <p>Chlorophyll-a: {result["Chlorophyll-a"]} µg/L</p>
                  <p>SST Date: {result.sst_date}</p>
                  <p>Sentinel-2 Data Date: {result.dates["Sentinel-2"]}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
