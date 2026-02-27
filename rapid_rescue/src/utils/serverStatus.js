// Server status checking utilities

export const checkServerStatus = async () => {
  const checks = {
    serverRunning: false,
    websocketAvailable: false,
    lastCheck: null,
    error: null
  };

  try {
    // Try to create a WebSocket connection to test server availability
    const testConnection = () => {
      return new Promise((resolve) => {
        const socket = new WebSocket('ws://127.0.0.1:8000/ws');
        
        const timeout = setTimeout(() => {
          socket.close();
          resolve({ running: false, error: 'Connection timeout' });
        }, 3000);

        socket.onopen = () => {
          clearTimeout(timeout);
          socket.close();
          resolve({ running: true, error: null });
        };

        socket.onerror = (error) => {
          clearTimeout(timeout);
          resolve({ running: false, error: 'WebSocket connection failed' });
        };
      });
    };

    const result = await testConnection();
    checks.serverRunning = result.running;
    checks.websocketAvailable = result.running;
    checks.error = result.error;
    checks.lastCheck = new Date();

  } catch (error) {
    checks.error = error.message;
    checks.lastCheck = new Date();
  }

  return checks;
};

export const waitForServer = async (maxWaitTime = 30000, checkInterval = 2000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkServerStatus();
    
    if (status.serverRunning) {
      console.log('✅ Server is running and WebSocket is available');
      return true;
    }
    
    console.log(`⏳ Waiting for server... (${Math.round((Date.now() - startTime) / 1000)}s)`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  console.warn('⚠️ Server did not become available within the timeout period');
  return false;
};

export const getServerStatusMessage = (status) => {
  if (status.serverRunning) {
    return '✅ Server is running';
  } else if (status.error) {
    return `❌ Server error: ${status.error}`;
  } else {
    return '❌ Server is not running';
  }
};
