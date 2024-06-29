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
    reactive,
    App,
    useComponent
} = owl;

import {Root} from './app.js'
let year_month = `2023-12`;

let reactive_state = reactive({
    year_month
})

class Parent extends Component {
    setup() {

        onError(err => {
            console.log(err.cause.message);
            alert(err.cause.message);
        })

        this.state = useState(reactive_state);

    }
}

Parent.template = xml`
    <Root  year_month="state.year_month" />
`
Parent.components = {
    Root,
}

whenReady(async () => {
    let templates = await loadFile('./xml/app.xml');

    let app = new App(Parent, {
        env: {
            update_year_month(y_m) {
                reactive_state.year_month = y_m;
            }
        },
        dev: true,
    });

    app.addTemplates(templates);

    app.mount(document.body);
});

