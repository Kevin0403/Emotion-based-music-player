import React, { createContext, useState } from 'react';

// Create the context
export const SongContext = createContext();

// Provider component that holds the song data globally
export const SongProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [mood, setMood] = useState(null); // Optionally store mood as well

  return (
    <SongContext.Provider value={{ songs, setSongs, mood, setMood }}>
      {children}
    </SongContext.Provider>
  );
};
