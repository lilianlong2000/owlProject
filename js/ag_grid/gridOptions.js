/** @odoo-module **/
// import GroupRowInnerRenderer from './GroupRowInnerRenderer.js'

// console.log(data());
const init_grid_options = () => {
    const gridOptions = {
        // columnDefs: col(),
        rowHeight:32,
        rowData:[],
        defaultColDef: {
            editable: params => {
                return true
            },//单元表格是否可编辑
            // enableRowGroup: true,
            // sortable: true, //开启排序
            resizable: true,//是否可以调整列大小，就是拖动改变列大小
            filter: true,  //开启刷选
            // filter: 'agTextColumnFilter',
            // flex:1,
            // suppressMovable:true,
            lockPinned: true,
            initialWidth: 200,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        },
        suppressRowHoverHighlight:true,
        columnHoverHighlight:false,
        rowSelection: 'single', // 开启多行选择 multiple
        groupSelectsChildren: false,
        // suppressMenuHide:true,
        suppressRowClickSelection: true,
        suppressAggFuncInHeader: true,
        enableRangeSelection: true,
        enableRangeHandle: true,
        undoRedoCellEditing: false,
        // enterMovesDown: false,
        enterMovesDownAfterEdit: false,

        suppressCopyRowsToClipboard: true,
        rowMultiSelectWithClick: true,
        // suppressCellSelection: true,
        groupDisplayType: 'groupRows',
        // autoGroupColumnDef:{
        //     cellRendererParams: {
        //         footerValueGetter: params =>  {
        //             // const isRootLevel = params.node.level === -1;
        //             return `Sub Total (${params.value})`;
        //         },
        //     }
        // },
        // groupRowRendererParams: {
        //     suppressCount: true,
        //     innerRenderer: GroupRowInnerRenderer,
        //     editable:false
        // },
        groupDefaultExpanded: -1,
        // getContextMenuItems:(e) => agGridApi.getContextMenuItems(e,gridOptions),
        // editType: 'fullRow',
        onGridReady: function (params) {
            //表格创建完成后执行的事件
            // console.log('1111111111111111111111')
            // this.api.sizeColumnsToFit();//调整表格大小自适应
        },
        undoRedoCellEditingLimit: 20,
        // onCellValueChanged: (e) => agGridApi.onCellValueChanged(e,gridOptions),
        // getRowStyle: params => agGridApi.getRowStyle(params),
        // onPasteStart: params => agGridApi.onPasteStart(params),
        // paginationAutoPageSize: true, //根据网页高度自动分页（前端分页）
        overlayNoRowsTemplate:'<span>暂无数据</span>',

    };

    return gridOptions;


}


export default init_grid_options
