import React, { useState } from "react";
import { User, Car, Mail, Lock, Phone, UserCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import handleSignUp from "../../controllers/Signup";

function OverallSignup() {
  const [role, setRole] = useState("rider"); // Default role is "rider"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payload for backend - match your backend expected fields
      const payload = {
        name: formData.name.trim(), // matches backend 'name'
        email: formData.email.trim(), // must be Gmail
        mobile: formData.mobile.trim(), // must match Bangladeshi phone pattern
        password: formData.password, // at least 6 characters
        user_type: role === "rider" ? "rider" : "driver", // must be sent
      };
      // Call API with the correct parameters: (values, role, navigate)
      await handleSignUp(payload, role, navigate);
    } catch (error) {
      console.error("Signup error:", error);
      alert("An error occurred during signup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-100 to-red-100 py-6 px-8 text-center rounded-t-xl border-b border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-700">
            Create Your {role} Account
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Sign up to get started</p>
          <Link
            to="/"
            className="inline-block mt-3 text-blue-600 hover:text-blue-500 font-medium text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
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

          {/* Name Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="name"
            >
              Full Name
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter your ${role.toLowerCase()} name`}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Mobile Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="mobile"
            >
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                id="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your mobile number"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              required
              disabled={isLoading}
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              I agree to the{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms and Conditions
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              role === "driver"
                ? "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
                : "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            {isLoading
              ? `Creating ${role === "rider" ? "Rider" : "Driver"} Account...`
              : `Create ${role === "rider" ? "Rider" : "Driver"} Account`}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="mt-6 flex items-center">
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

export default OverallSignup;
