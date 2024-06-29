/** @odoo-module **/
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

class Toast extends Component {
    static template = 'Month_stock_Toast';
    static props = {
        is_open: {type: Boolean},
        data: {type: Object}
    };

    setup() {
        onMounted(() => {
            let _this = this;
            this.Modal = new bootstrap.Modal('#toast', {});

            document.getElementById('toast').addEventListener('hidden.bs.modal', event => {
                _this.env.closeToast();
            })
        })

        onWillUpdateProps(nextProps => {
            // console.log(nextProps);
            if (nextProps.is_open) {
                return this.open(nextProps.data);
            }
        });

        this.handleOnConfirm = _.debounce(this.onConfirm,300);
        this.handleOnCancel = _.debounce(this.onCancel,300);
    }

    open(data) {
        this.Modal.show();
    }

    onConfirm() {
        if (typeof (this.props.data.onConfirm) == 'function') {
            this.props.data.onConfirm();
        }
        this.Modal.hide();
    }

    onCancel(){
        if (typeof (this.props.data.onCancel) == 'function') {
            this.props.data.onCancel();
        }
        this.Modal.hide();
    }
}
export {
    Toast
}

