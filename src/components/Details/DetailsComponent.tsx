import {
  Fab,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Button,
  Tooltip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import React, { useState, useEffect } from "react";
import { IdType } from "vis-network";
import axios from "axios";
import { useDispatch, useSelector } from 'react-redux';
import { selectGremlin, setError } from "../../reducers/gremlinReducer";
import { selectGraph } from "../../reducers/graphReducer";
import { selectOptions } from "../../reducers/optionReducer";
import _, { add } from "lodash";
import { stringifyObjectValues } from "../../logics/utils";
import {
  COMMON_GREMLIN_ERROR,
  QUERY_ENDPOINT,
  DISABLE_NODE_EDGE_EDIT,
  QUERY_RAW_ENDPOINT,
  EDGE_ID_APPEND
} from "../../constants";
import { updateOnConfirm, onFetchQuery } from "../../logics/actionHelper";
import { EditText, EditTextarea } from 'react-edit-text';
import 'react-edit-text/dist/index.css';

type EditEvent = {
  name: string;
  value: string;
  previousValue: string;
};

export const DetailsComponent = () => {
  const dispatch = useDispatch();
  const { host, port } = useSelector(selectGremlin);
  const { selectedNode, selectedEdge } = useSelector(selectGraph);
  const { nodeLabels, nodeLimit } = useSelector(selectOptions);

  const [editField, setEditField] = useState<null | string>(null);
  const [editValue, setEditValue] = useState<null | string>(null);
  const [openAddProperty, setOpenAddProperty] = useState<boolean>(false);
  const [addPropertyName, setAddPropertyName] = useState<null | string>(null);
  const [addPropertyValue, setAddPropertyValue] = useState<null | string>(null);

  let hasSelected = false;
  let selectedType: any = null;
  let selectedId: IdType | undefined = undefined;
  let selectedProperties = null;
  let selectedHeader: string | null = null;
  if (!_.isEmpty(selectedNode)) {
    hasSelected = true;
    selectedType = _.get(selectedNode, 'type');
    selectedId = _.get(selectedNode, 'id');
    selectedProperties = _.get(selectedNode, 'properties');
    selectedProperties = stringifyObjectValues(selectedProperties);
    selectedHeader = 'Node';
  } else if (!_.isEmpty(selectedEdge)) {
    hasSelected = true;
    selectedType = _.get(selectedEdge, 'type');
    selectedId = _.get(selectedEdge, 'id');
    selectedProperties = _.get(selectedEdge, 'properties');
    selectedHeader = 'Edge';
    selectedProperties = stringifyObjectValues(selectedProperties);
  }

  useEffect(() => {
    setEditField(null);
    setEditValue(null);
  }, [selectedNode, selectedEdge]);

  /**
   * Return a number of table rows with key-value cells for object properties
   * @param data
   * @returns
   */
  function getRows(data: any) {
    if (data == null) return;
    return Object.entries(data).map(e => {

      return <TableRow>
        <TableCell style={{ width: 1, height: 1 }}><strong>{String(e[0])}</strong></TableCell>
        <TableCell>
          {!DISABLE_NODE_EDGE_EDIT ? (
            <EditText
              name={String(e[0])}
              style={{ fontSize: '14px', border: '1px solid #ccc', height: '28px', lineHeight: '28px'}}
              onSave={onConfirmEdit}
              defaultValue={String(e[1])}
              showEditButton
            />
          ) : <strong>{String(e[0])}</strong>
          }
        </TableCell>
      </TableRow>;
    });
  }

  function onTraverse(nodeId: IdType | undefined, direction: string) {
    const query = `g.V('${nodeId}').${direction}()`;
    axios
      .post(
        QUERY_ENDPOINT,
        {
          host,
          port,
          query,
          nodeLimit,
        },
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

  function updateElementProperty(name: string, value: string) {
    let query = '';
    if (selectedHeader === "Node") {
      query = `g.V('${selectedId}').property("${name}", "${value}")`;
      axios
        .post(
          QUERY_ENDPOINT,
          {
            host,
            port,
            query,
            nodeLimit,
          },
          { headers: { 'Content-Type': 'application/json' } }
        )
        .then((response) => {
          updateOnConfirm(selectedHeader, selectedId, response, query, nodeLabels);
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message || COMMON_GREMLIN_ERROR;
          dispatch(setError(errorMessage));
        });
    } else {
      query = `g.V().where(__.outE().hasId(${selectedId}))`;
      editEdgeRawQuery(name, value)
        .then(() => {
          return axios
            .post(
              QUERY_ENDPOINT,
              {
                host,
                port,
                query,
                nodeLimit,
              },
              { headers: { 'Content-Type': 'application/json' } }
            );
        })
        .then((response) => {
          updateOnConfirm(selectedHeader, selectedId, response, query, nodeLabels);
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message || COMMON_GREMLIN_ERROR;
          dispatch(setError(errorMessage));
        });
    }
  }

  async function editEdgeRawQuery(name: string, value: string) {

    const query = `g.E(${selectedId}${EDGE_ID_APPEND}).property("${name}", "${value}")`;
    try {
      const response = await axios
        .post(
          QUERY_RAW_ENDPOINT,
          {
            host,
            port,
            query,
            nodeLimit,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
      return true;
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || (error as any).message || COMMON_GREMLIN_ERROR;
      dispatch(setError(errorMessage));
      throw error;
    }
  }

  function onConfirmEdit({ name, value, previousValue }: EditEvent) {
    setEditField(null);
    setEditValue(null);
    value = value.replace(/"/g, '\\"');
    updateElementProperty(name, value)
  }

  function onConfirmAddProperty(event: { preventDefault: () => void; }) {
    event.preventDefault()
    if (addPropertyName === null || addPropertyValue === null) return;
    updateElementProperty(addPropertyName, addPropertyValue)
    onCancelAddProperty()
  }

  function onCancelAddProperty() {
    setOpenAddProperty(false)
    setAddPropertyName(null)
    setAddPropertyValue(null)
  }

  return hasSelected && (<>
        <h2>Information: {selectedHeader}</h2>
        {selectedHeader === 'Node' && (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={6} md={6}>
              <Fab
                variant="extended"
                size="small"
                onClick={() => onTraverse(selectedId, 'out')}
              >
                Traverse Out Edges
                <ArrowForwardIcon />
              </Fab>
            </Grid>
            <Grid item xs={6} sm={6} md={6}>
              <Fab
                variant="extended"
                size="small"
                onClick={() => onTraverse(selectedId, 'in')}
              >
                Traverse In Edges
                <ArrowBackIcon />
              </Fab>
            </Grid>
          </Grid>
        )}
        <Grid item xs={12} sm={12} md={12}>
          <Grid container>
            <Table aria-label="simple table">
              <TableBody>
                <TableRow key={'type'}>
                  <TableCell style={{ width: 1, height: 1 }} scope="row"><strong>Type</strong></TableCell>
                  <TableCell align="left">{String(selectedType)}</TableCell>
                </TableRow>
                <TableRow key={'id'}>
                  <TableCell style={{ width: 1, height: 1 }} scope="row"><strong>ID</strong></TableCell>
                  <TableCell align="left">{String(selectedId)}</TableCell>
                </TableRow>
                {getRows(selectedProperties)}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
        <Grid
          container
          spacing={0}
          direction="column"
          paddingTop={2}
        >
          <Button variant='contained' onClick={() => setOpenAddProperty(true)}>
            Add Property
          </Button>
        </Grid>
        <Dialog
          open={openAddProperty}
          onClose={onCancelAddProperty}
          PaperProps={{
            component: 'form',
            onSubmit: onConfirmAddProperty,
          }}>
          <DialogTitle>Add Property</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item>
                <TextField
                  autoFocus
                  required
                  margin="dense"
                  id="propertyName"
                  label="Property Name"
                  variant="standard"
                  onChange={e => setAddPropertyName(e.target.value)}
                />
              </Grid>
              <Grid item>
                <TextField
                  required
                  margin="dense"
                  id="propertyValue"
                  label="Property Value"
                  variant="standard"
                  onChange={e => setAddPropertyValue(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button variant='outlined' onClick={onCancelAddProperty}>Cancel</Button>
            <Button type='submit' variant='contained'>Add</Button>
          </DialogActions>
        </Dialog>

      </>
    ) ||
    (<Grid item xs={12} sm={12} md={12}>
      <Grid container>
        <Typography>No Nodes Selected</Typography>
      </Grid>
    </Grid>)

}