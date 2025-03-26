// src/helpers/tokenHelper.ts
export function fetchNiftyToken(): Promise<any> {
  const projectsUrl = "https://workflow.thelittledesigngroup.com/webhook/c0589acb-3d40-4460-9c29-06c8dfa71fb7";
  const client_id = "KAcvyR6sV001Ark7DywiW2PlTrk8uuc1";
  const client_secret = "7kEWtP1S89pbDa7ehVWVCZDApuBKsfG9cGB2lzVYzleuOCM5ci5vuf4IK0b2RGxj";
  const auth_header = "Basic " + btoa(`${client_id}:${client_secret}`);

  return fetch(projectsUrl, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ auth: auth_header, action: "token" })
  })
    .then(response => response.json())
    .then(data => {
      console.log("Token response:", data);
      const token = data.access_token;
      // Save token data to chrome.storage so your UI can load it
      chrome.storage.local.set({ niftyToken: token }, () => {
        console.log("Token saved to chrome.storage.local");
      });
      return data;
    })
    .catch(err => {
      console.error("Error fetching token:", err);
      throw err;
    });
}
