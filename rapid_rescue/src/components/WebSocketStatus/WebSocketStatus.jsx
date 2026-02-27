import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { checkWebSocketReadiness } from "../../utils/websocketDiagnostics";

const WebSocketStatus = () => {
  const [connectionState, setConnectionState] = useState({
    connected: false,
    state: "CLOSED",
    stateCode: 3,
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [systemChecks, setSystemChecks] = useState({
    serverReachable: false,
    websocketSupported: false,
    networkConnected: false,
  });

  const user = useSelector((state) => state.user);

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const { default: WebSocketController } = await import(
          "../../controllers/websocket/ConnectionManger"
        );
        const state = WebSocketController.getConnectionState();
        setConnectionState(state);
        setLastUpdate(new Date());
        
        // Also run system checks
        const checks = await checkWebSocketReadiness();
        setSystemChecks(checks);
      } catch (error) {
        console.error("Failed to check WebSocket status:", error);
        setConnectionState({
          connected: false,
          state: "ERROR",
          stateCode: -1,
        });
      }
    };

    // Check status immediately
    checkConnectionStatus();

    // Check status every 5 seconds
    const interval = setInterval(checkConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (connectionState.connected) return "text-green-600 bg-green-100";
    if (connectionState.state === "CONNECTING")
      return "text-yellow-600 bg-yellow-100";
    if (connectionState.state === "ERROR") return "text-red-600 bg-red-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusIcon = () => {
    if (connectionState.connected) return "🟢";
    if (connectionState.state === "CONNECTING") return "🟡";
    if (connectionState.state === "ERROR") return "🔴";
    return "🔴";
  };

  // Only show for drivers
  if (!user || user.role !== "driver") {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor()}`}
      >
        <div className="flex items-center space-x-2">
          <span>{getStatusIcon()}</span>
          <span>WebSocket: {connectionState.state}</span>
        </div>
        {lastUpdate && (
          <div className="text-xs opacity-75 mt-1">
            Last check: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
        {!systemChecks.serverReachable && (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ Server not reachable
          </div>
        )}
        {!systemChecks.networkConnected && (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ Network offline
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketStatus;
