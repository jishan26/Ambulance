import { deleteUser } from "../store/slices/user-slice";
import { DisconnectFromServer } from "./websocket/handler";
import { apiFetch, setDriverOffline } from "./apiClient";

async function Logout(dispatch, navigate) {
  console.log("Calling logout...");

  try {
    // Check if user is a driver and set them offline before logout
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.role === "driver" && storedUser.id) {
      console.log("🔄 Setting driver as offline before logout...");
      const offlineResult = await setDriverOffline();
      if (offlineResult.success) {
        console.log("✅ Driver set as offline before logout");
      } else {
        console.warn("⚠️ Failed to set driver as offline:", offlineResult.error);
      }
    }

    const response = await apiFetch("/auth/logout", { method: "DELETE" });

    const statusCode = response.status;

    if (statusCode === 200 || statusCode === 204) {
      // Disconnect WebSocket
      await DisconnectFromServer();

      // Clear Redux user state
      dispatch(deleteUser());

      // Clear persisted user in localStorage
          localStorage.removeItem("user");

      // Navigate to login page
      navigate("/login");
      console.log("Logout successful");
    } else {
      let errorMsg = "Error occurred. Please try again.";
      try {
        const data = await response.json();
        if (data?.detail) {
          errorMsg = data.detail;
        }
      } catch {
        // Ignore if no JSON body
      }
      alert(errorMsg);
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("An unknown error occurred. Please try again.");
  }
}

export default Logout;
