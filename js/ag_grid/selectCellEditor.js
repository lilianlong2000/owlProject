/** @odoo-module **/
import {formatId} from "./tool.js";
/** @odoo-module **/
class cellEditor{
    // 创建编辑器后调用一次
    init(params){
        // console.log(params);
        let _this = this;
        this.charPress = params.charPress;
        this.params = params;
        this.owl = params.context.owl_widget;
        this.selectList = params.values;
        this.data = params.data;
        this.field = params.colDef.field;

        this.activeIndex = -1;

        let value = params.value || '';

        this.oldValue = value;
        this.currentValue = value;

        let el = document.createElement('div');
        let _html = '';

        _html += `<input type="text" class="form-control" style="font-size: 12px;padding: 5px 4px;" placeholder="请输入"/>`;
        _html += `<div class="result" style="overflow-y: auto;height: 200px;"><ul class="list-group list-group-flush resultData"></ul></div>`;//max-height: 200px;
        el.innerHTML = _html;
        this.el = el;
        this.inputEl = this.el.querySelector('input');
        this.bindInput();

        // el.querySelectorAll('li').forEach(function (e){
        //     e.addEventListener('click',function (){
        //         _this.bindClick(e);
        //     })
        // });

    }

    // 插入elementNode
    getGui(){
        return this.el;
    }
    // 将值发送到当前的表格
    getValue(){
        return this.currentValue;
    }
    // 编辑开始前调用
    isCancelBeforeStart() {
        return false;
    }
    // 编辑结束后返回一次
    // 如果返回true,编辑结果失效
    isCancelAfterEnd(){
        if(this.currentValue == this.oldValue){
            return true;
        }else{
            return false;
        }
    }

    afterGuiAttached(){
        let charPress = this.charPress;
        this.inputEl.value = '';
        this.inputEl.focus();
        if(charPress){
            this.inputEl.value = charPress;
        }else if(this.currentValue){
            // console.log('----------');
            // console.log(this.currentValue);
            let filter = this.selectList.filter(v=> v.id == this.currentValue);
            if(filter.length>0){
                this.inputEl.value = filter[0].name;
            }
        }else{
            // 没有值
        }
        this.setResult(1);
    }

    isPopup(){
        return true
    }

    // getPopupPosition(){
    //     return 'under'
    // }
    bindInput(){
        let _this = this;
        let _input = this.inputEl;
        _input.onkeyup = (e) => {
            // 按键监听
            // console.log(e.keyCode);
            // console.log(e.which);
            if(e.which === 40){
                _this.keyDown();
            }else if(e.which === 38){
                _this.keyUp();
            }else if(e.which === 13){
                _this.keyEnter();
            }else{
                _this.setResult();
            }
        }

        _input.onkeydown = (e) => {
            if(e.which === 13 && _this.activeIndex != -1){
                e.stopPropagation();
            }
            if(e.which === 13){
                e.stopPropagation();
            }
            if(e.which === 40){
                e.stopPropagation();
            }
            if(e.which === 38){
                e.stopPropagation();
            }
        };

        // _input.onchange = (e) => {
        //     _this.activeIndex = -1;
        //     _this.updataActive();
        // }
    }
    setResult(flag){
        this.activeIndex = -1;
        let _this = this;
        let el = this.el;
        let _input = this.inputEl;
        let str = '';
        let count = 0;
        let value_name = _input.value.trim();
        if(value_name){
            this.selectList.forEach((v,i)=>{
                if(v.name == value_name){
                    str += `<li class="list-group-item clearfix" data-id="${v.id}" data-name="${v.name}">${v.name}</li>`;
                    count++;
                }
            });
        }
        if(flag){
            this.selectList.forEach((v,i)=>{
                if(v.name != value_name){
                    str += `<li class="list-group-item clearfix" data-id="${v.id}" data-name="${v.name}">${v.name}</li>`;
                    count++;
                }
            });
        }else{
            this.selectList.forEach((v,i)=>{
                if(value_name && v.name.includes(value_name) && v.name != value_name){
                    str += `<li class="list-group-item clearfix" data-id="${v.id}" data-name="${v.name}">${v.name}</li>`;
                    count++;
                }
                if(!value_name){
                    str += `<li class="list-group-item clearfix" data-id="${v.id}" data-name="${v.name}">${v.name}</li>`;
                    count++;
                }
            });
        }

        if(count == 0){
            str += `<li class="list-group-item text-danger" data-id="tips">没有结果</li>`;
        }
        el.getElementsByTagName('ul')[0].innerHTML = str;
        el.querySelectorAll('li').forEach(function (e){
            e.addEventListener('click',function (){
                _this.bindClick(e);
            })
        });
    }
    keyUp(){
        if(this.activeIndex != -1){
            this.activeIndex--;
        }
        this.updataActive();
    }
    keyDown(){
        if(this.el.querySelectorAll('li').length == this.activeIndex+1){
            this.activeIndex = -1;
        }else{
            this.activeIndex++;
        }
        this.updataActive();
    }

    keyEnter(){
        // console.log('keyEnter');
        let _this = this;
        let activeIndex = _this.activeIndex;
        if(activeIndex == -1){
            activeIndex = 0
        }
        this.el.querySelectorAll('li').forEach(function (e,i){
            if(i == activeIndex){
                _this.bindClick(e);
            }
        });
    }

    bindClick(e){
        // console.log('bindClick');
        // console.log(e);
        let _this = this;
        let id = e.getAttribute('data-id')||'';
        let name = e.getAttribute('data-name');
        if(id == 'tips'){

        }else{
            this.currentValue = formatId(id);
            this.params.stopEditing();
        }
    }

    updataActive(){
        let _this = this;
        // console.log('updataActive');
        this.el.querySelectorAll('li').forEach(function (e,i){
            if(i == _this.activeIndex){
                e.classList.add('active');
            }else{
                e.classList.remove('active');
            }
        });
    }
}


export default cellEditor
