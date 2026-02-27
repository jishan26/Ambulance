import { Map } from "lucide-react";

const Distance = ({ remainingDistanceKm, routeActive, progressPercent }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-[16px] shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
        <div className="relative w-full h-full bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/90 to-transparent animate-progress-beam"></div>
        </div>
      </div>

      <div className="p-5 flex items-center space-x-4">
        <div className="bg-blue-50 p-3 rounded-2xl">
          <Map className="w-6 h-6 text-blue-600 stroke-[2]" />
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Remaining Distance
            </span>
            <div className="flex items-center space-x-1">
              <Map className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                {routeActive ? "Route Active" : "No Route"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-blue-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
                <path
                  className="text-blue-600 transition-all"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  strokeDasharray={`${Math.min(
                    Math.max(progressPercent, 0),
                    100
                  )}, 100`}
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-600">
                  {Math.round(Math.min(Math.max(progressPercent, 0), 100))}%
                </span>
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-800">
                {remainingDistanceKm?.toFixed
                  ? remainingDistanceKm.toFixed(1)
                  : remainingDistanceKm}
              </span>
              <span className="text-sm text-gray-500">km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Distance.defaultProps = {
  remainingDistanceKm: "--",
  routeActive: true,
  progressPercent: 50,
};

export default Distance;
