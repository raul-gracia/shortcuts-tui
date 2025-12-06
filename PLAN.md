# Shortcuts TUI - Project Plan

A terminal-based shortcuts cheat sheet application with full-screen TUI, fuzzy search, and native integration for Zellij, tmux, and Neovim.

## Project Overview

### Vision
Create a **which-key/CheatSheet-style** CLI tool for terminal users that displays categorized shortcuts in a visually appealing bento box layout with instant fuzzy search.

### Key Features
- Full-screen terminal UI with tab-based category navigation
- Bento box / column grid layout for shortcut groups
- Fast fuzzy search (fzf-style) filtering
- Quick dismiss (ESC/q)
- YAML-based configuration
- Native integration plugins for Zellij, tmux, and Neovim
- Cross-platform binaries (macOS, Windows, Linux)

---

## Technology Stack

### Core Application: TypeScript + Bun + Ink

**Rationale**: After extensive research, TypeScript/Bun + Ink is the optimal choice:

| Criteria | Ink (TS/Bun) | Ratatouille (Elixir) | TTY (Ruby) |
|----------|--------------|----------------------|------------|
| Stars | 32,800 | 2,300 | 7,400 |
| Last Update | Nov 2024 | Apr 2024 | May 2024 |
| Binary Size | ~50MB (Bun) | ~70MB (Burrito) | N/A |
| Startup | <100ms | ~200ms | ~500ms |
| Layout | Flexbox (Yoga) | Grid | Manual |
| Focus System | Built-in useFocus | Manual | Manual |

**Dependencies**:
```json
{
  "dependencies": {
    "ink": "^6.5.0",
    "ink-text-input": "^6.0.0",
    "fzf": "^0.5.2",
    "js-yaml": "^4.1.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/bun": "^1.1.0",
    "@types/js-yaml": "^4.0.9",
    "@types/react": "^18.3.0",
    "typescript": "^5.6.0"
  }
}
```

---

## Architecture

### Directory Structure
```
shortcuts-tui/
├── src/
│   ├── index.tsx           # Entry point
│   ├── App.tsx             # Main application component
│   ├── components/
│   │   ├── TabBar.tsx      # Category tabs navigation
│   │   ├── ShortcutGrid.tsx # Bento box layout
│   │   ├── ShortcutCard.tsx # Individual shortcut display
│   │   ├── SearchBar.tsx   # Fuzzy search input
│   │   └── HelpFooter.tsx  # Keybindings help
│   ├── hooks/
│   │   ├── useConfig.ts    # YAML config loader
│   │   ├── useFuzzySearch.ts # fzf integration
│   │   └── useKeyboard.ts  # Key event handling
│   ├── types/
│   │   └── config.ts       # TypeScript interfaces
│   └── utils/
│       ├── configLoader.ts # YAML parsing
│       └── theme.ts        # Color theme system
├── config/
│   └── shortcuts.example.yaml
├── integrations/
│   ├── zellij/             # Zellij WASM plugin
│   ├── tmux/               # tmux plugin scripts
│   └── neovim/             # Neovim Lua plugin
├── .github/
│   └── workflows/
│       └── release.yml     # Multi-platform builds
├── docs/
│   ├── CONFIGURATION.md
│   ├── INTEGRATIONS.md
│   └── DEVELOPMENT.md
├── package.json
├── tsconfig.json
├── bunfig.toml
└── README.md
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      TabBar.tsx                              │ │
│  │  [ Git ] [ Neovim ] [ Tmux ] [ Docker ] [ Kubernetes ]      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     SearchBar.tsx                            │ │
│  │  🔍 Type to filter...                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   ShortcutGrid.tsx                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ShortcutCard │  │ShortcutCard │  │ShortcutCard │         │ │
│  │  │ ctrl+c copy │  │ ctrl+v paste│  │ ctrl+z undo │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ShortcutCard │  │ShortcutCard │  │ShortcutCard │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     HelpFooter.tsx                           │ │
│  │  Tab: Next  Shift+Tab: Prev  /: Search  ESC: Quit           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration Schema (YAML)

```yaml
# ~/.config/shortcuts-tui/shortcuts.yaml
theme:
  primary: "#7aa2f7"
  secondary: "#9ece6a"
  background: "#1a1b26"
  text: "#c0caf5"

