# Shortcuts TUI - Neovim Plugin

A Neovim plugin that opens shortcuts-tui in a floating terminal window.

## Requirements

- Neovim >= 0.9.0
- [shortcuts-tui](https://github.com/raul-gracia/shortcuts-tui) binary installed and in PATH

## Installation

### Using lazy.nvim

```lua
{
  "raul-gracia/shortcuts-tui",
  dir = "integrations/neovim",  -- if cloning the full repo
  -- or use the direct path:
  -- url = "https://github.com/raul-gracia/shortcuts-tui",
  keys = {
    { "<leader>?", "<cmd>ShortcutsTui<cr>", desc = "Shortcuts TUI" },
  },
  opts = {},
}
```

### Using packer.nvim

```lua
use {
  "raul-gracia/shortcuts-tui",
  rtp = "integrations/neovim",
  config = function()
    require("shortcuts-tui").setup()
  end,
}
```

### Manual Installation

Clone or copy the `integrations/neovim/lua/shortcuts-tui` directory to your Neovim runtime path:

```bash
mkdir -p ~/.config/nvim/lua
cp -r integrations/neovim/lua/shortcuts-tui ~/.config/nvim/lua/
```

Then add to your `init.lua`:

```lua
require("shortcuts-tui").setup()
```

## Configuration

```lua
require("shortcuts-tui").setup({
  -- Command to run (default: "shortcuts-tui")
  cmd = "shortcuts-tui",

  -- Window dimensions (0.0-1.0 = percentage of screen)
  width = 0.9,
  height = 0.85,

  -- Border style: "none", "single", "double", "rounded", "solid", "shadow"
  border = "rounded",

  -- Keymap to open (set to nil to disable default keymap)
  keymap = "<leader>?",
})
```

## Usage

| Command | Description |
|---------|-------------|
| `:ShortcutsTui` | Open shortcuts-tui |
| `:ShortcutsTuiClose` | Close the window |
| `<leader>?` | Open shortcuts-tui (default keymap) |

### Keybindings in the floating window

| Key | Action |
|-----|--------|
| `ESC` | Close shortcuts-tui (handled by the app) |
| `ESC ESC` | Force close window (fallback) |
| `Ctrl-C` | Force close window |

## Health Check

Run `:checkhealth shortcuts-tui` to verify your installation:

```
shortcuts-tui: require("shortcuts-tui.health").check()

shortcuts-tui ~
- OK Neovim >= 0.9.0
- OK 'shortcuts-tui' executable found
- OK Config file found: ~/.config/shortcuts-tui/shortcuts.yaml
- OK Terminal support available
- OK Floating window support available

shortcuts-tui configuration ~
- cmd: shortcuts-tui
- width: 0.9
- height: 0.85
- border: rounded
- keymap: <leader>?
```

## Troubleshooting

### Binary not found

Ensure `shortcuts-tui` is in your PATH:

```bash
# Check if binary is accessible
which shortcuts-tui

# Or specify full path in config
require("shortcuts-tui").setup({
  cmd = "/usr/local/bin/shortcuts-tui",
})
```

### Window doesn't open

1. Run `:checkhealth shortcuts-tui` to diagnose
2. Check if terminal support is available: `:echo has('terminal')`
3. Verify Neovim version: `:version`

## License

MIT
