import { createSlice } from "@reduxjs/toolkit";

const bidNegotiationSlice = createSlice({
  name: "bidNegotiation",
  initialState: {
    currentBids: [],
    selectedDriver: null,
    counterOffers: [],
    negotiationStatus: "waiting", // waiting, negotiating, accepted, rejected
  },
  reducers: {
    addDriverBid: (state, action) => {
      const bid = action.payload;
      const existingIndex = state.currentBids.findIndex(
        (b) => b.driver_id === bid.driver_id
      );

      if (existingIndex >= 0) {
        state.currentBids[existingIndex] = bid;
      } else {
        state.currentBids.push(bid);
      }
    },

    removeDriverBid: (state, action) => {
      const driverId = action.payload;
      state.currentBids = state.currentBids.filter(
        (bid) => bid.driver_id !== driverId
      );
    },

    setSelectedDriver: (state, action) => {
      state.selectedDriver = action.payload;
    },

    addCounterOffer: (state, action) => {
      const counterOffer = action.payload;
      state.counterOffers.push(counterOffer);
    },

    setNegotiationStatus: (state, action) => {
      state.negotiationStatus = action.payload;
    },

    clearBidNegotiation: (state) => {
      state.currentBids = [];
      state.selectedDriver = null;
      state.counterOffers = [];
      state.negotiationStatus = "waiting";
    },

    startBidNegotiation: (state, action) => {
      state.negotiationStatus = "negotiating";
      state.selectedDriver = action.payload;
    },

    addRiderCounterOffer: (state, action) => {
      state.counterOffers.push({
        ...action.payload,
        type: "rider",
        timestamp: new Date().toISOString(),
      });
    },

    addDriverCounterOffer: (state, action) => {
      state.counterOffers.push({
        ...action.payload,
        type: "driver",
        timestamp: new Date().toISOString(),
      });
    },

    acceptBid: (state, action) => {
      const bidId = action.payload;
      state.currentBids = state.currentBids.map((bid) =>
        bid.driver_id === bidId
          ? { ...bid, status: "accepted" }
          : { ...bid, status: "rejected" }
      );
      state.negotiationStatus = "accepted";
    },

    rejectBid: (state, action) => {
      const bidId = action.payload;
      state.currentBids = state.currentBids.map((bid) =>
        bid.driver_id === bidId ? { ...bid, status: "rejected" } : bid
      );
      state.negotiationStatus = "rejected";
    },
  },
});

export const {
  addDriverBid,
  removeDriverBid,
  setSelectedDriver,
  addCounterOffer,
  setNegotiationStatus,
  clearBidNegotiation,
  startBidNegotiation,
  addRiderCounterOffer,
  addDriverCounterOffer,
  acceptBid,
  rejectBid,
} = bidNegotiationSlice.actions;

export default bidNegotiationSlice.reducer;
