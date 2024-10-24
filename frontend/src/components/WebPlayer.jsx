import React from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';
import { useLocation } from 'react-router-dom';

function WebPlayer({ accessToken }) {
  const location = useLocation();
  const relatedSongs = location.state?.songs;

  return (
    <div className="flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xl mt-20  bg-white shadow-lg rounded-lg">
        <SpotifyPlayer
          token={accessToken}
          uris={relatedSongs} // Array of song URIs
          play={true}
          styles={{
            height: '100px', // Adjust height for better appearance
            trackArtistColor: '#000',
            trackNameColor: '#000',
            color: '#000',
            sliderColor: '#1cb954',
            sliderHandleColor: '#1cb954',
            sliderTrackColor: '#cccccc',
            trackNameColor: '#000',
            trackArtistColor: '#000',
            bgColor: '#fff',
          }}
        />
      </div>
    </div>
  );
}

export default WebPlayer;
