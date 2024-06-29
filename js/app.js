/** @odoo-module **/
import init_grid_options from "./ag_grid/gridOptions.js";
import {
  onFullscreenChange,
  formatId,
  toObj,
  getMonths,
  keepTwoDecimal,
  getDaysArr,
  add_stock_out_detail_id,
  add_stock_in_detail_id,
} from "./ag_grid/tool.js";
import { Toast } from "./components/Toast.js";
import { StockOutModal } from "./components/StockOutModal.js";
import { StockInModal } from "./components/StockInModal.js";
import { CreatMaterialModal } from "./components/CreatMaterialModal.js";

import numberCellEditor from "./ag_grid/numberCellEditor.js";
import stockOutNumberCellEditor from "./ag_grid/stockOutNumberCellEditor.js";
import stockInNumberCellEditor from "./ag_grid/stockInNumberCellEditor.js";

import cellRenderer from "./ag_grid/cellRenderer.js";

// 获取单位转化比
const getMainUnitBomUnitRatio = (material_id, unit_id, owl) => {
  const fillterArr = owl.index.material_unit_ratio.filter(
    (v) => v.material_id[0] == material_id && v.unit_id[0] == unit_id
  );
  if (fillterArr.length == 0) {
    return 0;
  } else {
    return fillterArr[0].unit_ratio;
  }
};
// 获取重量单位转化比
const getWeightRatio = (main_unit_id, unit_id, owl) => {
  // this.index.weight_ratio
  let { weight_ratio, material_purchase_unit_category } = owl.index;
  let main_unit = material_purchase_unit_category.find(
    (v) => v.id == main_unit_id
  );
  let unit = material_purchase_unit_category.find((v) => v.id == unit_id);
  let radio = 0;
  if (
    main_unit &&
    unit &&
    weight_ratio[main_unit.name] &&
    weight_ratio[unit.name]
  ) {
    radio = weight_ratio[unit.name] / weight_ratio[main_unit.name];
  }
  return radio;
};

class GroupRowInnerRenderer {
  // 初始化
  init(params) {
    const eGui = document.createElement("div");
    let _html = "";
    let value = params.value;
    let owl = params.context.owl_widget;
    this.owl = owl;

    let Count = params.node.allChildrenCount;

    eGui.className = "d-flex align-items-center gap-1";
    if (params.data) {
      this.material_id = params.data._material_id;
      _html += `<div class="icon" style="cursor: pointer;"><svg t="1703409352644" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5202" width="18" height="18"><path d="M512 97.52381c228.912762 0 414.47619 185.563429 414.47619 414.47619s-185.563429 414.47619-414.47619 414.47619S97.52381 740.912762 97.52381 512 283.087238 97.52381 512 97.52381z m36.571429 341.333333h-73.142858v292.571428h73.142858V438.857143z m0-121.904762h-73.142858v73.142857h73.142858v-73.142857z" p-id="5203" fill="#71639e"></path></svg></div>`;
    }
    _html += `<div class="" >${value}</div>`;
    eGui.innerHTML = _html;
    this.eGui = eGui;

    let _this = this;
    if (params.data) {
      eGui.getElementsByClassName("icon")[0].onclick = _.debounce(
        _this.toMaterialDetail.bind(_this),
        300
      );
    }
  }
  toMaterialDetail(e) {
    return this.owl.toMaterialDetail(e, this.material_id);
  }
  // 插入页面
  getGui() {
    return this.eGui;
  }
  // 刷新
  refresh(params) {
    return false;
  }

  destroy() {}
}
class nameCellRenderer {
  // 初始化
  init(params) {
    const eGui = document.createElement("div");
    let _html = "";
    let value = params.value;
    if (!value) {
      return;
    }
    let owl = params.context.owl_widget;
    this.owl = owl;

    eGui.className = "d-flex align-items-center gap-1";
    if (params.data) {
      this.material_id = params.data._material_id;
      _html += `<div class="icon" style="cursor: pointer;"><svg t="1703409352644" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5202" width="18" height="18"><path d="M512 97.52381c228.912762 0 414.47619 185.563429 414.47619 414.47619s-185.563429 414.47619-414.47619 414.47619S97.52381 740.912762 97.52381 512 283.087238 97.52381 512 97.52381z m36.571429 341.333333h-73.142858v292.571428h73.142858V438.857143z m0-121.904762h-73.142858v73.142857h73.142858v-73.142857z" p-id="5203" fill="#71639e"></path></svg></div>`;
    }
    _html += `<div class="" >${value}</div>`;
    eGui.innerHTML = _html;
    this.eGui = eGui;

    let _this = this;
    if (params.data) {
      eGui.getElementsByClassName("icon")[0].onclick = _.debounce(
        _this.toMaterialDetail.bind(_this),
        300
      );
    }
  }
  toMaterialDetail(e) {
    return this.owl.toMaterialDetail(e, this.material_id);
  }
  // 插入页面
  getGui() {
    return this.eGui;
  }
  // 刷新
  refresh(params) {
    return false;
  }

  destroy() {}
}
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
  onWillUnmount,
  useComponent,
  EventBus,
} = owl;

class Root extends Component {
  setup() {
    this.bus = new EventBus();

    this.tmp_user_vals = {};

    this.timer = setInterval(async () => {
      this.update_user_settings_in_batch();
    }, 5000);

    onWillUnmount(() => {
      clearInterval(this.timer);
    });

    useSubEnv({
      bus: this.bus,
    });

    this.myGrid_ref = useRef("myGrid");
    this.recordData = []; //表格的基础数据
    this.addRowMaxId = ""; //表格最大的id
    this.rowData = []; //表格数据
    this.pinnedTopRowData = [];

    this.index = {
      cus_loc: [],
    };
    this.settlement_data = {};
    this.dinner_mode_cus = {};
    this.dinner_mode_category = {};
    this.org_group_category = {};
    this.cus_sales_category = {};
    this.dinner_type_category = {};
    this.cus_loc_name = {};
    this.cus_loc = {};

    this.monthList = getMonths(14);
    this.dinnerTypeList = [
      { name: "早餐", id: "dn1" },
      { name: "中餐", id: "dn2" },
      { name: "晚餐", id: "dn3" },
      { name: "夜餐", id: "dn5" },
    ];
    this.dinnerType = toObj(this.dinnerTypeList, "id");
    this.salesCategoryList = [];
    this.salesCategory = {};
    this.salesCategoryName = {};
    this.tableHead = {};

    this.monthList = getMonths(14);
    let year_month = this.monthList.find((e) => e === this.props.year_month);

    if (!year_month) {
      year_month = this.props.year_month;
      this.monthList.push(year_month);
      console.log("该月份不存在, 需要加入到月份列表中!!!");
    }
    this.year_month = year_month;

    this.sidebarFilterReg = {}; //所有的正则
    this.checkedSidebarFilterReg = {}; //已选择的
    this.dinner_mode_cus = {};
    this.material_name_sort = {};

    console.log(this.props);

    useChildSubEnv({
      // 只会在组件的子组件中挂载公共数据及方法
      closeToast: () => {
        this.state.toastOpen = false;
        this.state.toastData = {};
      },
      openToast: (data) => {
        this.state.toastOpen = true;
        this.state.toastData = { ...data };
      },
      closeCreatMaterialModal: () => {
        this.state.CreatMaterialModalOpen = false;
        this.state.CreatMaterialModalData = {};
      },
      openCreatMaterialModal: (obj, callback) => {
        return this.openCreatMaterialModal(obj, callback);
      },
      closeStockOutModal: () => {
        this.state.StockOutModalOpen = false;
        this.state.StockOutModalData = {};
      },
      closeStockInModal: () => {
        this.state.StockInModalOpen = false;
        this.state.StockInModalData = {};
      },
      getIndex: () => {
        return JSON.parse(JSON.stringify(this.index));
      },
      getGlobal: () => {
        return JSON.parse(JSON.stringify(this.global));
      },
      updataStockOutDetailList: (data) => {
        return this.updataStockOutDetailList(data);
      },
      updataStockInDetailList: (data) => {
        return this.updataStockInDetailList(data);
      },
      getMainUnitBomUnitRatio: (material_id, unit_id) => {
        return getMainUnitBomUnitRatio(material_id, unit_id, this);
      },
      getWeightRatio: (main_unit_id, unit_id) => {
        return getWeightRatio(main_unit_id, unit_id, this);
      },
      addMaterialAsync: (material_obj, is_edit) => {
        return this.addMaterialAsync(material_obj, is_edit);
      },
    });

    let dayArr = getDaysArr(this.year_month);
    let end = new Date(dayArr[dayArr.length - 1]).getDate();

    this.index = {};
    this.global = {};
    this.oldCellData = {};
    this.cellDataAvgPrice = {};
    this.errorCell = [];
    this.StockOutDetailDelIds = [];
    this.StockInDetailDelIds = [];
    this.state = useState({
      loading: false,
      isMenuMode: true,
      toastOpen: false,
      toastData: {}, //提示消息
      isEditing: false,
      isChanged: false,
      errorTips: "",
      keyword: "",
      start: "1",
      end: end,
      StockOutModalOpen: false,
      StockOutModalData: {},
      StockInModalOpen: false,
      StockInModalData: {},
      tableConfig: {
        isShowZero: true,
      },
      CreatMaterialModalOpen: false,
      CreatMaterialModalEdit: false,
      CreatMaterialModalData: {},
      month: this.year_month,
    });

    onWillStart(async () => await this.LoadData());
    onWillUpdateProps(async (next_props) => await this.LoadData());
    onMounted(this.RenderAG);

    this.handleSave = _.debounce(this.save, 300);
    this.handleSearch = _.debounce(this.search, 300);
    this.handleClearSearch = _.debounce(this.clearSearch, 300);
    this.handleFilterDate = _.debounce(this.filterDate, 300);
    this.handleBatch = _.debounce(this.batch, 300);
    this.handleSale = _.debounce(this.sale, 300);
  }

