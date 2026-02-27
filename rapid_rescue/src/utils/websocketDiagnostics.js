// WebSocket diagnostics and troubleshooting utilities

export const diagnoseWebSocketError = (error) => {
  const diagnostics = {
    errorType: 'unknown',
    possibleCauses: [],
    suggestedFixes: [],
    severity: 'medium'
  };

  // Check error type and provide specific guidance
  if (error.type === 'error') {
    diagnostics.errorType = 'connection_error';
    diagnostics.possibleCauses = [
      'Server is not running',
      'Network connectivity issues',
      'Firewall blocking WebSocket connections',
      'CORS policy blocking the connection',
      'Invalid WebSocket URL'
    ];
    diagnostics.suggestedFixes = [
      'Check if the backend server is running on port 8000',
      'Verify network connection',
      'Check browser console for CORS errors',
      'Try refreshing the page',
      'Check if WebSocket URL is correct (ws://127.0.0.1:8000/ws)'
    ];
  }

  if (error.code) {
    switch (error.code) {
      case 1006:
        diagnostics.errorType = 'abnormal_closure';
        diagnostics.possibleCauses = ['Server disconnected unexpectedly', 'Network interruption'];
        diagnostics.suggestedFixes = ['Check server logs', 'Verify network stability'];
        diagnostics.severity = 'high';
        break;
      case 1000:
        diagnostics.errorType = 'normal_closure';
        diagnostics.severity = 'low';
        break;
      case 1001:
        diagnostics.errorType = 'going_away';
        diagnostics.possibleCauses = ['Server is shutting down', 'Client navigating away'];
        diagnostics.severity = 'medium';
        break;
      case 1002:
        diagnostics.errorType = 'protocol_error';
        diagnostics.possibleCauses = ['Protocol violation', 'Invalid WebSocket frame'];
        diagnostics.suggestedFixes = ['Check server WebSocket implementation', 'Update client code'];
        diagnostics.severity = 'high';
        break;
      case 1003:
        diagnostics.errorType = 'unsupported_data';
        diagnostics.possibleCauses = ['Unsupported data type', 'Invalid message format'];
        diagnostics.suggestedFixes = ['Check message format', 'Verify data types'];
        diagnostics.severity = 'medium';
        break;
    }
  }

  return diagnostics;
};

export const checkWebSocketReadiness = async () => {
  const checks = {
    serverReachable: false,
    websocketSupported: false,
    networkConnected: false,
    corsPolicy: 'unknown'
  };

  // Check if WebSocket is supported
  checks.websocketSupported = typeof WebSocket !== 'undefined';

  // Check network connectivity
  checks.networkConnected = navigator.onLine;

  // Try to check if server is reachable by attempting a WebSocket connection
  try {
    // Create a temporary WebSocket to test connectivity
    const testSocket = new WebSocket('ws://127.0.0.1:8000/ws');
    
    const serverCheckPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testSocket.close();
        resolve(false);
      }, 2000); // 2 second timeout
      
      testSocket.onopen = () => {
        clearTimeout(timeout);
        testSocket.close();
        resolve(true);
      };
      
      testSocket.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
    
    checks.serverReachable = await serverCheckPromise;
  } catch (error) {
    console.warn('Server connectivity check failed:', error.message);
    checks.serverReachable = false;
  }

  return checks;
};

export const getWebSocketConnectionAdvice = (error, checks) => {
  const advice = [];

  if (!checks.websocketSupported) {
    advice.push('❌ WebSocket is not supported in this browser');
  }

  if (!checks.networkConnected) {
    advice.push('❌ Network connection is offline');
  }

  if (!checks.serverReachable) {
    advice.push('❌ Backend server is not reachable. Make sure it\'s running on port 8000');
  }

  if (error.code === 1006) {
    advice.push('🔄 Connection closed abnormally. This usually means the server disconnected unexpectedly.');
  }

  if (error.type === 'error' && !checks.serverReachable) {
    advice.push('🔧 Try starting the backend server: cd FastAPI-demo && python main.py');
  }

  return advice;
};

export const logWebSocketDiagnostics = async (error) => {
  console.group('🔍 WebSocket Diagnostics');
  
  const diagnostics = diagnoseWebSocketError(error);
  const checks = await checkWebSocketReadiness();
  const advice = getWebSocketConnectionAdvice(error, checks);

  console.log('📊 Error Analysis:', diagnostics);
  console.log('🔍 System Checks:', checks);
  console.log('💡 Recommendations:', advice);

  console.groupEnd();
};
