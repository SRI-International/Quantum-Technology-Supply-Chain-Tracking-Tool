import React, { ChangeEvent } from "react";
import { Button, Grid, TextField } from "@mui/material";
import { clearGraph, setComponents, setMaterials, setSuppliers } from '../../reducers/graphReducer';
import { clearQueryHistory } from '../../reducers/optionReducer';
import { useDispatch, useSelector } from 'react-redux';
import { selectGremlin, setError, setQuery, } from '../../reducers/gremlinReducer';
import axios from "axios";
import { COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from "../../constants";
import { onFetchQuery } from "../../logics/actionHelper";
import { RootState } from "../../app/store";
import { highlightNodesAndEdges } from "../../logics/graphImpl/visImpl";
import { GRAPH_IMPL } from "../../constants";

const Query = ({ }) => {
  const dispatch = useDispatch()
  const { host, port, query } = useSelector(selectGremlin);
  const { nodeLabels, nodeLimit } = useSelector(
    (state: RootState) => state.options
  );

  function handleClearGraph() {
    dispatch(clearGraph());
    dispatch(clearQueryHistory());
    dispatch(setSuppliers([]));
    dispatch(setMaterials([]));
    dispatch(setComponents([]));
  }

  function sendQuery() {
    dispatch(setError(null));
    if (GRAPH_IMPL === 'vis') {
      highlightNodesAndEdges(null, null);
    }
    axios
      .post(
        QUERY_ENDPOINT,
        { host, port, query, nodeLimit },
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then((response) => {
        onFetchQuery(response, query, nodeLabels, dispatch);
      })
      .catch((error) => {
        console.warn(error)
        dispatch(setError(COMMON_GREMLIN_ERROR));
      });
  }

  function onQueryChanged(query: ChangeEvent<HTMLTextAreaElement>): void {
    dispatch(setQuery(query.target.value));
    return
  }

  return (
    <div>
      <form noValidate autoComplete="off">
        <TextField
          value={query}
          onChange={onQueryChanged}
          id="standard-basic"
          label="gremlin query"
          InputProps={{ style: { fontFamily: 'monospace' } }}
          style={{ width: '100%' }}
          variant="outlined"
          multiline={true}
          sx={{ fontFamily: 'monospace' }}
        />
        <Grid item xs={12} sm={12} md={12} sx={{ display: 'flex', flexWrap: 'wrap' }} >
          <Button
            variant="contained"
            color="primary"
            onClick={sendQuery.bind(this)}
            style={{ width: 'calc(50% - 10px)', flexGrow: 1, margin: '5px' }}
          >
            Execute
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearGraph.bind(this)}
            style={{ width: 'calc(50% - 10px)', flexGrow: 1, margin: '5px' }}
          >
            Clear Graph
          </Button>
        </Grid>
      </form>
    </div>);
}

export default Query