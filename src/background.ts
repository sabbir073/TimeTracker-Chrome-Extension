// src/background.ts
import { supabase } from './supabaseClient';

// Schedule screenshot capture every 5 minutes
chrome.alarms.create("screenshotAlarm", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "screenshotAlarm") {
    console.log("captureAndSendScreenshot");
    captureAndSendScreenshot();
  }
});

// Message listener for timer control and state retrieval
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_TIMER') {
    chrome.storage.local.get(['isRunning', 'sessionStart', 'accumulatedTime'], (result) => {
      const isRunning = result.isRunning || false;
      const accumulatedTime = result.accumulatedTime || 0;
      const sessionStart = result.sessionStart || 0;

      if (!isRunning) {
        chrome.storage.local.set({
          isRunning: true,
          sessionStart: Date.now()
        }, () => {
          sendResponse({ success: true });
        });
      } else {
        const now = Date.now();
        const sessionElapsed = now - sessionStart;
        const newAccumulated = accumulatedTime + sessionElapsed;
        chrome.storage.local.set({
          isRunning: false,
          accumulatedTime: newAccumulated,
          sessionStart: 0
        }, () => {
          sendResponse({ success: true });
        });
      }
    });
    return true;
  }
  
  if (message.type === 'GET_ELAPSED_TIME') {
    chrome.storage.local.get(['isRunning', 'sessionStart', 'accumulatedTime'], (result) => {
      const isRunning = result.isRunning || false;
      const accumulatedTime = result.accumulatedTime || 0;
      const sessionStart = result.sessionStart || 0;
      let elapsed = accumulatedTime;
      if (isRunning && sessionStart) {
        elapsed += (Date.now() - sessionStart);
      }
      sendResponse({ elapsed });
    });
    return true;
  }

  if (message.type === 'CALL_REACT_FUNCTION') {
    console.log('Background received request:', message.payload);
    sendResponse({ result: 'Background processing complete' });
    return true;
  }
});

function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin; // e.g. "https://www.domain.com"
  } catch (error) {
    console.error("Invalid URL:", url, error);
    return url;
  }
}

// Capture screenshot, upload it to Supabase Storage, and save a timelog record
function captureAndSendScreenshot() {
  // Get the active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let activeTabUrl = "N/A";
    if (tabs && tabs.length > 0 && tabs[0].url) {
      activeTabUrl = tabs[0].url;
    }

    // Extract domain from activeTabUrl
    const activeDomain = extractDomain(activeTabUrl);
    console.log("Active domain:", activeDomain);

    // Get selected project and task from local storage
    chrome.storage.local.get(["selectedProject", "selectedTask", "user", "isRunning", "urlMappings"], (result) => {
      let task = result.selectedTask || { task_id: null, title: null };
      let user = result.user;
      let isRunning = result.isRunning || false;
      let urlMappings = result.urlMappings || [];

      if (!user) {
        console.log("User not found in storage");
        return;
      }

      if (!isRunning) {
        console.log("Timer not running, skipping screenshot capture");
        return;
      }

      // Try to find a mapping that matches the active domain
      const mapping = urlMappings.find((m: any) => {
        if (!m.url) return false;
        const mappingDomain = extractDomain(m.url);
        return mappingDomain === activeDomain;
      });

      if (mapping) {
        // Override task with mapping's task_id
        console.log("Found mapping for active domain:", mapping);
        task = { task_id: mapping.task_id, title: mapping.title };
      } else {
        console.log("No mapping found for active domain, using selected task");
      }

      // Fetch screenshot from your endpoint
      fetch('http://localhost:5000/screenshot')
        .then(res => res.blob())
        .then(async (blob) => {
          // Generate a unique filename
          const uniqueId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
          const fileName = `${task.task_id}_${uniqueId}.png`;

          // Upload the screenshot blob to Supabase Storage (bucket: 'timetracker')
          const { data, error: uploadError } = await supabase
            .storage
            .from('timetracker')
            .upload(fileName, blob, {
              contentType: 'image/png'
            });

          console.log("Upload data:", data);

          if (uploadError) {
            console.error("Error uploading screenshot:", uploadError);
            return;
          }

          // Retrieve the public URL for the uploaded image
          const { data: imageData } = supabase
            .storage
            .from('timetracker')
            .getPublicUrl(fileName);


          // Build timelog record data
          const timelogRecord = {
            task_id: task.task_id,            // Ensure this matches your column type
            user_id: user.id,               // Optionally set user id if available (e.g., via supabase.auth)
            duration: null,              // You can calculate duration if needed
            image: imageData.publicUrl,  // Public URL of the uploaded image
            website: activeTabUrl       // URL of the active tab
          };

          // Insert the timelog record into Supabase table 'timelogs'
          const { error: timelogError } = await supabase
            .from('timelogs')
            .insert(timelogRecord);

          if (timelogError) {
            console.error("Error inserting timelog:", timelogError);
            return;
          }

          chrome.storage.local.set({ screenshot: imageData.publicUrl }, () => {
            console.log("Screenshot saved to storage");
          });

          console.log("Timelog inserted successfully with screenshot:", timelogRecord);
        })
        .catch(error => {
          console.error("Error fetching or processing screenshot:", error);
        });
    });
  });
}

// Example: Calling captureAndSendScreenshot on tab activation in background.js
chrome.tabs.onActivated.addListener(() => {
  console.log("Tab activated, capturing screenshot...");
  captureAndSendScreenshot();
});