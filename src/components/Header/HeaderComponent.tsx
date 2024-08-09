import React, { SyntheticEvent, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, LinearProgress, Paper, createFilterOptions } from '@mui/material';
import { COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from '../../constants';
import { onFetchQuery } from '../../logics/actionHelper';
import { selectOptions } from '../../reducers/optionReducer';
import { SupplierSelector } from './SupplierSelector';
import { ComponentSelector } from './ComponentSelector';
import { MaterialSelector } from './MaterialSelector';
import style from './HeaderComponent.module.css';
import { Edge, Node } from 'vis-network';
import _ from 'lodash';
import { selectGraph, setSuppliers } from '../../reducers/graphReducer';
import { selectGremlin, setError, setQuery, } from '../../reducers/gremlinReducer';
import axios from 'axios';

interface HeaderComponentProps {
  panelWidth: number
}

export const HeaderComponent = (props: HeaderComponentProps) => {
  const { nodeLabels, nodeLimit } = useSelector(selectOptions);
  const { components, suppliers, materials } = useSelector(selectGraph);
  const dispatch = useDispatch();
  const { host, port, error } = useSelector(selectGremlin);

  useEffect(() => {
    onChange();
  }, [components, suppliers, materials])

  const onChange = () => {
    let queryToSend = '';
    let str = '';
    dispatch(setError(null));
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
        dispatch(setError(COMMON_GREMLIN_ERROR));
      });
  }


  return (
    <Box sx={{ display: 'flex', flexDirection: "column", width: `calc(100% - ${props.panelWidth}px)` }}>
      <Box className={style["header"]} sx={{ width: '100%', position: 'relative' }}>
        <Paper
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
      </Box>
      {error && <div style={{ display: 'flex', color: 'red', marginTop: '10px', marginLeft: 'auto' }}>
        {error}
      </div>}
    </Box>

  );
};
