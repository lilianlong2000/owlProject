/** @odoo-module **/
let make_add_function = () => {

    let id = 1;

    return () => {
        return `virtual${id++}`;
    }

};
const getMonths = (num) => {
    let dataArr = [];
    let data = new Date();
    // let year = data.getFullYear();
    data.setMonth(data.getMonth()+1, 1)//获取到当前月份,设置月份
    for (let i = 0; i < num; i++) {
        data.setMonth(data.getMonth() - 1);//每次循环一次 月份值减1
        let m = data.getMonth() + 1;
        m = m < 10 ? "0" + m : m;
        dataArr.push(data.getFullYear() + "-" + (m))
    }
    return dataArr;
};
const getDaysArr = (year_month) =>{
    let y = year_month.split('-')[0];
    let m = Number(year_month.split('-')[1])
    let m_str = m>=10?m:'0'+m;

    let today = new Date();
    let today_m = today.getMonth()+1;
    let today_d = today.getDate();

    // 获取指定月份天数
    let days = new Date(y,m,0).getDate();
    let arr = [];
    for (let i = 1; i <= days; i ++) {
        if(today_m == m && i>today_d){
            //未来的时间不输出
        }else{
            let day_str = i>=10?i:'0'+i;
            arr.push(`${y}-${m_str}-${day_str}`)
        }
    }
    return arr;
};

const getWeekDaysArr = (date) => {
    let today = new Date(date);

    let year = today.getFullYear(); //本年
    let month = today.getMonth()+1; //本月
    let day = today.getDate(); //本日
    let newDate = new Date(year+"-"+month+"-"+day+" 00:00:00"); //年月日拼接

    let nowTime  = newDate.getTime(); //当前的时间戳
    let weekDay = newDate.getDay(); //当前星期 0.1.2.3.4.5.6 【0 = 周日】
    let oneDayTime = 24*60*60*1000; //一天的总ms
    for(let i = 0; i　< 7; i++) {
        let time = (i-weekDay) * oneDayTime + nowTime;
        let date = new Date(time);
        days.push(formatDate(date,'yyyy-mm-dd'))
    }
    let days = [];

    return days;
};

const formatDate = (date,format) => {
    let dateArr = {
        'y+': date.getFullYear(),
        'm+': date.getMonth() + 1,
        'd+': date.getDate(),
        'H+': date.getHours(),
        'M+': date.getMinutes(),
        'S+': date.getSeconds(),
    }
    for (let i in dateArr) {
        let re = new RegExp('(' + i + ')');
        format = format.replace(re, () => dateArr[i] < 10 ? '0' + dateArr[i] : dateArr[i]);
    }
    return format
};

// 该日期所在的周
const getWeekByDay = (date) =>{
    let _Date = new Date(date);
    let year = _Date.getFullYear(); //本年
    let month = _Date.getMonth()+1; //本月
    let day = _Date.getDate(); //本日
    let week = _Date.getDay();//星期
    week = week == 0 ? 6:week-1;
    let oneDayTime = 24*60*60*1000; //一天的总ms

    let monthStartTime = new Date(year+"-"+month+"-1"+" 00:00:00").getTime();

    let monthEndTime = new Date(year+"-"+(month+1)+"-1"+" 00:00:00").getTime()-oneDayTime;

    let startTime = _Date.getTime() - (oneDayTime*week);
    let endTime = startTime + (oneDayTime*6);

    if(startTime<monthStartTime){
        startTime = monthStartTime
    }
    if(endTime>monthEndTime){
        endTime = monthEndTime
    }
    return {
        start:formatDate(new Date(startTime),'yyyy-mm-dd'),
        end:formatDate(new Date(endTime),'yyyy-mm-dd')
        // start:startTime,
        // end:endTime
    }
};

const keepTwoDecimal = (num) =>{
    num = Number(num) || 0;
    let result = parseFloat(num);
    result = Math.round(num*100)/100;
    return result;
}

const formatId = (id) =>{
    id = id+'';
    if(id.trim() == ''){
        return ''
    }else if(id.startsWith('virtual')){
        return id.trim();
    }else if(!isNaN(Number(id))){
        id = Number(id);
        return id;
    }else{
        return id;
    }
};

