import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { Fzf } from "fzf";
import { loadConfig, getAllShortcuts } from "./utils/configLoader";
import { DEFAULT_THEME, type Config, type Theme } from "./types/config";

export function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
  }, []);

  const theme: Theme = {
    ...DEFAULT_THEME,
    ...(config?.theme || {}),
  };

  useInput((input, key) => {
    // Exit on ESC or q (when not in search mode)
    if (key.escape || (input === "q" && !searchMode)) {
      exit();
      return;
    }

    // Toggle search mode
    if (input === "/" && !searchMode) {
      setSearchMode(true);
      return;
    }

    // Exit search mode
    if (key.escape && searchMode) {
      setSearchMode(false);
      setSearchQuery("");
      return;
    }

    // Handle search input
    if (searchMode) {
      if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQuery((prev) => prev + input);
      }
      return;
    }

    // Tab navigation
    if (key.tab && !key.shift) {
      setActiveTab((prev) =>
        config ? (prev + 1) % config.categories.length : 0
      );
    } else if (key.tab && key.shift) {
      setActiveTab((prev) =>
        config
          ? (prev - 1 + config.categories.length) % config.categories.length
          : 0
      );
    }

    // Number keys for quick tab switch
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= 9 && config) {
      const idx = num - 1;
      if (idx < config.categories.length) {
        setActiveTab(idx);
      }
    }
  });

  if (!config) {
    return (
      <Box>
        <Text color={theme.muted}>Loading...</Text>
      </Box>
    );
  }

  const activeCategory = config.categories[activeTab];
  let displayedShortcuts = activeCategory?.groups || [];

  // Filter shortcuts if searching
  if (searchQuery && searchMode) {
    const allShortcuts = getAllShortcuts(config);
    const fzf = new Fzf(allShortcuts, {
      selector: (item) => `${item.keys} ${item.description}`,
    });
    const results = fzf.find(searchQuery);

    // Group filtered results
    const groupedResults = new Map<string, typeof allShortcuts>();
    for (const result of results) {
      const key = `${result.item.category}/${result.item.group}`;
      if (!groupedResults.has(key)) {
        groupedResults.set(key, []);
      }
      groupedResults.get(key)?.push(result.item);
    }

    displayedShortcuts = Array.from(groupedResults.entries()).map(
      ([key, shortcuts]) => ({
        name: key,
        shortcuts: shortcuts.map((s) => ({
          keys: s.keys,
          description: s.description,
        })),
      })
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={theme.primary}>
          Shortcuts TUI
        </Text>
        <Text color={theme.muted}> - Press ESC or q to quit</Text>
      </Box>

      {/* Tab Bar */}
      <Box marginBottom={1} gap={1}>
        {config.categories.map((cat, idx) => (
          <Box key={cat.name}>
            <Text
              backgroundColor={idx === activeTab ? theme.highlight : undefined}
              color={idx === activeTab ? theme.primary : theme.muted}
              bold={idx === activeTab}
            >
              {" "}
              {idx + 1}:{cat.icon ? `${cat.icon} ` : ""}
              {cat.name}{" "}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Search Bar */}
      <Box marginBottom={1}>
        <Text color={searchMode ? theme.primary : theme.muted}>
          {searchMode ? "/ " : "Press / to search: "}
        </Text>
        {searchMode && (
          <Text color={theme.text}>
            {searchQuery}
            <Text color={theme.primary}>_</Text>
          </Text>
        )}
      </Box>

      {/* Shortcut Grid */}
      <Box flexDirection="column" gap={1}>
        {displayedShortcuts.map((group) => (
          <Box key={group.name} flexDirection="column">
            <Text bold color={theme.secondary}>
              {group.name}
            </Text>
            <Box flexDirection="column" paddingLeft={2}>
              {group.shortcuts.map((shortcut, idx) => (
                <Box key={idx} gap={2}>
                  <Text color={theme.primary} bold>
                    {shortcut.keys.padEnd(20)}
                  </Text>
                  <Text color={theme.text}>{shortcut.description}</Text>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" borderColor={theme.border} paddingX={1}>
        <Text color={theme.muted}>
          Tab: Next | Shift+Tab: Prev | 1-9: Jump | /: Search | ESC/q: Quit
        </Text>
      </Box>
    </Box>
  );
}