categories:
  - name: Git
    icon: ""
    color: "#f7768e"
    groups:
      - name: Basics
        shortcuts:
          - keys: "git add ."
            description: "Stage all changes"
          - keys: "git commit -m"
            description: "Commit with message"
      - name: Branches
        shortcuts:
          - keys: "git checkout -b"
            description: "Create and switch branch"

  - name: Neovim
    icon: ""
    color: "#7aa2f7"
    groups:
      - name: Navigation
        shortcuts:
          - keys: "<leader>ff"
            description: "Find files"
          - keys: "<leader>fg"
            description: "Live grep"
```

---

## Integration Strategies

### 1. Zellij Plugin (Native WASM)

**Approach**: Build a Rust WASM plugin that renders directly in Zellij

**Architecture**:
```
┌──────────────────────────────────────────┐
│              Zellij                       │
│  ┌─────────────────────────────────────┐ │
│  │     shortcuts-tui.wasm              │ │
│  │     (Rust → WASM)                   │ │
│  │                                     │ │
│  │  - Subscribes to Key events         │ │
│  │  - Renders native Zellij UI         │ │
│  │  - Reads YAML config                │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Implementation**:
```rust
// integrations/zellij/src/main.rs
use zellij_tile::prelude::*;

#[derive(Default)]
struct ShortcutsTui {
    config: ShortcutsConfig,
    search_query: String,
    active_tab: usize,
}

register_plugin!(ShortcutsTui);

impl ZellijPlugin for ShortcutsTui {
    fn load(&mut self, configuration: BTreeMap<String, String>) {
        subscribe(&[EventType::Key, EventType::ModeUpdate]);
        // Load YAML config
    }

    fn update(&mut self, event: Event) -> bool {
        match event {
            Event::Key(key) => self.handle_key(key),
            _ => false,
        }
    }

    fn render(&mut self, rows: usize, cols: usize) {
        // Render TUI using Zellij's native rendering
    }
}
```

**Keybinding** (zellij config):
```kdl
keybinds {
    shared {
        bind "Ctrl g" {
            LaunchOrFocusPlugin "file:~/.config/zellij/plugins/shortcuts-tui.wasm" {
                floating true
                move_to_focused_tab true
            }
        }
    }
}
```

