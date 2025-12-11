---@class ShortcutsTuiConfig
---@field cmd string Command to run
---@field width number Window width (0.0-1.0)
---@field height number Window height (0.0-1.0)
---@field border string Border style
---@field keymap string Keymap to open

local M = {}

---@type ShortcutsTuiConfig
M.config = {
  cmd = "shortcuts-tui",
  width = 0.9,
  height = 0.85,
  border = "rounded",
  keymap = "<leader>?",
}

local state = {
  win = nil,
  buf = nil,
}

---Create a centered floating window
---@return number buf Buffer handle
---@return number win Window handle
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
    noautocmd = true,
  })

  -- Set window options
  vim.api.nvim_set_option_value("winblend", 0, { win = win })
  vim.api.nvim_set_option_value("winhighlight", "Normal:Normal,FloatBorder:FloatBorder", { win = win })

  return buf, win
end

---Close the floating window
local function close_window()
  if state.win and vim.api.nvim_win_is_valid(state.win) then
    vim.api.nvim_win_close(state.win, true)
  end
  if state.buf and vim.api.nvim_buf_is_valid(state.buf) then
    vim.api.nvim_buf_delete(state.buf, { force = true })
  end
  state.win = nil
  state.buf = nil
end

---Open shortcuts-tui in a floating terminal
function M.open()
  -- Close existing window if open
  if state.win and vim.api.nvim_win_is_valid(state.win) then
    close_window()
    return
  end

  local buf, win = create_floating_window()
  state.buf = buf
  state.win = win

  -- Open terminal with shortcuts-tui
  vim.fn.termopen(M.config.cmd, {
    on_exit = function(_, exit_code, _)
      -- Close window when process exits
      vim.schedule(function()
        close_window()
      end)
    end,
  })

  -- Enter terminal insert mode
  vim.cmd("startinsert")

  -- Set up buffer keymaps
  local opts = { buffer = buf, noremap = true, silent = true }

  -- Ctrl-C force closes the window (ESC is handled by shortcuts-tui itself)
  vim.keymap.set("t", "<C-c>", function()
    close_window()
  end, opts)

  -- Double-ESC as fallback to close window if app doesn't respond
  vim.keymap.set("t", "<Esc><Esc>", function()
    close_window()
  end, opts)
end

---Toggle shortcuts-tui window
function M.toggle()
  M.open()
end

---Setup the plugin
---@param opts? ShortcutsTuiConfig
function M.setup(opts)
  M.config = vim.tbl_deep_extend("force", M.config, opts or {})

  -- Create keymap
  vim.keymap.set("n", M.config.keymap, function()
    M.toggle()
  end, { desc = "Open Shortcuts TUI" })

  -- Create user command
  vim.api.nvim_create_user_command("ShortcutsTui", function()
    M.toggle()
  end, { desc = "Open Shortcuts TUI" })

  vim.api.nvim_create_user_command("ShortcutsTuiClose", function()
    close_window()
  end, { desc = "Close Shortcuts TUI" })
end

return M
