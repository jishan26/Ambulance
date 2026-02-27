import MapComponent from "./MapComponent/MapComponent";
import PatientRequestComponent from "./PatientRequestComponent/PatientRequestComponent";
import PropTypes from "prop-types";

const MainContent = ({
  isAvailable = false,
  isCheckedOut = false,
  toggleAvailability = () => {},
  totalIncomingRequests = 0,
  onStartBidding = () => {},
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Emergency Response Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            Real-time patient request management and route tracking
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Component - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <MapComponent isCheckedOut={isCheckedOut} />
          </div>

          {/* Patient Request Component - Takes 1 column */}
          <div className="lg:col-span-1">
            <PatientRequestComponent
              isAvailable={isAvailable}
              isCheckedOut={isCheckedOut}
              toggleAvailability={toggleAvailability}
              totalIncomingRequests={totalIncomingRequests}
              onStartBidding={onStartBidding}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

MainContent.propTypes = {
  isAvailable: PropTypes.bool.isRequired,
  isCheckedOut: PropTypes.bool.isRequired,
  toggleAvailability: PropTypes.func.isRequired,
  totalIncomingRequests: PropTypes.number.isRequired,
  onStartBidding: PropTypes.func.isRequired,
};

export default MainContent;
