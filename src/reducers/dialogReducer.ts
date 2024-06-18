import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../app/store';

const initialState = {
  isDialogOpen: false,
  type: null,
  properties: {},
  x: null,
  y: null
};

const slice = createSlice({
  name: 'dialog',
  initialState,
  reducers: {
    openDialog: (state) => {
      state.isDialogOpen = true;
    },
    closeDialog: (state) => {
      state.isDialogOpen = false;
    },
    setCoordinates: (state, action) => {
      const { x, y } = action.payload;
      state.x = x;
      state.y = y;
    }

  }
});

export const { openDialog, closeDialog, setCoordinates } = slice.actions;
export const selectDialog = (state: RootState) => state.dialog;
export default slice.reducer;