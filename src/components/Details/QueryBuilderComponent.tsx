import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Autocomplete, Box, Button, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from '../../constants';
import { onFetchQuery } from '../../logics/actionHelper';
import { selectOptions, setLayout } from '../../reducers/optionReducer';
import _ from 'lodash';
import { clearGraph, selectGraph } from '../../reducers/graphReducer';
import { selectGremlin, setError } from '../../reducers/gremlinReducer';
import axios from 'axios';
import { applyLayout } from '../../logics/graph';
import { type } from 'os';
import { selectDialog } from '../../reducers/dialogReducer';
import { DIALOG_TYPES } from '../ModalDialog/ModalDialogComponent';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { EditText } from 'react-edit-text';
import ClearIcon from '@mui/icons-material/Clear';
import { highlightNodesAndEdges } from '../../logics/graphImpl/visImpl';
import { GRAPH_IMPL } from '../../constants';
import { addWhereField, removeWhereField, selectQueryBuilder, setClause, setPropertyName, setPropertyValue, setSelectedType } from '../../reducers/queryBuilderReducer';

//g.V().hasLabel('Vertex').or(__.has('name', 'Jill'), __.has('name', 'Bob'))


export type WhereField = {
    propertyName: string;
    whereClause: string;
    propertyValue: string;
    operator: string;
};

export const OPERATORS = {
    NONE: 'none',
    AND: 'And',
    OR: 'Or'
};
export const CLAUSES = {
    GREATER_THAN: '>',
    LESS_THAN: '<',
    GREATER_THAN_EQ: '>=',
    LESS_THAN_EQ: '<=',
    EQUAL: '=='
};


