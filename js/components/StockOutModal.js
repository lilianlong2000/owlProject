/** @odoo-module **/
import init_grid_options from '../ag_grid/gridOptions.js'
import {formatId,keepTwoDecimal,add_stock_out_detail_id} from "../ag_grid/tool.js";
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

class StockOutModal extends Component {
    static template = xml`
    <div class="modal-backdrop fade show" t-if="props.is_open"></div>
        <!--单位转化 -->
        <div class="modal fade " id="stockOutModal" tabindex="-1">
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
                        <div t-ref="stockOutGrid" style="width: 100%;height:300px" class="ag-theme-balham myGrid Month_stock_myGrid"/>
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
        this.stockOutGrid_ref = useRef('stockOutGrid');
        this.material_purchase_unit_category = {};
        this.material_item = {};
        this.index = {};
        this.rowData = [];

        onMounted(() => {
            let _this = this;
            this.stockOutModal = new bootstrap.Modal('#stockOutModal', {
                toggle:'modal'
            });

            document.getElementById('stockOutModal').addEventListener('hidden.bs.modal', event => {
                _this.state.form = {};
                _this.env.closeStockOutModal();
            })

            this.gridOptions = Object.assign({}, init_grid_options(), {
                rowData: [],
                suppressRowClickSelection: false,
                columnDefs: [
                    {
                        headerName: '出库数量',
                        field: 'main_unit_qty',
                        menuTabs: [],
                        flex: 1,
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
                        headerName: '主单位',
                        field: 'main_unit_name',
                        menuTabs: [],
                        flex: 1,
                        editable:false,
                        cellClassRules:{
                            'bg_gray':(params)=>true
                        }
                    },
                    {
                        headerName: '客户组',
                        field: 'cus_group_id',
                        menuTabs: [],
                        width: 200,
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

            this.stockOutGrid = new agGrid.Grid(this.stockOutGrid_ref.el, this.gridOptions);
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
        this.state.headTitle = material_name + '['+date+'] 出库明细';
        let rowData = this.env.getIndex().stock_out_detail_list.filter(v=>v.material_id[0] == material_id && v.date == date);
        rowData.forEach(v=>{
            v.main_unit_name = v.main_unit_id[1];
            v.main_unit_id = v.main_unit_id[0];
            try {
                v.cus_group_id = v.cus_group_id[0];
            }catch (e) {}
        });
        this.rowData = rowData;

        this.gridOptions.api.setRowData(this.rowData);
        this.stockOutModal.show();
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
            // let main_unit_id = formatId(v.main_unit_id);
            // let actual_out_cost = v.actual_out_cost;
            // if(v.isChanged){
            //     actual_out_cost = v.main_unit_qty*this.material.avg_main_unit_price
            // }
            return {
                id: formatId(v.id),
                isChanged:v.isChanged,
                main_unit_qty:v.main_unit_qty,
                actual_out_cost:v.actual_out_cost
            }
        });
        let delIds = JSON.parse(JSON.stringify(this.state.delIds));
        await this.env.updataStockOutDetailList({date,material_id,delIds,list:data});
        // let res =
        // if(typeof (this.props.data.callback) == 'function'){
        //     if(this.state.isCheck){
        //         const selRows = this.gridOptions.api.getSelectedRows();
        //         let unit_id = formatId(selRows[0].unit_id);
        //         let unit_name = this.material_purchase_unit_category[unit_id].name;
        //         this.props.data.callback({unit_id,unit_name});
        //     }else{
        //         this.props.data.callback();
        //     }
        // }
        this.stockOutModal.hide();
    }

    checkForm(){
        this.state.msg = '';
        let rowData = this.getRowData();
        let flag = false;
        rowData.forEach(v=>{
            if(!v.main_unit_qty){
                this.state.msg = "请填写出库数量";
            }
            if(!v.cus_group_id){
                this.state.msg = "请选择客户组";
            }
        });
    }

    addRow(){
        let data = {
            id:add_stock_out_detail_id(),
            main_unit_qty:'',
            material_id:this.props.data.material_id,
            main_unit_id: this.material.main_unit_id,
            main_unit_name: this.material.main_unit_name,
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
    StockOutModal
}
