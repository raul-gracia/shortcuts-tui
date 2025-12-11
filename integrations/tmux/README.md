# Shortcuts TUI - tmux Plugin

A tmux plugin that opens shortcuts-tui in a popup window using `display-popup`.

## Requirements

- tmux >= 3.2 (for `display-popup` support)
- [shortcuts-tui](https://github.com/raul-gracia/shortcuts-tui) binary installed

## Installation

### Using TPM (Tmux Plugin Manager)

Add to your `~/.tmux.conf`:

```bash
set -g @plugin 'raul-gracia/shortcuts-tui'
```

Then press `prefix + I` to install.

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/raul-gracia/shortcuts-tui.git ~/.tmux/plugins/shortcuts-tui

# Add to ~/.tmux.conf
run-shell ~/.tmux/plugins/shortcuts-tui/integrations/tmux/shortcuts-tui.tmux
```

Reload tmux config:

```bash
tmux source-file ~/.tmux.conf
```

## Configuration

Add these options to `~/.tmux.conf` before the plugin line:

```bash
# Trigger key (default: ?)
set -g @shortcuts-tui-key "?"

# Popup dimensions (default: 90% x 80%)
set -g @shortcuts-tui-width "90%"
set -g @shortcuts-tui-height "80%"

# Load the plugin
set -g @plugin 'raul-gracia/shortcuts-tui'
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `@shortcuts-tui-key` | `?` | Key to trigger the popup (after prefix) |
| `@shortcuts-tui-width` | `90%` | Popup width (percentage or columns) |
| `@shortcuts-tui-height` | `80%` | Popup height (percentage or rows) |

## Usage

Press `prefix + ?` (or your configured key) to open shortcuts-tui in a popup.

### Keybindings inside the popup

| Key | Action |
|-----|--------|
| `Tab` | Next category |
| `Shift+Tab` | Previous category |
| `1-9` | Jump to category |
| `/` | Start search |
| `ESC` | Exit search / Close |
| `q` | Close |

The popup will automatically close when you exit shortcuts-tui.

## Binary Location

The plugin searches for the `shortcuts-tui` binary in these locations (in order):

1. `shortcuts-tui` (in PATH)
2. `~/.local/bin/shortcuts-tui`
3. `/usr/local/bin/shortcuts-tui`
4. Development path (relative to plugin)

If the binary is not found, you'll see an error message in tmux.

## Troubleshooting

### "binary not found" error

Ensure shortcuts-tui is installed and in your PATH:

```bash
# Check if binary is accessible
which shortcuts-tui

# Or install it
curl -L https://github.com/raul-gracia/shortcuts-tui/releases/latest/download/shortcuts-tui-linux-x64 \
  -o ~/.local/bin/shortcuts-tui && chmod +x ~/.local/bin/shortcuts-tui
```

### Popup doesn't appear

1. Check tmux version (requires >= 3.2):
   ```bash
   tmux -V
   ```

2. Verify the keybinding is set:
   ```bash
   tmux list-keys | grep shortcuts
   ```

3. Reload tmux config:
   ```bash
   tmux source-file ~/.tmux.conf
   ```

### Popup closes immediately

Check if shortcuts-tui runs correctly outside tmux:

```bash
shortcuts-tui
```

If it errors, you may need to install dependencies or check your config file.

## License

MIT
