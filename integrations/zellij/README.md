# Shortcuts TUI - Zellij Integration

Run the shortcuts-tui application directly in Zellij using a simple keybinding.

## Requirements

- Zellij >= 0.40.0
- `shortcuts-tui` binary installed and in PATH

## Installation

1. First, install the `shortcuts-tui` binary (see [main README](../../README.md))

2. Create the layout file at `~/.config/zellij/layouts/shortcuts-tui.kdl`:

```kdl
layout {
    tab name="Shortcuts" focus=true {
        pane command="shortcuts-tui" close_on_exit=true
    }
}
```

3. Add a keybinding to your Zellij config (`~/.config/zellij/config.kdl`):

```kdl
keybinds {
    shared_except "locked" {
        bind "Alt ?" {
            NewTab {
                layout "shortcuts-tui"
            }
        }
    }
}
```

## Usage

Press `Alt+?` (or your configured keybinding) to open shortcuts-tui in a new fullscreen tab.

When you exit with `ESC` or `q`, the tab closes automatically and returns you to your previous tab.

### Keybindings (inside shortcuts-tui)

| Key | Action |
|-----|--------|
| `Tab` | Next category |
| `Shift+Tab` | Previous category |
| `1-9` | Jump to category by number |
| `/` | Start search mode |
| `ESC` | Exit search / Close |
| `q` | Close |

## Alternative Configurations

### Floating pane (smaller window)

If you prefer a floating pane instead of a full tab:

```kdl
keybinds {
    shared_except "locked" {
        bind "Alt ?" {
            Run "shortcuts-tui" {
                floating true
                close_on_exit true
            }
        }
    }
}
```

### In-place (replace current pane)

Run in the current pane (useful for small layouts):

```kdl
keybinds {
    shared_except "locked" {
        bind "Alt ?" {
            Run "shortcuts-tui" {
                in_place true
                close_on_exit true
            }
        }
    }
}
```

## Troubleshooting

### "command not found: shortcuts-tui"

Make sure the `shortcuts-tui` binary is installed and in your PATH:

```bash
which shortcuts-tui
```

If not found, see the [installation instructions](../../README.md#installation).

### Layout file not found

Ensure the layout file exists at `~/.config/zellij/layouts/shortcuts-tui.kdl` with the correct content.

## License

MIT
