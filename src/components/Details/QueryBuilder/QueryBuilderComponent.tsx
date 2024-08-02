import React, { SyntheticEvent, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, LinearProgress, Paper, createFilterOptions } from '@mui/material';

import { Edge, Node } from 'vis-network';
import _ from 'lodash';
import axios from 'axios';
import { QUERY_ENDPOINT, COMMON_GREMLIN_ERROR } from '../../../constants';
import { MaterialSelector } from './WhereSelector';
import { onFetchQuery } from '../../../logics/actionHelper';
import { applyLayout } from '../../../logics/graph';
import { selectGraph, clearGraph, setMaterials, setComponents, setSuppliers } from '../../../reducers/graphReducer';
import { selectGremlin } from '../../../reducers/gremlinReducer';
import { selectOptions, setLayout } from '../../../reducers/optionReducer';

interface HeaderComponentProps {
  panelWidth: number
}

export const HeaderComponent = (props: HeaderComponentProps) => {
  const { nodeLabels, nodeLimit, graphOptions } = useSelector(selectOptions);
  const { components, suppliers, materials, selectorNodes } = useSelector(selectGraph);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const { host, port } = useSelector(selectGremlin);

  const handleLoad = () => {
    dispatch(clearGraph());
    applyLayout("hierarchical");
    dispatch(setLayout("hierarchical"));
    let queryToSend = '';
    let str = '';
    setError(null);
    if (suppliers.length > 0) {
      str = suppliers.map((gr) => `'${gr}'`).join(',');
      queryToSend = `g.V().has("Entity", "name", within(${str})).emit().repeat(out())`;
      sendRequest(queryToSend);
    }
    if (components.length > 0) {
      str = components.map((gr) => `'${gr}'`).join(',');
      queryToSend = `g.V().has("Component", "name", within(${str})).emit().repeat(in())`;
      sendRequest(queryToSend);
    }
    if (materials.length > 0) {
      str = materials.map((gr) => `'${gr}'`).join(',');
      queryToSend = `g.V().has("Material", "name", within(${str})).emit().repeat(in())`;
      sendRequest(queryToSend);
    }
  };

  const handleClear = () => {
    dispatch(clearGraph());
    dispatch(setMaterials([]));
    dispatch(setComponents([]));
    dispatch(setSuppliers([]));
  }

  const sendRequest = (query: string) => {
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
        setError(COMMON_GREMLIN_ERROR);
      });
  }


  return (
    <Box sx={{ width: `calc(100% - ${props.panelWidth}px)`, position: 'relative' }}>
      {/* <Paper
        elevation={10}
        className={style['header-component-block']}
      >
        <ComponentSelector />
      </Paper>
      <Paper
        elevation={10}
        className={style['header-supplier-block']}
      >
        <SupplierSelector />
      </Paper>
      <Paper
        elevation={10}
        className={style['header-material-block']}
      >
        <MaterialSelector />
      </Paper>

      <br />
      <Button
        variant="contained"
        color="primary"
        disabled={selectorNodes.length === 0}
        onClick={handleLoad}
      >
        Load
      </Button>
      <Button
        variant="contained"
        color="primary"
        disabled={selectorNodes.length === 0}
        onClick={handleClear}
      >
        Clear
      </Button>
      <div style={{ color: 'red' }}>{error}</div> */}
    </Box>
  );
};