<p align="center">
  <br />
  <a href="https://cybearl.com" target="_blank"><img width="100px" src="https://cybearl.com/_next/image?url=%2Fassets%2Fimages%2Flogo%2Foriginal.webp&w=128&q=75" /></a>
  <h2 align="center">@cybearl/gitgame</h2>
  <p align="center">A small CLI tool to simplify UE5-based game development with Git LFS.</p>
</p>

## Development setup
This project runs on [Deno](https://deno.com/) and uses [Biome](https://biomejs.dev/) for formatting/linting.
Because there is no `node_modules` directory, the Biome VS Code extension cannot auto-discover its binary,
it has to be installed locally and pointed at via your **user** settings.

### 1. Install Biome
```powershell
winget install BiomeJS.Biome
```

On other platforms, see the [Biome install docs](https://biomejs.dev/guides/manual-installation/).

### 2. Locate the binary
Winget installs it to a path like:

```
C:\Users\<you>\AppData\Local\Microsoft\WinGet\Packages\BiomeJS.Biome_Microsoft.Winget.Source_8wekyb3d8bbwe\biome.exe
```

### 3. Point the VS Code extension at it
Open your **User** `settings.json` (Ctrl+Shift+P → "Preferences: Open User Settings (JSON)") and add:

```json
"biome.lsp.bin": "C:/Users/<you>/AppData/Local/Microsoft/WinGet/Packages/BiomeJS.Biome_Microsoft.Winget.Source_8wekyb3d8bbwe/biome.exe",
"biome.suggestInstallingGlobally": false
```

Reload the window and the Biome extension will pick it up.
