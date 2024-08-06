import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, TextField } from '@mui/material';
import { COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from '../../constants';
import { onFetchQuery } from '../../logics/actionHelper';
import { selectOptions, setLayout } from '../../reducers/optionReducer';
import _, { findLast } from 'lodash';
import { clearGraph, selectGraph } from '../../reducers/graphReducer';
import { selectGremlin } from '../../reducers/gremlinReducer';
import axios from 'axios';
import { applyLayout } from '../../logics/graph';
import { type } from 'os';
import { selectDialog } from '../../reducers/dialogReducer';
import { DIALOG_TYPES } from '../ModalDialog/ModalDialogComponent';

interface Term {
    [key: string]: string // Replace with your actual term structure
}

type QueryNode = {
    [key: string]: QueryNode[]; // A key-value map where values are Queries
} | Term; // Or it can be just a Term object


const exampleQuery: QueryNode[] = [
    { term1: 'value1' },
    {
        'OR': [
            {
                'OR': [
                    { term2: 'value2' },
                    { term3: 'value3' }
                ]
            },
            { term4: 'value4' }
        ]
    },
    { term5: 'value5' }
];

const orQuery: QueryNode[] = [
    {'OR' : [
        {term1: 'value1'},
        {term2: 'value2'}
    ]}
]

// const deeperQuery: QueryNode[] = [
//     {'OR' : [
//         {term1: 'value1'},
//         {'OR': [{term2: 'value2'}, {term4: 'value4'}], [{term3: 'value3'}, {term5: 'value5'}]}
//     ]}
// ]

const findLastORNode = (query: QueryNode[]): QueryNode | null => {
    let lastORNode: QueryNode | null = null;

    const traverse = (nodes: QueryNode[]) => {
        for (const node of nodes) {
            if (typeof node === 'object' && !Array.isArray(node)) {
                const keys = Object.keys(node);
                if (keys.includes('OR')) {
                    lastORNode = node; // Update lastORNode if 'OR' key is found
                    return;
                }
                
                // If the value of 'OR' is an array, traverse it
                if (lastORNode && Array.isArray(lastORNode['OR'])) {
                    traverse(lastORNode['OR']);
                }
            }
        }
    };

    traverse(query);
    return lastORNode;
};


export const QueryBuilder = () => {

    const processQuery = (query: QueryNode[]): string => {
        const processNode = (node: QueryNode): string => {
            if (Array.isArray(node)) {
                // node is a Query array
                return node.map(processNode).join(' AND ');
            }

            const keys = Object.keys(node);
            if (keys.length === 0) {
                return '';
            }

            const key = keys[0];
            const value = node[key];

            if (key === 'OR' && Array.isArray(value)) {
                return `(${value.map(processNode).join(' OR ')})`;
            }
            return Object.entries(node).map(([k, v]) => `${k}:${v}`).join(' ');

        };
        return query.map(node => processNode(node)).join('AND');

    };

    const insertTerm = (query: QueryNode[], term: Term, operator: 'AND' | 'OR' = 'AND'): QueryNode[] => {
        if (query.length === 0) {
            return [term];
        }
    
        if (operator === 'AND') {
            return [...query, term];
        }
    
        // For OR operator, wrap the current query and the new term into an OR clause'
        const orNode = findLastORNode(query)
        if (!orNode) {
            return [{ 'OR': [...query, term] }];
        }
        else {
            console.log(JSON.stringify(orNode));
            return [orNode];
        }

    };


    console.log(JSON.stringify(processQuery(exampleQuery)));


    const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
    const [value, setValue] = useState<string>('');

    const handleAddTerm = () => {
        // Add logic to handle adding a new term
    };

    const handleAddNode = (type: 'AND' | 'OR') => {
        // Add logic to handle adding a new node
    };

    const handleChange = (index: number, newTerm: Term) => {
        // Handle term change logic
    };

    return (<div>

    </div>)
};


// import React, { useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, TextField } from '@mui/material';
// import { COMMON_GREMLIN_ERROR, QUERY_ENDPOINT } from '../../constants';
// import { onFetchQuery } from '../../logics/actionHelper';
// import { selectOptions, setLayout } from '../../reducers/optionReducer';
// import _ from 'lodash';
// import { clearGraph, selectGraph } from '../../reducers/graphReducer';
// import { selectGremlin } from '../../reducers/gremlinReducer';
// import axios from 'axios';
// import { applyLayout } from '../../logics/graph';
// import { type } from 'os';
// import { selectDialog } from '../../reducers/dialogReducer';
// import { DIALOG_TYPES } from '../ModalDialog/ModalDialogComponent';

// type FormField = {
//     propertyName: string;
//     propertyValue: string;
//     propertyClause: string;
// };

// const CLAUSES = {
//     GREATER_THAN: '>',
//     LESS_THAN: '<',
//     GREATER_THAN_EQ : '>=',
//     LESS_THAN_EQ: '<=',
//     EQUAL: '=='
// };

// export const QueryBuilder = () => {
//     const { nodeLabels, nodeLimit } = useSelector(selectOptions);
//     const { selectorNodes } = useSelector(selectGraph);
//     const {suggestions} = useSelector(selectDialog);
//     const [error, setError] = useState<string | null>(null);
//     const dispatch = useDispatch();
//     const { host, port } = useSelector(selectGremlin);
//     const [formFields, setFormFields] = useState<FormField[]>([]);
//     const types = ["Component", "Entity", "Material"];
//     const [selectedType, setSelectedType] = React.useState("");
//     const [whereOptions, setWhereOptions] = React.useState<string[]>([]);
//     console.log(suggestions);

//     const [selectedWhereOptions, setSelectedWhereOptions] = React.useState<string[]>([]);

//     const materialNames = selectorNodes.filter(node => node.type === 'Material').map(node => node.properties.name);
//     const [selectedMaterialNames, setSelectedMaterialNames] = React.useState<string[]>([]);

//     const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
//         const { name, value } = event.target;
//         setFormFields(prevFormFields =>
//             prevFormFields.map((formField, i) =>
//                 i === index ? { ...formField, [name]: value } : formField
//             )
//         );
//     };


//     const addFields = () => {
//         let object = {
//             propertyName: '',
//             propertyValue: '',
//             propertyClause: ''
//         };
//         setFormFields([...formFields, object]);
//     };

//     const removeFields = (index: number) => {
//         let data = [...formFields];
//         data.splice(index, 1);
//         setFormFields(data);
//     };


//     const handleSelectChange = (event: SelectChangeEvent<typeof selectedType>) => {
//         const {
//             target: { value },
//         } = event;
//         setSelectedType(value);
//         setWhereOptions(suggestions[DIALOG_TYPES.NODE]?.labels[value] ?? []);
//     };

//     const handleWhereChange = (event: SelectChangeEvent<typeof selectedWhereOptions>) => {
//         const {
//             target: { value },
//         } = event;
//         setSelectedWhereOptions(
//             typeof value === 'string' ? value.split(',') : value,
//         );
//     };

//     const handleMaterialChange = (event: SelectChangeEvent<typeof selectedMaterialNames>) => {

//         const {
//             target: { value },
//         } = event;
//         setSelectedMaterialNames(
//             typeof value === 'string' ? value.split(',') : value,
//         );
//     };

//     const handleLoad = () => {
//         dispatch(clearGraph());
//         applyLayout("hierarchical");
//         dispatch(setLayout("hierarchical"));
//         let queryToSend = '';
//         let str = '';
//         setError(null);


//         if (selectedMaterialNames.length > 0) {
//             str = selectedMaterialNames.map((gr) => `'${gr}'`).join(',');
//             queryToSend = `g.V().has("Material", "name", within(${str})).emit().repeat(in())`;
//             sendRequest(queryToSend);
//         }
//     };

//     const handleClear = () => {
//         dispatch(clearGraph());
//     }

//     const sendRequest = (query: string) => {
//         axios
//             .post(
//                 QUERY_ENDPOINT,
//                 { host, port, query, nodeLimit },
//                 { headers: { 'Content-Type': 'application/json' } }
//             )
//             .then((response) => {
//                 onFetchQuery(response, query, nodeLabels, dispatch);
//             })
//             .catch((error) => {
//                 console.warn(error)
//                 setError(COMMON_GREMLIN_ERROR);
//             });
//     }
//     const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
//     const [value, setValue] = useState<string>('');

//     const handlePropertyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//         setSelectedProperty(event.target.value);
//         setValue(''); // Clear value when property changes
//     };

//     const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setValue(event.target.value);
//     };


//     return (
//         <Box sx = {{}}>
//             <Paper
//                 elevation={10}
//             >
//                 <FormControl size="small" sx = {{width : "100%"}}>
//                     <InputLabel id="component-select">SELECT</InputLabel>
//                     <Select
//                         labelId="select"
//                         value={selectedType}
//                         label="select"
//                         onChange={handleSelectChange}
//                         MenuProps={{
//                             anchorOrigin: {
//                                 vertical: 'bottom',
//                                 horizontal: 'left',
//                             },
//                             transformOrigin: {
//                                 vertical: 'top',
//                                 horizontal: 'left',
//                             },
//                             PaperProps: {
//                                 style: { maxHeight: '600px' }
//                             }
//                         }}
//                     >
//                         {types.map((name) => (
//                             <MenuItem
//                                 key={name}
//                                 value={name}
//                             >
//                                 {name}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>
//             </Paper>
//             <Paper
//                 elevation={10}
//             >
//                 <FormControl size="small" sx = {{width : "100%"}}>
//                     <InputLabel id="supplier-select">WHERE</InputLabel>
//                     <Select
//                         labelId="where-select"
//                         value={selectedWhereOptions}
//                         multiple
//                         label="where-select"
//                         onChange={handleWhereChange}
//                         MenuProps={{
//                             anchorOrigin: {
//                                 vertical: 'bottom',
//                                 horizontal: 'left',
//                             },
//                             transformOrigin: {
//                                 vertical: 'top',
//                                 horizontal: 'left',
//                             },
//                             PaperProps: {
//                                 style: { maxHeight: '600px' }
//                             }
//                         }}
//                     >
//                         {whereOptions.map((name) => (
//                             <MenuItem
//                                 key={name}
//                                 value={name}
//                             >
//                                 {name}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>
//             </Paper>
//             <Paper
//                 elevation={10}      >
//                 <FormControl size="small">
//                     <InputLabel id="material-select">Select Material</InputLabel>
//                     <Select
//                         labelId="material-select"
//                         value={selectedMaterialNames}
//                         multiple
//                         label="Select Material"
//                         onChange={handleMaterialChange}
//                         MenuProps={{
//                             anchorOrigin: {
//                                 vertical: 'bottom',
//                                 horizontal: 'left',
//                             },
//                             transformOrigin: {
//                                 vertical: 'top',
//                                 horizontal: 'left',
//                             },
//                             PaperProps: {
//                                 style: { maxHeight: '600px' }
//                             }
//                         }}
//                     >
//                         {materialNames.map((name) => (
//                             <MenuItem
//                                 key={name}
//                                 value={name}
//                             >
//                                 {name}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>
//             </Paper>

//             <br />
//             <Button
//                 variant="contained"
//                 color="primary"
//                 disabled={selectorNodes.length === 0}
//                 onClick={handleLoad}
//             >
//                 Load
//             </Button>
//             <Button
//                 variant="contained"
//                 color="primary"
//                 disabled={selectorNodes.length === 0}
//                 onClick={handleClear}
//             >
//                 Clear
//             </Button>
//             <div style={{ color: 'red' }}>{error}</div>


//             <Grid container spacing={2}>
//                 {formFields.map((form, index) => (
//                     <React.Fragment key={index}>
//                         <Grid item xs={5}>
//                             <TextField
//                                 required
//                                 margin="dense"
//                                 name="propertyName"
//                                 label="Property Name"
//                                 value={form.propertyName}
//                                 onChange={event => handleFormChange(event, index)}
//                                 fullWidth
//                                 variant="standard"
//                             />
//                         </Grid>
//                         <Grid item xs={5}>
//                             <TextField
//                                 required
//                                 margin="dense"
//                                 name="propertyValue"
//                                 label="Property Value"
//                                 value={form.propertyValue}
//                                 onChange={event => handleFormChange(event, index)}
//                                 fullWidth
//                                 variant="standard"
//                             />
//                         </Grid>
//                         <Grid item xs={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
//                             <Button onClick={() => removeFields(index)} variant="outlined" color="secondary">
//                                 Remove
//                             </Button>
//                         </Grid>
//                     </React.Fragment>
//                 ))}
//             </Grid>
//             <Grid item xs={12}>
//             <Button onClick={addFields} variant="outlined" color="primary">
//               Add More..
//             </Button>
//           </Grid>
//         </Box>
//     );
// };
