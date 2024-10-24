import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import MoodPrediction from './components/MoodPrediction';
import SongSelection from './components/SongSelection';
import WebPlayer from './components/WebPlayer';
import { SongProvider } from './components/SongContext'; // Import the provider
import Loader from './components/Loader';

function App() {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode) {
      fetchAccessToken(authCode);
    } else {
      redirectToLogin();
    }
  }, []);

  const fetchAccessToken = (authCode) => {
    axios.get(`http://localhost:5000/callback?code=${authCode}`)
      .then(response => {
        setAccessToken(response.data.access_token);
      })
      .catch(error => {
        console.error('Error fetching access token:', error);
        redirectToLogin();
      });
  };

  const redirectToLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  if (!accessToken) {
    return <Loader />;
  }

  return (
    <SongProvider>
      <Router>
        <div className="min-w-screen bg-gray-100">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Navigate to="/mood-prediction" />} />
            <Route path="/mood-prediction" element={<MoodPrediction accessToken={accessToken} />} />
            <Route path="/song-selection" element={<SongSelection accessToken={accessToken} />} />
            <Route path="/web-player" element={<WebPlayer accessToken={accessToken} />} />
          </Routes>
        </div>
      </Router>
    </SongProvider>
  );
}

const Navbar = () => (
  <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 shadow-lg fixed top-0 left-0 w-full z-50">
    <div className="container mx-auto flex justify-between items-center">
      <Link to="/mood-prediction" className="text-2xl font-bold text-white hover:text-gray-300 transition duration-300">
        Moodify
      </Link>
      <div className="space-x-6 hidden md:flex">
        <Link to="/mood-prediction" className="text-white text-lg hover:text-gray-300 transition duration-300">
          Mood Prediction
        </Link>
        <Link to="/song-selection" className="text-white text-lg hover:text-gray-300 transition duration-300">
          Song Selection
        </Link>
        <Link to="/web-player" className="text-white text-lg hover:text-gray-300 transition duration-300">
          Web Player
        </Link>
      </div>
      <div className="md:hidden text-white text-2xl">
        <i className="fas fa-bars"></i>
      </div>
    </div>
  </nav>
);

export default App;
