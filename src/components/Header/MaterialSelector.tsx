import React, { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import { selectGremlin } from '../../reducers/gremlinReducer';
import style from './HeaderComponent.module.css';
import { clearGraph, selectGraph, setComponents, setMaterials, setSuppliers } from '../../reducers/graphReducer';

export function MaterialSelector() {
  const dispatch = useDispatch();
  const { selectorNodes, materials } = useSelector(selectGraph);
  const names = selectorNodes.filter(node => node.type === 'Material').map(node => node.properties.name);

  const [selectedMaterialNames, setSelectedMaterialNames] = React.useState<string[]>(materials);

  const handleChange = (event: SelectChangeEvent<typeof selectedMaterialNames>) => {
    const {
      target: { value },
    } = event;
    setSelectedMaterialNames(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  
  const handleLoadComponent = () => {
    if (selectedMaterialNames.length > materials.length || !selectedMaterialNames.every((name) => materials.includes(name))) {
      dispatch(clearGraph());
      dispatch(setMaterials(selectedMaterialNames));
      console.log("cleared and set Component selector")
    }
  };
    
  const handleClear = () => {
    if (selectedMaterialNames.length > 0) {
      dispatch(clearGraph());
      setSelectedMaterialNames([])
      dispatch(setMaterials([]));
    }
  }


  return (
<>
    <FormControl size="small" className={style['header-groups-select']}>
      <InputLabel id="material-select">Select Material</InputLabel>
      <Select
        labelId="material-select"
        value={selectedMaterialNames}
        multiple
        label="Select Material"
        onChange={handleChange}
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
        {names.map((name) => (
          <MenuItem
            key={name}
            value={name}
          >
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <FormControl
    size="small"
    className={style['header-groups-load']}
  >
    <Button
      variant="contained"
      color="primary"
      disabled={names.length === 0}
      onClick={handleLoadComponent}
    >
      Load
    </Button>
    <Button
          variant="contained"
          color="primary"
          disabled={names.length === 0}
          onClick={handleClear}
        >
          Clear
        </Button>
  </FormControl>
  </>
  );
}