export const QueryBuilder = () => {
    const { nodeLabels, nodeLimit } = useSelector(selectOptions);
    const { suggestions } = useSelector(selectDialog);
    const dispatch = useDispatch();
    const { host, port } = useSelector(selectGremlin);
    const types = ["Component", "Entity", "Material"];
    const { selectedType, whereFields, whereOptions } = useSelector(selectQueryBuilder);


    const addFields = (operator: string) => {
        dispatch(addWhereField(operator));
    };

    const removeFields = (index: number) => {
        dispatch(removeWhereField(index));
    };


    const handleSelectChange = (event: SelectChangeEvent<typeof selectedType>) => {
        const { value } = event.target
        const selectedType = value;
        dispatch(setSelectedType({ selectedType, suggestions }))
    };

    const handleWhereChange = (event: SelectChangeEvent<string>, index: number) => {
        const { value } = event.target;
        dispatch(setPropertyName({ value, index }));
    };
    const handleClauseChange = (event: SelectChangeEvent<string>, index: number) => {
        const { value } = event.target;
        dispatch(setClause({ value, index }));
    };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const { value } = event.target;
        dispatch(setPropertyValue({ value, index }))
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let query = `g.V().hasLabel('${selectedType}')`;
        console.log(whereFields)

        whereFields.forEach((form) => {
            let expression;

            switch (form.whereClause) {
                case CLAUSES.EQUAL:
                    expression = `'${form.propertyValue}'`;
                    break;
                case CLAUSES.GREATER_THAN:
                    expression = `P.gt(${form.propertyValue})`;
                    break;
                case CLAUSES.GREATER_THAN_EQ:
                    expression = `P.gte(${form.propertyValue})`;
                    break;
                case CLAUSES.LESS_THAN:
                    expression = `P.lt(${form.propertyValue})`;
                    break;
                case CLAUSES.LESS_THAN_EQ:
                    expression = `P.lte(${form.propertyValue})`;
                    break
            }
            expression = `('${form.propertyName}', ${expression})`;

            switch (form.operator) {
                case OPERATORS.NONE:
                    query += `.has${expression}`;
                    break;
                case OPERATORS.AND:
                    query += `.and(__.has${expression})`;
                    break;
                case OPERATORS.OR:
                    query += `.or(__.has${expression})`;
                    break;
            }


        })
        console.log(buildNestedQuery(whereFields));
        dispatch(clearGraph());
        dispatch(setError(null));
        console.log(query)
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

    function buildNestedQuery(whereFields: WhereField[]): string {
        if (whereFields.length === 0) {
            return "g.V()";  // Return a base traversal string if no conditions
        }

        function convertClauseToPredicate(clause: string, value: any) {
            switch (clause) {
                case CLAUSES.GREATER_THAN:
                    return `P.gt(${JSON.stringify(value)})`;
                case CLAUSES.GREATER_THAN_EQ:
                    return `P.gte(${JSON.stringify(value)})`;
                case CLAUSES.LESS_THAN:
                    return `P.lt(${JSON.stringify(value)})`;
                case CLAUSES.LESS_THAN_EQ:
                    return `P.lte(${JSON.stringify(value)})`;
                case CLAUSES.EQUAL:
                default:
                    return JSON.stringify(value);  // For equality, the value is used directly
            }
        }

        function buildTraversal(fields: WhereField[]): string {
            if (fields.length === 0) return "";

            const firstField = fields[0];
            const restFields = fields.slice(1);

            const predicate = convertClauseToPredicate(firstField.whereClause, firstField.propertyValue);
            const currentStep = `.has('${firstField.propertyName}', ${predicate})`;

            if (firstField.operator === OPERATORS.NONE) {
                if (restFields.length === 0) {
                    return currentStep;
                } else {
                    return `${currentStep}.and(${buildTraversal(restFields)})`;
                }
            } else if (firstField.operator === OPERATORS.AND) {
                return `${currentStep}.and(${buildTraversal(restFields)})`;
            } else if (firstField.operator === OPERATORS.OR) {
                return `${currentStep}.or(${buildTraversal(restFields)})`;
            }
            return "";
        }

        return `g.V().hasLabel('Entity')${buildTraversal(whereFields)}`;
    }

    /* 
    BC: if whereFields.length == 1
    const whereFields: WhereField[] = [
    { propertyName: 'country', whereClause: CLAUSES.EQUAL, propertyValue: 'Denmark', operator: OPERATORS.OR },
    { propertyName: 'risk', whereClause: CLAUSES.EQUAL, propertyValue: 'high', operator: OPERATORS.AND },
    { propertyName: 'population', whereClause: CLAUSES.GREATER_THAN, propertyValue: 5000000, operator: OPERATORS.AND },
    { propertyName: 'stability', whereClause: CLAUSES.EQUAL, propertyValue: 'low', operator: OPERATORS.NONE },
];

looks like: g.V().hasLabel("Entity").and(AND(population > 50000, 1{(stability == low)})

base: 

    */


    const whereRow = (form: WhereField, index: number) => {
        console.log(index);
        console.log(whereFields[index])
        return (
            <Stack key={index} spacing={1} sx={{ mb: 2, width: '100%' }}>
                {whereFields[index].operator !== OPERATORS.NONE && (
                    <Typography variant="subtitle1" align="center">
                        {whereFields[index].operator}
                    </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ display: 'flex', width: "100%" }}>
                    <Paper elevation={10} sx={{ width: "40%", marginRight: 0.5, flexDirection: 'row', display: 'flex', alignItems: 'center' }}>
                        <FormControl size="small" sx={{ flex: 1, height: '100%' }}>
                            <InputLabel id="supplier-select">WHERE</InputLabel>
                            <Select
                                labelId="where-select"
                                required
                                value={whereFields[index].propertyName}
                                name="propertyName"
                                label="where-select"
                                onChange={event => handleWhereChange(event, index)}
                                sx={{ height: '100%' }}
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
                                {whereOptions.map((name) => (
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

                    <Paper elevation={10} sx={{ width: "20%", marginRight: 0.5, flexDirection: 'row', display: 'flex', alignItems: 'center' }}>
                        <FormControl size="small" sx={{ flex: 1, height: '100%' }}>
                            <InputLabel id="supplier-select">CLAUSE</InputLabel>
                            <Select
                                labelId="clause-select"
                                value={whereFields[index].whereClause}
                                name="propertyName"
                                label="clause-select"
                                required
                                onChange={event => handleClauseChange(event, index)}
                                sx={{ height: '100%' }}
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
                                {Object.entries(CLAUSES).map(([key, value]) => (
                                    <MenuItem key={key} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>
                    <FormControl size="small" sx={{ display: 'flex', width: "40%", margin: '0px' }}>
                        <TextField
                            margin="dense"
                            name="propertyValue"
                            label="Value"
                            value={form.propertyValue}
                            onChange={event => handleValueChange(event, index)}
                            fullWidth
                            sx={{
                                width: "100%", border: '1px solid #ccc',
                                borderRadius: '4px',
                                paddingBottom: '8px', margin: '0px', paddingLeft: '10px', boxSizing: 'border-box'
                            }}
                            variant="standard"

                            InputLabelProps={{
                                sx: {
                                    marginLeft: '8px'
                                }
                            }}
                        />
                    </FormControl>
                    <IconButton size="medium" onClick={() => removeFields(index)} color="secondary">
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
        )
    }

    return (
        <Box sx={{}}>
            <Paper
                elevation={10}
            >
                <FormControl size="small" sx={{ width: "100%" }}>
                    <InputLabel id="component-select">SELECT</InputLabel>
                    <Select
                        labelId="select"
                        value={selectedType}
                        label="select"
                        onChange={handleSelectChange}
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
                        {types.map((name) => (
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
            <form onSubmit={handleSubmit}>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography>WHERE</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ paddingLeft: '8px', paddingRight: '8px' }}>
                        <Grid>
                            {whereFields.map((form, index) => (
                                <React.Fragment key={index}>
                                    {whereRow(form, index)}
                                </React.Fragment>
                            ))}
                        </Grid>
                        <Grid item xs={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <Button onClick={() => addFields(OPERATORS.AND)} variant="outlined" color="secondary">
                                And
                            </Button>
                            <Button onClick={() => addFields(OPERATORS.OR)} variant="outlined" color="secondary">
                                Or
                            </Button>
                        </Grid>
                        <Button type="submit" variant="outlined" color="secondary">
                            Submit
                        </Button>
                    </AccordionDetails>
                </Accordion>
            </form>
        </Box>
    );
};
