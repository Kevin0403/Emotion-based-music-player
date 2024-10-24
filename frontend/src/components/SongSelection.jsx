import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SongContext } from './SongContext'; // Import context
import Loader from './Loader'; // Assuming you have a loader component

function SongSelection({ accessToken }) {
  const { songs, setSongs, mood, setMood } = useContext(SongContext); // Use global state
  const location = useLocation();
  const navigate = useNavigate();
  const currentMood = location.state?.mood || mood; // Get mood from location or context

  const [loading, setLoading] = useState(false);

  const fetchSongs = () => {
    setLoading(true);
    axios
      .post('http://localhost:5000/get-songs', { mood: currentMood })
      .then((response) => {
        setSongs(response.data); // Update global state
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching songs:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentMood !== mood || songs.length === 0) {
      setMood(currentMood); // Update global mood if not set
      fetchSongs();
    }
  }, []);

  const handleSongSelect = (songUri) => {
    setLoading(true);
    axios
      .post('http://localhost:5000/play-songs', { song_uri: songUri })
      .then((response) => {
        navigate('/web-player', { state: { songs: response.data } });
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error playing songs:', error);
        setLoading(false);
      });
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 mt-[50px]">
      {loading && <Loader />}
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Song Recommendations for Mood: {currentMood}
      </h1>
      <h3 className="text-red-500 mb-3 text-lg font-bold">
        Select a song from below to play a related playlist
      </h3>
      
      {/* Refresh Button */}
      <button
        className="mb-4 py-1 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300"
        onClick={fetchSongs} // Call fetchSongs on button click
      >
        Refresh Songs
      </button>

      <div className="flex flex-wrap justify-center gap-4">
        {songs.map((song, index) => (
          <div className="max-w-sm w-full bg-white shadow-md rounded-md overflow-hidden" key={index}>
            <img
              src={song.photo_url}
              alt={song.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-3">
              <h2 className="text-lg font-semibold mb-1 text-gray-800">{song.name}</h2>
              <p className="text-gray-600 mb-1">
                <strong>Artists:</strong> {song.artists}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Album:</strong> {song.album}
              </p>
              <button
                className="w-full py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                onClick={() => handleSongSelect(song.uri)}
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SongSelection;
