import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { apiFetch } from "../../controllers/apiClient";
import { setUser } from "../../store/slices/user-slice";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Car,
  Shield,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react";

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col p-4 rounded-lg bg-white shadow-sm border border-gray-100">
      <div className="flex items-center mb-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500 mr-2" />}
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {label}
        </span>
      </div>
      <span className="mt-1 text-xl font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function InfoItem({
  label,
  value,
  editable = false,
  onChange,
  type = "text",
  icon: Icon,
}) {
  return (
    <div className="p-4 rounded-lg bg-gray-50">
      <div className="flex items-center mb-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500 mr-2" />}
        <p className="text-gray-500 text-sm">{label}</p>
      </div>
      {editable ? (
        <input
          type={type}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <p className="font-medium text-gray-900 mt-1">
          {value || "Not provided"}
        </p>
      )}
    </div>
  );
}

export default function DriverProfile() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [driver, setDriver] = useState({
    driver_id: null,
    name: "",
    email: "",
    mobile: "",
    ratings: null,
    is_available: false,
    // Additional fields for display
    base: "",
    languages: "",
    trips: "",
    onTime: "",
    years: "",
    vehicleType: "",
    plate: "",
    equipment: "",
    insurance: "",
    certifications: [],
    feedback: [],
  });
  const [snapshot, setSnapshot] = useState(driver);

  // Fetch driver profile from database
  useEffect(() => {
    if (user.id && user.role === "driver") {
      fetchDriverProfile();
    } else {
      setLoading(false);
    }
  }, [user.id, user.role]);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/profile/driver/${user.id}`);

      if (response.ok) {
        const data = await response.json();
        console.log("🚗 Fetched driver profile:", data);

        // Map database fields to component state
        setDriver((prev) => ({
          ...prev,
          driver_id: data.driver_id,
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          ratings: data.ratings || 0,
          is_available: data.is_available || false,
          // Keep additional fields for display
          base: prev.base || "Downtown EMS, Bay 3",
          languages: prev.languages || "English, Spanish",
          trips: prev.trips || "0",
          onTime: prev.onTime || "0%",
          years: prev.years || "0",
          vehicleType: prev.vehicleType || "Type II Ambulance",
          plate: prev.plate || "RR-AMB-4567",
          equipment: prev.equipment || "AED, O2, Trauma kit, Stretcher",
          insurance: prev.insurance || "Valid • Expires 12/2026",
          certifications: prev.certifications || [
            "EMT-B License",
            "CPR & AED (AHA)",
            "EVOC Certified",
            "Trauma First Response",
          ],
          feedback: prev.feedback || [
            "Very professional and calm under pressure",
            "Arrived 5 minutes early for pickup",
            "Vehicle well-maintained and clean",
          ],
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("❌ Error fetching driver profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setSnapshot(driver);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDriver(snapshot);
    setIsEditing(false);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare data for API (only database fields)
      const profileData = {
        name: driver.name,
        email: driver.email,
        mobile: driver.mobile,
        ratings: driver.ratings,
        is_available: driver.is_available,
      };

      const response = await apiFetch(`/profile/driver/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Driver profile updated successfully:", data);

        // Update Redux store with new user data
        dispatch(
          setUser({
            name: data.name,
            email: data.email,
            mobile: data.mobile,
          })
        );

        setIsEditing(false);
        setSnapshot(driver);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setDriver((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAvailability = () => {
    setDriver((prev) => ({ ...prev, is_available: !prev.is_available }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver profile...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "driver") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mt-20">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Driver Profile
          </h2>
          <p className="text-gray-600">
            {user.role
              ? `You are logged in as a ${user.role}. This profile is for drivers only.`
              : "Please login as a driver to access this profile."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Driver Profile
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your driver information and availability
              </p>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400 mr-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Total Trips" value={driver.trips} icon={Car} />
          <Stat label="On-Time Rate" value={driver.onTime} icon={Clock} />
          <Stat
            label="Rating"
            value={
              driver.ratings ? `${driver.ratings.toFixed(1)} (320)` : "N/A"
            }
            icon={Star}
          />
          <Stat label="Years Experience" value={driver.years} icon={Award} />
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Full Name"
              value={driver.name}
              editable={isEditing}
              onChange={(value) => updateField("name", value)}
              icon={User}
            />
            <InfoItem
              label="Email Address"
              value={driver.email}
              editable={isEditing}
              onChange={(value) => updateField("email", value)}
              type="email"
              icon={Mail}
            />
            <InfoItem
              label="Phone Number"
              value={driver.mobile}
              editable={isEditing}
              onChange={(value) => updateField("mobile", value)}
              type="tel"
              icon={Phone}
            />
            <InfoItem
              label="Base Location"
              value={driver.base}
              editable={isEditing}
              onChange={(value) => updateField("base", value)}
              icon={MapPin}
            />
          </div>
        </div>

        {/* Availability Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Availability Status
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  driver.is_available ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-gray-700">
                {driver.is_available
                  ? "Available for trips"
                  : "Currently unavailable"}
              </span>
            </div>
            {isEditing && (
              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  driver.is_available
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {driver.is_available ? "Set Unavailable" : "Set Available"}
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Vehicle Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Vehicle Type"
              value={driver.vehicleType}
              editable={isEditing}
              onChange={(value) => updateField("vehicleType", value)}
            />
            <InfoItem
              label="License Plate"
              value={driver.plate}
              editable={isEditing}
              onChange={(value) => updateField("plate", value)}
            />
            <InfoItem
              label="Equipment"
              value={driver.equipment}
              editable={isEditing}
              onChange={(value) => updateField("equipment", value)}
            />
            <InfoItem
              label="Insurance Status"
              value={driver.insurance}
              editable={isEditing}
              onChange={(value) => updateField("insurance", value)}
              icon={Shield}
            />
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {driver.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-900">{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Recent Feedback
          </h2>
          <div className="space-y-3">
            {driver.feedback.map((feedback, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">{feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
