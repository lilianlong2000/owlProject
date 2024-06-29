/** @odoo-module **/
import {keepTwoDecimal} from "./tool.js";
class cellEditor{
    // 创建编辑器后调用一次
    init(params){
        // console.log(params);
        // let _this = this;
        this.params = params;
        this.charPress = params.charPress;
        this.owl = params.context.owl_widget;
        this.data = params.data;
        this.field = params.colDef.field;
        let value = params.value == null ? '':params.value;
        this.value = value;
        this.min = '';
        this.max = '';
        if(params.values){
            let {decimal,min,max} = params.values;
            this.isDecimal = decimal?true:false;
            // this.min = (min+'' == 'undefined')?'':min;
            // this.max = (max+'' == 'undefined')?'':max;
        }
        let el = document.createElement('div');//form-control form-control-sm
        el.className = 'cellEditor';
        let _html = '<input type="text" class="input form-control numberCellEditor-input" oninput="value=value.replace(/[^\\d.]/g,\'\')">';
        el.innerHTML = _html;
        this.el = el;
        this.input = this.el.querySelector('.input')
        this.bindInput();
    }

    // 插入elementNode
    getGui(){
        return this.el;
    }
    // 将值发送到当前的表格
    getValue(){
        let value;
        if(this.value != ''){
            if(this.isDecimal){
                value = keepTwoDecimal(this.value) || 0;
            }else{
                value = parseInt(this.value) || 0;
            }
        }else{
            value = this.value;
        }
        return value
    }
    // 编辑开始前调用
    isCancelBeforeStart() {
        return false;
    }
    // 编辑结束后返回一次
    // 如果返回true,编辑结果失效
    isCancelAfterEnd(){
        return false;
    }
    afterGuiAttached(){
        let material_id = this.data._material_id;
        let day = this.field.split('||')[1];
        if(this.owl.isStockOutCanFastInput(material_id,day)){
            this.input.value = '';
            this.input.focus();
            this.input.value = this.charPress || this.value;
        }else{
            this.owl.openStockOutModal({
                material_id:material_id,
                day:day
            });
            this.params.stopEditing();
        }
    }

    isPopup(){
        return false
    }

    // getPopupPosition(){
    //     return 'under'
    // }
    bindInput(){
        this.input.onkeyup = (e) => {
            this.value = this.input.value+'';
        }
    }
}


export default cellEditor
