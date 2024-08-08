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

type FormField = {
    propertyName: string;
    whereClause: string;
    propertyValue: string;
    operator: string;
};

const OPERATORS = {
    NONE: 'none',
    AND: 'And',
    OR: 'Or'
};
const CLAUSES = {
    GREATER_THAN: '>',
    LESS_THAN: '<',
    GREATER_THAN_EQ: '>=',
    LESS_THAN_EQ: '<=',
    EQUAL: '=='
};


export const QueryBuilder = () => {
    const { nodeLabels, nodeLimit } = useSelector(selectOptions);
    const { selectorNodes } = useSelector(selectGraph);
    const { suggestions } = useSelector(selectDialog);
    const dispatch = useDispatch();
    const { host, port } = useSelector(selectGremlin);
    const [formFields, setFormFields] = useState<FormField[]>([{ propertyName: '', whereClause: '', propertyValue: '', operator: OPERATORS.NONE }]);
    const types = ["Component", "Entity", "Material"];
    const [selectedType, setSelectedType] = React.useState("");
    const [whereOptions, setWhereOptions] = React.useState<string[]>([]);


    const addFields = (operator: string) => {
        let object = {
            propertyName: '',
            whereClause: '',
            propertyValue: '',
            operator: operator,
        };
        setFormFields([...formFields, object]);
    };

    const removeFields = (index: number) => {
        let data = [...formFields];
        data.splice(index, 1);
        setFormFields(data);
    };


    const handleSelectChange = (event: SelectChangeEvent<typeof selectedType>) => {
        const { value } = event.target
        setSelectedType(value);
        setWhereOptions(suggestions[DIALOG_TYPES.NODE]?.labels[value] ?? []);
    };

    const handleWhereChange = (event: SelectChangeEvent<string>, index: number) => {
        const { name, value } = event.target;
        setFormFields(prevFormFields =>
            prevFormFields.map((formField, i) =>
                i === index ? { ...formField, propertyName: value } : formField
            )
        );
    };
    const handleClauseChange = (event: SelectChangeEvent<string>, index: number) => {
        const { name, value } = event.target;
        setFormFields(prevFormFields =>
            prevFormFields.map((formField, i) =>
                i === index ? { ...formField, whereClause: value } : formField
            )
        );
    };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const { name, value } = event.target;
        setFormFields(prevFormFields =>
            prevFormFields.map((formField, i) =>
                i === index ? { ...formField, propertyValue: value } : formField
            )
        );
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let query = `g.V().hasLabel('${selectedType}')`;
        console.log(formFields)

        formFields.forEach((form) => {
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

            console.log(query);

        })
        
        dispatch(clearGraph());
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


    const whereRow = (form: FormField, index: number) => {
        return (
            <Stack key={index} spacing={1} sx={{ mb: 2, width: '100%' }}>
                {formFields[index].operator !== OPERATORS.NONE && (
                    <Typography variant="subtitle1" align="center">
                        {formFields[index].operator}
                    </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ display: 'flex', width: "100%" }}>
                    <Paper elevation={10} sx={{ width: "40%", marginRight: 0.5, flexDirection: 'row', display: 'flex', alignItems:'center'}}>
                        <FormControl size="small" sx={{ flex: 1, height: '100%' }}>
                            <InputLabel id="supplier-select">WHERE</InputLabel>
                            <Select
                                labelId="where-select"
                                required
                                value={formFields[index].propertyName}
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

                    <Paper elevation={10} sx={{ width: "20%", marginRight: 0.5, flexDirection: 'row', display: 'flex', alignItems:'center' }}>
                        <FormControl size="small" sx={{ flex: 1, height: '100%'}}>
                            <InputLabel id="supplier-select">CLAUSE</InputLabel>
                            <Select
                                labelId="clause-select"
                                value={formFields[index].whereClause}
                                name="propertyName"
                                label="clause-select"
                                required
                                onChange={event => handleClauseChange(event, index)}
                                sx={{ height: '100%'}}
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
                    <FormControl size="small" sx={{ display: 'flex', width: "40%", margin: '0px'}}>
                        <TextField
                            required
                            margin="dense"
                            name="propertyValue"
                            label="Value"
                            value={form.propertyValue}
                            onChange={event => handleValueChange(event, index)}
                            fullWidth
                            sx={{ width: "100%", border: '1px solid #ccc',
                                borderRadius: '4px', 
                                paddingBottom: '8px', margin: '0px', paddingLeft: '10px',boxSizing: 'border-box'}}
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
            <form onSubmit = {handleSubmit}>
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
                        {formFields.map((form, index) => (
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
