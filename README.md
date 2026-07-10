<p align="center">
  <br />
  <a href="https://cybearl.com" target="_blank"><img width="100px" src="https://cybearl.com/_next/image?url=%2Fassets%2Fimages%2Flogo%2Foriginal.webp&w=128&q=75" /></a>
  <h2 align="center">@cybearl/gitgame</h2>
  <p align="center">A small tool with a web interface to simplify UE5-based game development with Git LFS.</p>
</p>

## Installation
### Prerequisites
- [Node.js](https://nodejs.org) 22 or newer
- [Yarn](https://classic.yarnpkg.com) 1.x (classic)

### App
```bash
# From the root of the repo
$ yarn install

# Run the app in development mode
$ yarn dev
```

## Dev Notes
### Keeping the UObject enum in sync with UE5 source
The enums at `src/main/lib/uasset/enums.ts` mirror a handful of headers from
[EpicGames/UnrealEngine](https://github.com/EpicGames/UnrealEngine) (private repo, requires an
Epic-linked GitHub account). A full build of the engine is ~400GB and even a plain clone is
10-15GB, so we keep a sparse checkout of just the `UObject` headers we care about.

The source lives at `.ue5/UnrealEngine/` (already in `.gitignore`).

One-time setup, from the repo root:
```bash
$ git clone --filter=blob:none --sparse https://github.com/EpicGames/UnrealEngine.git .ue5/UnrealEngine
$ cd .ue5/UnrealEngine
$ git sparse-checkout set Engine/Source/Runtime/Core/Public/UObject Engine/Source/Runtime/CoreUObject/Public/UObject
```

**Important:** always run `git sparse-checkout` commands from **inside** `.ue5/UnrealEngine/`, or
pass `-C .ue5/UnrealEngine` explicitly. If you run one from the gitgame repo root by accident,
git will silently enable sparse-checkout on the **gitgame** repo (because that's the enclosing
`.git` it finds) and hide 99% of your working tree. Recover with:
```bash
$ git sparse-checkout disable
```
Files are never lost — they're still in `HEAD`/index, just filtered from the working tree.

If the working tree stays empty after `set` on the UE clone (blob fetch silently failing on the
private repo), force a re-materialize:
```bash
$ git -C .ue5/UnrealEngine sparse-checkout reapply
$ git -C .ue5/UnrealEngine checkout HEAD -- .
```

To add more UE paths later (e.g. when we start writing type-specific shapers and need
`Engine/Classes/Engine/Texture.h`):
```bash
$ git -C .ue5/UnrealEngine sparse-checkout add Engine/Source/Runtime/Engine/Classes/Engine
```

To pull upstream updates before resyncing enum values:
```bash
$ git -C .ue5/UnrealEngine pull
```

Files that map to `enums.ts`:
- `Engine/Source/Runtime/Core/Public/UObject/ObjectVersion.h` — `EUnrealEngineObjectUE4Version`, `EUnrealEngineObjectUE5Version`
- `Engine/Source/Runtime/CoreUObject/Public/UObject/ObjectMacros.h` — `PackageFlags`, `EObjectFlags`
- `Engine/Source/Runtime/CoreUObject/Public/UObject/PackageFileSummary.h` — header layout the parser reads
