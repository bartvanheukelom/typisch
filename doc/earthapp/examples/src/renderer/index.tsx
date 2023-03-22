import React from "react"

import ReactDOM from "react-dom"
import './importIcons'
import {sendLogsToRenderer} from "@typisch/electron/utils";
import {appHooks} from "@typisch/eui/euiApp";

sendLogsToRenderer()

function render() {
    ReactDOM.render(<App />, document.getElementById("root"));
}
render()

function App() {

    const app = appHooks();

    // TODO react error boundary
    return <React.Fragment>

        <app.comps />

        <div>Main Content Here</div>

    </React.Fragment>
}
