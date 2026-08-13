import App from "@renderer/App"
import DialogApp from "@renderer/DialogApp"
import PreferencesApp from "@renderer/PreferencesApp"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// Styles
import "@renderer/styles/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("Root element #root not found in index.html.")

/**
 * The shell this window renders, picked from the route it was loaded on.
 * @returns The root component for this window.
 */
function resolveApp() {
    if (window.location.hash.startsWith("#/dialog")) return <DialogApp />
    if (window.location.hash.startsWith("#/preferences")) return <PreferencesApp />

    return <App />
}

createRoot(root).render(<StrictMode>{resolveApp()}</StrictMode>)
