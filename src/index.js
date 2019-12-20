import React from "react";
import ReactDOM from "react-dom";

import "./styles.css";
import Calendar from "./Calendar";

function App() {
  return <Calendar />;
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
