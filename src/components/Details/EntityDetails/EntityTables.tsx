import * as React from 'react';
import EntityDetailsDownstream from './EntityDetailsDownstream';
import EntityDetailsSuppliers from './EntityDetailsSuppliers';
import EntityDetailsUpstream from './EntityDetailsUpstream';
import { Divider, Grid, Typography } from '@mui/material';

export default function EntityTables() {

    return (

        <Grid sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 16px)' }}>
            <h2>Entity Details</h2>
            <Typography variant="h6" sx={{ marginTop: '0px', marginBottom: '16px' }}>
                Suppliers
            </Typography>
            <EntityDetailsSuppliers />
            <Grid item xs={12} sm={12} md={12}>
                <Divider sx={{ margin: '16px 0', borderWidth: '2px' }} />
            </Grid>
            <Typography variant="h6" sx={{ margin: '16px 0' }}>
                Component Dependencies
            </Typography>
            <EntityDetailsDownstream />

            <Grid item xs={12} sm={12} md={12}>
                <Divider sx={{ margin: '16px 0', borderWidth: '2px' }} />
            </Grid>
            <Typography variant="h6" sx={{ margin: '16px 0' }}>
                Component Inputs
            </Typography>
            <EntityDetailsUpstream />
        </Grid>
    );
}
