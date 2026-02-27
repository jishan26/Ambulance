import { createSlice } from "@reduxjs/toolkit";

const nearbyDriversSlice = createSlice({
  name: "nearbyDrivers",
  initialState: {
    drivers: {}, // { driverId: { latitude, longitude, timestamp, name?, status? } }
    lastUpdated: null,
    isTracking: false,
  },
  reducers: {
    addDriver: (state, action) => {
      const { driver_id, latitude, longitude, timestamp, name, status } =
        action.payload;
      const wasNewDriver = !state.drivers[driver_id];

      state.drivers[driver_id] = {
        latitude,
        longitude,
        timestamp,
        name: name || `Driver ${driver_id}`,
        status: status || "available",
      };
      state.lastUpdated = new Date().toISOString();

      const totalDrivers = Object.keys(state.drivers).length;
      console.log(
        `➕ ${
          wasNewDriver ? "Added new" : "Updated existing"
        } driver ${driver_id}. Total drivers: ${totalDrivers}`
      );
    },
    updateDriver: (state, action) => {
      console.log("Updating driver in Redux:", action.payload);
      const { driver_id, latitude, longitude, timestamp, name, status } =
        action.payload;
      if (state.drivers[driver_id]) {
        state.drivers[driver_id] = {
          ...state.drivers[driver_id],
          latitude,
          longitude,
          timestamp,
          ...(name && { name }),
          ...(status && { status }),
        };
        state.lastUpdated = new Date().toISOString();
      } else {
        // If driver doesn't exist, add them
        state.drivers[driver_id] = {
          latitude,
          longitude,
          timestamp,
          name: name || `Driver ${driver_id}`,
          status: status || "available",
        };
        state.lastUpdated = new Date().toISOString();
      }
      console.log(
        `📊 Total drivers available: ${Object.keys(state.drivers).length}`
      );
    },
    removeDriver: (state, action) => {
      const driverId = action.payload;
      const hadDriver = !!state.drivers[driverId];

      if (hadDriver) {
        delete state.drivers[driverId];
        state.lastUpdated = new Date().toISOString();
        const totalDrivers = Object.keys(state.drivers).length;
        console.log(
          `➖ Removed driver ${driverId}. Total drivers: ${totalDrivers}`
        );
      } else {
        console.log(`⚠️ Attempted to remove non-existent driver ${driverId}`);
      }
    },
    setDrivers: (state, action) => {
      console.log("🚑 Setting drivers in Redux:", action.payload);
      // Convert array to object format if needed
      if (Array.isArray(action.payload)) {
        console.log(
          `📊 Converting ${action.payload.length} drivers to object format`
        );
        const driversObj = {};
        action.payload.forEach((driver) => {
          console.log(
            `📍 Processing driver ${driver.id}: ${driver.name} at ${driver.latitude}, ${driver.longitude}`
          );
          driversObj[driver.id] = {
            latitude: driver.latitude,
            longitude: driver.longitude,
            timestamp: driver.timestamp,
            name: driver.name || `Driver ${driver.id}`,
            status: driver.status || "available",
          };
        });
        // Create a new object to prevent concurrent modification issues
        state.drivers = { ...driversObj };
      } else {
        // Create a new object to prevent concurrent modification issues
        state.drivers = { ...action.payload };
      }
      state.lastUpdated = new Date().toISOString();
      console.log(
        `📊 Total drivers available: ${Object.keys(state.drivers).length}`
      );
    },
    clearDrivers: (state) => {
      state.drivers = {};
      state.lastUpdated = null;
    },
    setTracking: (state, action) => {
      state.isTracking = action.payload;
    },
  },
});

export const {
  addDriver,
  updateDriver,
  removeDriver,
  setDrivers,
  clearDrivers,
  setTracking,
} = nearbyDriversSlice.actions;

export default nearbyDriversSlice.reducer;
