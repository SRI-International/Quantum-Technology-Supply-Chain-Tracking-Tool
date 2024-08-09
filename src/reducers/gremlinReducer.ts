import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../app/store';

const initialState = {
  host: 'gremlin-server',
  port: '8182',
  query: 'g.V()',
  error: null
};

const slice = createSlice({
  name: 'gremlin',
  initialState,
  reducers: {
    setHost: (state, action) => {
      state.host = action.payload;
    },
    setPort: (state, action) => {
      state.port = action.payload;
    },
    setQuery: (state, action) => {
      state.query = action.payload;
      state.error = null;
    },
    setError: (state, action) => {
      if (action.payload != null) {
        console.warn(action.payload);
      }
      state.error = action.payload;
    }
  }
});

export const { setHost, setPort, setQuery, setError } = slice.actions;
export const selectGremlin = (state: RootState) => state.gremlin;
export default slice.reducer;