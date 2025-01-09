import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
//import React from "react";

const startApp = async () => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    //<React.StrictMode>
      <App />
    //</React.StrictMode>
  );
};

startApp();
