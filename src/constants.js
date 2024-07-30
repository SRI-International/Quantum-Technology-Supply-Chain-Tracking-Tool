const SERVER_URL = 'http://localhost:3001';
export const QUERY_ENDPOINT = `${SERVER_URL}/query`;
export const QUERY_RAW_ENDPOINT = `${SERVER_URL}/query-raw`;
export const WORKSPACE_ENDPOINT = `${SERVER_URL}/workspaces`;
export const COMMON_GREMLIN_ERROR = 'Invalid query. Please execute a query to get a set of vertices';

export let GRAPH_IMPL = "cytoscape" // 'vis' | 'cytoscape' | 'sigma'
export const ACTIONS = {
  SET_HOST: 'SET_HOST',
  SET_PORT: 'SET_PORT',
  SET_QUERY: 'SET_QUERY',
  SET_ERROR: 'SET_ERROR',
  SET_NETWORK: 'SET_NETWORK',
  CLEAR_GRAPH: 'CLEAR_GRAPH',
  ADD_NODES: 'ADD_NODES',
  ADD_EDGES: 'ADD_EDGES',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  SET_SELECTED_EDGE: 'SET_SELECTED_EDGE',
  SET_IS_PHYSICS_ENABLED: 'SET_IS_PHYSICS_ENABLED',
  ADD_QUERY_HISTORY: 'ADD_QUERY_HISTORY',
  CLEAR_QUERY_HISTORY: 'CLEAR_QUERY_HISTORY',
  SET_NODE_LABELS: 'SET_NODE_LABELS',
  ADD_NODE_LABEL: 'ADD_NODE_LABEL',
  EDIT_NODE_LABEL: 'EDIT_NODE_LABEL',
  REMOVE_NODE_LABEL: 'REMOVE_NODE_LABEL',
  REFRESH_NODE_LABELS: 'REFRESH_NODE_LABELS',
  SET_NODE_LIMIT: 'SET_NODE_LIMIT'
};

export const DISABLE_NODE_EDGE_EDIT = false;
export const EDGE_ID_APPEND = 'L';
/**
 * To set initial labels to override the default labels, create an entry in the mapping
 * below as per the example.
 */
export const INITIAL_LABEL_MAPPINGS = {
  Component: 'name',
  Material: 'name',
  Entity: 'name'
}

export const SAVED_QUERIES = {
  'Get materials or components only supplied by China': `g.V().and(
       in('supplies').has('country', 'China'),
       in('supplies').not(has('country', 'China')).
       count().is(eq(0))
    )`,
  'Get materials or components with at least one supplier from China': `g.V().
      or(
         repeat(in('yields')).until(in('supplies').
           has('country', 'China')),
         in('supplies').has('country', 'China')
      )`,
  'Get materials or components with only one supplier': `g.V().as('a').
        where(__.in('supplies').count().is(eq(1)))`
  // "get node with name marko" : "g.V().has('name', 'marko')",
  // "get person nodes that marko has outgoing edges to" : "g.V().has('name', 'marko').out().hasLabel('person')"
}

export const RISK_QUERY = "g.V().hasLabel('Entity').property('risk', 'low').has('country', 'China').property('risk', 'high')"
export const RISK_COLORS = {
  risk: { high: "red", medium: "yellow", low: "green" }
}

