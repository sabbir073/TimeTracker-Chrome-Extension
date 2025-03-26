// src/components/SessionTimer.tsx
import React, { useState, useEffect } from 'react';

const SessionTimer = () => {
  const [elapsedTime, setElapsedTime] = useState(0); // in milliseconds
  const [isRunning, setIsRunning] = useState(false);

  // Function to fetch elapsed time and running state from background storage
  const fetchElapsedTime = () => {
    // Request elapsed time from background
    chrome.runtime.sendMessage({ type: 'GET_ELAPSED_TIME' }, (response) => {
      if (response && typeof response.elapsed === 'number') {
        setElapsedTime(response.elapsed);
      }
    });
    // Also update isRunning state directly from storage
    chrome.storage.local.get('isRunning', (result) => {
      setIsRunning(result.isRunning || false);
    });
  };

  // Toggle timer state by sending a message to background
  const toggleTimer = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chrome.runtime.sendMessage({ type: 'TOGGLE_TIMER' }, (response) => {
      // Optionally, you can update local isRunning state after toggling.
      // Here we rely on the subsequent polling to update the state.
    });
  };

  // Poll for elapsed time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchElapsedTime();
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Convert elapsed time (ms) into total seconds, then hours and minutes
  const totalSeconds = Math.floor(elapsedTime / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
  <p className="text-3xl font-semibold text-gray-800 mb-6">
    Session Time: {hours}hrs {formattedMinutes}m
  </p>
  <button
    onClick={toggleTimer}
    className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow-md transition duration-150 ease-in-out hover:bg-purple-700 active:scale-95 cursor-pointer"
  >
    {isRunning ? 'Stop' : 'Start'}
  </button>
</div>

  );
};

export default SessionTimer;