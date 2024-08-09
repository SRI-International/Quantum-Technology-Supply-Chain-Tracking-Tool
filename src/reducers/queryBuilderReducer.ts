// import vis from 'vis-network';
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../app/store';
import _ from 'lodash';
import { defaultNodeLabel, EdgeData, NodeData } from "../logics/utils";
import { Workspace } from '../components/Details/SettingsComponent';
import { CLAUSES, OPERATORS, WhereField } from '../components/Details/QueryBuilderComponent';
import { DIALOG_TYPES } from '../components/ModalDialog/ModalDialogComponent';

type QueryBuilderState = {
    selectedType: string,
    whereFields: WhereField[],
    whereOptions: string[]
};

const initialState: QueryBuilderState = {
    selectedType: "",
    whereFields: [{ propertyName: '', whereClause: CLAUSES.EQUAL, propertyValue: '', operator: OPERATORS.NONE }],
    whereOptions: []

};

const slice = createSlice({
    name: 'queryBuilder',
    initialState,
    reducers: {
        setSelectedType: (state, action) => {
            const {selectedType, suggestions} = action.payload
            state.selectedType = selectedType
            state.whereOptions = suggestions[DIALOG_TYPES.NODE]?.labels[selectedType] ?? [];
        },
        setPropertyName: (state, action) => {
            const { value, index } = action.payload
            state.whereFields = state.whereFields.map((whereField, i) =>
                    i === index ? { ...whereField, propertyName: value } : whereField
                );
        },
        setClause: (state, action) => {
            const { value, index } = action.payload
            state.whereFields = state.whereFields.map((whereField, i) =>
                    i === index ? { ...whereField, whereClause: value } : whereField
                );
        },
        setPropertyValue: (state, action) => {
            const { value, index } = action.payload
            state.whereFields = state.whereFields.map((whereField, i) =>
                    i === index ? { ...whereField, propertyValue: value } : whereField
                );
        },
        addWhereField: (state, action) => {
            const operator = action.payload
            let object = {
                propertyName: '',
                whereClause: CLAUSES.EQUAL,
                propertyValue: '',
                operator: operator,
            };
            state.whereFields = [...state.whereFields, object];
        },
        removeWhereField: (state, action) => {
            const index = action.payload;
            let data = [...state.whereFields];
            if (index == 0 && data.length > 1) {
                data[1] = {...data[1], operator: OPERATORS.NONE}
            }
            data.splice(index, 1);
            state.whereFields = data;
        },
        setWhereOptions: (state, action) => {
            const index = action.payload;
            let data = [...state.whereFields];
            data.splice(index, 1);
            state.whereFields = data;
        },





    },
});

export const {
    setSelectedType,
    setPropertyName,
    setClause,
    setPropertyValue,
    addWhereField,
    removeWhereField
} = slice.actions;

export const selectQueryBuilder = (state: RootState) => state.queryBuilder;

export default slice.reducer;
