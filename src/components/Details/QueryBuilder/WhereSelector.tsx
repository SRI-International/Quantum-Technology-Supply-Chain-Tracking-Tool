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
import { selectGraph, setMaterials } from '../../../reducers/graphReducer';


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
    dispatch(setMaterials(typeof value === 'string' ? value.split(',') : value));
  };

  return (
    <>
      <FormControl size="small">
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
    </>
  );
}