import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  view: 'list', // 'list' or 'map'
};

const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    setView: (state, action) => {
      state.view = action.payload;
    },
  },
});

export const { setView } = viewSlice.actions;
export const selectView = (state) => state.view.view;
export default viewSlice.reducer;
