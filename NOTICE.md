# Notice
`@cybearl/gitgame` is released under the MIT License, as stated in [LICENSE](LICENSE). That grant covers the
source code authored by Cybearl but it does **not** cover the third-party assets listed below, which remain
the property of their respective owners and are used here to reproduce the Windows 95 visual style.

If you fork this project or redistribute a build of it, these assets are yours to review.

## Microsoft assets
The following assets originate from Microsoft software and are not licensed to Cybearl for
redistribution:
| Asset                    | Origin                                          | Where it lives                        |
|--------------------------|-------------------------------------------------|---------------------------------------|
| Sound effects (`.wav`)   | Windows 95 system sounds                        | `src/main/assets/sounds/`             |
| Shell icons (`.png`)     | Windows 95 resource icons, via `@react95/icons` | `node_modules`, bundled at build time |
| `ms_sans_serif` webfonts | Microsoft Sans Serif, via `react95`             | `node_modules`, bundled at build time |

The sound files are committed to this repository, the icons and fonts are not, they are resolved
from `node_modules` through the `@react95-icons` and `@react95-fonts` aliases declared in
[electron.vite.config.ts](electron.vite.config.ts).

## Third-party packages
The interface is built on the following MIT-licensed packages, which are re-implementations of the
Windows 95 look rather than Microsoft code:
| Package          | Author     | License |
|------------------|------------|---------|
| `react95`        | Artur Bień | MIT     |
| `@react95/icons` | Artur Bień | MIT     |

Their MIT licenses cover the component and packaging code written by their author, they do **not**
extend to the underlying Microsoft artwork that those packages redistribute.

## Trademarks
Cybearl is not affiliated with, endorsed by, or sponsored by Microsoft Corporation. Windows and
Windows 95 are trademarks of Microsoft Corporation, references to them in this project are
descriptive, made solely to identify the visual style that the interface imitates.

## Requests
If you represent a rights holder and object to any asset used here, open an issue on
[the tracker](https://github.com/cybearl/gitgame/issues) and it will be replaced.
