// import vis from 'vis-network';
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../app/store';
import _ from 'lodash';
import { defaultNodeLabel, EdgeData, NodeData } from "../logics/utils";
import { Workspace } from '../components/Details/SettingsComponent';

type GraphState = {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNode?: NodeData;
  selectedEdge?: EdgeData;
  nodeColorMap: { [index: string]: string };
  selectorNodes: NodeData[];
  workspace: Workspace | null;
};

const initialState: GraphState = {
  nodes: [],
  edges: [],
  selectedNode: undefined,
  selectedEdge: undefined,
  nodeColorMap: {},
  selectorNodes: [],
  workspace: null
};

const slice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    clearGraph: (state) => {
      state = Object.assign({}, state);
      state.nodes = [];
      state.edges = [];
      state.selectedNode = undefined;
      state.selectedEdge = undefined;
      return state;
    },
    addNodes: (state, action) => {
      state = Object.assign({}, state);
      const newNodes = _.differenceBy(action.payload, state.nodes, (node: any) => node.id);
      state.nodes = [...state.nodes, ...newNodes];
      return state;
    },
    updateNode: (state, action) => {
      const { updateId, updatedElement } = action.payload;
      const stateNodeIndex = state.nodes.findIndex(node => node.id === updateId);
      if (stateNodeIndex !== -1) {
        state.nodes[stateNodeIndex] = { ...state.nodes[stateNodeIndex], ...updatedElement };
        state.selectedNode = updatedElement;
      } else {
        console.error("Node not found in state or updatedNodes");
      }
    },
    updateEdge: (state, action) => {
      const { updateId, updatedElement } = action.payload;
      const stateEdgeIndex = state.edges.findIndex(edge => edge.id === updateId);
      if (stateEdgeIndex !== -1) {
        state.edges[stateEdgeIndex] = { ...state.edges[stateEdgeIndex], ...updatedElement };
        state.selectedEdge = updatedElement;
      } else {
        console.error("Edge not found in state or updatedNodes");
      }
    },
    addEdges: (state, action) => {
      state = Object.assign({}, state);
      const newEdges = _.differenceBy(action.payload, state.edges, (edge: any) => `${edge.id}`);
      state.edges = [...state.edges, ...newEdges];
      return state;
    },
    setSelectedNode: (state, action) => {
      const nodeId = action.payload;
      state = Object.assign({}, state);
      if (nodeId !== null) {
        state.selectedNode = _.find(state.nodes, node => node.id == nodeId);
      }
      state.selectedEdge = undefined;
      return state;
    },
    setSelectedEdge: (state, action) => {
      const edgeId = action.payload;
      state = Object.assign({}, state);
      if (edgeId !== null) {
        state.selectedEdge = _.find(state.edges, edge => edge.id === edgeId);
      }
      state.selectedNode = undefined;
      return state;
    },
    refreshNodeLabels: (state, action) => {
      const nodeLabelMap = _.mapValues(_.keyBy(action.payload, 'type'), 'field');
      state.nodes = state.nodes.map((node: any) => {
        if (node.type in nodeLabelMap) {
          const field = nodeLabelMap[node.type];
          const label = node.properties[field];
          if (label === undefined)
            return { ...node, ...{ label: defaultNodeLabel(node) } }
          else
            return { ...node, label };
        }

        return { ...node, ...{ label: defaultNodeLabel(node) } }
      });
    },
    updateColorMap: (state, action) => {
      Object.assign(state.nodeColorMap, action.payload);
    },
    setSelectorNodes: (state, action) => {
      state.selectorNodes = action.payload;
    },
    chooseWorkspace: (state, action) => {
      state.workspace = action.payload;
    },

  },
});

export const {
  clearGraph,
  updateNode,
  updateEdge,
  addNodes,
  addEdges,
  setSelectedEdge,
  setSelectedNode,
  refreshNodeLabels,
  updateColorMap,
  setSelectorNodes,
  chooseWorkspace,
} = slice.actions;

export const selectGraph = (state: RootState) => state.graph;

export default slice.reducer;
