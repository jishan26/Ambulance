// controllers/Signup.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000"; // change to localhost:8000 if same machine

const handleSignUp = async (values, role, navigate) => {
  try {
    // Validate navigate function
    if (!navigate || typeof navigate !== "function") {
      console.error("Navigate function is not available or not a function");
      alert("Navigation error occurred");
      return;
    }

    // Prepare payload for FastAPI
    const payload = {
      ...values,
      user_type: role === "rider" ? "rider" : "driver", // Match backend user_type
    };

    console.log("Signup payload:", payload); // Debug

    const response = await axios.post(`${API_BASE_URL}/auth/signup`, payload, {
      withCredentials: true, // needed for HTTP-only cookies
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 201) {
      alert("Signup successful!");
      navigate("/login");
    }
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 422 && Array.isArray(data.detail)) {
        const messages = data.detail.map((err) => `${err.loc[1]}: ${err.msg}`);
        alert(messages.join("\n"));
      } else if (status === 409) {
        alert(data.detail || "Email or phone already taken");
      } else {
        alert("Server error, please try again later");
        console.error("Server Response:", data);
      }
    } else {
      // Network or CORS error
      alert(
        "Failed to fetch. Check backend server is running and CORS settings."
      );
      console.error(error.message);
    }
  }
};

export default handleSignUp;
