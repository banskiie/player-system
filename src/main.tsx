import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

import { ThemeProvider } from "@emotion/react"
import { base } from "./theme/theme.ts"
import { BrowserRouter } from "react-router-dom"

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <BrowserRouter>
    <ThemeProvider theme={base}>
      <App />
    </ThemeProvider>
  </BrowserRouter>
  // </React.StrictMode>
)