//全屏
const fullScreen = () => {
    const element = document.documentElement; //若要全屏页面div
    // const element = document.querySelector(".fullScreen_panorama");
    //IE 10及以下ActiveXObject
    if (window.ActiveXObject) {
        const WsShell = new ActiveXObject('WScript.Shell');
        WsShell.SendKeys('{F11}');
        //写全屏后的执行函数
    }
    //HTML W3C 提议
    else if (element.requestFullScreen) {
        element.requestFullScreen();
        //写全屏后的执行函数
    }
    //IE11
    else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
        //写全屏后的执行函数
    }
    // Webkit (works in Safari5.1 and Chrome 15)
    else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen();
        //写全屏后的执行函数
    }
    // Firefox (works in nightly)
    else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
        //写全屏后的执行函数
    } else {
        alert("此设备不支持 Fullscreen API")
    }

}

//退出全屏
const fullExit = () => {
    const element= document.documentElement;//若要全屏页面中
    // const element = document.querySelector(".fullScreen_panorama");
    //IE ActiveXObject
    if (window.ActiveXObject) {
        const WsShell = new ActiveXObject('WScript.Shell');
        WsShell.SendKeys('{F11}');
        //写退出全屏后的执行函数
    }
    //HTML5 W3C 提议
    else if (element.requestFullScreen) {
        document.exitFullscreen();
        //写退出全屏后的执行函数
    }
    //IE 11
    else if (element.msRequestFullscreen) {
        document.msExitFullscreen();
        //写退出全屏后的执行函数
    }
    // Webkit (works in Safari5.1 and Chrome 15)
    else if (element.webkitRequestFullScreen) {
        document.webkitCancelFullScreen();
        //写退出全屏后的执行函数
    }
    // Firefox (works in nightly)
    else if (element.mozRequestFullScreen) {
        document.mozCancelFullScreen();
        //写退出全屏后的执行函数
    }
}

const onFullscreenChange=(fn)=>{
    document.addEventListener('fullscreenchange', function(e){ /*code*/fn(e) });
    document.addEventListener('webkitfullscreenchange', function(e){ /*code*/fn(e)});
    document.addEventListener('mozfullscreenchange', function(e){ /*code*/fn(e)});
    document.addEventListener('MSFullscreenChange', function(e){ /*code*/fn(e)});
}
const toObj = (arr,k) => {
    let _Obj = {};
    for(let i = 0; i　< arr.length; i++) {
        _Obj[arr[i][k]] = arr[i];
    }
    return _Obj;
};
const isChineseStr = (str) => {
    return /^[\u4E00-\u9FA5]+$/.test(str)
}
const formatPrice = (price) => {
    price = '' + price;
    price = price
        .replace(/\s*/g,"") //去除字符串内所有的空格
        .replace(/[^\d.]/g, '') // 清除“数字”和“.”以外的字符
        .replace(/\.{2,}/g, '.') // 只保留第一个. 清除多余的
        .replace('.', '$#$')
        .replace(/\./g, '')
        .replace('$#$', '.')
        .replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3'); // 只能输入两个小数
    // if (price.indexOf('.') < 0 && price != '') {
    //     // 以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额
    //     price = parseFloat(price);
    // }
    // if (price[0] == '0' && price != '') {
    //     // 以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额
    //     price = parseFloat(price);
    // }
    if(price != ''){
        price = Number(price);
    }
    return price;
};

const add_stock_out_detail_id = make_add_function();
const add_stock_in_detail_id = make_add_function();
const add_material_item_id = make_add_function();
const add_material_item_bom_unit_ratio_id = make_add_function();

export {
    toObj,
    getWeekByDay,
    onFullscreenChange,
    fullScreen,fullExit,
    getMonths,getDaysArr,getWeekDaysArr,keepTwoDecimal,formatId,add_stock_out_detail_id,add_stock_in_detail_id,add_material_item_id,add_material_item_bom_unit_ratio_id,isChineseStr,formatPrice

}
