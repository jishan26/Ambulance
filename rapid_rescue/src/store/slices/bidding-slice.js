import { createSlice } from '@reduxjs/toolkit';

const biddingSlice = createSlice({
  name: 'bidding',
  initialState: {
    activeBids: [], // Array of active bid negotiations
    riderBids: [], // Rider's counter offers
    driverBids: [], // Driver's bids
    loading: false,
    error: null,
  },
  reducers: {
    // Add a new bid from driver
    addDriverBid: (state, action) => {
      const bid = action.payload;
      const existingIndex = state.activeBids.findIndex(
        b => b.driver_id === bid.driver_id && b.req_id === bid.req_id
      );
      
      if (existingIndex >= 0) {
        state.activeBids[existingIndex] = bid;
      } else {
        state.activeBids.push(bid);
      }
    },

    // Add rider's counter offer
    addRiderBid: (state, action) => {
      const bid = action.payload;
      const existingIndex = state.riderBids.findIndex(
        b => b.driver_id === bid.driver_id && b.req_id === bid.req_id
      );
      
      if (existingIndex >= 0) {
        state.riderBids[existingIndex] = bid;
      } else {
        state.riderBids.push(bid);
      }
    },

    // Update bid status (accepted, rejected, etc.)
    updateBidStatus: (state, action) => {
      const { driver_id, req_id, status } = action.payload;
      const bidIndex = state.activeBids.findIndex(
        b => b.driver_id === driver_id && b.req_id === req_id
      );
      
      if (bidIndex >= 0) {
        state.activeBids[bidIndex].status = status;
      }
    },

    // Clear all bids
    clearAllBids: (state) => {
      state.activeBids = [];
      state.riderBids = [];
      state.driverBids = [];
    },

    // Set loading state
    setBiddingLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error state
    setBiddingError: (state, action) => {
      state.error = action.payload;
    },

    // Remove specific bid
    removeBid: (state, action) => {
      const { driver_id, req_id } = action.payload;
      state.activeBids = state.activeBids.filter(
        b => !(b.driver_id === driver_id && b.req_id === req_id)
      );
      state.riderBids = state.riderBids.filter(
        b => !(b.driver_id === driver_id && b.req_id === req_id)
      );
    },
  },
});

export const {
  addDriverBid,
  addRiderBid,
  updateBidStatus,
  clearAllBids,
  setBiddingLoading,
  setBiddingError,
  removeBid,
} = biddingSlice.actions;

export default biddingSlice.reducer;
