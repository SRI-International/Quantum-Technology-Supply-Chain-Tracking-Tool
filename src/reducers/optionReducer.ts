import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../app/store';
import _ from 'lodash';
import { INITIAL_LABEL_MAPPINGS } from '../constants';
import { GraphOptions } from "../logics/utils";

export interface NodeLabel {
  type: string;
  field: string | undefined;
}

type OptionState = {
  nodeLabels: NodeLabel[];
  queryHistory: string[];
  nodeLimit: number | null;
  graphOptions: GraphOptions;
};

const initialNodeLabels: NodeLabel[] = Object.entries(INITIAL_LABEL_MAPPINGS).map(([type, field]) =>
  ({ type, field }));

const initialState: OptionState = {
  nodeLabels: initialNodeLabels,
  queryHistory: [],
  nodeLimit: null,
  graphOptions: {
    layout: 'force-directed',
    isPhysicsEnabled: true,
  }
};

const slice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setIsPhysicsEnabled: (state, action) => {
      state.graphOptions.isPhysicsEnabled = _.get(action, 'payload', true);
    },
    setLayout: (state, action) => {
      state.graphOptions.layout = action.payload
    },
    addQueryHistory: (state, action) => {
      state.queryHistory = [...state.queryHistory, action.payload];
    },
    clearQueryHistory: (state) => {
      state.queryHistory = [];
    },
    setNodeLabels: (state, action) => {
      state.nodeLabels = _.get(action, 'payload', []);
    },
    addNodeLabel: (state) => {
      state.nodeLabels = [...state.nodeLabels, { type: '', field: '' }];
    },
    editNodeLabel: (state, action) => {
      const editIndex = action.payload.id;
      const editedNodeLabel = action.payload.nodeLabel;

      if (state.nodeLabels[editIndex]) {
        state.nodeLabels = [
          ...state.nodeLabels.slice(0, editIndex),
          editedNodeLabel,
          ...state.nodeLabels.slice(editIndex + 1),
        ];
      }
    },
    removeNodeLabel: (state, action) => {
      const removeIndex = action.payload;
      if (removeIndex < state.nodeLabels.length) {
        state.nodeLabels = [
          ...state.nodeLabels.slice(0, removeIndex),
          ...state.nodeLabels.slice(removeIndex + 1),
        ];
      }
    },
    setNodeLimit: (state, action) => {
      state.nodeLimit = action.payload;
    },
  },
});

export const {
  setIsPhysicsEnabled,
  setLayout,
  addQueryHistory,
  clearQueryHistory,
  setNodeLabels,
  addNodeLabel,
  editNodeLabel,
  removeNodeLabel,
  setNodeLimit,
} = slice.actions;

export const selectOptions = (state: RootState) => state.options;
export default slice.reducer;

// export const reducer =  (state=initialState, action)=>{
//   switch (action.type){
//     case ACTIONS.SET_IS_PHYSICS_ENABLED: {
//       const isPhysicsEnabled = _.get(action, 'payload', true);
//       return { ...state, isPhysicsEnabled };
//     }
//     case ACTIONS.ADD_QUERY_HISTORY: {
//       return { ...state, queryHistory: [ ...state.queryHistory, action.payload] }
//     }
//     case ACTIONS.CLEAR_QUERY_HISTORY: {
//       return { ...state, queryHistory: [] }
//     }
//     case ACTIONS.SET_NODE_LABELS: {
//       const nodeLabels = _.get(action, 'payload', []);
//       return { ...state, nodeLabels };
//     }
//     case ACTIONS.ADD_NODE_LABEL: {
//       const nodeLabels = [...state.nodeLabels, {}];
//       return { ...state, nodeLabels };
//     }
//     case ACTIONS.EDIT_NODE_LABEL: {
//       const editIndex = action.payload.id;
//       const editedNodeLabel = action.payload.nodeLabel;

//       if (state.nodeLabels[editIndex]) {
//         const nodeLabels = [...state.nodeLabels.slice(0, editIndex), editedNodeLabel, ...state.nodeLabels.slice(editIndex+1)];
//         return { ...state, nodeLabels };
//       }
//       return state;
//     }
//     case ACTIONS.REMOVE_NODE_LABEL: {
//       const removeIndex = action.payload;
//       if (removeIndex < state.nodeLabels.length) {
//         const nodeLabels = [...state.nodeLabels.slice(0, removeIndex), ...state.nodeLabels.slice(removeIndex+1)];
//         return { ...state, nodeLabels };
//       }
//       return state;
//     }
//     case ACTIONS.SET_NODE_LIMIT: {
//       const nodeLimit = action.payload;
//       return { ...state, nodeLimit };
//     }
//     default:
//       return state;
//   }
// };
