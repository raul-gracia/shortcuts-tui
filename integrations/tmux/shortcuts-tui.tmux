#!/usr/bin/env bash
# shortcuts-tui tmux plugin
# TPM (Tmux Plugin Manager) compatible
#
# Installation:
#   Add to ~/.tmux.conf:
#     set -g @plugin 'raul-gracia/shortcuts-tui'
#   Then: prefix + I to install
#
# Configuration:
#   set -g @shortcuts-tui-key "?"         # Trigger key (default: ?)
#   set -g @shortcuts-tui-width "90%"     # Popup width
#   set -g @shortcuts-tui-height "80%"    # Popup height

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Binary location - check multiple paths
get_shortcuts_binary() {
    local paths=(
        "shortcuts-tui"                                    # In PATH
        "$HOME/.local/bin/shortcuts-tui"                   # Local bin
        "/usr/local/bin/shortcuts-tui"                     # System bin
        "$CURRENT_DIR/../../dist/shortcuts-tui"            # Development
    )

    for path in "${paths[@]}"; do
        if command -v "$path" &>/dev/null || [[ -x "$path" ]]; then
            echo "$path"
            return 0
        fi
    done

    # Fallback: try to find it
    if command -v shortcuts-tui &>/dev/null; then
        echo "shortcuts-tui"
        return 0
    fi

    echo ""
    return 1
}

get_tmux_option() {
    local option=$1
    local default_value=$2
    local option_value
    option_value=$(tmux show-option -gqv "$option")
    if [[ -z "$option_value" ]]; then
        echo "$default_value"
    else
        echo "$option_value"
    fi
}

main() {
    local shortcuts_bin
    shortcuts_bin=$(get_shortcuts_binary)

    if [[ -z "$shortcuts_bin" ]]; then
        tmux display-message "shortcuts-tui: binary not found. Install from https://github.com/raul-gracia/shortcuts-tui"
        return 1
    fi

    local key
    local width
    local height

    key=$(get_tmux_option "@shortcuts-tui-key" "?")
    width=$(get_tmux_option "@shortcuts-tui-width" "90%")
    height=$(get_tmux_option "@shortcuts-tui-height" "80%")

    # Bind the key to open popup
    tmux bind-key "$key" display-popup \
        -E \
        -w "$width" \
        -h "$height" \
        -T " Shortcuts " \
        "$shortcuts_bin"
}

main "$@"
