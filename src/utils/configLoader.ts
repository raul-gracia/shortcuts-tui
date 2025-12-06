import * as yaml from "js-yaml";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Config, Category } from "../types/config";

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
            { keys: "git commit -m", description: "Commit with message" },
            { keys: "git push", description: "Push to remote" },
            { keys: "git pull", description: "Pull from remote" },
          ],
        },
        {
          name: "Branches",
          shortcuts: [
            { keys: "git checkout -b", description: "Create & switch branch" },
            { keys: "git branch -d", description: "Delete branch" },
            { keys: "git merge", description: "Merge branch" },
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
            { keys: "gd", description: "Go to definition" },
            { keys: "gr", description: "Go to references" },
          ],
        },
        {
          name: "Editing",
          shortcuts: [
            { keys: "<leader>ca", description: "Code action" },
            { keys: "<leader>rn", description: "Rename symbol" },
            { keys: "K", description: "Hover documentation" },
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
          ],
        },
        {
          name: "Windows",
          shortcuts: [
            { keys: "prefix c", description: "New window" },
            { keys: "prefix n", description: "Next window" },
            { keys: "prefix p", description: "Previous window" },
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
