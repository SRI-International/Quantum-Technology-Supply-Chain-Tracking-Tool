import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent } from '@mui/material';
import { COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from '../../constants';
import { onFetchQuery } from '../../logics/actionHelper';
import { selectOptions, setLayout } from '../../reducers/optionReducer';
import style from './HeaderComponent.module.css';;
import _ from 'lodash';
import { selectGremlin, setError } from '../../reducers/gremlinReducer';
import { clearGraph, selectGraph } from '../../reducers/graphReducer';
import axios from 'axios';
import { applyLayout } from '../../logics/graph';

interface HeaderComponentProps {
  panelWidth: number
}

export const HeaderComponent = (props: HeaderComponentProps) => {
  const { nodeLabels, nodeLimit } = useSelector(selectOptions);
  const { selectorNodes } = useSelector(selectGraph);
  const dispatch = useDispatch();
  const { host, port, error } = useSelector(selectGremlin);

  const componentNames = selectorNodes.filter(node => node.type === 'Component').map(node => node.properties.name);
  const [selectedComponentNames, setSelectedComponentNames] = React.useState<string[]>([]);


  const supplierNames = selectorNodes.filter(node => node.type === 'Entity').map(node => node.properties.name);
  const [selectedSupplierNames, setSelectedSupplierNames] = React.useState<string[]>([]);

  const materialNames = selectorNodes.filter(node => node.type === 'Material').map(node => node.properties.name);
  const [selectedMaterialNames, setSelectedMaterialNames] = React.useState<string[]>([]);


  const handleComponentChange = (event: SelectChangeEvent<typeof selectedComponentNames>) => {
    const {
      target: { value },
    } = event;
    setSelectedComponentNames(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleSupplierChange = (event: SelectChangeEvent<typeof selectedSupplierNames>) => {
    const {
      target: { value },
    } = event;
    setSelectedSupplierNames(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleMaterialChange = (event: SelectChangeEvent<typeof selectedMaterialNames>) => {

    const {
      target: { value },
    } = event;
    setSelectedMaterialNames(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleLoad = () => {
    dispatch(clearGraph());
    applyLayout("hierarchical");
    dispatch(setLayout("hierarchical"));
    let queryToSend = '';
    let str = '';
    dispatch(setError(null));
    if (selectedSupplierNames.length > 0) {
      str = selectedSupplierNames.map((gr) => `'${gr}'`).join(',');
      queryToSend = `g.V().has("Entity", "name", within(${str})).emit().repeat(out())`;
      sendRequest(queryToSend);
    }
    if (selectedComponentNames.length > 0) {
      str = selectedComponentNames.map((gr) => `'${gr}'`).join(',');
      queryToSend = `g.V().has("Component", "name", within(${str})).emit().repeat(in())`;
      sendRequest(queryToSend);
    }
    if (selectedMaterialNames.length > 0) {
      str = selectedMaterialNames.map((gr) => `'${gr}'`).join(',');
      queryToSend = `g.V().has("Material", "name", within(${str})).emit().repeat(in())`;
      sendRequest(queryToSend);
    }
  };

  const handleClear = () => {
    dispatch(clearGraph());
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
          <FormControl size="small" className={style['header-component-select']}>
            <InputLabel id="component-select">Select Component</InputLabel>
            <Select
              labelId="component-select"
              value={selectedComponentNames}
              multiple
              label="Select Component"
              onChange={handleComponentChange}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  style: { maxHeight: '600px' }
                }
              }}
            >
              {componentNames.map((name) => (
                <MenuItem
                  key={name}
                  value={name}
                >
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
        <Paper
          elevation={10}
          className={style['header-supplier-block']}
        >
          <FormControl size="small" className={style['header-supplier-select']}>
            <InputLabel id="supplier-select">Select Supplier</InputLabel>
            <Select
              labelId="supplier-select"
              value={selectedSupplierNames}
              multiple
              label="Select Supplier"
              onChange={handleSupplierChange}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  style: { maxHeight: '600px' }
                }
              }}
            >
              {supplierNames.map((name) => (
                <MenuItem
                  key={name}
                  value={name}
                >
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
        <Paper
          elevation={10}
          className={style['header-material-block']}
        >
          <FormControl size="small" className={style['header-material-select']}>
            <InputLabel id="material-select">Select Material</InputLabel>
            <Select
              labelId="material-select"
              value={selectedMaterialNames}
              multiple
              label="Select Material"
              onChange={handleMaterialChange}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  style: { maxHeight: '600px' }
                }
              }}
            >
              {materialNames.map((name) => (
                <MenuItem
                  key={name}
                  value={name}
                >
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
      </Box>
      {error && <div style={{ display: 'flex', color: 'red', marginTop: '10px', marginLeft: 'auto' }}>
        {error}
      </div>}
    </Box>
  );
};
