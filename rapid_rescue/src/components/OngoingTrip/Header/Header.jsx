import { Ambulance, AlertTriangle, User } from "lucide-react";
import PropTypes from "prop-types";

const Header = ({ role, handleEndTrip, userName }) => {
  return (
    <div className="px-6 py-5 rounded-2xl flex justify-between items-center bg-gradient-to-r from-red-500 to-red-600 shadow-lg relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mt-16 -mr-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -mb-12 -ml-12"></div>
      </div>

      <div className="flex items-center space-x-4 z-10">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-md">
          <Ambulance className="w-7 h-7 text-white stroke-[2]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Emergency Medical Transport
          </h2>
          <div className="flex items-center mt-1">
            <span className="text-sm text-white/90">Active response • </span>
            <div className="flex items-center ml-2 bg-white/20 px-2 py-0.5 rounded-full">
              <User className="w-3 h-3 text-white mr-1" />
              <span className="text-xs text-white">{userName}</span>
            </div>
          </div>
        </div>
      </div>

      {role === "driver" && (
        <button
          onClick={handleEndTrip}
          className="group relative px-6 py-3 rounded-xl text-sm font-semibold 
                      text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 
                      transition-all duration-300 ease-in-out 
                      flex items-center space-x-2 shadow-md hover:shadow-lg z-10
                      border border-white/30 hover:border-white/40"
        >
          <div className="absolute -inset-1 bg-white/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
          <AlertTriangle className="w-5 h-5 text-white stroke-[2] group-hover:animate-pulse" />
          <span>End Emergency</span>
        </button>
      )}
    </div>
  );
};

Header.propTypes = {
  role: PropTypes.string.isRequired,
  handleEndTrip: PropTypes.func.isRequired,
  userName: PropTypes.string,
};

Header.defaultProps = {
  userName: "User",
};

export default Header;
