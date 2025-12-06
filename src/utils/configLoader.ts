import * as yaml from "js-yaml";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Config } from "../types/config";

const CONFIG_PATHS = [
  join(homedir(), ".config", "shortcuts-tui", "shortcuts.yaml"),
  join(homedir(), ".config", "shortcuts-tui", "shortcuts.yml"),
  join(homedir(), ".shortcuts-tui.yaml"),
  join(homedir(), ".shortcuts-tui.yml"),
];

const DEFAULT_CONFIG: Config = {
  categories: [
    {
      name: "Git",
      icon: "",
      color: "#f7768e",
      groups: [
        {
          name: "Basics",
          shortcuts: [
            { keys: "git status", description: "Check repository status" },
            { keys: "git add .", description: "Stage all changes" },
            { keys: "git add -p", description: "Stage interactively" },
            { keys: "git commit -m", description: "Commit with message" },
            { keys: "git commit --amend", description: "Amend last commit" },
            { keys: "git push", description: "Push to remote" },
            { keys: "git pull", description: "Pull from remote" },
            { keys: "git fetch --all", description: "Fetch all remotes" },
          ],
        },
        {
          name: "Branches",
          shortcuts: [
            { keys: "git checkout -b", description: "Create & switch branch" },
            { keys: "git branch -d", description: "Delete branch" },
            { keys: "git branch -D", description: "Force delete branch" },
            { keys: "git merge", description: "Merge branch" },
            { keys: "git rebase -i", description: "Interactive rebase" },
            { keys: "git cherry-pick", description: "Cherry pick commit" },
          ],
        },
        {
          name: "History",
          shortcuts: [
            { keys: "git log --oneline", description: "Compact log" },
            { keys: "git log --graph", description: "Visual branch graph" },
            { keys: "git diff", description: "Show unstaged changes" },
            { keys: "git diff --staged", description: "Show staged changes" },
            { keys: "git blame", description: "Show line-by-line author" },
            { keys: "git reflog", description: "Show reference log" },
          ],
        },
        {
          name: "Stash",
          shortcuts: [
            { keys: "git stash", description: "Stash changes" },
            { keys: "git stash pop", description: "Apply & remove stash" },
            { keys: "git stash list", description: "List all stashes" },
            { keys: "git stash drop", description: "Delete stash" },
          ],
        },
        {
          name: "Remote",
          shortcuts: [
            { keys: "git remote -v", description: "List remotes" },
            { keys: "git remote add", description: "Add remote" },
            { keys: "git remote remove", description: "Remove remote" },
            { keys: "git push -u origin", description: "Set upstream" },
            { keys: "git fetch origin", description: "Fetch from origin" },
          ],
        },
        {
          name: "Tags",
          shortcuts: [
            { keys: "git tag", description: "List tags" },
            { keys: "git tag -a v1.0", description: "Create annotated tag" },
            { keys: "git push --tags", description: "Push all tags" },
            { keys: "git tag -d", description: "Delete local tag" },
          ],
        },
        {
          name: "Reset & Revert",
          shortcuts: [
            { keys: "git reset HEAD~1", description: "Undo last commit (keep)" },
            { keys: "git reset --hard", description: "Hard reset (discard)" },
            { keys: "git revert", description: "Revert commit" },
            { keys: "git clean -fd", description: "Remove untracked" },
          ],
        },
        {
          name: "Worktrees",
          shortcuts: [
            { keys: "git worktree add", description: "Add worktree" },
            { keys: "git worktree list", description: "List worktrees" },
            { keys: "git worktree remove", description: "Remove worktree" },
            { keys: "git worktree prune", description: "Prune worktrees" },
          ],
        },
        {
          name: "Submodules",
          shortcuts: [
            { keys: "git submodule add", description: "Add submodule" },
            { keys: "git submodule update", description: "Update submodules" },
            { keys: "git submodule init", description: "Init submodules" },
            { keys: "git submodule sync", description: "Sync submodules" },
          ],
        },
        {
          name: "Bisect",
          shortcuts: [
            { keys: "git bisect start", description: "Start bisect" },
            { keys: "git bisect good", description: "Mark as good" },
            { keys: "git bisect bad", description: "Mark as bad" },
            { keys: "git bisect reset", description: "End bisect" },
          ],
        },
      ],
    },
    {
      name: "Neovim",
      icon: "",
      color: "#7aa2f7",
      groups: [
        {
          name: "Navigation",
          shortcuts: [
            { keys: "<leader>ff", description: "Find files" },
            { keys: "<leader>fg", description: "Live grep" },
            { keys: "<leader>fb", description: "Find buffers" },
            { keys: "<leader>fh", description: "Find help tags" },
            { keys: "gd", description: "Go to definition" },
            { keys: "gr", description: "Go to references" },
            { keys: "gi", description: "Go to implementation" },
            { keys: "<C-o>", description: "Jump back" },
            { keys: "<C-i>", description: "Jump forward" },
          ],
        },
        {
          name: "LSP",
          shortcuts: [
            { keys: "<leader>ca", description: "Code action" },
            { keys: "<leader>rn", description: "Rename symbol" },
            { keys: "K", description: "Hover documentation" },
            { keys: "<leader>d", description: "Show diagnostics" },
            { keys: "[d", description: "Previous diagnostic" },
            { keys: "]d", description: "Next diagnostic" },
            { keys: "<leader>f", description: "Format buffer" },
          ],
        },
        {
          name: "Editing",
          shortcuts: [
            { keys: "gcc", description: "Toggle line comment" },
            { keys: "gc", description: "Toggle selection comment" },
            { keys: "ys{motion}{char}", description: "Add surrounding" },
            { keys: "ds{char}", description: "Delete surrounding" },
            { keys: "cs{old}{new}", description: "Change surrounding" },
            { keys: "<C-n>", description: "Multi-cursor next" },
          ],
        },
        {
          name: "Windows & Buffers",
          shortcuts: [
            { keys: "<C-w>v", description: "Vertical split" },
            { keys: "<C-w>s", description: "Horizontal split" },
            { keys: "<C-w>h/j/k/l", description: "Navigate windows" },
            { keys: "<leader>bd", description: "Delete buffer" },
            { keys: "<S-h>", description: "Previous buffer" },
            { keys: "<S-l>", description: "Next buffer" },
          ],
        },
        {
          name: "Telescope",
          shortcuts: [
            { keys: "<leader>fr", description: "Recent files" },
            { keys: "<leader>fc", description: "Find commands" },
            { keys: "<leader>fk", description: "Find keymaps" },
            { keys: "<leader>fs", description: "Find symbols" },
            { keys: "<leader>fw", description: "Find word" },
          ],
        },
        {
          name: "File Explorer",
          shortcuts: [
            { keys: "<leader>e", description: "Toggle explorer" },
            { keys: "a", description: "Add file/folder" },
            { keys: "d", description: "Delete" },
            { keys: "r", description: "Rename" },
            { keys: "y", description: "Copy name" },
          ],
        },
        {
          name: "Git Integration",
          shortcuts: [
            { keys: "<leader>gs", description: "Git status" },
            { keys: "<leader>gc", description: "Git commits" },
            { keys: "<leader>gb", description: "Git branches" },
            { keys: "]c", description: "Next hunk" },
            { keys: "[c", description: "Previous hunk" },
          ],
        },
        {
          name: "Motions",
          shortcuts: [
            { keys: "w/W", description: "Next word start" },
            { keys: "e/E", description: "Next word end" },
            { keys: "b/B", description: "Prev word start" },
            { keys: "f{char}", description: "Find char forward" },
            { keys: "t{char}", description: "Till char forward" },
            { keys: "%", description: "Matching bracket" },
          ],
        },
        {
          name: "Marks & Jumps",
          shortcuts: [
            { keys: "m{a-z}", description: "Set local mark" },
            { keys: "'{a-z}", description: "Jump to mark" },
            { keys: "``", description: "Last position" },
            { keys: "<C-]>", description: "Jump to tag" },
          ],
        },
        {
          name: "Registers",
          shortcuts: [
            { keys: '"{reg}y', description: "Yank to register" },
            { keys: '"{reg}p', description: "Paste from register" },
            { keys: ":reg", description: "View registers" },
            { keys: "<C-r>{reg}", description: "Insert register" },
          ],
        },
      ],
    },
    {
      name: "Tmux",
      icon: "",
      color: "#9ece6a",
      groups: [
        {
          name: "Panes",
          shortcuts: [
            { keys: "prefix %", description: "Split vertical" },
            { keys: 'prefix "', description: "Split horizontal" },
            { keys: "prefix x", description: "Close pane" },
            { keys: "prefix z", description: "Toggle zoom" },
            { keys: "prefix {", description: "Move pane left" },
            { keys: "prefix }", description: "Move pane right" },
            { keys: "prefix q", description: "Show pane numbers" },
            { keys: "prefix o", description: "Next pane" },
          ],
        },
        {
          name: "Windows",
          shortcuts: [
            { keys: "prefix c", description: "New window" },
            { keys: "prefix n", description: "Next window" },
            { keys: "prefix p", description: "Previous window" },
            { keys: "prefix &", description: "Kill window" },
            { keys: "prefix ,", description: "Rename window" },
            { keys: "prefix w", description: "List windows" },
            { keys: "prefix 0-9", description: "Switch to window N" },
          ],
        },
        {
          name: "Sessions",
          shortcuts: [
            { keys: "prefix d", description: "Detach session" },
            { keys: "prefix s", description: "List sessions" },
            { keys: "prefix $", description: "Rename session" },
            { keys: "prefix (", description: "Previous session" },
            { keys: "prefix )", description: "Next session" },
            { keys: "tmux new -s", description: "New named session" },
            { keys: "tmux attach -t", description: "Attach to session" },
          ],
        },
        {
          name: "Copy Mode",
          shortcuts: [
            { keys: "prefix [", description: "Enter copy mode" },
            { keys: "Space", description: "Start selection" },
            { keys: "Enter", description: "Copy selection" },
            { keys: "prefix ]", description: "Paste buffer" },
            { keys: "q", description: "Exit copy mode" },
          ],
        },
      ],
    },
    {
      name: "VS Code",
      icon: "",
      color: "#73daca",
      groups: [
        {
          name: "General",
          shortcuts: [
            { keys: "Cmd+Shift+P", description: "Command palette" },
            { keys: "Cmd+P", description: "Quick open file" },
            { keys: "Cmd+Shift+N", description: "New window" },
            { keys: "Cmd+W", description: "Close editor" },
            { keys: "Cmd+,", description: "Open settings" },
            { keys: "Cmd+K Cmd+S", description: "Keyboard shortcuts" },
          ],
        },
        {
          name: "Editing",
          shortcuts: [
            { keys: "Cmd+D", description: "Select next occurrence" },
            { keys: "Cmd+Shift+L", description: "Select all occurrences" },
            { keys: "Alt+Up/Down", description: "Move line up/down" },
            { keys: "Shift+Alt+Up/Down", description: "Copy line up/down" },
            { keys: "Cmd+Shift+K", description: "Delete line" },
            { keys: "Cmd+/", description: "Toggle comment" },
            { keys: "Cmd+Shift+A", description: "Toggle block comment" },
            { keys: "Cmd+]", description: "Indent line" },
            { keys: "Cmd+[", description: "Outdent line" },
          ],
        },
        {
          name: "Navigation",
          shortcuts: [
            { keys: "Cmd+G", description: "Go to line" },
            { keys: "Cmd+Shift+O", description: "Go to symbol" },
            { keys: "F12", description: "Go to definition" },
            { keys: "Shift+F12", description: "Show references" },
            { keys: "Cmd+Shift+\\", description: "Jump to bracket" },
            { keys: "Ctrl+-", description: "Go back" },
            { keys: "Ctrl+Shift+-", description: "Go forward" },
          ],
        },
        {
          name: "Search & Replace",
          shortcuts: [
            { keys: "Cmd+F", description: "Find" },
            { keys: "Cmd+H", description: "Replace" },
            { keys: "Cmd+Shift+F", description: "Search in files" },
            { keys: "Cmd+Shift+H", description: "Replace in files" },
            { keys: "F3 / Shift+F3", description: "Find next/previous" },
          ],
        },
      ],
    },
    {
      name: "Docker",
      icon: "",
      color: "#bb9af7",
      groups: [
        {
          name: "Containers",
          shortcuts: [
            { keys: "docker ps", description: "List running containers" },
            { keys: "docker ps -a", description: "List all containers" },
            { keys: "docker run -it", description: "Run interactive" },
            { keys: "docker exec -it", description: "Execute in container" },
            { keys: "docker stop", description: "Stop container" },
            { keys: "docker rm", description: "Remove container" },
            { keys: "docker logs -f", description: "Follow logs" },
          ],
        },
        {
          name: "Images",
          shortcuts: [
            { keys: "docker images", description: "List images" },
            { keys: "docker build -t", description: "Build with tag" },
            { keys: "docker pull", description: "Pull image" },
            { keys: "docker push", description: "Push image" },
            { keys: "docker rmi", description: "Remove image" },
            { keys: "docker tag", description: "Tag image" },
          ],
        },
        {
          name: "Compose",
          shortcuts: [
            { keys: "docker compose up", description: "Start services" },
            { keys: "docker compose up -d", description: "Start detached" },
            { keys: "docker compose down", description: "Stop & remove" },
            { keys: "docker compose logs", description: "View logs" },
            { keys: "docker compose ps", description: "List services" },
            { keys: "docker compose build", description: "Build services" },
          ],
        },
        {
          name: "Cleanup",
          shortcuts: [
            { keys: "docker system prune", description: "Remove unused data" },
            { keys: "docker volume prune", description: "Remove unused volumes" },
            { keys: "docker image prune", description: "Remove unused images" },
            { keys: "docker container prune", description: "Remove stopped" },
          ],
        },
      ],
    },
    {
      name: "macOS",
      icon: "",
      color: "#ff9e64",
      groups: [
        {
          name: "System",
          shortcuts: [
            { keys: "Cmd+Space", description: "Spotlight search" },
            { keys: "Cmd+Tab", description: "Switch applications" },
            { keys: "Cmd+`", description: "Switch windows in app" },
            { keys: "Cmd+Q", description: "Quit application" },
            { keys: "Cmd+H", description: "Hide application" },
            { keys: "Cmd+M", description: "Minimize window" },
            { keys: "Cmd+Opt+Esc", description: "Force quit dialog" },
            { keys: "Ctrl+Cmd+Q", description: "Lock screen" },
          ],
        },
        {
          name: "Screenshots",
          shortcuts: [
            { keys: "Cmd+Shift+3", description: "Screenshot full screen" },
            { keys: "Cmd+Shift+4", description: "Screenshot selection" },
            { keys: "Cmd+Shift+4+Space", description: "Screenshot window" },
            { keys: "Cmd+Shift+5", description: "Screenshot options" },
          ],
        },
        {
          name: "Finder",
          shortcuts: [
            { keys: "Cmd+N", description: "New Finder window" },
            { keys: "Cmd+Shift+N", description: "New folder" },
            { keys: "Cmd+Delete", description: "Move to trash" },
            { keys: "Cmd+Shift+Delete", description: "Empty trash" },
            { keys: "Cmd+Shift+.", description: "Show hidden files" },
            { keys: "Space", description: "Quick Look" },
            { keys: "Cmd+I", description: "Get info" },
          ],
        },
        {
          name: "Text Editing",
          shortcuts: [
            { keys: "Cmd+A", description: "Select all" },
            { keys: "Cmd+C", description: "Copy" },
            { keys: "Cmd+V", description: "Paste" },
            { keys: "Cmd+X", description: "Cut" },
            { keys: "Cmd+Z", description: "Undo" },
            { keys: "Cmd+Shift+Z", description: "Redo" },
            { keys: "Opt+Delete", description: "Delete word" },
            { keys: "Cmd+Delete", description: "Delete to line start" },
          ],
        },
      ],
    },
    {
      name: "Shell",
      icon: "",
      color: "#7dcfff",
      groups: [
        {
          name: "Navigation",
          shortcuts: [
            { keys: "Ctrl+A", description: "Move to line start" },
            { keys: "Ctrl+E", description: "Move to line end" },
            { keys: "Ctrl+W", description: "Delete word backward" },
            { keys: "Ctrl+U", description: "Delete to line start" },
            { keys: "Ctrl+K", description: "Delete to line end" },
            { keys: "Ctrl+Y", description: "Paste deleted text" },
            { keys: "Alt+B", description: "Move word backward" },
            { keys: "Alt+F", description: "Move word forward" },
          ],
        },
        {
          name: "History",
          shortcuts: [
            { keys: "Ctrl+R", description: "Search history" },
            { keys: "Ctrl+P / Up", description: "Previous command" },
            { keys: "Ctrl+N / Down", description: "Next command" },
            { keys: "!!", description: "Repeat last command" },
            { keys: "!$", description: "Last argument" },
            { keys: "!*", description: "All arguments" },
            { keys: "history", description: "Show history" },
          ],
        },
        {
          name: "Process Control",
          shortcuts: [
            { keys: "Ctrl+C", description: "Kill foreground process" },
            { keys: "Ctrl+Z", description: "Suspend process" },
            { keys: "fg", description: "Resume in foreground" },
            { keys: "bg", description: "Resume in background" },
            { keys: "jobs", description: "List background jobs" },
            { keys: "Ctrl+D", description: "Exit / EOF" },
          ],
        },
        {
          name: "Useful Commands",
          shortcuts: [
            { keys: "cd -", description: "Previous directory" },
            { keys: "pushd / popd", description: "Directory stack" },
            { keys: "ctrl+l / clear", description: "Clear screen" },
            { keys: "which / type", description: "Locate command" },
            { keys: "man", description: "Manual pages" },
            { keys: "alias", description: "List aliases" },
          ],
        },
      ],
    },
  ],
};

export function loadConfig(): Config {
  for (const configPath of CONFIG_PATHS) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8");
        const parsed = yaml.load(content) as Config;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          categories: parsed.categories || DEFAULT_CONFIG.categories,
        };
      } catch (error) {
        console.error(`Error loading config from ${configPath}:`, error);
      }
    }
  }

  return DEFAULT_CONFIG;
}

export function getAllShortcuts(config: Config): Array<{
  category: string;
  group: string;
  keys: string;
  description: string;
}> {
  const shortcuts: Array<{
    category: string;
    group: string;
    keys: string;
    description: string;
  }> = [];

  for (const category of config.categories) {
    for (const group of category.groups) {
      for (const shortcut of group.shortcuts) {
        shortcuts.push({
          category: category.name,
          group: group.name,
          keys: shortcut.keys,
          description: shortcut.description,
        });
      }
    }
  }

  return shortcuts;
}
