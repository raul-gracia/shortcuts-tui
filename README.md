# Shortcuts TUI

A terminal-based shortcuts cheat sheet with fuzzy search and native integrations for Zellij, tmux, and Neovim.

![License](https://img.shields.io/github/license/raul-gracia/shortcuts-tui)
![Release](https://img.shields.io/github/v/release/raul-gracia/shortcuts-tui)

## Features

- Full-screen terminal UI with tab-based category navigation
- Fast fuzzy search (fzf-style) filtering
- Bento box / column grid layout for shortcut groups
- YAML-based configuration
- Native integrations for:
  - **Zellij** (WASM plugin)
  - **tmux** (TPM plugin with display-popup)
  - **Neovim** (floating window plugin)
- Cross-platform binaries (macOS, Windows, Linux)

## Installation

### Direct Download

```bash
# macOS (Apple Silicon)
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-darwin-arm64 \
  -o /usr/local/bin/shortcuts-tui && chmod +x /usr/local/bin/shortcuts-tui

# macOS (Intel)
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-darwin-x64 \
  -o /usr/local/bin/shortcuts-tui && chmod +x /usr/local/bin/shortcuts-tui

# Linux
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-linux-x64 \
  -o /usr/local/bin/shortcuts-tui && chmod +x /usr/local/bin/shortcuts-tui

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-windows-x64.exe" -OutFile "$env:USERPROFILE\bin\shortcuts-tui.exe"
```

### From Source

```bash
git clone https://github.com/raul-gracia/shortcuts-tui.git
cd shortcuts-tui
bun install
bun run build
```

## Usage

```bash
# Run directly
shortcuts-tui

# Or with custom config
SHORTCUTS_TUI_CONFIG=~/.config/shortcuts.yaml shortcuts-tui
```

### Keybindings

| Key | Action |
|-----|--------|
| `Tab` | Next category |
| `Shift+Tab` | Previous category |
| `1-9` | Jump to category |
| `/` | Start search |
| `ESC` | Exit search / Quit |
| `q` | Quit |

## Configuration

Create a config file at `~/.config/shortcuts-tui/shortcuts.yaml`:

```yaml
theme:
  primary: "#7aa2f7"
  secondary: "#9ece6a"
  background: "#1a1b26"
  text: "#c0caf5"

categories:
  - name: Git
    icon: ""
    groups:
      - name: Basics
        shortcuts:
          - keys: "git status"
            description: "Check repository status"
          - keys: "git add ."
            description: "Stage all changes"
```

See [config/shortcuts.example.yaml](config/shortcuts.example.yaml) for a complete example.

## Integrations

### Neovim

Floating window plugin with health checks. Using lazy.nvim:

```lua
{
  "raul-gracia/shortcuts-tui",
  dir = "integrations/neovim",
  keys = { { "<leader>?", "<cmd>ShortcutsTui<cr>", desc = "Shortcuts TUI" } },
  opts = {},
}
```

Run `:checkhealth shortcuts-tui` to verify installation.

**[Full Neovim documentation →](integrations/neovim/README.md)**

### Zellij

Native WASM plugin for Zellij floating panes:

```bash
# Install plugin
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui.wasm \
  -o ~/.config/zellij/plugins/shortcuts-tui.wasm
```

Add to `~/.config/zellij/config.kdl`:

```kdl
keybinds {
    shared {
        bind "Ctrl g" {
            LaunchOrFocusPlugin "file:~/.config/zellij/plugins/shortcuts-tui.wasm" {
                floating true
            }
        }
    }
}
```

**[Full Zellij documentation →](integrations/zellij/README.md)**

### tmux

Add to `~/.tmux.conf`:

```bash
set -g @plugin 'raul-gracia/shortcuts-tui'

# Optional customization
set -g @shortcuts-tui-key "?"      # Default: ?
set -g @shortcuts-tui-width "90%"  # Popup width
set -g @shortcuts-tui-height "80%" # Popup height
```

Then press `prefix + I` to install (if using TPM).

**[Full tmux documentation →](integrations/tmux/README.md)**

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Type check
bun run typecheck

# Build binary
bun run build

# Build all platforms
bun run build:all
```

## License

MIT
