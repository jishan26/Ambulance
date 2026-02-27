import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import validateToken from "../controllers/TokenValidator";
import {
  ConnectToserver,
  DisconnectFromServer,
} from "../controllers/websocket/handler";
import { setUser } from "../store/slices/user-slice";
import { checkServerStatus, waitForServer } from "../utils/serverStatus";

const AuthWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [initialized, setInitialized] = useState(false);

  // Restore user from localStorage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log("AuthWrapper: Restored user from localStorage", parsedUser);
      dispatch(setUser(parsedUser));
    }
    setInitialized(true);
  }, [dispatch]);

  // Validate token after restoring user
  useEffect(() => {
    if (!initialized) return;

    if (user && user.token) {
      console.log("AuthWrapper: Validating authentication for user:", user);
      validateToken(navigate, dispatch, user);
    }
  }, [initialized, user, dispatch, navigate]);

  // Connect WebSocket when user is authenticated
  useEffect(() => {
    const connectWithServerCheck = async () => {
      if (user && user.id && user.role && user.token) {
        console.log("AuthWrapper: Checking server status before connecting...");
        
        // Check if server is running first
        const serverStatus = await checkServerStatus();
        if (serverStatus.serverRunning) {
          console.log("AuthWrapper: Server is running, connecting to WebSocket");
          ConnectToserver(user.id, user.role, user.token);
        } else {
          console.warn("AuthWrapper: Server is not running, waiting for server...");
          const serverReady = await waitForServer(10000, 2000); // Wait up to 10 seconds
          if (serverReady) {
            console.log("AuthWrapper: Server is now ready, connecting to WebSocket");
            ConnectToserver(user.id, user.role, user.token);
          } else {
            console.error("AuthWrapper: Server did not become available, skipping WebSocket connection");
          }
        }
      } else if (user === null || !user.id) {
        // Only disconnect if user is explicitly null or has no ID
        console.log("AuthWrapper: Disconnecting WebSocket - no valid user");
        DisconnectFromServer();
      }
    };

    connectWithServerCheck();

    // Only cleanup on unmount, not on user change
    return () => {
      console.log("AuthWrapper: Component unmounting, disconnecting WebSocket");
      DisconnectFromServer();
    };
  }, [user?.id, user?.role, user?.token]); // Only depend on specific user properties

  return <>{children}</>;
};

export default AuthWrapper;
