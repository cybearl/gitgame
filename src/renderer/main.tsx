import App from "@renderer/App"
import DialogApp from "@renderer/DialogApp"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// Styles
import "@renderer/styles/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("Root element #root not found in index.html.")

/**
 * The dialog windows load the same bundle on the `#/dialog` route, rendering the
 * Win95-styled dialog instead of the main application shell.
 */
const isDialogWindow = window.location.hash.startsWith("#/dialog")

createRoot(root).render(<StrictMode>{isDialogWindow ? <DialogApp /> : <App />}</StrictMode>)