**References**:
- [Zellij Plugin System](https://zellij.dev/documentation/plugins)
- [Creating Plugins Guide](https://zellij.dev/news/new-plugin-system/)

---

### 2. Tmux Plugin (display-popup)

**Approach**: Use tmux's `display-popup` command with the compiled binary

**Architecture**:
```
┌──────────────────────────────────────────┐
│              Tmux                         │
│  ┌─────────────────────────────────────┐ │
│  │        display-popup                │ │
│  │  ┌───────────────────────────────┐  │ │
│  │  │    shortcuts-tui binary       │  │ │
│  │  │    (Bun compiled)             │  │ │
│  │  └───────────────────────────────┘  │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Implementation** (`integrations/tmux/shortcuts-tui.tmux`):
```bash
#!/usr/bin/env bash
# Tmux Plugin Manager compatible plugin

CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SHORTCUTS_TUI_BIN="${SHORTCUTS_TUI_BIN:-shortcuts-tui}"

# Default keybinding: prefix + ?
default_key_bindings="?"

get_tmux_option() {
    local option=$1
    local default_value=$2
    local option_value=$(tmux show-option -gqv "$option")
    if [ -z "$option_value" ]; then
        echo "$default_value"
    else
        echo "$option_value"
    fi
}

main() {
    local key=$(get_tmux_option "@shortcuts-tui-key" "$default_key_bindings")
    local width=$(get_tmux_option "@shortcuts-tui-width" "90%")
    local height=$(get_tmux_option "@shortcuts-tui-height" "80%")

    tmux bind-key "$key" display-popup \
        -E \
        -w "$width" \
        -h "$height" \
        -T " Shortcuts " \
        "$SHORTCUTS_TUI_BIN"
}

main
```

**User Configuration** (`.tmux.conf`):
```bash
# Install via TPM
set -g @plugin 'raul-gracia/shortcuts-tui'

# Optional customization
set -g @shortcuts-tui-key "?"
set -g @shortcuts-tui-width "85%"
set -g @shortcuts-tui-height "75%"

# Initialize TPM
run '~/.tmux/plugins/tpm/tpm'
```

**References**:
- [tmux-popup plugin](https://github.com/MackenzieStanger/tmux-popup)
- [tmux-menus plugin](https://github.com/jaclu/tmux-menus)
- [TPM - Tmux Plugin Manager](https://github.com/tmux-plugins/tpm)

---

### 3. Neovim Plugin (Floating Terminal)

**Approach**: Lua plugin using toggleterm.nvim or native floating windows

**Architecture**:
```
┌──────────────────────────────────────────┐
│              Neovim                       │
│  ┌─────────────────────────────────────┐ │
│  │     shortcuts-tui.nvim              │ │
│  │     (Lua plugin)                    │ │
│  │                                     │ │
│  │  - Creates floating window          │ │
│  │  - Launches terminal with binary    │ │
│  │  - Handles close events             │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Implementation** (`integrations/neovim/lua/shortcuts-tui/init.lua`):
```lua
local M = {}

M.config = {
    cmd = "shortcuts-tui",
    width = 0.9,
    height = 0.85,
    border = "rounded",
    keymap = "<leader>?",
}

local function create_floating_window()
    local width = math.floor(vim.o.columns * M.config.width)
    local height = math.floor(vim.o.lines * M.config.height)
    local row = math.floor((vim.o.lines - height) / 2)
    local col = math.floor((vim.o.columns - width) / 2)

    local buf = vim.api.nvim_create_buf(false, true)
    local win = vim.api.nvim_open_win(buf, true, {
        relative = "editor",
        width = width,
        height = height,
        row = row,
        col = col,
        style = "minimal",
        border = M.config.border,
        title = " Shortcuts ",
        title_pos = "center",
    })

    vim.fn.termopen(M.config.cmd, {
        on_exit = function()
            vim.api.nvim_win_close(win, true)
        end,
    })

    vim.cmd("startinsert")

    -- Close on ESC
    vim.keymap.set("t", "<Esc>", function()
        vim.api.nvim_win_close(win, true)
    end, { buffer = buf })
end

function M.toggle()
    create_floating_window()
end

function M.setup(opts)
    M.config = vim.tbl_deep_extend("force", M.config, opts or {})

    vim.keymap.set("n", M.config.keymap, function()
        M.toggle()
    end, { desc = "Open Shortcuts TUI" })

    vim.api.nvim_create_user_command("ShortcutsTui", function()
        M.toggle()
    end, { desc = "Open Shortcuts TUI" })
end

return M
```

**User Configuration** (LazyVim):
```lua
-- lua/plugins/shortcuts-tui.lua
return {
    "raul-gracia/shortcuts-tui.nvim",
    keys = {
        { "<leader>?", desc = "Shortcuts TUI" },
    },
    opts = {
        cmd = "shortcuts-tui",
        width = 0.9,
        height = 0.85,
        keymap = "<leader>?",
    },
}
```

**Alternative: toggleterm.nvim integration**:
```lua
local Terminal = require("toggleterm.terminal").Terminal

local shortcuts_tui = Terminal:new({
    cmd = "shortcuts-tui",
    direction = "float",
    float_opts = {
        border = "rounded",
        width = function() return math.floor(vim.o.columns * 0.9) end,
        height = function() return math.floor(vim.o.lines * 0.85) end,
    },
    on_open = function(term)
        vim.keymap.set("t", "<Esc>", function()
            term:close()
        end, { buffer = term.bufnr })
    end,
})

vim.keymap.set("n", "<leader>?", function()
    shortcuts_tui:toggle()
end, { desc = "Shortcuts TUI" })
```

**References**:
- [toggleterm.nvim](https://github.com/akinsho/toggleterm.nvim)
- [Neovim Floating Window API](https://neovim.io/doc/user/api.html)
- [haunt.nvim](https://github.com/adigitoleo/haunt.nvim)

---

## Release Strategy

### GitHub Actions Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: linux-x64
            artifact: shortcuts-tui-linux-x64
          - os: macos-latest
            target: darwin-arm64
            artifact: shortcuts-tui-darwin-arm64
          - os: macos-13
            target: darwin-x64
            artifact: shortcuts-tui-darwin-x64
          - os: windows-latest
            target: windows-x64
            artifact: shortcuts-tui-windows-x64.exe

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build binary
        run: |
          bun build ./src/index.tsx \
            --compile \
            --target=bun-${{ matrix.target }} \
            --outfile=${{ matrix.artifact }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}
          path: ${{ matrix.artifact }}

  release:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            shortcuts-tui-linux-x64/shortcuts-tui-linux-x64
            shortcuts-tui-darwin-arm64/shortcuts-tui-darwin-arm64
            shortcuts-tui-darwin-x64/shortcuts-tui-darwin-x64
            shortcuts-tui-windows-x64.exe/shortcuts-tui-windows-x64.exe
          generate_release_notes: true
```

### Zellij Plugin Build

```yaml
# .github/workflows/zellij-plugin.yml
name: Zellij Plugin

on:
  push:
    tags:
      - 'v*'

jobs:
  build-wasm:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: wasm32-wasi

      - name: Build WASM plugin
        working-directory: integrations/zellij
        run: |
          cargo build --release --target wasm32-wasi
          mv target/wasm32-wasi/release/shortcuts_tui.wasm shortcuts-tui.wasm

      - name: Upload WASM artifact
        uses: actions/upload-artifact@v4
        with:
          name: shortcuts-tui.wasm
          path: integrations/zellij/shortcuts-tui.wasm
```

---

## Development Roadmap

### Phase 1: Core Application (Week 1-2)
- [ ] Project setup with Bun + TypeScript + Ink
- [ ] Basic component architecture (App, TabBar, Grid, Card)
- [ ] YAML configuration loader
- [ ] Fuzzy search integration (fzf-for-js)
- [ ] Keyboard navigation (Tab, Arrow keys, ESC)
- [ ] Theme system with Tokyo Night default

### Phase 2: Polish & Configuration (Week 3)
- [ ] Multiple color themes
- [ ] Responsive grid layout
- [ ] Configuration validation
- [ ] Error handling and user feedback
- [ ] Performance optimization
- [ ] Documentation

### Phase 3: Integrations (Week 4-5)
- [ ] Tmux plugin with TPM support
- [ ] Neovim plugin (standalone + toggleterm)
- [ ] Zellij WASM plugin (Rust)
- [ ] Integration documentation

### Phase 4: Release (Week 6)
- [ ] GitHub Actions CI/CD
- [ ] Multi-platform binary builds
- [ ] Homebrew formula
- [ ] AUR package
- [ ] README with demos and screenshots

---

## Installation Methods

### Direct Binary
```bash
# macOS (Apple Silicon)
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-darwin-arm64 -o /usr/local/bin/shortcuts-tui
chmod +x /usr/local/bin/shortcuts-tui

# macOS (Intel)
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-darwin-x64 -o /usr/local/bin/shortcuts-tui
chmod +x /usr/local/bin/shortcuts-tui

# Linux
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-linux-x64 -o /usr/local/bin/shortcuts-tui
chmod +x /usr/local/bin/shortcuts-tui
```

### Homebrew
```bash
brew install raul-gracia/tap/shortcuts-tui
```

### From Source
```bash
git clone https://github.com/raul-gracia/shortcuts-tui.git
cd shortcuts-tui
bun install
bun build ./src/index.tsx --compile --outfile=shortcuts-tui
```

---

## Research References

### Zellij Plugins
- [Zellij Plugin Documentation](https://zellij.dev/documentation/plugins)
- [Building WASM Plugins](https://zellij.dev/news/new-plugin-system/)
- [Plugin Development Environment](https://zellij.dev/documentation/plugin-dev-env.html)
- [rust-plugin-example](https://github.com/zellij-org/rust-plugin-example)

### Tmux Integration
- [TPM - Tmux Plugin Manager](https://github.com/tmux-plugins/tpm)
- [tmux-popup](https://github.com/MackenzieStanger/tmux-popup)
- [tmux-menus](https://github.com/jaclu/tmux-menus)
- [display-popup documentation](https://man7.org/linux/man-pages/man1/tmux.1.html)

### Neovim Plugins
- [toggleterm.nvim](https://github.com/akinsho/toggleterm.nvim)
- [Neovim Floating Window API](https://neovim.io/doc/user/api.html)
- [Creating Neovim UI Plugins](https://www.2n.pl/blog/how-to-make-ui-for-neovim-plugins-in-lua)

### TUI Frameworks
- [Ink - React for CLI](https://github.com/vadimdemedes/ink)
- [fzf-for-js](https://github.com/ajitid/fzf-for-js)
- [Yoga Layout Engine](https://yogalayout.com/)
