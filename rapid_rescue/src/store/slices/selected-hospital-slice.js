import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  hospital: null, // { name, latitude, longitude, fullAddress }
  isSelected: false,
};

const selectedHospitalSlice = createSlice({
  name: "selectedHospital",
  initialState,
  reducers: {
    setSelectedHospital: (state, action) => {
      state.hospital = action.payload;
      state.isSelected = action.payload !== null;
    },
    clearSelectedHospital: (state) => {
      state.hospital = null;
      state.isSelected = false;
    },
  },
});

export const { setSelectedHospital, clearSelectedHospital } = selectedHospitalSlice.actions;
export default selectedHospitalSlice.reducer;
