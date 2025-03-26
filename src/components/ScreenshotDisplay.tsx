// src/components/ScreenshotDisplay.tsx
import React, { useEffect, useState } from 'react';

const ScreenshotDisplay = () => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the initial screenshot URL from local storage
    chrome.storage.local.get(['screenshot'], (result) => {
      if (result.screenshot) {
        setScreenshotUrl(result.screenshot);
      }
    });

    // Listener to update screenshot URL when changes occur in local storage
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.screenshot) {
        setScreenshotUrl(changes.screenshot.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <div className="flex justify-center items-center">
      {screenshotUrl ? (
        <img src={screenshotUrl} alt="Latest Screenshot" className="max-w-full" />
      ) : (
        <p>No screenshot available.</p>
      )}
    </div>
  );
};

export default ScreenshotDisplay;