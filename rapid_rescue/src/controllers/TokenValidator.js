import { setUser, deleteUser } from "../store/slices/user-slice";
import { apiFetch, API_BASE_URL } from "./apiClient";

async function validateToken(navigate, dispatch, user) {
  if (!user || !user.token) {
    console.log("No token found, skipping token validation");
    return false;
  }

  try {
    const response = await apiFetch(`/auth/validate-token`, { method: "GET" });

    const data = await response.json();

    if (response.ok) {
      console.log("Token valid:", data);
      dispatch(setUser({ ...data, token: user.token }));
      return true;
    } else if (response.status === 401) {
      console.log("Token invalid or expired:", data);
      dispatch(deleteUser());
      localStorage.removeItem("user");
      navigate("/login");
      return false;
    } else {
      console.log("Unexpected response:", data);
      return false;
    }
  } catch (err) {
    console.error("Network error:", err);
    return false;
  }
}

// WebSocket connection helper
export function connectWebSocket(user) {
  if (!user || !user.token) return null;

  const ws = new WebSocket(`ws://127.0.0.1:8000/ws?token=${user.token}`);

  ws.onopen = () => console.log("WebSocket connected");
  ws.onmessage = (event) => console.log("WS message:", event.data);
  ws.onerror = (err) => console.error("WebSocket error:", err);
  ws.onclose = () => console.log("WebSocket closed");

  return ws;
}

export default validateToken;
