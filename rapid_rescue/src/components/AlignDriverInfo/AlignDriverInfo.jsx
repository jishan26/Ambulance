import React from "react";
import {
  FaUserCircle,
  FaStar,
  FaPhone,
  FaAmbulance,
  FaClock,
} from "react-icons/fa";
import PropTypes from "prop-types";

const AlignDriverInfo = ({
  driver_name = "Driver Name",
  driver_mobile = "+880 1234-567890",
  req_id = "",
  fare = 250,
  driver_id = "",
  specialty = "Emergency Response",
  rating = 4.8,
  vehicle = "Emergency Medical Transport",
  eta = "8 min",
  pickup_location = "Pickup Location",
  destination = "Destination",
  onAccept = () => {},
}) => {
  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md border border-gray-300 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-indigo-100 p-1 md:p-2 rounded-full">
            <FaUserCircle className="text-2xl md:text-3xl text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-1 md:gap-2">
              <p className="font-semibold text-gray-800 text-sm md:text-base">
                {driver_name}
              </p>
              <div className="flex items-center bg-green-100 px-1 md:px-2 py-0.5 rounded text-xs text-green-700">
                <FaStar className="text-yellow-500 mr-1" /> {rating}
              </div>
            </div>
            <div className="flex items-center text-gray-600 text-xs md:text-sm mt-0.5 md:mt-1">
              <FaPhone className="text-xs mr-1" /> {driver_mobile}
            </div>
            <div className="flex items-center text-gray-600 text-xs md:text-sm mt-0.5">
              <FaAmbulance className="text-xs mr-1" /> {vehicle}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-indigo-600 text-base md:text-lg">
            ৳{fare}
          </p>
          <p className="text-xs text-gray-500">Driver's Bid</p>
          <div className="flex items-center text-green-600 text-xs mt-1">
            <FaClock className="text-xs mr-1" /> {eta}
          </div>
        </div>
      </div>

      <div className="mt-2 md:mt-3">
        <button
          onClick={onAccept}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 w-full py-2 md:py-2.5 rounded-lg text-white font-medium text-xs md:text-sm hover:from-indigo-700 hover:to-indigo-800 transition duration-300 flex items-center justify-center gap-2"
        >
          Accept Driver
        </button>
      </div>
    </div>
  );
};

AlignDriverInfo.propTypes = {
  driver_name: PropTypes.string,
  driver_mobile: PropTypes.string,
  req_id: PropTypes.string,
  fare: PropTypes.number,
  driver_id: PropTypes.string,
  specialty: PropTypes.string,
  rating: PropTypes.number,
  vehicle: PropTypes.string,
  eta: PropTypes.string,
  pickup_location: PropTypes.string,
  destination: PropTypes.string,
  onAccept: PropTypes.func,
};

export default AlignDriverInfo;
