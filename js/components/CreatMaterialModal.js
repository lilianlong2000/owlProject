/** @odoo-module **/
import {keepTwoDecimal,formatPrice,formatId,toObj,add_material_item_bom_unit_ratio_id, add_material_item_id,isChineseStr} from "../ag_grid/tool.js";

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

class CreatMaterialModal extends Component {
    static template = xml`
    <!-- 创建菜品所需食材 Modal -->
        <div class="modal fade" id="CreatMaterialModal">
            <div class="modal-dialog modal-lg  modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <t t-if="props.is_edit">食材详情</t>
                            <t t-if="!props.is_edit">创建菜品所需食材</t>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                     <div class="modal-body">
                        <div class="mb-3 row">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                食材名称
                            </label>
                            <div class="col-sm-2">
                                <input t-if="props.is_edit" disabled="true" type="text" placeholder="食材名称" class="form-control" t-model="state.creatForm.mname" t-on-change="inputOnChange"/>
                                <input t-if="!props.is_edit" type="text" placeholder="食材名称" class="form-control" t-model="state.creatForm.mname" t-on-change="inputOnChange"/>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                形态类别
                            </label>
                            <div class="col-sm-2" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.form" t-on-change="inputOnChange">
                                    <option value="" name="form">请选择</option>
                                    <t t-foreach="form" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="form">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                食材类别
                            </label>
                            <div class="col-sm-2" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.phase" t-on-change="inputOnChange">
                                    <option value="" name="phase">请选择</option>
                                    <t t-foreach="phaseArr" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="phase">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                        </div>
                        <div class="mb-3 row">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                食材分类
                            </label>
                            <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.top_category_id" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="index.material_top_category" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <!--<label class="col-auto col-form-label text-right">-->
                                <!--<span class="text-danger" style="margin-right: 4px;">*</span>-->
                                <!--切配-->
                            <!--</label>-->
                            <!--<div class="col-sm-2" t-if="props.is_open">-->
                                <!--<select class="form-select" t-model="state.creatForm.default_process_id" t-on-change="inputOnChange">-->
                                    <!--<option value="" name="default_process_id">请选择</option>-->
                                    <!--<t t-foreach="index.dish_process_category" t-as="v" t-key="v_index">-->
                                        <!--<option t-att-value="v.id" name="default_process_id">-->
                                            <!--<t t-esc="v.name"/>-->
                                        <!--</option>-->
                                    <!--</t>-->
                                <!--</select>-->
                            <!--</div>-->
                        </div>
                        <div class="pb-2 fw-bold mb-3 border-bottom">价格单位</div>
                        <div class="mb-3 row">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                主单位
                            </label>
                            <div class="col-sm-2" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.main_unit_id" t-on-change="inputOnChange" t-if="state.is_virtual">
                                    <option value="" name="main_unit_id">请选择</option>
                                    <t t-foreach="index.material_purchase_unit_category" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="main_unit_id">
                                            <t t-esc="v.name"/>
                                        </option>
                                    </t>
                                </select>
                                <select class="form-select" t-model="state.creatForm.main_unit_id" t-on-change="inputOnChange" disabled="true" t-if="!state.is_virtual">
                                    <option value="" name="main_unit_id">请选择</option>
                                    <t t-foreach="index.material_purchase_unit_category" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="main_unit_id">
                                            <t t-esc="v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                主单位价格
                            </label>
                            <div class="col-sm-3">
                                <input type="number"  min="0" placeholder="价格" class="form-control" t-model="state.creatForm.main_price" t-on-change="inputOnChange"/>
                            </div>
                        </div>
                        <!--添加-->
                        <div class="mb-3 row" t-if="!props.is_edit">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                采购单位
                            </label>
                            <div class="col-sm-2" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.purchase_unit_id" t-on-change="inputOnChange">
                                    <option value="" name="purchase_unit_id">请选择</option>
                                    <t t-foreach="index.material_purchase_unit_category" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="purchase_unit_id">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                主单位/采购单位转化比
                            </label>
                            <div class="col-sm-3">
                                <input type="number" placeholder="单位转化比" class="form-control" t-model="state.creatForm.main_unit_bom_unit_ratio" t-on-change="inputOnChange" min="0"/>
                            </div>
                        </div>
                        <!--编辑-->
                        <div class="mb-3 row" t-if="props.is_edit">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                采购单位
                            </label>
                            <div class="col-sm-2" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.purchase_unit_id" t-on-change="inputOnChange">
                                    <option value="" name="purchase_unit_id">请选择</option>
                                    <t t-foreach="state.unitList" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="purchase_unit_id">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                        </div>
                        <!--weight_ratio-->
                        <!--volume_ratio-->
                        <div class="mb-3 row" t-if="state.isOtherRatio">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                主单位/斤
                            </label>
                            <div class="col-sm-3">
                                <input type="number" placeholder="" class="form-control" t-model="state.creatForm.weight_ratio" t-on-change="inputOnChange" min="0"/>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                主单位/升
                            </label>
                            <div class="col-sm-3">
                                <input type="number" placeholder="" class="form-control" t-model="state.creatForm.volume_ratio" t-on-change="inputOnChange" min="0"/>
                            </div>
                        </div>
                        <div class="pb-2 fw-bold mb-3 border-bottom">采购</div>
                        <div class="mb-3 row">
                           <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                采购频次
                            </label>
                            <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.purchase_freq" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="index.purchase_category" t-as="v" t-key="v_index">
                                        <option t-att-value="v.name">
                                            <t t-esc=" v.name_cn"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <label class="col-auto col-form-label text-right" t-att-style="state.creatForm.purchase_freq != 'day'?'display:none':''">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                提前
                            </label>
                            <div class="col-auto" t-att-style="state.creatForm.purchase_freq != 'day'?'display:none':''">
                                <select class="form-select" name="plan_day_purchase_ahead_days" t-model="state.creatForm.plan_day_purchase_ahead_days" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                </select>
                                <!--<input type="number" min="0" placeholder="数字" class="form-control" t-model="state.creatForm.plan_day_purchase_ahead_days" t-on-change="inputOnChange" style="width: 100px !important;"/>-->
                            </div>
                             <label class="col-auto col-form-label" t-att-style="state.creatForm.purchase_freq != 'day'?'display:none':''">
                                天下单
                            </label>
                        </div>
                        
                        <!--<div class="mb-3 row">-->
                            <!--<label class="col-auto col-form-label text-right">-->
                                <!--<span class="text-danger" style="margin-right: 4px;">*</span>-->
                                <!--食材分类-->
                            <!--</label>-->
                            <!--<div class="col" t-if="props.is_open">-->
                                <!--<div class="col-form-label">-->
                                    <!--<div class="form-check form-check-inline" t-foreach="index.material_top_category" t-as="v" t-key="v_index">-->
                                        <!--<input class="form-check-input" type="radio" t-att-value="v.id" t-model="state.creatForm.top_category_id" name="top_category_id" t-on-click="radioClick"/>-->
                                        <!--<label class="form-check-label">-->
                                            <!--<t t-esc="v.name"/>-->
                                        <!--</label>-->
                                    <!--</div>-->
                                <!--</div>-->
                            <!---->
                            <!--</div>-->
                        <!--</div>-->
                        <div class="mb-3 row">
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                采购分类
                            </label>
                            <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.purchase_category_id" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="index.material_purchase_category" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                成本类别
                            </label>
                            <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.daily_cost_category_id" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="daily_cost_category_arr" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id">
                                            <t t-esc="v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                        </div>
                        <div class="mb-3 row">
                           <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                切配单进位
                           </label>
                           <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.cutlist_qty_adjust" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="adjust_arr" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id">
                                            <t t-esc="v.name"/>
                                        </option>
                                    </t>
                                </select>
                           </div>
                           <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                采购进位
                           </label>
                           <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.purchase_qty_adjust" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="adjust_arr" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id">
                                            <t t-esc="v.name"/>
                                        </option>
                                    </t>
                                </select>
                           </div>
                        </div>

                        <div class="mb-3 row">
                            <!--<label class="col-auto col-form-label text-right">-->
                                <!--<span class="text-danger" style="margin-right: 4px;">*</span>-->
                                <!--采购草稿至-->
                            <!--</label>-->
                            <!--<div class="col-sm-3" t-if="props.is_open">-->
                                <!--<select class="form-select" t-model="state.creatForm.purchase_first_to" t-on-change="inputOnChange">-->
                                    <!--<option value="">请选择</option>-->
                                    <!--<t t-foreach="purchase_first_to_list" t-as="v" t-key="v_index">-->
                                        <!--<option t-att-value="v.id">-->
                                            <!--<t t-esc="v.name"/>-->
                                        <!--</option>-->
                                    <!--</t>-->
                                <!--</select>-->
                            <!--</div>-->
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                首选供应商
                            </label>
                            <div class="col-sm-5" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.default_msupplier_id" t-on-change="inputOnChange">
                                    <option value="" name="default_msupplier_id">请选择</option>
                                    <t t-foreach="state.msupplierList" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id" name="default_msupplier_id">
                                            <t t-esc="v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                        </div>
                        <div class="pb-2 fw-bold mb-3 border-bottom">仓管</div>
                        <div class="mb-3 row">
                           <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                出库类型
                            </label>
                            <div class="col-sm-3" t-if="props.is_open">
                                <select class="form-select" t-model="state.creatForm.in_out_way" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <t t-foreach="in_out_way_arr" t-as="v" t-key="v_index">
                                        <option t-att-value="v.id">
                                            <t t-esc=" v.name"/>
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <label class="col-auto col-form-label text-right">
                                <span class="text-danger" style="margin-right: 4px;">*</span>
                                提前
                            </label>
                            <div class="col-auto">
                                <select class="form-select" name="out_days_ahead" t-model="state.creatForm.out_days_ahead" t-on-change="inputOnChange">
                                    <option value="">请选择</option>
                                    <option value="0">0（当天发料）</option>
                                    <option value="-1">1</option>
                                    <option value="-2">2</option>
                                </select>
                            </div>
                             <label class="col-auto col-form-label">
                                天发料
                            </label>
                        </div>

                            <!--<div class="col" t-if="props.is_open">-->
                                <!--<div class="col-form-label">-->
                                    <!--<div class="form-check form-check-inline" t-foreach="index.purchase_category" t-as="v" t-key="v_index">-->
                                        <!--<input class="form-check-input" type="radio" t-att-value="v.name" t-model="state.creatForm.purchase_freq" name="purchase_freq" t-on-click="radioClick"/>-->
                                        <!--<label class="form-check-label">-->
                                            <!--<t t-esc="v.name_cn"/>-->
                                        <!--</label>-->
                                    <!--</div>-->
                                <!--</div>-->
                            <!--</div>-->
                        
                     </div>
                    <div class="modal-footer">
                        <div class="text-danger" style="flex:1">
                            <t t-esc="state.msg"/>
                        </div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <!--<button t-if="props.is_edit" type="button" class="btn btn-secondary" t-on-click.stop="handleOpenUnitRatioModal">单位转化比</button> -->
                        <button type="button" class="btn btn-primary" t-on-click.stop="handleSubmitModel" t-att-disabled="state.btnDisabled">
                            <t t-if="props.is_edit">确定修改</t>
                            <t t-if="!props.is_edit">确定创建</t>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    static props = {
        is_open: {type: Boolean,optional:true},
        is_edit: {type: Boolean,optional:true},
        data: {type: Object,optional:true},
    };

    setup() {
        this.form = [
            {id:'冻品',name:'冻品'},
            {id:'鲜品',name:'鲜品'},
            {id:'干货',name:'干货'},
            {id:'其他',name:'其他'},
            {id:'常温',name:'常温'},
            {id:'腌制',name:'腌制'},
            {id:'水发',name:'水发'},
        ];
        this.phaseArr = [
            {id:'p1_material',name:'食材'},
            {id:'p2_semi_dish',name:'半成品'},
            {id:'p3_dish',name:'成品'},
            {id:'p4_non_mm',name:'非食材'},
            {id:'p5_package',name:'套餐'},
        ];
        this.phase = toObj(this.phaseArr,'id');
        this.purchase_first_to_list = [
            {id:'to_purchase',name:'采购'},
            {id:'to_supplier',name:'供应商'},
        ];
        this.in_out_way_arr = [
            {id:'by_application',name:'领料单出库'},
            {id:'by_usage_deduct',name:'盘点出库'},
            {id:'by_in_out',name:'即入即出'},
            {id:'others',name:'理论出库'},
        ];
        this.adjust_arr = [
            {id:'pqa1_keep',name:'不调整'},
            {id:'pqa1_ceil',name:'向上进位'},
            {id:'pqa1_5',name:'按5进位'},
            {id:'pqa1_10',name:'按10进位'},
        ];
        this.state = useState({
            isOtherRatio:false,
            creatForm: {
                mname:'',
                form:'',
                phase:'',
                main_unit_id:'',
                purchase_unit_id:'',
                main_unit_bom_unit_ratio:'',
                default_process_id:'',
                main_price:'',
                top_category_id:'',
                purchase_category_id:'',
                plan_day_purchase_ahead_days:'',
                purchase_freq:'',
                daily_cost_category_id:'',
                default_msupplier_id:'',
                purchase_first_to:'',
                in_out_way:'',
                out_days_ahead:'',
                weight_ratio:'',
                volume_ratio:'',
                cutlist_qty_adjust:'',
                purchase_qty_adjust:'',
            },
            btnDisabled:false,
            msg: '',
            unitList:[],
            is_virtual:false,
            msupplierList:[]
        });
        this.index = {};//purchase_category  material_purchase_unit_category  dish_process_category
        this.material = {};
        this.daily_cost_category_arr = [];
        // bom_unit_ratio_ids:[]
        // form
        // id
        // is_auto_in_plan_day_material
        // is_po_5_10
        // is_po_10
        // main_price
        // main_unit_id
        // material_price_alert
        // name
        // phase
        // plan_day_purchase_ahead_days
        // purchase_category_id
        // purchase_freq
        // repeat_tag
        // stock_qty
        // top_category_id


        // material_item_bom_unit_ratio.json
        // id
        // main_unit_bom_unit_ratio
        // material_id
        // purchase_unit_id
        onMounted(() => {
            let _this = this;
            this.modal = new bootstrap.Modal('#CreatMaterialModal', {});
            document.getElementById('CreatMaterialModal').addEventListener('hidden.bs.modal', event => {
                _this.env.closeCreatMaterialModal();
            })
        })

        onWillUpdateProps(nextProps => {
            // console.log(nextProps);
            if (nextProps.is_open) {
                // console.log(this.index.material_top_category);
                return this.openModel(nextProps);
            }
        });

        this.handleSubmitModel = _.debounce(this.submitModel,300);
        this.handleOpenUnitRatioModal = _.debounce(this.openUnitRatioModal,300);
    }

    // 打开弹窗 赋值
    openModel(props) {
        let d = props.data || {};
        console.log('-------openModel---------');
        this.index = JSON.parse(JSON.stringify(this.env.getIndex()));
        this.daily_cost_category_arr = this.index.daily_cost_category.filter(v=>v.is_active);

        let daily_cost_category_obj = toObj(this.index.daily_cost_category,'id');
        let msupplierList = this.index.msupplier.map(v=>{
            let cost_category_name = daily_cost_category_obj[v.cost_category_id[0]].name;
            return {
                id:v.id,
                name:cost_category_name+'-'+v.supplier_nick_name,
                cost_category_id:v.cost_category_id[0],
            }
        });
        msupplierList = msupplierList.sort((a,b)=>{ return a.cost_category_id[0] - b.cost_category_id[0]});
        this.state.msupplierList = msupplierList;
        // console.log(JSON.parse(JSON.stringify(d)));

        let flag = true;

        if(props.is_edit){
            //编辑
            d.id = formatId(d.id);
            let material =  this.index.material_item.find(v=>v.id == d.id);
            console.assert(material,'找不到该食材')
            this.material = JSON.parse(JSON.stringify(material));
            this.state.creatForm.mname = material.name.split('-')[0];
            this.state.creatForm.form = material.form;
            this.state.creatForm.phase = material.phase;
            this.state.creatForm.main_unit_id = material.main_unit_id;
            this.state.creatForm.purchase_unit_id = material.purchase_unit_id || '';
            this.state.creatForm.main_unit_bom_unit_ratio = this.env.getMainUnitBomUnitRatio(material.id,material.purchase_unit_id);
            this.state.creatForm.default_process_id = material.default_process_id || '';
            this.state.creatForm.main_price = material.main_price;
            this.state.creatForm.top_category_id = material.top_category_id;
            this.state.creatForm.purchase_category_id = material.purchase_category_id;
            this.state.creatForm.purchase_freq = material.purchase_freq;
            this.state.creatForm.plan_day_purchase_ahead_days = material.plan_day_purchase_ahead_days.replace('-','');
            this.state.creatForm.daily_cost_category_id = material.daily_cost_category_id;
            this.state.creatForm.default_msupplier_id = material.default_msupplier_id;
            this.state.creatForm.purchase_first_to = material.purchase_first_to || '';
            this.state.creatForm.in_out_way = material.in_out_way || '';
            this.state.creatForm.out_days_ahead = material.out_days_ahead || '0';

            this.state.creatForm.volume_ratio = material.volume_ratio||'';
            this.state.creatForm.weight_ratio = material.weight_ratio||'';

            this.state.creatForm.cutlist_qty_adjust = material.cutlist_qty_adjust||'';
            this.state.creatForm.purchase_qty_adjust = material.purchase_qty_adjust||'';

            this.setUnitList();

            if((d.id+'').startsWith('virtual')){
                this.state.is_virtual = true;
            }else{
                this.state.is_virtual = false;
            }

            let _material_purchase_unit_category = this.index.material_purchase_unit_category.filter(v=>v.name == '两'|| v.name == '克').map(v=>v.id);
            if(_material_purchase_unit_category.includes(material.main_unit_id)){
                flag = false;
            }
        }else{
            // 创建
            this.material = {};
            this.state.creatForm.mname = d.name || '';
            this.state.creatForm.form='鲜品';
            this.state.creatForm.phase='p1_material';
            this.state.creatForm.main_unit_id = 9;
            this.state.creatForm.purchase_unit_id = 9;
            this.state.creatForm.main_unit_bom_unit_ratio = 1;
            this.state.creatForm.default_process_id = 14;
            this.state.creatForm.main_price = '';
            this.state.creatForm.top_category_id = 1;

            let purchase_category = this.index.material_purchase_category.find(v=>v.name=='鲜肉');
            let purchase_category_id = '';
            if(purchase_category){
                purchase_category_id = purchase_category.id
            }else{
                purchase_category_id = this.index.material_purchase_category[0].id;
            }
            this.state.creatForm.purchase_category_id = purchase_category_id;

            this.state.creatForm.purchase_freq = 'day';
            this.state.creatForm.plan_day_purchase_ahead_days = '1';

            let daily_cost_category_id = this.index.daily_cost_category[0].id;
            this.state.creatForm.daily_cost_category_id = daily_cost_category_id;

            let default_msupplier = this.index.msupplier.find(v=>v.supplier_nick_name.endsWith('_自购'));
            let default_msupplier_id = '';
            default_msupplier && (default_msupplier_id = default_msupplier.id);
            this.state.creatForm.default_msupplier_id = default_msupplier_id;

            this.state.creatForm.purchase_first_to = 'to_purchase';

            this.state.creatForm.in_out_way = 'by_application';
            this.state.creatForm.out_days_ahead = '0';

            this.state.creatForm.volume_ratio = '';
            this.state.creatForm.weight_ratio = '';

            this.state.creatForm.cutlist_qty_adjust = 'pqa1_keep';
            this.state.creatForm.purchase_qty_adjust = 'pqa1_keep';


            this.state.is_virtual = true;
        }

        if(flag){
            this.index.material_purchase_unit_category = this.index.material_purchase_unit_category.filter(v=>v.name != '两'&& v.name != '克');
        }

        this.state.btnDisabled = false;
        this.state.msg = '';

        this.isOtherRatio();
        this.modal.show();
    }

    isOtherRatio(){
        let _jin = this.index.material_purchase_unit_category.find(v=>v.name == '斤');
        let _sheng =  this.index.material_purchase_unit_category.find(v=>v.name == '升');
        try {
            let flag = this.state.creatForm.purchase_unit_id == _jin.id || this.state.creatForm.purchase_unit_id == _sheng.id;
            let flag2 = this.state.creatForm.main_unit_id == _jin.id || this.state.creatForm.main_unit_id == _sheng.id;
            // console.log(flag);
            // console.log(flag2);
            if(flag || flag2){
                this.state.isOtherRatio = false;
            }else{
                this.state.isOtherRatio = true;
            }
        }catch (e) {
            this.state.isOtherRatio = true;
        }
    }

    openUnitRatioModal(){
        let material_id = this.props.data.id;
        this.env.openUnitRatioModal({
            material_id:material_id,
            action:'edit'
        },()=>{
            this.setUnitList();
        })
    }

    setUnitList(){
        let material_id = this.material.id;
        if(material_id){
            let material_item_unit_ratio = this.env.getIndex().material_unit_ratio.filter(v=>v.material_id[0] == material_id);
            let ids = material_item_unit_ratio.map(v=>v.unit_id[0]);
            let list = this.env.getIndex().material_purchase_unit_category.filter(v=>ids.includes(v.id));
            this.state.unitList = list;
        }else{
            this.state.unitList = [];
        }
    }

    // 提交
    async submitModel() {
        this.checkForm();
        if (this.state.msg != '') {
            return false
        }
        let newMaterial = JSON.parse(JSON.stringify(this.material));
        Object.assign(newMaterial,this.state.creatForm);
        // console.log(this);
        console.log('食材提交...');
        console.log(newMaterial);

        let phaseName = this.phase[newMaterial.phase].name;

        newMaterial.default_process_id = formatId(newMaterial.default_process_id);
        newMaterial.main_unit_id = formatId(newMaterial.main_unit_id);
        newMaterial.purchase_unit_id = formatId(newMaterial.purchase_unit_id);
        newMaterial.top_category_id = formatId(newMaterial.top_category_id);
        newMaterial.purchase_category_id = formatId(newMaterial.purchase_category_id);
        if(newMaterial.purchase_freq != 'day'){
            newMaterial.plan_day_purchase_ahead_days = '-1';
        }else{
            newMaterial.plan_day_purchase_ahead_days = '-'+newMaterial.plan_day_purchase_ahead_days;
        }

        newMaterial.daily_cost_category_id = formatId(newMaterial.daily_cost_category_id);
        newMaterial.default_msupplier_id = formatId(newMaterial.default_msupplier_id);

        newMaterial.name = `${newMaterial.mname}-${newMaterial.form}-${phaseName}`;

        if(newMaterial.weight_ratio+'' != ''){
            newMaterial.weight_ratio = Number(newMaterial.weight_ratio);
        }
        if(newMaterial.volume_ratio+'' != ''){
            newMaterial.volume_ratio = Number(newMaterial.volume_ratio);
        }

        if(this.props.is_edit){
            newMaterial.unit_ratio_list = [];
        }else{
            newMaterial.id = add_material_item_id();
            newMaterial.unit_ratio_list = [{
                id: add_material_item_bom_unit_ratio_id(),
                unit_ratio:Number(newMaterial.main_unit_bom_unit_ratio),
                unit_id: newMaterial.purchase_unit_id
            }];
            if(newMaterial.purchase_unit_id != newMaterial.main_unit_id){
                newMaterial.unit_ratio_list.push({
                    id: add_material_item_bom_unit_ratio_id(),
                    unit_ratio: 1,
                    unit_id: newMaterial.main_unit_id
                })
            }
        }

        delete newMaterial.bom_unit_ratio_ids;
        // delete newMaterial.purchase_unit_id;
        delete newMaterial.main_unit_bom_unit_ratio;

        this.state.btnDisabled = true;
        try {
            let res = await this.env.addMaterialAsync(newMaterial,this.props.is_edit);
            console.log('---addMaterialAsync----');
            // console.log(res);
            if(typeof (this.props.data.callback) == 'function'){
                this.props.data.callback(res);
            }
            this.modal.hide();
        }catch (e) {
            console.log('食材创建失败...');
            let name = e.data.name;
            let msg = e.data.message;
            let message = ` ${name} -> ${msg}  `
            window.confirm(message);

            this.state.btnDisabled = false;
        }
    }

    inputOnChange(e) {
        this.isOtherRatio();
        this.checkForm();
    }

    radioClick(e){
        this.checkForm();
    }

    checkForm() {
        let mname = this.state.creatForm.mname.trim();
        this.state.creatForm.mname = mname;
        let main_price = this.state.creatForm.main_price;
        this.state.creatForm.main_price = formatPrice(main_price);

        let plan_day_purchase_ahead_days = this.state.creatForm.plan_day_purchase_ahead_days;
        // plan_day_purchase_ahead_days = (plan_day_purchase_ahead_days+'').replace('-','');
        // plan_day_purchase_ahead_days =  typeof parseInt(this.state.creatForm.plan_day_purchase_ahead_days) == 'number'?parseInt(this.state.creatForm.plan_day_purchase_ahead_days):''
        // this.state.creatForm.plan_day_purchase_ahead_days = plan_day_purchase_ahead_days;

        if (mname == '') {
            this.state.msg = '请填写食材名称';
            return;
        }
        if(!isChineseStr(mname)){
            this.state.msg = '食材名称只能是中文';
            return;
        }
        if (!this.state.creatForm.form) {
            this.state.msg = '请选择形态类别';
            return;
        }
        if (!this.state.creatForm.phase) {
            this.state.msg = '请选择食材类别';
            return;
        }
        let phaseName = this.phase[this.state.creatForm.phase].name;
        if(!this.props.is_edit && this.getMaterialByFullname(`${mname}-${this.state.creatForm.form}-${phaseName}`)){
            this.state.msg = '已有该食材';
            return;
        }
        if (!this.state.creatForm.main_unit_id) {
            this.state.msg = '请选择主单位';
            return;
        }
        if (!main_price) {
            this.state.msg = '请填写主单位价格';
            return;
        }
        if (!this.state.creatForm.purchase_unit_id) {
            this.state.msg = '请选择采购单位';
            return;
        }
        let radio = this.env.getWeightRatio(this.state.creatForm.main_unit_id,this.state.creatForm.purchase_unit_id);
        if(!this.props.is_edit &&  radio!= 0){
            this.state.creatForm.main_unit_bom_unit_ratio = radio;
        }
        let main_unit_bom_unit_ratio = Number(this.state.creatForm.main_unit_bom_unit_ratio);
        if (!this.props.is_edit && !main_unit_bom_unit_ratio) {
            this.state.msg = '请填写单位转化比';
            return;
        }
        if(!this.props.is_edit && main_unit_bom_unit_ratio <= 0){
            this.state.msg = '单位转化比需大于0';
            return;
        }

        if(this.state.isOtherRatio){
            let weight_ratio  = Number(this.state.creatForm.weight_ratio);
            let volume_ratio = Number(this.state.creatForm.volume_ratio);
            if(weight_ratio +'' == 'NaN'){
                this.state.msg = '主单位/斤 为数字';
                return;
            }
            if(volume_ratio+'' == 'NaN'){
                this.state.msg = '主单位/升为数字';
                return;
            }
            if(!(weight_ratio > 0 || volume_ratio>0)){
                this.state.msg = '主单位/斤、 主单位/升，至少一个必须大于0';
                return;
            }
        }

        if (!this.state.creatForm.top_category_id) {
            this.state.msg = '请选择食材分类';
            return;
        }
        // if (!this.state.creatForm.default_process_id) {
        //     this.state.msg = '请选择切配';
        //     return;
        // }
        if (!this.state.creatForm.purchase_freq) {
            this.state.msg = '请选择采购频次';
            return;
        }
        if(!plan_day_purchase_ahead_days && this.state.creatForm.purchase_freq == 'day'){
            this.state.msg = '请选择提前几天下单';
            return;
        }
        if (!this.state.creatForm.purchase_category_id) {
            this.state.msg = '请选择采购分类';
            return;
        }
        if (!this.state.creatForm.daily_cost_category_id) {
            this.state.msg = '请选择成本类别';
            return;
        }
        // if (!this.state.creatForm.purchase_first_to) {
        //     this.state.msg = '请选择采购草稿至';
        //     return;
        // }
        if (!this.state.creatForm.cutlist_qty_adjust) {
            this.state.msg = '请选择切配单进位';
            return;
        }
        if (!this.state.creatForm.purchase_qty_adjust) {
            this.state.msg = '请选择采购单进位';
            return;
        }
        if (!this.state.creatForm.default_msupplier_id) {
            this.state.msg = '请选择首选供应商';
            return;
        }
        if (!this.state.creatForm.in_out_way) {
            this.state.msg = '请选择出库类型';
            return;
        }
        if (!this.state.creatForm.out_days_ahead) {
            this.state.msg = '请选择提前几天出料';
            return;
        }


        this.state.msg = '';
    }
    // 全名
    getMaterialByFullname(fullname){
        let filterArr = this.index.material_item.filter(v=>v.name == fullname);
        let material = false;
        if(filterArr.length > 0){
            material = filterArr[0]
        }
        return material;
    }

}
CreatMaterialModal.defaultProps = {
    is_edit: false
}

export {
    CreatMaterialModal
}