  async addMaterialAsync(data, isEdit) {
    if (!data || data.name.trim() == "") {
      return 0;
    }

    let res;
    if (this.props.PlanDayUpdateMaterialItemVals) {
      res = await this.props.PlanDayUpdateMaterialItemVals(data);
    } else {
      res = await this.requestMaterial(data);
    }

    let { material_id, main_price, main_unit_id, unit_ratio_obj_list } = res;

    console.assert(unit_ratio_obj_list.length >= data.unit_ratio_list.length);

    Object.assign(data, {
      id: material_id,
      main_price,
      main_unit_id,
    });

    if (isEdit) {
      let index = this.index.material_item.findIndex((v) => {
        return v.id == data.id;
      });
      this.index.material_item[index] = data;
      if (unit_ratio_obj_list.length > 0) {
        let material_unit_ratio = this.index.material_unit_ratio.filter(
          (v) => v.material_id[0] != material_id
        );
        unit_ratio_obj_list.forEach((obj, i) => {
          obj.material_id = [material_id];
          obj.unit_id = [obj.unit_id];
          material_unit_ratio.push(obj);
        });
        this.index.material_unit_ratio = material_unit_ratio;
      }

      console.log(index);
      console.log(this.index.material_item[index]);
    } else {
      this.index.material_item.push(data);
      res.unit_ratio_obj_list.forEach((bom_obj, i) => {
        let new_bom_unit_ratio = {
          id: bom_obj.id,
          material_id: [data.id],
          unit_id: [bom_obj.unit_id],
          unit_ratio: bom_obj.unit_ratio,
        };
        this.index.material_unit_ratio.push(new_bom_unit_ratio);
      });

      this.global.material_item[material_id] = {
        material_name: data.name.split("-")[0],
        material_id: material_id,
        main_unit_name:
          this.global.material_purchase_unit_category[data.main_unit_id].name,
        main_unit_id: data.main_unit_id,
        avg_main_unit_price: 0,
        purchase_unit_name:
          this.global.material_purchase_unit_category[data.purchase_unit_id]
            .name,
        purchase_unit_id: data.purchase_unit_id,
      };
      this.material_name_sort[material_id] = 2;
      this.global.material_unit_ratio[material_id][data.purchase_unit_id] =
        res.unit_ratio_obj_list[0].unit_ratio;
    }
    this.material_item = toObj(this.index.material_item, "id");

    return data;
  }

