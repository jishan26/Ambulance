import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { apiFetch } from "../../controllers/apiClient";
import { setUser } from "../../store/slices/user-slice";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Pill,
  FileText,
  Calendar,
  Scale,
  Ruler,
  Droplets,
  Building2,
  Clock,
} from "lucide-react";

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

export default function PatientProfile() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState({
    rider_id: null,
    name: "",
    email: "",
    mobile: "",
    // Additional fields for display
    address: "",
    emergencyContact: "",
    primaryCondition: "",
    allergies: "",
    medications: "",
    notes: "",
    age: "",
    weight: "",
    height: "",
    blood: "",
    hospitals: [],
    timeline: [],
  });
  const [snapshot, setSnapshot] = useState(patient);

  // Fetch patient profile from database
  useEffect(() => {
    if (user.id && user.role === "rider") {
      fetchPatientProfile();
    } else {
      setLoading(false);
    }
  }, [user.id, user.role]);

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/profile/rider/${user.id}`);

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Fetched patient profile:", data);

        // Map database fields to component state
        setPatient((prev) => ({
          ...prev,
          rider_id: data.rider_id,
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          // Keep additional fields for display
          address: prev.address || "Not provided",
          emergencyContact: prev.emergencyContact || "Not provided",
          primaryCondition: prev.primaryCondition || "Not specified",
          allergies: prev.allergies || "None known",
          medications: prev.medications || "None",
          notes: prev.notes || "No additional notes",
          age: prev.age || "Not provided",
          weight: prev.weight || "Not provided",
          height: prev.height || "Not provided",
          blood: prev.blood || "Not provided",
          hospitals: prev.hospitals || ["Not specified"],
          timeline: prev.timeline || ["No recent activity"],
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("❌ Error fetching patient profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setSnapshot(patient);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setPatient(snapshot);
    setIsEditing(false);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare data for API (only database fields)
      const profileData = {
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
      };

      const response = await apiFetch(`/profile/rider/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Profile updated successfully:", data);

        // Update Redux store with new user data
        dispatch(
          setUser({
            name: data.name,
            email: data.email,
            mobile: data.mobile,
          })
        );

        setIsEditing(false);
        setSnapshot(patient);
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
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "rider") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mt-20">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Patient Profile
          </h2>
          <p className="text-gray-600">
            {user.role
              ? `You are logged in as a ${user.role}. This profile is for riders only.`
              : "Please login as a rider to access this profile."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Profile
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your medical information and contact details
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

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Full Name"
              value={patient.name}
              editable={isEditing}
              onChange={(value) => updateField("name", value)}
              icon={User}
            />
            <InfoItem
              label="Email Address"
              value={patient.email}
              editable={isEditing}
              onChange={(value) => updateField("email", value)}
              type="email"
              icon={Mail}
            />
            <InfoItem
              label="Phone Number"
              value={patient.mobile}
              editable={isEditing}
              onChange={(value) => updateField("mobile", value)}
              type="tel"
              icon={Phone}
            />
            <InfoItem
              label="Address"
              value={patient.address}
              editable={isEditing}
              onChange={(value) => updateField("address", value)}
              icon={MapPin}
            />
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Medical Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Primary Condition"
              value={patient.primaryCondition}
              editable={isEditing}
              onChange={(value) => updateField("primaryCondition", value)}
            />
            <InfoItem
              label="Allergies"
              value={patient.allergies}
              editable={isEditing}
              onChange={(value) => updateField("allergies", value)}
            />
            <InfoItem
              label="Current Medications"
              value={patient.medications}
              editable={isEditing}
              onChange={(value) => updateField("medications", value)}
              icon={Pill}
            />
            <InfoItem
              label="Blood Type"
              value={patient.blood}
              editable={isEditing}
              onChange={(value) => updateField("blood", value)}
              icon={Droplets}
            />
          </div>
        </div>

        {/* Physical Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Scale className="w-5 h-5 mr-2" />
            Physical Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoItem
              label="Age"
              value={patient.age}
              editable={isEditing}
              onChange={(value) => updateField("age", value)}
              icon={Calendar}
            />
            <InfoItem
              label="Weight"
              value={patient.weight}
              editable={isEditing}
              onChange={(value) => updateField("weight", value)}
              icon={Scale}
            />
            <InfoItem
              label="Height"
              value={patient.height}
              editable={isEditing}
              onChange={(value) => updateField("height", value)}
              icon={Ruler}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Emergency Contact
          </h2>
          <InfoItem
            label="Emergency Contact"
            value={patient.emergencyContact}
            editable={isEditing}
            onChange={(value) => updateField("emergencyContact", value)}
          />
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Additional Notes
          </h2>
          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-gray-500 text-sm mb-2">Medical Notes</p>
            {isEditing ? (
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={patient.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            ) : (
              <p className="font-medium text-gray-900">{patient.notes}</p>
            )}
          </div>
        </div>

        {/* Preferred Hospitals */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Preferred Hospitals
          </h2>
          <div className="space-y-2">
            {patient.hospitals.map((hospital, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">{hospital}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {patient.timeline.map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></div>
                <p className="text-sm text-gray-700">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
