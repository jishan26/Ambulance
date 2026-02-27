import { setUser } from "../store/slices/user-slice";
import { apiFetch } from "./apiClient";

const handleLogin = async (values, dispatch, navigate) => {
  try {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(values),
    });

    const statusCode = res.status;
    let data = null;

    try {
      data = await res.json(); // try to parse JSON if available
    } catch {
      data = {};
    }

    if (statusCode === 200) {
      console.log("Login successful, received data:", data);
      console.log(
        "Checking for token in response:",
        data.token ? "Token found" : "No token in response"
      );

      // If backend doesn't send token, we need to handle session-based auth differently
       dispatch(setUser(data));
          if (data.token) {
              localStorage.setItem("user", JSON.stringify(data));
                          }

      
      if (data.role === "rider") {
        navigate("/");
      } else {
        navigate("/");
      }
    } else if (statusCode === 401) {
      alert("Invalid credentials. Please try again.");
    } else if (statusCode === 422) {
      alert(data.detail || "Validation error. Please check your input.");
    } else if (statusCode === 500) {
      alert(
        "Sorry, we're experiencing a technical issue. Please try again later."
      );
    } else {
      alert(data.detail || `Unexpected error (code: ${statusCode})`);
    }
  } catch (err) {
    console.error("Login error:", err);
    alert(`Network error: ${err.message}`);
  }
};

export default handleLogin;
