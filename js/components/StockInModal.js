/** @odoo-module **/
import init_grid_options from '../ag_grid/gridOptions.js'
import {formatId,keepTwoDecimal,add_stock_in_detail_id} from "../ag_grid/tool.js";
import numberCellEditor from "../ag_grid/numberCellEditor.js";
import selectCellEditor from "../ag_grid/selectCellEditor.js";

const {
    markup,
    Component,
    onWillStart,
    useEnv,
    useSubEnv,
    useChildSubEnv,
    useRef,
    useState,
    mount,
    xml,
    whenReady,
    onMounted,
    onError,
    loadFile,
    onWillUpdateProps,
    useEffect,
    useComponent
} = owl;

class StockInModal extends Component {
    static template = xml`
    <div class="modal-backdrop fade show" t-if="props.is_open"></div>
        <!--单位转化 -->
        <div class="modal fade " id="stockInModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5">
                            <t t-esc="state.headTitle"/>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row justify-content-end mb-3">
                            <div class="col-auto">
                                <button type="button" class="btn btn-outline-primary btn-xs" t-on-click.stop="handleAddRow">添加</button>
                            </div>
                        </div>
                        <div t-ref="stockInGrid" style="width: 100%;height:300px" class="ag-theme-balham myGrid Month_stock_myGrid"/>
                    </div>
                    <div class="modal-footer">
                        <div class="text-danger" style="flex:1">
                            <t t-esc="state.msg"/>
                        </div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" t-on-click.stop="handleSubmitModel">确定</button>
                    </div>
                </div>
            </div>
        </div>      
    `;
    static props = {
        is_open: {type: Boolean,optional:true},
        data: {type: Object,optional:true}
    };

    setup() {
        this.state = useState({
            headTitle: '出库明细',
            material:{},
            form: {},
            msg: '',
            isCheck:true,
            delIds:[]
        });
        this.stockInGrid_ref = useRef('stockInGrid');
        this.material_purchase_unit_category = {};
        this.material_item = {};
        this.index = {};
        this.rowData = [];

        onMounted(() => {
            let _this = this;
            this.stockInModal = new bootstrap.Modal('#stockInModal', {
                toggle:'modal'
            });

            document.getElementById('stockInModal').addEventListener('hidden.bs.modal', event => {
                _this.state.form = {};
                _this.env.closeStockInModal();
            })

            this.gridOptions = Object.assign({}, init_grid_options(), {
                rowData: [],
                suppressRowClickSelection: false,
                columnDefs: [
                    {
                        headerName: '入库数量',
                        field: 'purchase_unit_qty',
                        menuTabs: [],
                        width: 60,
                        editable:true,
                        cellEditor:numberCellEditor,
                        cellEditorParams:(params) => {
                            return {
                                values:{
                                    decimal:true
                                }
                            };
                        },
                        type: 'editableColumn'
                    },
                    {
                        headerName: '采购单位',
                        field: 'purchase_unit_id',
                        menuTabs: [],
                        width: 60,
                        editable:true,
                        cellClassRules:{

                        },
                        cellEditor:selectCellEditor,
                        cellEditorParams:(params) => {
                            let material_id = _this.props.data.material_id;
                            let arr = _this.env.getIndex().material_unit_ratio.filter(v=>v.material_id[0] == material_id);
                            let values = arr.map(v=>{
                                return {
                                    name:v.unit_id[1],
                                    id:v.unit_id[0]

                                }
                            });
                            return {
                                values: values
                            };
                        },
                        valueFormatter:(params)=>{
                            if(!params.value){
                                return ''
                            }
                            let name = params.value;
                            try {
                                name = _this.env.getGlobal().material_purchase_unit_category[params.value].name;
                            }catch (e) {}
                            return name
                        }
                    },
                    {
                        headerName: '单价',
                        field: 'purchase_unit_price',
                        menuTabs: [],
                        flex: 1,
                        editable:true,
                        cellEditor:numberCellEditor,
                        cellEditorParams:(params) => {
                            return {
                                values:{
                                    decimal:true
                                }
                            };
                        },
                        type: 'editableColumn'
                    },
                    {
                        headerName: '客户组',
                        field: 'cus_group_id',
                        menuTabs: [],
                        flex: 1,
                        editable:true,
                        cellClassRules:{

                        },
                        cellEditor:selectCellEditor,
                        cellEditorParams:(params) => {
                            let cus_group = _this.env.getIndex().cus_group;
                            let values = cus_group.map(v=>{
                                return {
                                    name:v.name,
                                    id:v.id
                                }
                            });
                            return {
                                values: values
                            };
                        },
                        valueFormatter:(params)=>{
                            if(!params.value){
                                return ''
                            }
                            let name = params.value;
                            try {
                                name = _this.env.getGlobal().cus_group[params.value].name;
                            }catch (e) {}
                            return name
                        },
                    },
                    {
                        headerName: '供应商',
                        field: 'msupplier_id',
                        menuTabs: [],
                        flex: 1,
                        editable:true,
                        cellClassRules:{

                        },
                        cellEditor:selectCellEditor,
                        cellEditorParams:(params) => {
                            let msupplier = _this.env.getIndex().msupplier;
                            let values = msupplier.map(v=>{
                                return {
                                    name:v.supplier_nick_name,
                                    id:v.id

                                }
                            });
                            return {
                                values: values
                            };
                        },
                        valueFormatter:(params)=>{
                            if(!params.value){
                                return ''
                            }
                            let name = params.value;
                            try {
                                name = _this.env.getGlobal().msupplier[params.value].supplier_nick_name;
                            }catch (e) {}
                            return name
                        },
                    },
                ],
                context: {
                    owl_widget: _this
                },
                onCellValueChanged: (e) => {
                    // console.log(e);
                    _this.onCellValueChanged(e);
                },
                getContextMenuItems: (e) => {
                    return _this.setAGMenus(e);
                },
                stopEditingWhenCellsLoseFocus:true
            });

            this.stockInGrid = new agGrid.Grid(this.stockInGrid_ref.el, this.gridOptions);
        })

        onWillUpdateProps(nextProps => {
            // console.log(nextProps);
            if (nextProps.is_open) {
                return this.openModel(nextProps.data);
            }
        });

        this.handleAddRow = _.debounce(this.addRow,300);
        this.handleSubmitModel = _.debounce(this.submitModel,300);
    }
    onCellValueChanged(params){
        params.data.isChanged = true;
        this.checkForm();
    }
    openModel(data) {
        // let index = this.env.getIndex();
        this.state.delIds = [];
        let {material_id,date} = data;
        let material = this.env.getGlobal().material_item[material_id];
        let material_name = material.material_name;
        // console.log(material_item);
        // console.log(material_name);
        this.material = material;
        this.state.headTitle = material_name + '['+date+'] 入库明细';
        let rowData = this.env.getIndex().stock_in_detail_list.filter(v=>v.material_id[0] == material_id && v.date == date);
        rowData.forEach(v=>{
            // v.purchase_unit_name = v.purchase_unit_id[1];
            v.purchase_unit_id = v.purchase_unit_id[0];
            // v.msupplier_name = v.msupplier_id[1];
            v.msupplier_id = v.msupplier_id[0];
            try {
                v.cus_group_id = v.cus_group_id[0];
            }catch (e) {}
        });
        this.rowData = rowData;

        this.gridOptions.api.setRowData(this.rowData);
        this.stockInModal.show();
    }

