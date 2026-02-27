import React, { useState, useEffect } from "react";
import {
  FaDollarSign,
  FaAmbulance,
  FaClock,
  FaUserMd,
  FaMapMarkerAlt,
  FaUsers,
  FaStar,
  FaQuoteLeft,
  FaPhoneAlt,
  FaHospital,
  FaFirstAid,
} from "react-icons/fa";
import {
  Users,
  Clock,
  DollarSign,
  UserCheck,
  Ambulance,
  Star,
  ArrowRight,
  MapPin,
  Shield,
  CheckCircle,
} from "lucide-react";
import Notification from "../Notification/Notification";
import { IoMdPulse } from "react-icons/io";
import { GiMedicines } from "react-icons/gi";
import ambulHero from "./ambulance-hero.jpg";
import { apiFetch } from "../../controllers/apiClient";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CurrentLocationDisplay from "../CurrentLocationDisplay/CurrentLocationDisplay";
import LiveLocationMap from "../Map/LiveLocationMap";
import StatisticsBanner from "../StatisticsBanner/StatisticsBanner";


const Homepage = () => {
  const navigate = useNavigate(); // ✅ call hook here
  const user = useSelector((state) => state.user);

  // State for available drivers
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState(null);

  // Fetch available drivers from database
  const fetchAvailableDrivers = async () => {
    try {
      setDriversLoading(true);
      setDriversError(null);

      const response = await apiFetch("/drivers/available");

      if (response.ok) {
        const data = await response.json();
        setAvailableDrivers(data.available_drivers || []);
        console.log(
          `📊 Fetched ${data.available_drivers?.length || 0} available drivers`
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("❌ Error fetching available drivers:", err);
      setDriversError(err.message);
      setAvailableDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  };

  // Fetch drivers on component mount
  useEffect(() => {
    fetchAvailableDrivers();
  }, []);

  // Feature cards data
  const features = [
    {
      icon: <FaAmbulance className="text-red-500 text-3xl" />,
      title: "90-Second Dispatch",
      description:
        "Immediate emergency response with our rapid dispatch system",
    },
    {
      icon: <FaClock className="text-blue-500 text-3xl" />,
      title: "24/7 Availability",
      description: "Round-the-clock emergency medical services",
    },
    {
      icon: <FaUserMd className="text-green-500 text-3xl" />,
      title: "Certified EMTs",
      description: "Trained emergency medical technicians",
    },
    {
      icon: <FaMapMarkerAlt className="text-purple-500 text-3xl" />,
      title: "Live GPS Tracking",
      description: "Real-time ambulance location updates",
    },
  ];

  // Process steps
  const processSteps = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      title: "Emergency Call",
      description:
        "24/7 dispatch center receives your call and verifies location",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      title: "Dispatch",
      description: "Nearest ambulance dispatched within 90 seconds",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Rapid Response",
      description: "EMTs provide care en route with hospital notification",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      title: "Hospital Handoff",
      description: "Seamless transfer to ER team with full case details",
    },
  ];

  // Testimonials
  const testimonials = [
    {
      quote:
        "The response time saved my mother's life during her stroke. Incredibly professional team.",
      name: "jishan",
      role: "Daughter of patient",
      rating: 5,
    },
    {
      quote:
        "I've never seen such efficient emergency services. The EMTs were amazing.",
      name: "Rakib",
      role: "Car accident victim",
      rating: 5,
    },
    {
      quote:
        "The live tracking feature kept us calm knowing exactly when help would arrive.",
      name: "Tarek",
      role: "Family member",
      rating: 4,
    },
  ];

  return (
    <div className="font-sans text-gray-800 antialiased">
      <Notification />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-white to-red-50 text-blue-900 overflow-hidden">
        {/* Decorative Background Overlays */}
        <div className="absolute inset-0">
          {/* Subtle red accent glow */}
          <div className="absolute top-24 right-1/3 w-[220px] h-[220px] bg-red-500/15 rounded-full blur-2xl"></div>
          {/* Blue made *very subtle* */}
          <div className="absolute bottom-24 left-1/3 w-[160px] h-[160px] bg-blue-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-6 py-24 md:py-32 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Section */}

            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                Advanced <span className="text-red-600">Emergency</span> <br />
                Medical Response
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-10 leading-relaxed max-w-lg">
                Experience faster response times, live ambulance tracking, and
                certified medical professionals ready 24/7 to save lives.
              </p>

              {user.role === "" ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("signup")}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl transition-all flex items-center justify-center"
                  >
                    Registration
                  </button>
                  <button
                    onClick={() => navigate("login")}
                    className="bg-white border border-blue-100 hover:bg-blue-50 text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg shadow-md transition-all"
                  >
                    Login
                  </button>
                </div>
              ) : (
                <p className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                  Welcome, {user.name}!
                </p>
              )}
            </div>

            {/* Info Card */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-red-400 to-blue-500 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden p-0 border border-blue-50">
                {/* Full-width image */}
                <img
                  src={ambulHero}
                  alt="Emergency"
                  className="w-full object-cover rounded-t-3xl"
                />

                <div className="p-8">
                  <div className="mt-8 grid grid-cols-2 gap-6 text-center">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-blue-50">
                      <div className="text-blue-900 font-bold text-2xl">
                        8 min
                      </div>
                      <div className="text-gray-600 text-sm">Avg Response</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-blue-50">
                      <div className="text-blue-900 font-bold text-2xl">
                        24/7
                      </div>
                      <div className="text-gray-600 text-sm">Availability</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Service</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Advanced medical response with cutting-edge technology and trained
              professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Our <span className="text-blue-900">Emergency Process</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              From emergency call to hospital arrival - optimized for speed and
              care
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Gradient glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-900 to-blue-900 rounded-xl blur opacity-0 group-hover:opacity-30 transition-all duration-300"></div>

                <div className="relative bg-white p-8 rounded-xl h-full border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  {/* Step number with gradient */}
                  <div className="absolute -top-5 -right-5 w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-900 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {index + 1}
                  </div>

                  <div className="text-center">
                    {/* Icon with animated background */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                      <div className="text-blue-900 group-hover:text-blue-900 transition-colors duration-300">
                        {step.icon}
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-3 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Animated arrow for non-last items */}
                    {index < processSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-300 group-hover:text-blue-400 transition-colors duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price Bidding Section
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 md:pr-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Price Bidding & Negotiation
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Our innovative bidding system allows you to receive competitive
                pricing from multiple ambulance providers, ensuring you get the
                best value without compromising on quality.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="mr-3 mt-1 text-green-500">✓</div>
                  <p>Compare quotes from multiple providers in real-time</p>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-1 text-green-500">✓</div>
                  <p>
                    Negotiate directly with providers for special circumstances
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-1 text-green-500">✓</div>
                  <p>Transparent pricing with no hidden fees</p>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-1 text-green-500">✓</div>
                  <p>Insurance integration for simplified billing</p>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2 mt-10 md:mt-0">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div className="flex items-center">
                    <FaDollarSign className="text-green-500 mr-2" size={24} />
                    <span className="font-semibold">Price Comparison</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    3 quotes available
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg flex justify-between items-center bg-blue-50 border-blue-200">
                    <div>
                      <p className="font-medium">MediRush Ambulance</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">★★★★☆</span>
                        <span>4.2 (120 rides)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">$75.00</p>
                      <p className="text-sm text-gray-600">ETA: 8 min</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">LifeSaver Express</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">★★★★★</span>
                        <span>4.8 (98 rides)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$82.50</p>
                      <p className="text-sm text-gray-600">ETA: 6 min</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">QuickMed Services</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">★★★★☆</span>
                        <span>4.3 (67 rides)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$79.00</p>
                      <p className="text-sm text-gray-600">ETA: 10 min</p>
                    </div>
                  </div>
                </div>
                <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                  Select Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Provider Selection Section */}
      <div className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-100/30 to-blue-100/30 rounded-full blur-3xl translate-y-32 -translate-x-32"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            {/* Content Section */}
            <div className="w-full lg:w-1/2 lg:pl-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4 mr-2" />
                Trusted Network
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                Choose the Best Provider
              </h2>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Access multiple verified ambulance providers and select based on
                what matters most to you. Real-time data ensures you make the
                best choice for your emergency.
              </p>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {[
                  {
                    icon: Star,
                    title: "Driver Ratings",
                    description:
                      "Verified reviews and ratings from real patients and families",
                    color: "from-yellow-400 to-orange-500",
                  },
                  {
                    icon: Clock,
                    title: "Fastest Response",
                    description:
                      "Real-time tracking with accurate arrival estimates",
                    color: "from-blue-500 to-purple-600",
                  },
                  {
                    icon: DollarSign,
                    title: "Transparent Pricing",
                    description:
                      "Upfront costs with no hidden fees or surprise charges",
                    color: "from-emerald-500 to-teal-600",
                  },
                  {
                    icon: UserCheck,
                    title: "Medical Expertise",
                    description:
                      "Specialized equipment and certified medical professionals",
                    color: "from-rose-500 to-pink-600",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="group p-6 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                All providers are licensed, insured, and background-checked
              </div>
            </div>

            {/* Provider Selection Widget */}
            <div className="w-full lg:w-1/2">
              <div className="relative max-w-md mx-auto lg:mx-0">
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 rounded-full blur-xl"></div>

                {/* Main Card */}
                <div className="relative bg-white/90 backdrop-blur-lg border border-gray-200/50 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-xl">Available Providers</h3>
                      <div className="flex items-center text-blue-100 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        Nearby
                      </div>
                    </div>
                    <p className="text-blue-100 text-sm">
                      Based on your current location
                    </p>
                    <div className="mt-4 bg-white/20 rounded-full p-1 text-center text-sm font-medium">
                      {driversLoading
                        ? "Loading..."
                        : driversError
                        ? "Error loading"
                        : `${availableDrivers.length} providers available now`}
                    </div>
                  </div>

                  {/* Provider List */}
                  <div className="p-6 space-y-4">
                    {driversLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">
                          Loading available drivers...
                        </p>
                      </div>
                    ) : driversError ? (
                      <div className="text-center py-8">
                        <div className="text-red-500 mb-2">⚠️</div>
                        <p className="text-red-600 mb-4">
                          Failed to load drivers
                        </p>
                        <button
                          onClick={fetchAvailableDrivers}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : availableDrivers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">🚑</div>
                        <p className="text-gray-500">
                          No drivers available at the moment
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Check back later or try refreshing
                        </p>
                      </div>
                    ) : (
                      availableDrivers.map((driver, index) => {
                        // Generate some mock data for display (since we don't have all fields in database)
                        const mockData = {
                          // time: Math.floor(Math.random() * 15) + 5, // 5-20 minutes
                          // price: Math.floor(Math.random() * 30) + 60, // $60-90
                          specialty: [
                            "Emergency Care",
                            "General Care",
                            "Cardiac Care",
                            "Trauma Care",
                          ][Math.floor(Math.random() * 4)],
                          isRecommended: index === 0, // First driver is recommended
                        };

                        return (
                          <div
                            key={driver.driver_id}
                            className={`relative p-4 border-2 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer group ${
                              mockData.isRecommended
                                ? "border-blue-200 bg-blue-50/50 hover:border-blue-300"
                                : "border-gray-100 bg-gray-50/30 hover:border-gray-200"
                            }`}
                          >
                            

                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${
                                    mockData.isRecommended
                                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                                  }`}
                                >
                                  <Ambulance className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {driver.name}
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <div className="flex items-center mr-3">
                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                      <span className="text-sm font-medium text-gray-700 ml-1">
                                        {driver.ratings
                                          ? driver.ratings.toFixed(1)
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {mockData.specialty}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* <div className="text-right">
                                <p className="text-sm text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {mockData.time} min
                                </p>
                                <p className="font-bold text-xl text-gray-900">
                                  ${mockData.price}
                                </p>
                              </div> */}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200/50 flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-500">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                Licensed & Insured
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-6">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center group">
                      View All Providers
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        Updated 2 minutes ago • 24/7 availability
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tracking Feature */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="lg:w-1/2">
              <div className="max-w-lg">
                <span className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full mb-4">
                  REAL-TIME TRACKING
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  Track Your Ambulance in{" "}
                  <span className="text-blue-600">Real-Time</span>
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Our advanced tracking system provides live updates on
                  ambulance location and estimated arrival time with
                  hospital-grade precision.
                </p>

                <div className="space-y-6">
                  {/* Feature 1 */}
                  <div className="flex items-start group">
                    <div className="bg-blue-50 p-3 rounded-lg mr-5 group-hover:bg-blue-100 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">
                        Precision Tracking
                      </h4>
                      <p className="text-gray-600">
                        Live GPS updates with 5-second refresh rate for accurate
                        location monitoring
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start group">
                    <div className="bg-blue-50 p-3 rounded-lg mr-5 group-hover:bg-blue-100 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">
                        Dynamic ETA
                      </h4>
                      <p className="text-gray-600">
                        AI-powered arrival estimates that adjust for traffic and
                        road conditions
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start group">
                    <div className="bg-blue-50 p-3 rounded-lg mr-5 group-hover:bg-blue-100 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">
                        Secure Sharing
                      </h4>
                      <p className="text-gray-600">
                        One-click status sharing with family or medical
                        professionals
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Live Location Card */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-1 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="font-bold text-lg text-gray-900">
                          Live Location Tracking
                        </span>
                      </div>
                      <div className="text-gray-600 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Real-time GPS coordinates
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Live
                    </div>
                  </div>

                  {/* Live Location Map */}
                  <div className="relative bg-gray-100 rounded-xl h-72 mb-6 overflow-hidden">
                    {user.id > 0 ? (
                      <LiveLocationMap
                        zoom={13}
                        height="288px"
                        markerColor="#4CAF50"
                        markerBorderColor="#2E7D32"
                        title={
                          user.role === "driver"
                            ? "Driver Location"
                            : user.role === "rider"
                            ? "Rider Location"
                            : "Your Location"
                        }
                        trackPeriodically={true}
                        updateInterval={5000}
                        showAccuracy={true}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-50 flex items-center justify-center">
                        <div className="text-center w-full p-6">
                          <div className="text-gray-500 mb-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium mb-2">
                            Live GPS Tracking Map
                          </p>
                          <p className="text-sm text-gray-400">
                            Please login to view live location tracking
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Location Info */}
                  {user.id > 0 && (
                    <div className="mb-6">
                      <CurrentLocationDisplay id={user.id} />

                      {/* Manual Location Update Button for Riders */}
                      {user.role === "rider" && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => {
                              // Trigger location update by refreshing the page
                              window.location.reload();
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            🔄 Refresh Location
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            Click if your location is not showing correctly
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Latitude</div>
                      <div className="font-bold text-gray-900 font-mono text-xs">
                        {user.latitude ? user.latitude.toFixed(6) : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Longitude
                      </div>
                      <div className="font-bold text-gray-900 font-mono text-xs">
                        {user.longitude ? user.longitude.toFixed(6) : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      <div className="font-bold text-gray-900">
                        {user.role
                          ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)
                          : "Guest"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${user.latitude},${user.longitude}`,
                          "_blank"
                        )
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      View on Map
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(
                            `${user.latitude}, ${user.longitude}`
                          );
                        }
                      }}
                      className="flex-1 border border-gray-200 hover:border-blue-300 text-blue-600 py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <StatisticsBanner />
      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Patient Experiences</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Hear from those who've used our emergency services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`${
                        i < testimonial.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      } text-lg`}
                    />
                  ))}
                </div>
                <div className="mb-6">
                  <FaQuoteLeft className="text-gray-300 text-2xl mb-4" />
                  <p className="text-gray-700 italic text-lg">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
                    <FaUserMd className="text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency CTA */}
      {/* <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Need Emergency Assistance?
            </h2>
            <p className="text-xl text-red-100 mb-8">
              Our emergency response teams are standing by 24/7 to provide
              immediate medical assistance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white hover:bg-gray-100 text-red-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-colors flex items-center justify-center">
                <FaPhoneAlt className="mr-2" /> Call Emergency: 911
              </button>
              <button className="bg-transparent hover:bg-red-800 text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-colors">
                Non-Emergency Contact
              </button>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Homepage;
