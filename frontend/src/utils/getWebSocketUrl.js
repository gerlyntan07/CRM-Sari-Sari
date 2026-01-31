/**
 * Get the WebSocket URL for notifications
 * Derives the URL from the same base as the API
 * @param {number} userId - The user ID for the WebSocket connection
 * @returns {string} The WebSocket URL
 */
export const getWebSocketUrl = (userId) => {
  // Use the same backend URL pattern as api.js
  // In production, you should set VITE_API_URL environment variable
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  try {
    // Parse the API URL to extract protocol, hostname, and port
    const apiUrlObj = new URL(apiUrl);
    const protocol = apiUrlObj.protocol === 'https:' ? 'wss' : 'ws';
    const hostname = apiUrlObj.hostname;
    const port = apiUrlObj.port || (apiUrlObj.protocol === 'https:' ? 443 : 80);
    
    // Construct WebSocket URL
    const wsUrl = `${protocol}://${hostname}:${port}/ws/notifications?user_id=${userId}`;
    console.log("📡 WebSocket URL:", wsUrl);
    
    return wsUrl;
  } catch (error) {
    console.error("Error parsing API URL:", error);
    // Fallback to localhost
    return `ws://localhost:8000/ws/notifications?user_id=${userId}`;
  }
};
