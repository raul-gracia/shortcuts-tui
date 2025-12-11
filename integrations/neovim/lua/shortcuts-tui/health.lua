local M = {}

local health = vim.health

M.check = function()
  health.start("shortcuts-tui")

  -- Check Neovim version
  if vim.fn.has("nvim-0.9") == 1 then
    health.ok("Neovim >= 0.9.0")
  else
    health.error("Neovim >= 0.9.0 required", {
      "Update Neovim to version 0.9.0 or later",
    })
  end

  -- Check if shortcuts-tui binary is available
  local config = require("shortcuts-tui").config
  local cmd = vim.split(config.cmd, " ")[1]

  if vim.fn.executable(cmd) == 1 then
    health.ok(string.format("'%s' executable found", cmd))

    -- Try to get version
    local handle = io.popen(cmd .. " --version 2>/dev/null")
    if handle then
      local version = handle:read("*a")
      handle:close()
      if version and version ~= "" then
        health.info("Version: " .. vim.trim(version))
      end
    end
  else
    health.error(string.format("'%s' executable not found", cmd), {
      "Install shortcuts-tui from https://github.com/raul-gracia/shortcuts-tui/releases",
      "Or build from source: cd shortcuts-tui && bun run build",
      "Ensure the binary is in your PATH",
    })
  end

  -- Check config file
  local config_paths = {
    vim.fn.expand("~/.config/shortcuts-tui/shortcuts.yaml"),
    vim.fn.expand("~/.config/shortcuts-tui/shortcuts.yml"),
    vim.fn.expand("~/.shortcuts-tui.yaml"),
    vim.fn.expand("~/.shortcuts-tui.yml"),
  }

  local config_found = false
  for _, path in ipairs(config_paths) do
    if vim.fn.filereadable(path) == 1 then
      health.ok("Config file found: " .. path)
      config_found = true
      break
    end
  end

  if not config_found then
    health.warn("No config file found (using defaults)", {
      "Create ~/.config/shortcuts-tui/shortcuts.yaml to customize shortcuts",
      "See https://github.com/raul-gracia/shortcuts-tui for examples",
    })
  end

  -- Check terminal support
  if vim.fn.has("terminal") == 1 then
    health.ok("Terminal support available")
  else
    health.error("Terminal support not available", {
      "Neovim was compiled without terminal support",
    })
  end

  -- Check floating window support
  if vim.fn.has("nvim-0.5") == 1 then
    health.ok("Floating window support available")
  else
    health.error("Floating window support not available")
  end

  -- Show current configuration
  health.start("shortcuts-tui configuration")
  health.info("cmd: " .. config.cmd)
  health.info("width: " .. tostring(config.width))
  health.info("height: " .. tostring(config.height))
  health.info("border: " .. config.border)
  health.info("keymap: " .. config.keymap)
end

return M
