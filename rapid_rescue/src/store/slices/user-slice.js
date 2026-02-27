import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    id: 0,
    name: "",
    email: "",
    mobile: "",
    role: "", // optional: could default to "rider" or "driver"
    latitude: 0,
    longitude: 0,
    token: "", // Bearer token for authentication
  },
  reducers: {
    setUser: (state, action) => {
      state.id = action.payload?.id ?? state.id;
      state.name = action.payload?.name ?? state.name;
      state.email = action.payload?.email ?? state.email;
      state.mobile = action.payload?.mobile ?? state.mobile;
      state.role = action.payload?.role ?? state.role;
      state.latitude = action.payload?.latitude ?? state.latitude;
      state.longitude = action.payload?.longitude ?? state.longitude;
      state.token = action.payload?.token ?? state.token;
    },
    deleteUser: (state) => {
      state.id = 0;
      state.name = "";
      state.email = "";
      state.mobile = "";
      state.role = "";
      state.token = "";
      state.latitude = 0;
      state.longitude = 0;
    },
  },
});

export const { setUser, deleteUser } = userSlice.actions;
export default userSlice.reducer;
