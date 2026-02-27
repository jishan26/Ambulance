import React, { useState } from "react";
import { User, Car, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import handleLogin from "./../../controllers/Login";

function UserLogin() {
  const [role, setRole] = useState("rider"); // Default role is "rider"
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const values = {
      phone_or_email: phoneOrEmail.trim(),
      password,
      user_type: role === "rider" ? "rider" : "driver", // ✅ backend expects this
    };

    handleLogin(values, dispatch, navigate);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-100 to-red-100 py-6 px-8 text-center rounded-t-xl border-b border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-700">Welcome Back</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to continue</p>

          <Link
            to="/"
            className="inline-block mt-3 text-blue-600 hover:text-blue-500 font-medium text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Form */}
        <div className="p-8">
          {/* Role Selection */}
          <div className="flex justify-center space-x-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("rider")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                role === "rider"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Rider</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                role === "driver"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Driver</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email/Mobile Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Mobile
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email or mobile"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                role === "driver"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Sign In as {role === "rider" ? "Rider" : "Driver"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
