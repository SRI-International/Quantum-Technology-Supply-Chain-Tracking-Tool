import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { selectGraph } from '../../../reducers/graphReducer';
import { useDispatch, useSelector } from 'react-redux';
import { NodeData } from '../../../logics/utils';
import { IdType } from 'vis-network';
import _ from "lodash";
import { Grid, TablePagination, TableSortLabel } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useEffect } from 'react';
import { COMMON_GREMLIN_ERROR, QUERY_ENTITY_ENDPOINT } from '../../../constants';
import axios from 'axios';
import { selectGremlin, setError } from '../../../reducers/gremlinReducer';
import { selectOptions } from '../../../reducers/optionReducer';


type RowData = {
    id: IdType
    name: string,
    level: number,
    upstreamInput: string
};
interface HeadCell {
    disablePadding: boolean;
    id: keyof RowData;
    label: string;
    numeric: boolean;
}

const headCells: readonly HeadCell[] = [
    {
        id: 'name',
        numeric: false,
        disablePadding: false,
        label: 'Component',
    },
    {
        id: 'level',
        numeric: true,
        disablePadding: false,
        label: 'level',
    },
    {
        id: 'upstreamInput',
        numeric: false,
        disablePadding: false,
        label: 'Upstream Input',
    },
];


function Row(props: { row: RowData }) {
    const { row } = props;
    const [open, setOpen] = React.useState(false);
    const upstreamInputText = Array.isArray(row.upstreamInput)
        ? row.upstreamInput.join(', ')
        : row.upstreamInput;
    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="left" component="th" scope="row">{row.name}</TableCell>
                <TableCell align="left">{row.level}</TableCell>
                <TableCell align="left">{upstreamInputText}</TableCell>
            </TableRow>
        </React.Fragment>
    );
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
        const numA = Number(aValue);
        const numB = Number(bValue);
        if (!isNaN(numA) && !isNaN(numB)) {
            if (numB < numA) {
                return -1;
            }
            if (numB > numA) {
                return 1;
            }
            return 0;
        }
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (bValue < aValue) {
            return -1;
        }
        if (bValue > aValue) {
            return 1;
        }
    }
    return 0;
}

type Order = 'asc' | 'desc';

type SortableKeys = keyof RowData;
function getComparator<Key extends SortableKeys>(
    order: Order,
    orderBy: Key,
): (
    a: { [key in Key]: any },
    b: { [key in Key]: any },
) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

interface EnhancedTableProps {
    onRequestSort: (event: React.MouseEvent<unknown>, property: SortableKeys) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}



function EnhancedTableHead(props: EnhancedTableProps) {
    const { order, orderBy, onRequestSort } =
        props;
    const createSortHandler =
        (property: SortableKeys) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property as SortableKeys);
        };

    return (
        <TableHead>
            <TableRow>
                {headCells.map((headCell, index) => (
                    <TableCell
                        key={headCell.id}
                        align="left"
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id as SortableKeys)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

export default function EntityDetailsDownstream() {
    const { nodes, edges } = useSelector(selectGraph);
    const { host, port } = useSelector(selectGremlin);
    const { nodeLimit } = useSelector(selectOptions);
    const { selectedNode } = useSelector(selectGraph);
    const [rows, setRows] = React.useState<RowData[]>([]);
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<SortableKeys>('name');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchData = async () => {
            const data = await createData(selectedNode);
            setRows(data);
        };
        fetchData();
    }, [nodes, edges, selectedNode]);

    async function createData(selected: NodeData | undefined): Promise<RowData[]> {
        const selectedId = _.get(selected, 'id');
        const queryDownstream = `
    g.withSack(0)
     .V(${selectedId})
     .repeat(__.out().sack(sum).by(constant(1)).simplePath())
     .emit()
     .filter(__.not(__.hasLabel('Entity'))) 
     .project("id", "name", "level", "upstreamInput")
     .by(__.id())
     .by(__.values("name").dedup())
     .by(__.sack())
     .by(
        __.inE().outV().values("name").fold()
     )
`;

        if (_.isEmpty(selected)) {
            return [];
        }

        try {
            const response = await axios.post(
                QUERY_ENTITY_ENDPOINT,
                {
                    host,
                    port,
                    query: queryDownstream,
                    nodeLimit,
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.data.map((node: any) => ({
                id: node.id,
                name: node.name,
                level: node.level,
                upstreamInput: node.upstreamInput
            }));
        } catch (error) {
            console.warn(error);
            dispatch(setError(COMMON_GREMLIN_ERROR));
            return [];
        }
    }

    const handleRequestSort = (
        event: React.MouseEvent<unknown>,
        property: SortableKeys,
    ) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    const visibleRows = React.useMemo(
        () =>
            rows.slice().sort(getComparator(order, orderBy)).slice(
                page * rowsPerPage,
                page * rowsPerPage + rowsPerPage,
            ),
        [order, orderBy, page, rowsPerPage, rows],
    );


    return (
        <Grid sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 16px)' }}>

            <Paper sx={{ width: '100%', overflow: 'auto', flex: 1 }}>
                <TableContainer sx={{ flex: 1 }}>
                    <Table stickyHeader aria-label="collapsible table" size="small">
                        <EnhancedTableHead
                            order={order}
                            orderBy={orderBy}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {visibleRows.map((row) => (
                                <Row key={row.id} row={row} />
                            ))}
                            {emptyRows > 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Grid>
    );
}
