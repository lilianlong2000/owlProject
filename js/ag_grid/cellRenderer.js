/** @odoo-module **/
// 份数 单价
class cellRenderer {
    init(params) {
        let el = document.createElement('div');
        if (params.value == "" || params.value == undefined){
            this.eGui = el;
            return;
        }
        let value = params.value || '';

        if(params.node.rowPinned){
            let html = `<span class="numValue">${value}</span>`;
            el.innerHTML = html;
            this.eGui = el;
            return;
        }

        let data = params.data;

        this.params = params;
        this.data = data;
        this.owl = params.context.owl_widget;
        let [type,day] = params.colDef.field.split('||');
        let classArr = [];
        let tips = [];
        let is_error_bg = false;
        let isChanged = false;

        if(type == 'stock_out'){
            let checkResult = this.owl.checkStockOut(params);
            let {isCheck,errorTips} = checkResult;
            if(!isCheck){
                is_error_bg = true;
                tips.push(errorTips);
            }
            isChanged = this.owl.checkIsChangedStockOut(params);
        }
        if(type == 'stock_in'){
            isChanged = this.owl.checkIsChangedStockIn(params);
        }

        tips.length > 0 && classArr.push('text-red-underline');


        let _html = '';
        if(tips.length>0){
            is_error_bg && (el.className = 'cell-error');
            el.setAttribute('data-bs-toggle','tooltip');
            el.setAttribute('data-bs-trigger','hover');
            el.setAttribute('data-bs-placement','bottom');
            el.setAttribute('data-bs-title',`${tips.join('，')}`);
        }

        _html += `<span class="numValue ${tips.length>0?'text-red-underline':''} ${isChanged?'fw-bold':''}">${value}</span>`;
        el.innerHTML = _html;

        let tooltip;
        let TooltipEl = tips.length>0 && el;
        TooltipEl && (tooltip = bootstrap.Tooltip.getOrCreateInstance(TooltipEl));

        this.eGui = el;
        this.tooltip = tooltip;

        this.eGui.addEventListener('click', (event)=>{
            event.stopPropagation();
            tooltip && tooltip.hide();
        });
    }

    getGui() {
        return this.eGui;
    }

    refresh(params) {
        return false;
    }

    destroy() {
        this.tooltip && this.tooltip.dispose();
    }
}

export default cellRenderer
