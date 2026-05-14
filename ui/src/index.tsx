/* @refresh reload */
import { render } from "solid-js/web";
import { App } from "./app";

import "uno.css";
import "./styles.css";

const root = document.querySelector("#root");

if (!(root instanceof HTMLElement)) {
  throw new Error("Root element not found");
}

render(() => <App />, root);