  requestMaterial(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          material_id: data.id,
          main_price: data.main_price,
          main_unit_id: data.main_unit_id,
          unit_ratio_obj_list:
            data.unit_ratio_list.length == 0
              ? []
              : data.unit_ratio_list.map((v) => {
                  return v;
                }),
        });
      }, 1000);
    });
  }

  async update_user_settings_in_batch() {
    let obj = this.tmp_user_vals;
    this.tmp_user_vals = {};

    if (this.props.MonthStockUpdateUserSettings && Object.keys(obj).length) {
      this.props.MonthStockUpdateUserSettings(obj);
    }
  }

  update_user_settings(obj) {
    // console.log(obj);
    obj = obj || {};
    // console.log(obj);
    let change_vals = {};
    for (let f of Object.keys(obj)) {
      if (this.index.user_settings[f] !== obj[f]) {
        change_vals[f] = obj[f];
      }
    }

    this.index.user_settings = {
      ...this.index.user_settings,
      ...obj,
    };
    console.log("更新user_settings");

    // 数据临时存储到该位置
    Object.assign(this.tmp_user_vals, change_vals);
  }

  searchKeydown(e) {
    // console.log(e.keyCode === 13);
    if (e.keyCode === 13) {
      this.search();
    }
  }
  async updataStockInDetailList(data) {
    console.log(data);
    let { material_id, date, list, delIds } = data;
    let material = this.global.material_item[material_id];
    let stock_in_detail_list = this.index.stock_in_detail_list.filter(
      (v) => !(v.material_id[0] == material_id && v.date == date)
    );
    let sum = 0;
    // let sum_cost = 0;
    list.forEach((v) => {
      v.date = date;
      v.material_id = [material_id, material.material_name];
      if (!v.purchase_unit_id) {
        v.purchase_unit_id = [
          material.purchase_unit_id,
          material.purchase_unit_name,
        ];
      }
      if (!v.msupplier_id) {
        let default_msupplier_id = this.index.default_msupplier_id;
        let default_msupplier_name =
          this.global.msupplier[default_msupplier_id].supplier_nick_name;
        v.msupplier_id = [default_msupplier_id, default_msupplier_name];
      }
      if (!v.cus_group_id) {
        let default_cus_group_id = this.index.cus_group[0].id;
        let default_cus_group_name =
          this.global.cus_group[default_cus_group_id].name;
        v.cus_group_id = [default_cus_group_id, default_cus_group_name];
      }
      if (!v.purchase_unit_price) {
        v.purchase_unit_price = material.avg_main_unit_price;
      }
      let purchase_unit_id = v.purchase_unit_id[0];
      let unit_ratio =
        this.global.material_unit_ratio[material_id][purchase_unit_id];
      sum += v.purchase_unit_qty * unit_ratio;
    });
    stock_in_detail_list = stock_in_detail_list.concat(list);
    this.index.stock_in_detail_list = stock_in_detail_list;
    this.StockInDetailDelIds = this.StockInDetailDelIds.concat(delIds);
    let rowItem = this.getRowData(material_id);
    let day = new Date(date).getDate();
    rowItem[0]["stock_in||" + day] = sum;
    this.gridOptions.api.applyTransactionAsync({ update: rowItem }, (res) => {
      this.gridOptions.api.redrawRows();
    });
    this.state.isChanged = true;
    this.state.isEditing = false;

    // 检查出库填写
    let errCells = this.checkStockOutEveryDay(rowItem[0]);
    this.errorCell = this.errorCell.filter(
      (v) => !v.startsWith("stock_out||" + material_id + "||")
    );
    if (errCells.length > 0) {
      this.errorCell = this.errorCell.concat(errCells);
    }
    // let cellKey = 'stock_out||'+material_id+'||'+day;
    // let {isCheck,errorTips} = this.checkStockOutByRow(sum,day,rowItem[0]);
    // if(isCheck){
    //     this.errorCell = this.errorCell.filter(v=>v!=cellKey);
    // }
    // if(!isCheck && !this.errorCell.includes(cellKey)){
    //     this.errorCell.push(cellKey);
    // }

    this.updataErrorTips();
    this.updataPinnedTopRowData();
  }
  async updataStockOutDetailList(data) {
    console.log(data);
    let { material_id, date, list, delIds } = data;
    let material = this.global.material_item[material_id];
    let stock_out_detail_list = this.index.stock_out_detail_list.filter(
      (v) => !(v.material_id[0] == material_id && v.date == date)
    );
    let sum = 0;
    // let sum_cost = 0;
    list.forEach((v) => {
      // id
      // main_unit_qty,
      // isChanged
      let actual_out_cost = v.actual_out_cost || 0;
      if (v.isChanged) {
        actual_out_cost = v.main_unit_qty * material.avg_main_unit_price;
      }
      v.date = date;
      v.material_id = [material_id, material.material_name];
      v.main_unit_id = [material.main_unit_id, material.main_unit_name];
      v.actual_out_cost = actual_out_cost;
      if (!v.cus_group_id) {
        let default_cus_group_id = this.index.cus_group[0].id;
        let default_cus_group_name =
          this.global.cus_group[default_cus_group_id].name;
        v.cus_group_id = [default_cus_group_id, default_cus_group_name];
      }
      sum += v.main_unit_qty;
      // sum_cost += v.actual_out_cost;
    });
    stock_out_detail_list = stock_out_detail_list.concat(list);
    this.index.stock_out_detail_list = stock_out_detail_list;
    this.StockOutDetailDelIds = this.StockOutDetailDelIds.concat(delIds);
    let rowItem = this.getRowData(material_id);
    let day = new Date(date).getDate();
    rowItem[0]["stock_out||" + day] = sum;
    this.gridOptions.api.applyTransactionAsync({ update: rowItem }, (res) => {
      this.gridOptions.api.redrawRows();
    });
    this.state.isChanged = true;
    this.state.isEditing = false;

    // 检查出库填写
    let errCells = this.checkStockOutEveryDay(rowItem[0]);
    this.errorCell = this.errorCell.filter(
      (v) => !v.startsWith("stock_out||" + material_id + "||")
    );
    if (errCells.length > 0) {
      this.errorCell = this.errorCell.concat(errCells);
    }

    // let cellKey = 'stock_out||'+material_id+'||'+day;
    // let {isCheck,errorTips} = this.checkStockOutByRow(sum,day,rowItem[0]);
    // if(isCheck){
    //     this.errorCell = this.errorCell.filter(v=>v!=cellKey);
    // }
    // if(!isCheck && !this.errorCell.includes(cellKey)){
    //     this.errorCell.push(cellKey);
    // }
    this.updataErrorTips();
    this.updataPinnedTopRowData();
  }
  // 出库数量是否支持单元格输入
  isStockOutCanFastInput(material_id, day) {
    day = day.padStart(2, "0");
    let date = this.year_month + "-" + day;
    let stock_out_detail_list = this.index.stock_out_detail_list.filter(
      (v) => v.material_id[0] == material_id && v.date == date
    );
    if (stock_out_detail_list.length > 1) {
      return false;
    }
    return true;
  }
  //入库数量食肉支持单元格输入
  isStockInCanFastInput(material_id, day) {
    day = day.padStart(2, "0");
    let date = this.year_month + "-" + day;
    let stock_in_detail_list = this.index.stock_in_detail_list.filter(
      (v) => v.material_id[0] == material_id && v.date == date
    );
    if (stock_in_detail_list.length > 1) {
      return false;
    }
    return true;
  }

  async toMaterialDetail(e, material_id) {
    console.log("点击食材按钮");
    console.log(material_id);
    if (this.props.MonthStockGoToStock) {
      await this.props.MonthStockGoToStock(material_id);
    }
  }
  async batch() {
    console.log("点击批量入库");
    if (this.props.MonthStockGoToMaterialBatch) {
      await this.props.MonthStockGoToMaterialBatch();
    }
  }
  async sale() {
    console.log("点击月报表");
    if (this.props.MonthStockGoToMonthReport) {
      await this.props.MonthStockGoToMonthReport();
    }
  }
  async save() {
    if (this.state.errorTips) {
      this.state.toastData = {
        msg: this.state.errorTips + "。请检查红底色的出库数据。",
      };
      this.state.toastOpen = true;
      return;
    }
    let addList = [];
    let updatalist = [];
    let delIds = [];
    this.StockOutDetailDelIds.forEach((v) => {
      if (!(v + "").startsWith("virtual")) {
        delIds.push(v);
      }
    });
    let _obj = {};
    this.index.stock_out_detail_list.forEach((v) => {
      if (v.isChanged) {
        let item = {
          id: v.id,
          main_unit_qty: v.main_unit_qty,
          date: v.date,
          material_id: v.material_id[0],
          main_unit_id: v.main_unit_id[0],
          cus_group_id: v.cus_group_id[0],
        };
        if ((v.id + "").startsWith("virtual")) {
          addList.push(item);
        } else {
          delIds.push(v.id);
          item.id = add_stock_out_detail_id();
          addList.push(item);
          _obj[item.id] = JSON.parse(JSON.stringify(v));
        }
      }
    });
    // let newCellData = this.getCellData();
    // let saveData = this.compareCellData(newCellData,this.oldCellData);
    // let {addList,updatalist,delIds} = saveData;
    console.log("出库新增：", addList);
    console.log("出库更新：", updatalist);
    console.log("出库删除：", delIds);

    let stockInAddList = [];
    let stockInUpdatalist = [];
    let stockInDelIds = [];
    this.StockInDetailDelIds.forEach((v) => {
      if (!(v + "").startsWith("virtual")) {
        stockInDelIds.push(v);
      }
    });
    this.index.stock_in_detail_list.forEach((v) => {
      if (v.isChanged) {
        let item = {
          id: v.id,
          material_id: v.material_id[0],
          date: v.date,
          purchase_unit_qty: v.purchase_unit_qty,
          msupplier_id: v.msupplier_id[0],
          cus_group_id: v.cus_group_id[0],
          purchase_unit_id: v.purchase_unit_id[0],
          purchase_unit_price: v.purchase_unit_price,
        };
        if ((v.id + "").startsWith("virtual")) {
          stockInAddList.push(item);
        } else {
          stockInUpdatalist.push(item);
        }
      }
    });
    console.log("入库新增：", stockInAddList);
    console.log("入库更新：", stockInUpdatalist);
    console.log("入库删除：", stockInDelIds);

    let res;

    let p_in_objs = [stockInAddList, stockInUpdatalist, stockInDelIds];
    let p_out_objs = [addList, updatalist, delIds];
    if (this.props.MonthStockUpdateData) {
      /*
                res = {
                    in_objs: obj2,
                    out_objs: obj1
                }
             */
      res = await this.props.MonthStockUpdateData(p_in_objs, p_out_objs);
    } else {
      res = await this.request(p_in_objs, p_out_objs);
    }

    let { out_objs, in_objs } = res;

    let { created, updated } = out_objs;
    this.index.stock_out_detail_list = this.index.stock_out_detail_list.filter(
      (v) => !delIds.includes(v.id)
    );
    addList.forEach((v, i) => {
      // let day = new Date(v.date).getDate();
      // let material_id = v.material_id;
      let _index = this.index.stock_out_detail_list.findIndex(
        (d) => d.id == v.id
      );
      if (_index < 0) {
        this.index.stock_out_detail_list.push({
          ..._obj[v.id],
          id: created[i].id,
          actual_out_cost: created[i].actual_out_cost,
          isChanged: false,
        });
      } else {
        this.index.stock_out_detail_list[_index].id = created[i].id;
        this.index.stock_out_detail_list[_index].actual_out_cost =
          created[i].actual_out_cost;
        this.index.stock_out_detail_list[_index].isChanged = false;
      }
    });
    updatalist.forEach((v, i) => {
      let _index = this.index.stock_out_detail_list.findIndex(
        (d) => d.id == v.id
      );
      this.index.stock_out_detail_list[_index].actual_out_cost =
        updated[i].actual_out_cost;
      this.index.stock_out_detail_list[_index].isChanged = false;
    });

    let stock_in_created = in_objs.created;
    // let stock_in_updated = stock_in_record_detail.updated;
    this.index.stock_in_detail_list = this.index.stock_in_detail_list.filter(
      (v) => !stockInDelIds.includes(v.id)
    );
    stockInAddList.forEach((v, i) => {
      let _index = this.index.stock_in_detail_list.findIndex(
        (d) => d.id == v.id
      );
      this.index.stock_in_detail_list[_index].id = stock_in_created[i].id;
      this.index.stock_in_detail_list[_index].isChanged = false;
    });
    stockInUpdatalist.forEach((v, i) => {
      let _index = this.index.stock_in_detail_list.findIndex(
        (d) => d.id == v.id
      );
      this.index.stock_in_detail_list[_index].isChanged = false;
    });

    // this.oldCellData = newCellData;
    this.state.isChanged = false;
    this.StockOutDetailDelIds = [];
    this.StockInDetailDelIds = [];
    this.gridOptions.api.redrawRows();
    this.updataPinnedTopRowData();
  }
  async request(in_objs, out_objs) {
    let [addList, updatalist, delIds] = out_objs;
    let [stockInAddList, stockInUpdatalist, stockInDelIds] = in_objs;
    return {
      out_objs: {
        created: addList.map((v) => {
          return {
            id: v.id,
            actual_out_cost: v.main_unit_qty * 1,
          };
        }),
        updated: updatalist.map((v) => v.main_unit_qty * 1),
      },
      in_objs: {
        created: stockInAddList.map((v) => {
          return {
            id: v.id,
          };
        }),
      },
    };
  }
  search() {
    let keyword = this.state.keyword;
    if (!keyword) {
      this.setFilterModel();
      return;
    }
    let filterModel = {
      material_name: {
        filterType: "text",
        type: "contains",
        filter: keyword,
      },
    };
    this.gridOptions.api.setFilterModel(filterModel);
    this.gridOptions.api.onFilterChanged();
  }
  clearSearch() {
    this.state.keyword = "";
    this.setFilterModel();
  }
  filterDate() {
    let start = Number(this.state.start);
    let end = Number(this.state.end);
    let dayArr = getDaysArr(this.year_month);
    let max_end = new Date(dayArr[dayArr.length - 1]).getDate();
    if (!start) {
      this.state.start = 1;
      start = 1;
    }
    if (!end || end > max_end) {
      this.state.end = max_end;
      end = max_end;
    }
    if (start > end) {
      this.state.end = start;
      end = start;
    }
    this.sidebarFilterChange();
  }
  // 更换月份
  selectMonth(e) {
    console.log("选择月份", this.state.month);
    let year_month = this.state.month;
    if (this.state.isChanged) {
      this.state.toastData = {
        msg: "当前月份未保存，确定放弃修改？",
        isCancel: true,
        onCancel: () => {
          this.state.month = this.year_month;
          document.getElementById("select_year_month").value = this.year_month;
        },
        onConfirm: () => {
          this.LoadData(year_month);
        },
      };
      this.state.toastOpen = true;
      return;
    }
    this.LoadData(year_month);
  }

  onFullscreenChange(e) {
    console.log(e);
    let isMenuMode = false;
    if (document.fullscreenElement) {
      console.log("进入全屏");
    } else {
      console.log("退出全屏");
      isMenuMode = true;
    }
    this.state.isMenuMode = isMenuMode;
    this.bus.trigger("setIsMenuMode", isMenuMode);
    if (this.props.toggleMenuMode) {
      this.props.toggleMenuMode(this.state.isMenuMode);
    }
  }
  async LoadTestData() {
    let stock_in_detail_list = await fetch(
      "./json/stock_in_detail_list.json"
    ).then((response) => response.json());
    let stock_obj = await fetch("./json/stock_obj.json").then((response) =>
      response.json()
    );
    // console.log(stock_obj);
    // console.log("00000000");
    let stock_out_detail_list = await fetch(
      "./json/stock_out_detail_list.json"
    ).then((response) => response.json());

    let default_msupplier_id = await fetch(
      "./json/default_msupplier_id.json"
    ).then((response) => response.json());
    let material_purchase_unit_category = await fetch(
      "./json/material_purchase_unit_category.json"
    ).then((response) => response.json());
    let material_unit_ratio = await fetch(
      "./json/material_unit_ratio.json"
    ).then((response) => response.json());
    let msupplier = await fetch("./json/msupplier.json").then((response) =>
      response.json()
    );
    let daily_cost_category = await fetch(
      "./json/daily_cost_category.json"
    ).then((response) => response.json());
    let material_item = await fetch("./json/material_item.json").then(
      (response) => response.json()
    );
    let material_purchase_category = await fetch(
      "./json/material_purchase_category.json"
    ).then((response) => response.json());
    let material_top_category = await fetch(
      "./json/material_top_category.json"
    ).then((response) => response.json());
    let cus_group = await fetch("./json/cus_group.json").then((response) =>
      response.json()
    );

    return {
      stock_in_detail_list,
      stock_obj,
      stock_out_detail_list,
      default_msupplier_id,
      material_purchase_unit_category,
      material_unit_ratio,
      msupplier,
      daily_cost_category,
      material_item,
      material_purchase_category,
      material_top_category,
      cus_group,
    };

    // let month_stock = await fetch('./json/month_stock.json')
    //     .then((response) => response.json());
    // return month_stock
  }

  async LoadData(year_month) {
    if (year_month) {
      this.year_month = year_month;
    }

    this.state.loading = true;
    console.log(`加载数据 `); // 开辟加载父类数据结构逻辑!!!
    let load_func = this.props.LoadData
      ? this.props.LoadData
      : this.LoadTestData.bind(this);

    let data = await load_func(this.year_month);

    let {
      stock_in_detail_list,
      stock_obj,
      stock_out_detail_list,
      default_msupplier_id,
      material_purchase_unit_category,
      material_unit_ratio,
      msupplier,
      daily_cost_category,
      material_item,
      material_purchase_category,
      material_top_category,
      cus_group,
    } = data;
    // this.index = {
    //     stock_in_detail_list:stock_in_detail_list.slist,
    //     stock_obj,
    //     stock_out_detail_list,
    //     default_msupplier_id:default_msupplier_id[0],
    //     material_purchase_unit_category,
    //     material_unit_ratio,
    //     msupplier
    // };
    this.index.stock_in_detail_list = stock_in_detail_list.slist;
    this.index.stock_obj = stock_obj;
    this.index.stock_out_detail_list = stock_out_detail_list;
    this.index.default_msupplier_id = default_msupplier_id[0];
    this.index.material_purchase_unit_category =
      material_purchase_unit_category;
    this.index.material_unit_ratio = material_unit_ratio;
    this.index.msupplier = msupplier;
    this.index.daily_cost_category = daily_cost_category;
    this.index.material_item = material_item;
    this.index.material_purchase_category = material_purchase_category;
    this.index.material_top_category = material_top_category;
    this.index.cus_group = cus_group;

    this.index.purchase_category = [
      {
        id: 1,
        name: "day",
        name_cn: "日采购",
      },
      {
        id: 2,
        name: "week",
        name_cn: "周采购",
      },
      {
        id: 3,
        name: "least_stock",
        name_cn: "最小库存",
      },
    ];
    this.index.weight_ratio = {
      斤: 1,
      两: 10,
      克: 500,
      公斤: 0.5,
    };

    let material_unit_ratio_obj = {};
    let unit_name = {};
    material_unit_ratio.forEach((v) => {
      let material_id = v.material_id[0];
      let unit_id = v.unit_id[0];
      !material_unit_ratio_obj[material_id] &&
        (material_unit_ratio_obj[material_id] = {});
      !material_unit_ratio_obj[material_id][unit_id] &&
        (material_unit_ratio_obj[material_id][unit_id] = v.unit_ratio);
      unit_name[unit_id] = v.unit_id[1];
    });

    this.global = {
      kuwei: toObj(stock_obj["库位"], "id"),
      material_item: {},
      material_unit_ratio: material_unit_ratio_obj,
      msupplier: toObj(msupplier, "id"),
      unit_name: unit_name,
      material_purchase_unit_category: toObj(
        material_purchase_unit_category,
        "id"
      ),
      cus_group: toObj(cus_group, "id"),
    };

    this.setRecordData();
    if (!year_month) {
      this.index.user_settings = stock_obj["用户配置"];
      this.setSidebarFilter();
      this.setKuweiFilter();
    }
    this.state.loading = false;
    this.state.isChanged = false;
  }

  //设置表格基础数据
  setRecordData() {
    // console.log(days);
    let { stock_obj, stock_in_detail_list, stock_out_detail_list } = this.index;
    let recordObj = {};
    let recordData = [];
    let oldCellData = {};
    let pinnedTopRow = {
      start_stock_cost: 0,
    };
    let sum_start_stock_cost = 0;
    // let cellDataAvgPrice = {};
    stock_obj["库存"].forEach((v) => {
      //     'cost_center_id':1,              #核算单位
      // 'cus_group_id':1,                #客户组
      // 'material_id':1,                 #食材
      // 'sel_weight ':'1',               #选食材的频次
      // 'stock_top_loc_id':1,            #库位
      // 'main_unit_id':1,                #单位
      // 'purchase_unit_id':1,            #采购单位
      // 'period_in_qty':1,               #入库数量
      // 'period_out_qty':1,              #出库数量
      // 'start_stock_qty':1,             #期初数量
      // 'start_stock_cost':1,            #期初成本
      // 'stock_qty':1,                   #库存
      // 'period_in_cost': 1,             #入库金额
      // 'period_out_cost': 1,            #出库金额
      // 'stock_cost': 1,                 #在库成本
      // 'avg_main_unit_price': 1,        #平均单价

      recordObj[v.material_id[0]] = {
        ...v,
        main_unit_name: v.main_unit_id[1],
        material_name: v.material_id[1],
        _material_id: v.material_id[0],
        stock_top_loc_name: v.stock_top_loc_id[1],
        stock_init_qty: v.start_stock_qty,
        // stock_in_qty:v.period_in_qty,
        // stock_out_qty:v.period_out_qty,
        // stock_qty:v.stock_qty,
        // stock_in_cost:v.period_in_cost,
        // stock_out_cost:v.period_out_cost,
        // stock_cost:v.stock_cost,
        purchase_unit_name: v.purchase_unit_id[1],
        stock_in_cost: 0,
        purchase_unit_price: 0,
        // stock_in_qty:0,
        // stock_out_cost:0
      };
      this.global.material_item[v.material_id[0]] = {
        material_name: v.material_id[1],
        material_id: v.material_id[0],
        main_unit_name: v.main_unit_id[1],
        main_unit_id: v.main_unit_id[0],
        avg_main_unit_price: v.avg_main_unit_price,
        purchase_unit_name: v.purchase_unit_id[1],
        purchase_unit_id: v.purchase_unit_id[0],
      };
      this.material_name_sort[v.material_id[1]] = Number(v.sel_weight);
    });
    // 入库
    stock_in_detail_list.forEach((v) => {
      let material_id = v.material_id[0];
      if (!recordObj[material_id]) {
        return;
      }
      if (!v.date.startsWith(this.year_month)) {
        return;
      }
      let day = new Date(v.date).getDate();
      let key = `stock_in||${day}`;
      if (!recordObj[material_id][key]) {
        recordObj[material_id][key] = 0;
      }
      let purchase_unit_id = v.purchase_unit_id[0];
      let unit_ratio =
        this.global.material_unit_ratio[material_id][purchase_unit_id];
      // console.log(unit_ratio);
      recordObj[material_id][key] += v.purchase_unit_qty * unit_ratio;

      // recordObj[v.material_id[0]][`stock_in||${day}||id`] = v.id;
      // recordObj[material_id].stock_in_cost += v.purchase_unit_qty * v.purchase_unit_price;
      // recordObj[v.material_id[0]].stock_in_qty += v.purchase_unit_qty;
    });
    // 出库
    stock_out_detail_list.forEach((v) => {
      let material_id = v.material_id[0];
      if (!recordObj[material_id]) {
        return;
      }
      if (!v.date.startsWith(this.year_month)) {
        return;
      }
      let day = new Date(v.date).getDate();
      let key = `stock_out||${day}`;
      if (!recordObj[material_id][key]) {
        recordObj[material_id][key] = 0;
        oldCellData[`stock_out||${material_id}||${day}`] = {
          qty: 0,
        };
      }
      recordObj[material_id][key] += v.main_unit_qty;
      oldCellData[`stock_out||${material_id}||${day}`].qty += v.main_unit_qty;
      // console.log(recordObj[material_id][key]);
      // recordObj[material_id][`stock_out||${day}||id`] = v.id;
      // recordObj[material_id][`stock_out||${day}||avg_price`] = v.actual_out_cost/v.main_unit_qty;
      // recordObj[material_id][`stock_out||${day}||cost`] = v.actual_out_cost;
      // recordObj[v.material_id[0]].stock_out_cost += v.actual_out_cost;

      // cellDataAvgPrice[`stock_out||${material_id}||${day}`] = v.actual_out_cost/v.main_unit_qty
    });
    this.addRowMaxId = 0;
    for (let key in recordObj) {
      let item = recordObj[key];
      this.addRowMaxId++;
      recordData.push({
        ...item,
        id: this.addRowMaxId,
      });
      sum_start_stock_cost += item.start_stock_cost;
      pinnedTopRow.start_stock_cost += item.start_stock_cost;
    }
    // console.log(recordData);
    this.recordData = recordData;
    this.rowData = recordData;
    this.sum_start_stock_cost = sum_start_stock_cost;
    // this.pinnedTopRowData = [pinnedTopRow];

    this.setPinnedTopRowData();
    // this.oldCellData = oldCellData;
    // this.cellDataAvgPrice = cellDataAvgPrice;

    this.checkCellData(oldCellData, recordObj);

    if (this.gridOptions) {
      this.gridOptions.api.setRowData(this.rowData);
      this.gridOptions.api.setColumnDefs(this.setColumnDefs());
      this.gridOptions.api.refreshHeader();
      this.gridOptions.api.redrawRows();
    }
    this.rowData = [{}];
  }
  setPinnedTopRowData() {
    let pinnedTopRow = {
      start_stock_cost: this.sum_start_stock_cost,
    };
    let dayArr = getDaysArr(this.year_month);
    dayArr.forEach((item) => {
      let day = new Date(item).getDate();
      let stock_out_detail_list = this.index.stock_out_detail_list.filter(
        (v) => v.date == item
      );
      let stock_out_nums = stock_out_detail_list.map((v) => v.actual_out_cost);

      let stock_in_detail_list = this.index.stock_in_detail_list.filter(
        (v) => v.date == item
      );
      let stock_in_nums = stock_in_detail_list.map(
        (v) => v.purchase_unit_price * v.purchase_unit_qty
      );

      pinnedTopRow["stock_in||" + day] = keepTwoDecimal(
        eval(stock_in_nums.join("+")) || 0
      );
      pinnedTopRow["stock_out||" + day] = keepTwoDecimal(
        eval(stock_out_nums.join("+")) || 0
      );
    });
    // console.log(pinnedTopRow);
    this.pinnedTopRowData = [pinnedTopRow];
  }
  updataPinnedTopRowData() {
    this.setPinnedTopRowData();
    this.gridOptions.api.pinnedRowModel.setPinnedTopRowData(
      this.pinnedTopRowData
    );
  }

  openCreatMaterialModal(obj, callback) {
    console.log("----openCreatMaterialModal----");
    !obj && (obj = {});
    this.state.CreatMaterialModalData = { ...obj, callback };
    this.state.CreatMaterialModalEdit = obj.id ? true : false;
    this.state.CreatMaterialModalOpen = true;
  }

  // 出库详情
  openStockOutModal(data) {
    let day = data.day.padStart(2, "0");
    data.date = this.year_month + "-" + day;
    this.state.StockOutModalOpen = true;
    this.state.StockOutModalData = {
      ...data,
    };
  }
  // 入库详情
  openStockInModal(data) {
    let day = data.day.padStart(2, "0");
    data.date = this.year_month + "-" + day;
    this.state.StockInModalOpen = true;
    this.state.StockInModalData = {
      ...data,
    };
  }
  checkCellData(cellData, recordObj) {
    this.errorCell = [];
    for (let key in cellData) {
      let value = cellData[key].qty;
      let [type, material_id, day] = key.split("||");
      let data = recordObj[material_id];
      let { isCheck, errorTips } = this.checkStockOutByRow(value, day, data);
      if (!isCheck) {
        this.errorCell.push(key);
      }
    }
    this.updataErrorTips();
  }
  updataErrorTips() {
    // console.log(this.errorCell);
    let tips = [];
    this.errorCell.forEach((v) => {
      // console.log(v);
      let [type, material_id, day] = v.split("||");
      let name = this.global.material_item[material_id].material_name;

      if (!tips.includes(name)) {
        tips.push(name);
      }
    });
    if (tips.length > 0) {
      this.state.errorTips = "出库大于入库：" + tips.join("，");
    } else {
      this.state.errorTips = "";
    }
  }
  setKuweiFilter() {
    let kuweiFilter = {};
    this.kuweiFilterForm.forEach((v) => {
      kuweiFilter[v.id] = true;
    });
    this.state.kuweiFilter = kuweiFilter;
    this.state.kuweiFilterCheckAll = true;
  }
  setSidebarFilter() {
    let { user_settings } = this.index;
    let sidebarFilter = {};
    let sidebarFilterReg = {};
    // 设置
    this.sidebarFilterForm.forEach((v) => {
      !sidebarFilter[v.key] && (sidebarFilter[v.key] = {});
      !sidebarFilterReg[v.key] && (sidebarFilterReg[v.key] = {});
      v.children.forEach((item) => {
        let flag = true;
        if (item.user_config_key) {
          flag = eval("user_settings." + item.user_config_key);
        }
        sidebarFilter[v.key][item.id] = flag;
        sidebarFilterReg[v.key][item.id] = item.reg || "";
      });
    });
    this.state.sidebarFilter = sidebarFilter;
    this.sidebarFilterReg = sidebarFilterReg;
    this.updataCheckedSidebarFilterReg();
    this.isCheckAll();
  }
  updataCheckedSidebarFilterReg() {
    let _this = this;
    let showReg = {};
    for (let key1 in _this.state.sidebarFilter) {
      showReg[key1] = [];
      for (let key2 in _this.state.sidebarFilter[key1]) {
        if (_this.state.sidebarFilter[key1][key2]) {
          let reg = _this.sidebarFilterReg[key1][key2];
          showReg[key1].push(reg);
        }
      }
    }
    this.checkedSidebarFilterReg = showReg;
  }
  // 左侧筛选-检查是否全选
  isCheckAll() {
    let sidebarFilterCheckAll = {};
    for (let key in this.state.sidebarFilter) {
      sidebarFilterCheckAll[key] = true;
      for (let name in this.state.sidebarFilter[key]) {
        if (!this.state.sidebarFilter[key][name]) {
          sidebarFilterCheckAll[key] = false;
        }
      }
    }
    this.state.sidebarFilterCheckAll = sidebarFilterCheckAll;
  }
  get kuweiFilterForm() {
    let _arr = JSON.parse(JSON.stringify(this.index.stock_obj["库位"]));
    return _arr;
  }

  //   // 左侧筛选-表单配置
  //   get sidebarFilterForm() {
  //     let _arr = [
  //       {
  //         name: "显示设置",
  //         key: "visable",
  //         colKey: "",
  //         children: [
  //           {
  //             name: "初始库存",
  //             id: "stock_init_qty",
  //             reg: /^stock_init_qty$/,
  //             user_config_key: "is_month_stock_show_start_qty",
  //           },
  //           {
  //             name: "入库数量",
  //             id: "stock_in_qty",
  //             reg: /^stock_in_qty$/,
  //             user_config_key: "is_month_stock_show_period_in_qty",
  //           },
  //           {
  //             name: "出库数量",
  //             id: "stock_out_qty",
  //             reg: /^stock_out_qty$/,
  //             user_config_key: "is_month_stock_show_period_out_qty",
  //           },
  //           {
  //             name: "库存数量",
  //             id: "stock_qty",
  //             reg: /^stock_qty$/,
  //             user_config_key: "is_month_stock_show_stock_qty",
  //           },
  //           {
  //             name: "初始成本",
  //             id: "start_stock_cost",
  //             reg: /^start_stock_cost$/,
  //             user_config_key: "is_month_stock_show_start_cost",
  //           },
  //           {
  //             name: "入库成本",
  //             id: "stock_in_cost",
  //             reg: /^stock_in_cost$/,
  //             user_config_key: "is_month_stock_show_period_in_cost",
  //           },
  //           {
  //             name: "出库成本",
  //             id: "stock_out_cost",
  //             reg: /^stock_out_cost$/,
  //             user_config_key: "is_month_stock_show_period_out_cost",
  //           },
  //           {
  //             name: "库存成本",
  //             id: "stock_cost",
  //             reg: /^stock_cost$/,
  //             user_config_key: "is_month_stock_show_stock_cost",
  //           },
  //           {
  //             name: "采购单位",
  //             id: "purchase_unit_name",
  //             reg: /^purchase_unit_name$/,
  //             user_config_key: "is_month_stock_show_purchase_unit_id",
  //           },
  //         ],
  //       },
  //       {
  //         name: "入库出库",
  //         key: "other",
  //         colKey: "",
  //         children: [
  //           {
  //             name: "入库",
  //             id: "stock_in",
  //             reg: /^stock_in\|\|[A-Za-z0-9]/,
  //             user_config_key: "is_month_stock_show_period_in",
  //           },
  //           {
  //             name: "出库",
  //             id: "stock_out",
  //             reg: /^stock_out\|\|[A-Za-z0-9]/,
  //             user_config_key: "is_month_stock_show_period_out",
  //           },
  //         ],
  //       },
  //     ];
  //     return _arr;
  //   }
  // 左侧筛选-表单配置
  get sidebarFilterForm() {
    let _arr = [
      {
        name: "显示设置",
        key: "visable",
        colKey: "",
        children: [
          {
            name: "销售额",
            id: "main_unit_test1",
            reg: /^main_unit_test\d{1,2}_1$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "食材",
            id: "main_unit_test3",
            reg: /^main_unit_test\d{1,2}_3$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "人工",
            id: "main_unit_test4",
            reg: /^main_unit_test\d{1,2}_4$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "领用",
            id: "main_unit_test5",
            reg: /^main_unit_test\d{1,2}_5$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "其他",
            id: "main_unit_test6",
            reg: /^main_unit_test\d{1,2}_6$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "成本",
            id: "main_unit_test7",
            reg: /^main_unit_test\d{1,2}_7$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "食材%",
            id: "main_unit_test8",
            reg: /^main_unit_test\d{1,2}_8$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "人工%",
            id: "main_unit_test9",
            reg: /^main_unit_test\d{1,2}_9$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "领用%",
            id: "main_unit_test10",
            reg: /^main_unit_test\d{1,2}_10$/,
            user_config_key: "is_month_stock_show_period_out",
          },
          {
            name: "其他%",
            id: "main_unit_test11",
            reg: /^main_unit_test\d{1,2}_11$/,
            user_config_key: "is_month_stock_show_period_out",
          },
        ],
      },
      {
        name: "入库出库",
        key: "other",
        colKey: "",
        children: [
          {
            name: "入库",
            id: "stock_in",
            reg: /^stock_in\|\|[A-Za-z0-9]/,
            user_config_key: "is_month_stock_show_period_in",
          },
          {
            name: "出库",
            id: "stock_out",
            reg: /^stock_out\|\|[A-Za-z0-9]/,
            user_config_key: "is_month_stock_show_period_out",
          },
        ],
      },
    ];
    return _arr;
  }
  kuweiFilterChange(e) {
    this.setFilterModel();
    e && this.isKuweiFilterCheckAll();
  }
  isKuweiFilterCheckAll() {
    let kuweiFilterCheckAll = true;
    let obj = this.state.kuweiFilter;
    for (let name in obj) {
      if (!this.state.kuweiFilter[name]) {
        kuweiFilterCheckAll = false;
      }
    }
    this.state.kuweiFilterCheckAll = kuweiFilterCheckAll;
  }
  kuweiFilterChangeAll(e) {
    let obj = this.state.kuweiFilter;
    for (let name in obj) {
      this.state.kuweiFilter[name] = this.state.kuweiFilterCheckAll;
    }
    this.kuweiFilterChange();
  }
  setFilterModel() {
    let _this = this;
    let stock_top_loc_name_arr = [];
    for (let id in _this.state.kuweiFilter) {
      if (_this.state.kuweiFilter[id]) {
        let name = this.global.kuwei[id].name;
        stock_top_loc_name_arr.push(name);
      }
    }
    let filterModel = {
      stock_top_loc_name: {
        type: "contains",
        values: stock_top_loc_name_arr,
      },
    };
    this.gridOptions.api.setFilterModel(filterModel);
    this.gridOptions.api.onFilterChanged();
  }
  //左侧筛选更改-全选
  sidebarFilterChangeAll(e) {
    let key = e.target.name;
    let obj = this.state.sidebarFilter[key];
    for (let name in obj) {
      this.state.sidebarFilter[key][name] =
        this.state.sidebarFilterCheckAll[key];
    }
    this.sidebarFilterChange();
  }
  // 左侧筛选更改
  sidebarFilterChange(e) {
    // console.log('------sidebarFilterChange-------');
    // this.updataTableHeadCus();
    e && this.isCheckAll();
    this.updataCheckedSidebarFilterReg();
    // this.updateUserConfig();
    let colIds = this.gridOptions.columnApi.getColumns().map((v) => {
      return v.colId;
    });
    // console.log(colIds);
    let showColIds = [];
    let hideColIds = [];
    colIds.forEach((colId) => {
      if (this.isShowColId(colId)) {
        showColIds.push(colId);
      } else {
        hideColIds.push(colId);
      }
    });
    // console.log(showColIds);
    this.gridOptions.columnApi.setColumnsVisible(hideColIds, false);
    this.gridOptions.columnApi.setColumnsVisible(showColIds, true);
    this.gridOptions.api.redrawRows();

    let user_config = {};
    this.sidebarFilterForm.forEach((v) => {
      v.children.forEach((item) => {
        if (item.user_config_key) {
          user_config[item.user_config_key] =
            this.state.sidebarFilter[v.key][item.id];
        }
      });
    });
    this.update_user_settings(user_config);
  }
  tableConfigChange() {
    this.gridOptions.api.redrawRows();
  }
  checkIsChangedStockIn(params) {
    let data = params.data;
    let material_id = data._material_id;
    let [type, day] = params.colDef.field.split("||");
    let date = this.year_month + "-" + day.padStart(2, "0");
    let stock_in_detail_list = this.index.stock_in_detail_list.filter(
      (v) => v.material_id[0] == material_id && v.date == date && v.isChanged
    );
    return stock_in_detail_list.length != 0;
  }
  checkIsChangedStockOut(params) {
    let data = params.data;
    let material_id = data._material_id;
    let [type, day] = params.colDef.field.split("||");
    let date = this.year_month + "-" + day.padStart(2, "0");
    let stock_out_detail_list = this.index.stock_out_detail_list.filter(
      (v) => v.material_id[0] == material_id && v.date == date && v.isChanged
    );
    return stock_out_detail_list.length != 0;
  }
  checkStockOut(params) {
    let data = params.data;
    let value = params.value || 0;
    let [type, day] = params.colDef.field.split("||");
    return params.context.owl_widget.checkStockOutByRow(value, day, data);
  }
  checkStockOutByRow(value, day, data) {
    let result = {
      isCheck: true,
      errorTips: "",
    };
    if (!value) {
      return result;
    }
    day = Number(day);
    let material_id = data._material_id;
    let purchase_unit_id = data.purchase_unit_id[0];
    let stock_in_sum = 0;
    let stock_out_sum = 0;
    let unit_ratio =
      this.global.material_unit_ratio[material_id][purchase_unit_id];
    for (let i = 1; i <= day; i++) {
      stock_in_sum += data["stock_in||" + i] || 0;
    }
    for (let i = 1; i <= day; i++) {
      stock_out_sum += data["stock_out||" + i] || 0;
    }
    // stock_in_sum = stock_in_sum * unit_ratio;
    stock_in_sum += data.stock_init_qty;
    let num = stock_in_sum - stock_out_sum;
    if (num < -1 || num == -1) {
      result.isCheck = false;
      result.errorTips = "超出剩余库存：" + (num + value) + "";
    }
    return result;
  }
  checkStockOutEveryDay(data) {
    let errCells = [];
    let material_id = data._material_id;
    for (let key in data) {
      if (key.startsWith("stock_out||")) {
        let [type, day] = key.split("||");
        let { isCheck } = this.checkStockOutByRow(data[key], day, data);
        if (!isCheck) {
          let cellKey = "stock_out||" + material_id + "||" + day;
          errCells.push(cellKey);
        }
      }
    }
    return errCells;
  }
  stock_in_qty_valueGetter(params) {
    let data = params.data;
    // let material_id = data._material_id;
    // let purchase_unit_id = data.purchase_unit_id[0];
    let num = 0;
    for (let col in data) {
      let arr = col.split("||");
      if (arr[0] == "stock_in" && arr.length == 2) {
        num += data[col] || 0;
      }
    }
    // let unit_ratio = this.global.material_unit_ratio[material_id][purchase_unit_id];
    return num;
    // return num * unit_ratio;
  }
  stock_out_qty_valueGetter(params) {
    let data = params.data;
    let num = 0;
    for (let col in data) {
      let arr = col.split("||");
      if (arr[0] == "stock_out" && arr.length == 2) {
        num += data[col] || 0;
      }
    }
    return num;
  }
  stock_qty_valueGetter(params) {
    let data = params.data;
    let stock_in_qty = params.getValue(`stock_in_qty`) || 0;
    let stock_out_qty = params.getValue(`stock_out_qty`) || 0;
    let stock_init_qty = data.stock_init_qty || 0;
    return stock_init_qty + stock_in_qty - stock_out_qty;
  }
  stock_cost_valueGetter(params) {
    let data = params.data;
    let stock_in_cost = params.getValue(`stock_in_cost`) || 0;
    let stock_out_cost = params.getValue(`stock_out_cost`) || 0;
    let start_stock_cost = data.start_stock_cost || 0;
    return start_stock_cost + stock_in_cost - stock_out_cost;
  }
  // 汇总-入库成本
  stock_in_cost_valueGetter(params) {
    let stock_in_detail_list = [];
    let data = params.data;
    let num = 0;
    let material_id = data._material_id;
    if (params.node.rowPinned) {
      stock_in_detail_list = this.index.stock_in_detail_list;
    } else {
      stock_in_detail_list = this.index.stock_in_detail_list.filter(
        (v) => v.material_id[0] == material_id
      );
    }
    stock_in_detail_list.forEach((v) => {
      num += v.purchase_unit_qty * v.purchase_unit_price;
    });
    return num;
  }
  // 汇总-出库成本
  stock_out_cost_valueGetter(params) {
    let data = params.data;
    let num = 0;
    let material_id = data._material_id;
    let stock_out_detail_list = [];
    if (params.node.rowPinned) {
      stock_out_detail_list = this.index.stock_out_detail_list;
    } else {
      stock_out_detail_list = this.index.stock_out_detail_list.filter(
        (v) => v.material_id[0] == material_id
      );
    }
    stock_out_detail_list.forEach((v) => {
      num += v.actual_out_cost;
    });
    return num;
  }
  // 判断该colId是否显示
  isShowColId(colId) {
    let showReg = this.checkedSidebarFilterReg;
    let flag = false;
    let alwaysShowColIds = [
      //   "stock_top_loc_name_group",
      //   "material_name",
      //   "main_unit_name",
      //   "main_unit_test2",
      "main_unit_test2",
    ]; //始终显示
    let alwaysShowColIdsReg = [
      /^main_unit_test\d{1,2}_2$/,
      /^main_unit_name\d{1,2}$/,
    ]; //始终显示
    let alwaysHideColIds = []; //始终隐藏
    // let alwaysHideColIds = ["stock_top_loc_name"]; //始终隐藏
    if (alwaysShowColIds.includes(colId)) {
      flag = true;
      return flag;
    }
    if (alwaysHideColIds.includes(colId)) {
      flag = false;
      return flag;
    }
    // console.log(showReg);
    showReg.visable.forEach((reg) => {
      if (reg.exec(colId + "")) {
        flag = true;
      }
    });
    showReg.other.forEach((reg) => {
      if (reg.exec(colId + "")) {
        flag = true;
      }
    });
    alwaysShowColIdsReg.forEach((reg) => {
      if (reg.exec(colId + "")) {
        flag = true;
      }
    });

    // let [type, day] = colId.split("||");

    // if ((type == "stock_in" || type == "stock_out") && flag) {
    //   let start = Number(this.state.start);
    //   let end = Number(this.state.end);
    //   day = Number(day);
    //   if (day >= start && day <= end) {
    //     flag = true;
    //   } else {
    //     flag = false;
    //   }
    // }
    // console.log(flag);
    return flag;
  }
  isGroupFirstCell(params) {
    // return true;
    let field = params.colDef.field;
    let [type, day] = field.split("||");
    let colIds = [];
    params.columnApi.getColumns().forEach((v) => {
      let [type2, day2] = v.colId.split("||");
      if (type == type2 && v.visible) {
        colIds.push({
          colId: v.colId,
          left: v.left,
        });
      }
    });
    colIds.sort((a, b) => {
      return a.left - b.left;
    });
    return colIds[0].colId == field;
  }
  headerValueGetter(params) {
    return 0;
  }
  setColumnDefs() {
    let _this = this;
    let col = [
      {
        // headerName: "库位",
        headerName: "项目名称",
        field: "main_unit_name1",
        // showRowGroup: "stock_top_loc_name",
        spanHeaderHeight: true,
        // cellRenderer: "agGroupCellRenderer",
        // cellRendererParams:{
        //     suppressCount: false,
        //     innerRenderer: GroupRowInnerRenderer,
        //     editable:false,
        //     checkbox: false,
        // },
        // width: 100,
        colSpan: (params) => {
          // console.log(params);
          //   if (!params.data) {
          //     return 3;
          //   }
          //   if (params.node.rowPinned) {
          //     return 3;
          //   }
          return 1;
        },
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        valueGetter: (params) => {
          if (params.node.rowPinned) {
            // return "成本汇总（￥）";
            return "汇总";
          }
          return params.data.stock_top_loc_name;
        },
        sortable: true, //开启排序
        unSortIcon: true,
      },
      /*
      {
        headerName: "库位",
        field: "stock_top_loc_name",
        width: 70,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => !params.data,
        },
        rowGroup: true,
        hide: true,
        comparator: (a, b) => {
          let list = _this.index.stock_obj["库位"];
          let a_index = 0;
          let b_index = 0;
          try {
            a_index = list.findIndex((v) => v.name == a);
            b_index = list.findIndex((v) => v.name == b);
          } catch (e) {
            console.log(b_index);
          }
          // return a_index - b_index;
          return b_index - a_index;
        },
        // sortable: true, //开启排序
        // unSortIcon: true,
        sort: "desc",
      },
      {
        headerName: "库位",
        field: "stock_top_loc_name_group",
        showRowGroup: "stock_top_loc_name",
        spanHeaderHeight: true,
        cellRenderer: "agGroupCellRenderer",
        // cellRendererParams:{
        //     suppressCount: false,
        //     innerRenderer: GroupRowInnerRenderer,
        //     editable:false,
        //     checkbox: false,
        // },
        width: 100,
        colSpan: (params) => {
          // console.log(params);
          if (!params.data) {
            return 3;
          }
          if (params.node.rowPinned) {
            return 3;
          }
          return 1;
        },
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        valueGetter: (params) => {
          if (params.node.rowPinned) {
            return "成本汇总（￥）";
          }
          return params.data.stock_top_loc_name;
        },
        sortable: true, //开启排序
        unSortIcon: true,
      },
      {
        headerName: "名称",
        field: "material_name",
        width: 100,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => !params.data,
        },
        cellRenderer: nameCellRenderer,
        filter: "agTextColumnFilter",
        sortable: true, //开启排序
        unSortIcon: true,
        comparator: (a, b) => {
          let a_index = _this.material_name_sort[a];
          let b_index = _this.material_name_sort[b];
          // return a_index - b_index;
          return b_index - a_index;
        },
        // sortable: false, //开启排序
        // unSortIcon: false
      },*/
      {
        headerName: "销售",
        field: "main_unit_name2",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "成本",
        field: "main_unit_name3",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "成本%",
        field: "main_unit_name4",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "食材",
        field: "main_unit_name5",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "人工",
        field: "main_unit_name6",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "领用",
        field: "main_unit_name7",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "其他",
        field: "main_unit_name8",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "销售",
        field: "main_unit_name9",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      /**
      {
        headerName: "销售",
        field: "main_unit_name",
        width: 60,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
      },
      {
        headerName: "初始库存",
        field: "stock_init_qty",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        sortable: true, //开启排序
        unSortIcon: true,
        valueFormatter: (params) => {
          if (params.node.rowPinned) {
            return "";
          }
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        hide: !this.isShowColId(`stock_init_qty`),
      },
      {
        headerName: "入库数量",
        field: "stock_in_qty",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        valueGetter: (params) => {
          if (params.data) {
            return this.stock_in_qty_valueGetter(params);
          }
        },
        valueFormatter: (params) => {
          if (params.node.rowPinned) {
            return "";
          }
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        sortable: true, //开启排序
        unSortIcon: true,
        hide: !this.isShowColId(`stock_in_qty`),
      },
      {
        headerName: "出库数量",
        field: "stock_out_qty",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        valueGetter: (params) => {
          if (params.data) {
            return this.stock_out_qty_valueGetter(params);
          }
        },
        valueFormatter: (params) => {
          if (params.node.rowPinned) {
            return "";
          }
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        sortable: true, //开启排序
        unSortIcon: true,
        hide: !this.isShowColId(`stock_out_qty`),
      },
      {
        headerName: "库存数量",
        field: "stock_qty",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        valueGetter: (params) => {
          if (params.data) {
            return this.stock_qty_valueGetter(params);
          }
        },
        valueFormatter: (params) => {
          if (params.node.rowPinned) {
            return "";
          }
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        sortable: true, //开启排序
        unSortIcon: true,
        hide: !this.isShowColId(`stock_qty`),
      },
      {
        headerName: "初始成本",
        menuTabs: [],
        width: 50,
        field: "start_stock_cost",
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        sortable: true, //开启排序
        unSortIcon: true,
        aggFunc: "sum",
        valueFormatter: (params) => {
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        // children:[{
        //     headerValueGetter:params => {
        //         return this.headerValueGetter(params)
        //     },
        //     headerClass:'headerValueGetter',
        // }],
        hide: !this.isShowColId(`start_stock_cost`),
      },
      {
        headerName: "入库成本",
        field: "stock_in_cost",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        sortable: true, //开启排序
        unSortIcon: true,
        aggFunc: "sum",
        valueFormatter: (params) => {
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        valueGetter: (params) => {
          if (params.data) {
            return this.stock_in_cost_valueGetter(params);
          }
        },
        hide: !this.isShowColId(`stock_in_cost`),
      },
      {
        headerName: "出库成本",
        field: "stock_out_cost",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        sortable: true, //开启排序
        unSortIcon: true,
        aggFunc: "sum",
        valueGetter: (params) => {
          if (params.data) {
            return this.stock_out_cost_valueGetter(params);
          }
        },
        valueFormatter: (params) => {
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        hide: !this.isShowColId(`stock_out_cost`),
      },
      {
        headerName: "库存成本",
        field: "stock_cost",
        width: 50,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        sortable: true, //开启排序
        unSortIcon: true,
        aggFunc: "sum",
        valueGetter: (params) => {
          if (params.data) {
            return this.stock_cost_valueGetter(params);
          }
        },
        valueFormatter: (params) => {
          if (!params.value && !this.state.tableConfig.isShowZero) {
            return "";
          }
          return keepTwoDecimal(params.value);
        },
        hide: !this.isShowColId(`stock_cost`),
      },
      {
        headerName: "采购单位",
        field: "purchase_unit_name",
        width: 40,
        menuTabs: [],
        pinned: "left",
        suppressMovable: true,
        spanHeaderHeight: true,
        cellClassRules: {
          bg_gray: (params) => true,
        },
        hide: !this.isShowColId(`purchase_unit_name`),
      },
      */
    ];
    // col = col.concat(this.setColumnDefs_days("stock_in"));
    // col = col.concat(this.setColumnDefs_days("stock_out"));

    col = this.setRowDefs_days(col);
    console.log(col);
    return col;
  }
  setColumnDefs_days(key) {
    let _this = this;
    let col = [
      {
        headerName: key == "stock_in" ? "入库" : "出库",
        field: key,
        menuTabs: [],
        children: [],
      },
    ];
    let dayArr = getDaysArr(this.year_month);
    console.log(dayArr);
    dayArr.forEach((v) => {
      let day = new Date(v).getDate();
      let colItem = {
        headerName: day,
        field: `${key}||${day}`,
        menuTabs: [],
        width: 50,
        // editable: key == 'stock_out',
        // editable: (params) => {
        //   if (params.node.rowPinned) {
        //     return false;
        //   }
        //   return true;
        // },
        // suppressMovable: true,
        // hide: !_this.isShowColId(`${key}||${day}`),
        // cellEditor:
        //   key == "stock_out"
        //     ? stockOutNumberCellEditor
        //     : stockInNumberCellEditor,
        // cellEditorParams: (params) => {
        //   return {
        //     values: {
        //       decimal: true,
        //     },
        //   };
        // },
        // cellClassRules: {
        //   cell_border_left: (params) => {
        //     return _this.isGroupFirstCell(params);
        //   },
        //   bg_gray: (params) => !params.data,
        // },
        // cellRenderer: cellRenderer,
        // valueFormatter:params => {
        //     if(params.node.rowPinned){
        //         return '1231231'
        //     }
        //     return params.value;
        // },
        // valueGetter:(params)=>{
        //     if(params.node.rowPinned){
        //         return '1231231'
        //     }else{
        //         return null
        //     }
        // },
      };
      col[0].children.push(colItem);
    });
    return col;
  }
  setRowDefs_days(col) {
    let _this = this;

    let dayArr = getDaysArr(this.year_month);
    console.log(dayArr);

    dayArr.forEach((v) => {
      let colTemplate = {
        headerName: "",
        field: "",
        menuTabs: [],
        children: [
          {
            headerName: "销售额",
            field: "main_unit_test1",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "成本",
            field: "main_unit_test2",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "食材",
            field: "main_unit_test3",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "人工",
            field: "main_unit_test4",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "领用",
            field: "main_unit_test5",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "其他",
            field: "main_unit_test6",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "成本%",
            field: "main_unit_test7",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "食材%",
            field: "main_unit_test8",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "人工%",
            field: "main_unit_test9",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "领用%",
            field: "main_unit_test10",
            width: 60,
            menuTabs: [],
          },
          {
            headerName: "其他%",
            field: "main_unit_test11",
            width: 60,
            menuTabs: [],
          },
        ],
      };
      let day = parseInt(v.split("-")[2]);
      colTemplate.headerName = day + "";
      colTemplate.field = "main_unit_test" + day;
      colTemplate.children.forEach((item, index) => {
        item.field = colTemplate.field + "_" + (index + 1);
        item.hide = !this.isShowColId(item.field);
      });
      col.push(colTemplate);
    });
    return col;
  }
  // 单元格改变
  onCellValueChanged(params) {
    console.log("----onCellValueChanged----");
    let data = params.data;
    let value = params.newValue || 0;
    value = Number(value);
    let colId = params.colDef.field;
    let [type, day] = colId.split("||");
    let { _material_id } = data;

    if (
      !this.isStockOutCanFastInput(_material_id, day) &&
      type == "stock_out"
    ) {
      data[colId] = params.oldValue;
      this.gridOptions.api.applyTransactionAsync(
        { update: [data] },
        (res) => {}
      );
    }

    if (this.isStockOutCanFastInput(_material_id, day) && type == "stock_out") {
      let date = this.year_month + "-" + day.padStart(2, "0");
      let list = this.index.stock_out_detail_list.filter(
        (v) => v.material_id[0] == _material_id && v.date == date
      );
      if (list.length == 0 && value != 0) {
        let item = {
          id: add_stock_out_detail_id(),
          main_unit_qty: value,
          isChanged: true,
        };
        this.updataStockOutDetailList({
          material_id: _material_id,
          date: date,
          list: [item],
          delIds: [],
        });
      }
      if (list.length == 1) {
        if (value == 0) {
          this.updataStockOutDetailList({
            material_id: _material_id,
            date: date,
            list: [],
            delIds: [list[0].id],
          });
        } else {
          list[0].main_unit_qty = value;
          list[0].isChanged = true;
          this.updataStockOutDetailList({
            material_id: _material_id,
            date: date,
            list: list,
            delIds: [],
          });
        }
      }
    }

    if (!this.isStockInCanFastInput(_material_id, day) && type == "stock_in") {
      data[colId] = params.oldValue;
      this.gridOptions.api.applyTransactionAsync(
        { update: [data] },
        (res) => {}
      );
    }

    if (this.isStockInCanFastInput(_material_id, day) && type == "stock_in") {
      let date = this.year_month + "-" + day.padStart(2, "0");
      let list = this.index.stock_in_detail_list.filter(
        (v) => v.material_id[0] == _material_id && v.date == date
      );
      if (list.length == 0 && value != 0) {
        let item = {
          id: add_stock_in_detail_id(),
          purchase_unit_qty: value,
          isChanged: true,
        };
        this.updataStockInDetailList({
          material_id: _material_id,
          date: date,
          list: [item],
          delIds: [],
        });
      }
      if (list.length == 1) {
        if (value == 0) {
          this.updataStockInDetailList({
            material_id: _material_id,
            date: date,
            list: [],
            delIds: [list[0].id],
          });
        } else {
          list[0].purchase_unit_qty = value;
          list[0].isChanged = true;
          this.updataStockInDetailList({
            material_id: _material_id,
            date: date,
            list: list,
            delIds: [],
          });
        }
      }
    }
    // this.gridOptions.api.redrawRows({ rowNodes: [params.node] });
  }
  // 右键菜单
  setAGMenus(e) {
    // console.log('-------setAGMenus-------');
    // console.log(e);
    let node = e.node || {};
    // console.log(node.rowIndex);
    if (!node.data) {
      return;
    }
    if (!e.column) {
      return;
    }
    if (node.rowPinned == "top") {
      return;
    }
    let _this = this;
    let menus = [];
    let data = node.data;
    let material_id = data._material_id;
    let material_name = data.material_name;
    let colId = e.column.colId;
    let [type, day] = colId.split("||");
    if (type != "stock_out" && type != "stock_in") {
      return;
    }
    if (type == "stock_out") {
      let date = this.year_month + "-" + day.padStart(2, "0");
      menus.push({
        name: material_name + " [" + date + "] 出库详情",
        action: () => {
          _this.openStockOutModal({
            material_id: material_id,
            day: day,
          });
        },
      });
    }
    if (type == "stock_in") {
      let date = this.year_month + "-" + day.padStart(2, "0");
      menus.push({
        name: material_name + " [" + date + "] 入库详情",
        action: () => {
          _this.openStockInModal({
            material_id: material_id,
            day: day,
          });
        },
      });
    }
    // menus.push({
    //     name: material_name+' 食材详情',
    //     action: () => {
    //         _this.openCreatMaterialModal({id: material_id});
    //     }
    // });
    // menus.push({
    //     name: '创建食材 至【'+data.stock_top_loc_name+'】',
    //     action: () => {
    //         _this.openCreatMaterialModal({stock_top_loc_id:data.stock_top_loc_id},(res)=>{
    //             _this.addRow({
    //                 ...res,
    //                 stock_top_loc_id:data.stock_top_loc_id,
    //                 stock_top_loc_name:data.stock_top_loc_name
    //             })
    //         });
    //     }
    // });
    return menus;
  }
  addRow(data) {
    this.addRowMaxId++;

    // this.global.material_item[material_id] = {
    //     material_name:data.name.split('-')[0],
    //     material_id:material_id,
    //     main_unit_name:this.global.material_purchase_unit_category[data.main_unit_id].name,
    //     main_unit_id:data.main_unit_id,
    //     avg_main_unit_price:0,
    //     purchase_unit_name:this.global.material_purchase_unit_category[data.purchase_unit_id].name,
    //     purchase_unit_id:data.purchase_unit_id,
    // };
    let material_id = data.id;
    let material = this.global.material_item[material_id];

    let rowItem = {
      id: this.addRowMaxId,
      avg_main_unit_price: 0,
      cost_center_id: [],
      main_unit_id: [material.main_unit_id, material.main_unit_name],
      main_unit_name: material.main_unit_name,
      material_id: [material_id, material.material_name],
      material_name: material.material_name,
      period_in_cost: "",
      period_in_qty: "",
      period_out_cost: "",
      period_out_qty: "",
      purchase_unit_id: [
        material.purchase_unit_id,
        material.purchase_unit_name,
      ],
      purchase_unit_name: material.purchase_unit_name,
      purchase_unit_price: "",
      sel_weight: "2",
      start_stock_cost: 0,
      start_stock_qty: 0,
      stock_cost: 0,
      stock_in_cost: 0,
      stock_init_qty: 0,
      stock_qty: 0,
      stock_top_loc_id: [data.stock_top_loc_id, data.stock_top_loc_name],
      stock_top_loc_name: data.stock_top_loc_name,
      _material_id: material_id,
    };
    this.gridOptions.api.applyTransactionAsync({ add: [rowItem] }, (res) => {});
  }
  SetAGOptions() {
    let _this = this;
    let cols = this.setColumnDefs();
    let rowData = this.rowData;
    let pinnedTopRowData = this.pinnedTopRowData;
    console.log("-----SetAGOptions----");
    let grid_options = init_grid_options();
    this.gridOptions = Object.assign({}, grid_options, {
      // suppressGroupRowsSticky:false,
      // turns OFF row hover, it's on by default
      suppressRowHoverHighlight: false,
      // turns ON column hover, it's off by default
      columnHoverHighlight: true,

      groupDisplayType: "custom",
      columnDefs: cols,
      rowData: rowData,
      defaultColDef: {
        // initialWidth: 200,
        wrapHeaderText: true,
        // autoHeaderHeight: true,
        editable: (params) => {
          return false;
        },
        resizable: true, //是否可以调整列大小，就是拖动改变列大小
        filter: true, //开启刷选
        lockPinned: true,
      },
      rowDragManaged: true,
      suppressMoveWhenRowDragging: true,
      animateRows: true,
      groupHeaderHeight: 30,
      headerHeight: 30,
      context: {
        owl_widget: _this,
      },
      // autoGroupColumnDef: {
      //     minWidth: 300,
      // },
      groupDefaultExpanded: 0, //0
      // autoGroupColumnDef: {
      //     sort: 'desc',
      //     minWidth: 300,
      // },
      // groupRowRendererParams: {
      //     suppressCount: true,
      //     innerRenderer: GroupRowInnerRenderer,
      //     editable:false,
      //     checkbox: false,
      // },
      valueCache: 1,
      onCellValueChanged: (e) => {
        _this.onCellValueChanged(e);
      },
      onCellEditingStarted: (e) => {
        _this.state.isEditing = true;
      },
      onCellEditingStopped: (e) => {
        _this.state.isEditing = false;
      },
      getContextMenuItems: (e) => {
        return _this.setAGMenus(e);
      },
      getRowId: (params) => {
        return params.data.id;
      },
      onGridReady: function (params) {
        // let defaultSortModel = [
        //     { colId: 'stock_top_loc_name', sort: 'desc', sortIndex: 0 },
        // ];
        // params.columnApi.applyColumnState({ state: defaultSortModel });
      },
      onFilterChanged: (params) => {
        // console.log('-------onFilterChanged----------');
        // _this.gridOptions.api.redrawRows();
      },
      // singleClickEdit: true,
      stopEditingWhenCellsLoseFocus: true,
      // getRowStyle: params => {
      //     if (params && params.node && params.node.data && (params.node.data.weekdayStr == '六'||params.node.data.weekdayStr == '日')) {//周末背景色
      //         return { background: 'rgb(255 252 217)' };
      //     }
      // }
      pinnedTopRowData: pinnedTopRowData,
      getRowStyle: (params) => {
        if (params.node.rowPinned) {
          return { backgroundColor: "#f5f7f7" };
        }
      },
    });
  }
  RenderAG() {
    // console.log('RenderAG');
    this.SetAGOptions();
    this.agGrid = new agGrid.Grid(this.myGrid_ref.el, this.gridOptions);

    onFullscreenChange((e) => {
      return this.onFullscreenChange(e);
    });
  }
  // 弃用
  getCellData() {
    let newCellData = {};
    let oldCellData = this.oldCellData;
    let rowData = this.getRowData();
    rowData.forEach((v) => {
      for (let col in v) {
        let arr = col.split("||");
        let day = arr[1];
        if (arr[0] == "stock_out" && arr.length == 2 && v[col] != null) {
          let key = "stock_out||" + v._material_id + "||" + day;
          let id = v[`stock_out||${day}||id`];
          if (oldCellData[key]) {
            id = oldCellData[key].id;
          }
          newCellData[key] = {
            qty: v[col],
            id: id || 0,
          };
        }
      }
    });
    return newCellData;
  }
  // 弃用
  // 比较成本数据
  compareCellData = (newData, oldData) => {
    let updatalist = [];
    let addList = [];
    let delIds = [];
    for (let key in newData) {
      let [type, material_id, day] = key.split("||");
      day = day.padStart(2, "0");
      let date = this.year_month + "-" + day;
      let item = {
        main_unit_qty: newData[key].qty,
        date: date,
        material_id: formatId(material_id),
        main_unit_id: this.global.material_item[material_id].main_unit_id,
      };
      if (!oldData[key]) {
        item.id = add_stock_out_detail_id();
        addList.push(item);
      } else if (newData[key].qty != oldData[key].qty) {
        item.id = newData[key].id;
        updatalist.push(item);
      }
    }
    for (let key in oldData) {
      if (!newData[key]) {
        // console.log(oldData[key]);
        delIds.push(oldData[key].id);
      }
    }
    return { updatalist, addList, delIds };
  };
  getRowData(material_id) {
    let rowData = [];
    // console.log(id);
    this.gridOptions.api.forEachNode(function (node) {
      // console.log(node);
      if (node.data) {
        if (material_id) {
          node.data._material_id == material_id && rowData.push(node.data);
        } else {
          rowData.push(node.data);
        }
      }
    });
    // console.log(rowData);
    return rowData;
  }
}

Root.template = "Month_stock_Root";

Root.props = {
  year_month: { type: String },
  LoadData: { type: Function, optional: true },
  MonthStockUpdateData: { type: Function, optional: true },
  toggleMenuMode: { type: Function, optional: true },
  MonthStockUpdateUserSettings: { type: Function, optional: true },
  MonthStockGoToMaterialBatch: { type: Function, optional: true },
  MonthStockGoToMonthReport: { type: Function, optional: true },
  MonthStockGoToStock: { type: Function, optional: true },
};

// console.log(t_root);
// console.log(init_grid_options);

Root.components = {
  Toast,
  StockOutModal,
  StockInModal,
  CreatMaterialModal,
};

export { Root };