    // 提交
    async submitModel() {
        let rowData = this.getRowData();
        this.checkForm();
        if (this.state.msg != '') {
            return;
        }
        let material_id = formatId(this.props.data.material_id);
        let date = this.props.data.date;
        let data = rowData.map(v=>{
            let purchase_unit_name = this.env.getGlobal().material_purchase_unit_category[v.purchase_unit_id].name ;
            let msupplier_name = this.env.getGlobal().msupplier[v.msupplier_id].supplier_nick_name;
            let cus_group_name = this.env.getGlobal().cus_group[v.cus_group_id].name;
            return {
                id: formatId(v.id),
                isChanged:v.isChanged || false,
                purchase_unit_id:[v.purchase_unit_id,purchase_unit_name],
                msupplier_id:[v.msupplier_id,msupplier_name],
                cus_group_id:[v.cus_group_id,cus_group_name],
                purchase_unit_price:v.purchase_unit_price,
                purchase_unit_qty:v.purchase_unit_qty,
            }
        });
        let delIds = JSON.parse(JSON.stringify(this.state.delIds));
        await this.env.updataStockInDetailList({date,material_id,delIds,list:data});
        this.stockInModal.hide();
    }

    checkForm(){
        this.state.msg = '';
        let rowData = this.getRowData();
        let flag = false;
        rowData.forEach(v=>{
            if(!v.purchase_unit_qty){
                this.state.msg = "请填写入库数量";
            }
            if(!v.purchase_unit_id){
                this.state.msg = "请选择采购单位";
            }
            if(!v.purchase_unit_price){
                this.state.msg = "请填写单价";
            }
            if(!v.cus_group_id){
                this.state.msg = "请选择客户组";
            }
            if(!v.msupplier_id){
                this.state.msg = "请选择供应商";
            }
        });
    }

    addRow(){
        let data = {
            id:add_stock_in_detail_id(),
            purchase_unit_qty:'',
            purchase_unit_price:this.material.avg_main_unit_price,
            material_id:this.props.data.material_id,
            purchase_unit_id: this.material.purchase_unit_id,
            msupplier_id:this.env.getIndex().default_msupplier_id,
            cus_group_id:this.env.getIndex().cus_group[0].id,
            isChanged:true
        };
        this.gridOptions.api.applyTransactionAsync({ add: [data] },(res) => {
            // this.gridOptions.api.redrawRows();
        });
    }

    removeRow(data){
        this.state.delIds.push(formatId(data.id));
        this.gridOptions.api.applyTransactionAsync({ remove: [data] },(res) => {
            this.checkForm();
        });
    }

    setAGMenus(e){
        let node = e.node || {};
        // console.log(node.rowIndex);
        if (!node.data) {
            return;
        }
        if(!e.column){
            return;
        }
        let _this = this;
        let data = node.data;
        let menus = [];
        menus.push({
            name: '删除本行',
            action: () => {
                _this.removeRow(node.data);
            },
            cssClasses: ['text-danger'],
        });
        return menus;
    }

    getRowData(id){
        let rowData = [];
        // console.log(id);
        this.gridOptions.api.forEachNode(function (node) {
            if(node.data){
                if(id){
                    node.data.id == id && (rowData.push(node.data));
                }else{
                    rowData.push(node.data);
                }
            }
        });
        // console.log(rowData);
        return rowData;
    }
}


export {
    StockInModal
}
