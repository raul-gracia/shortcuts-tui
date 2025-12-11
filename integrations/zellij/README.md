# Shortcuts TUI - Zellij Plugin

A native WASM plugin for Zellij that displays a shortcuts cheat sheet in a floating pane.

## Requirements

- Zellij >= 0.40.0

## Installation

### Download Pre-built Plugin

```bash
# Create plugins directory
mkdir -p ~/.config/zellij/plugins

# Download the WASM plugin
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui.wasm \
  -o ~/.config/zellij/plugins/shortcuts-tui.wasm
```

### Build from Source

```bash
# Install Rust and add WASM target
rustup target add wasm32-wasip1

# Clone and build
git clone https://github.com/raul-gracia/shortcuts-tui.git
cd shortcuts-tui/integrations/zellij
cargo build --release --target wasm32-wasip1

# Copy to plugins directory
mkdir -p ~/.config/zellij/plugins
cp target/wasm32-wasip1/release/shortcuts_tui_zellij.wasm \
   ~/.config/zellij/plugins/shortcuts-tui.wasm
```

## Configuration

Add a keybinding to your Zellij config (`~/.config/zellij/config.kdl`):

```kdl
keybinds {
    shared {
        // Press Ctrl+g to toggle shortcuts panel
        bind "Ctrl g" {
            LaunchOrFocusPlugin "file:~/.config/zellij/plugins/shortcuts-tui.wasm" {
                floating true
                move_to_focused_tab true
            }
        }
    }
}
```

### Alternative: Launch from specific mode

```kdl
keybinds {
    normal {
        // Press ? in normal mode
        bind "?" {
            LaunchOrFocusPlugin "file:~/.config/zellij/plugins/shortcuts-tui.wasm" {
                floating true
            }
        }
    }
}
```

### Pane size options

```kdl
LaunchOrFocusPlugin "file:~/.config/zellij/plugins/shortcuts-tui.wasm" {
    floating true
    move_to_focused_tab true
    // Optional: set initial size (requires Zellij 0.40+)
    // width "80%"
    // height "70%"
}
```

## Usage

Once the plugin is loaded:

| Key | Action |
|-----|--------|
| `Tab` | Next category |
| `Shift+Tab` | Previous category |
| `1-9` | Jump to category by number |
| `/` | Start search mode |
| `ESC` | Exit search / Close plugin |
| `q` | Close plugin |

## Current Limitations

- Uses built-in default shortcuts (Git, Zellij basics)
- Custom YAML config loading not yet implemented (planned)
- Theme customization not yet available (planned)

## Development

```bash
# Build debug version
cargo build --target wasm32-wasip1

# Build release version (smaller, optimized)
cargo build --release --target wasm32-wasip1

# The output will be at:
# target/wasm32-wasip1/release/shortcuts_tui_zellij.wasm
```

### Testing locally

```bash
# Copy to plugins and restart Zellij
cp target/wasm32-wasip1/release/shortcuts_tui_zellij.wasm \
   ~/.config/zellij/plugins/shortcuts-tui.wasm

# Start a new Zellij session to load the updated plugin
zellij
```

## Troubleshooting

### Plugin doesn't load

1. Verify the WASM file exists and has correct permissions:
   ```bash
   ls -la ~/.config/zellij/plugins/shortcuts-tui.wasm
   ```

2. Check Zellij version (requires >= 0.40.0):
   ```bash
   zellij --version
   ```

3. Look for errors in Zellij logs:
   ```bash
   # Zellij logs are typically in /tmp or check your system's temp directory
   cat /tmp/zellij-*/zellij.log
   ```

### Plugin crashes immediately

The plugin may be built for a different Zellij version. Try rebuilding from source with the matching `zellij-tile` version in `Cargo.toml`.

## License

MIT
