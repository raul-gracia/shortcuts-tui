import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { Fzf } from "fzf";
import { loadConfig, getAllShortcuts } from "./utils/configLoader";
import { DEFAULT_THEME, type Config, type Theme, type ShortcutGroup } from "./types/config";

// Solid block border style
const BLOCK_BORDER = {
  topLeft: "█",
  top: "█",
  topRight: "█",
  left: "█",
  right: "█",
  bottomLeft: "█",
  bottom: "█",
  bottomRight: "█",
};

// Background component that fills the screen with a solid color
function Background({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) {
  const lines = [];
  for (let i = 0; i < height; i++) {
    lines.push(
      <Text key={i} backgroundColor={color}>
        {" ".repeat(width)}
      </Text>
    );
  }
  return (
    <Box position="absolute" flexDirection="column">
      {lines}
    </Box>
  );
}

// Bento box component for each shortcut group with custom solid borders
function BentoBox({
  group,
  theme,
  boxWidth,
}: {
  group: ShortcutGroup;
  theme: Theme;
  boxWidth: number;
}) {
  const innerWidth = boxWidth - 2; // Width inside the border
  const keyColWidth = 20; // Fixed width for key column including leading space

  // Helper to truncate/pad strings to exact width
  const fitText = (text: string, width: number) => {
    if (width <= 0) return "";
    if (text.length > width) {
      return width >= 3 ? text.slice(0, width - 3) + "..." : text.slice(0, width);
    }
    return text.padEnd(width);
  };

  // Build a complete row string of exact innerWidth
  const buildRow = (content: string): string => {
    return fitText(content, innerWidth);
  };

  const descColWidth = innerWidth - keyColWidth;

  return (
    <Box flexDirection="column" width={boxWidth}>
      {/* Top border */}
      <Text color={theme.border} backgroundColor={theme.background}>
        {"╭" + "─".repeat(innerWidth) + "╮"}
      </Text>

      {/* Group title */}
      <Text backgroundColor={theme.background}>
        <Text color={theme.border} backgroundColor={theme.background}>│</Text>
        <Text bold color={theme.secondary} backgroundColor={theme.background}>
          {buildRow(" " + group.name)}
        </Text>
        <Text color={theme.border} backgroundColor={theme.background}>│</Text>
      </Text>

      {/* Shortcuts */}
      {group.shortcuts.map((shortcut, idx) => {
        const keyText = fitText(" " + shortcut.keys, keyColWidth);
        const descText = fitText(shortcut.description, descColWidth);

        return (
          <Text key={idx} backgroundColor={theme.background}>
            <Text color={theme.border} backgroundColor={theme.background}>│</Text>
            <Text color={theme.primary} bold backgroundColor={theme.background}>
              {keyText}
            </Text>
            <Text color={theme.text} backgroundColor={theme.background}>
              {descText}
            </Text>
            <Text color={theme.border} backgroundColor={theme.background}>│</Text>
          </Text>
        );
      })}

      {/* Bottom border */}
      <Text color={theme.border} backgroundColor={theme.background}>
        {"╰" + "─".repeat(innerWidth) + "╯"}
      </Text>
    </Box>
  );
}

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [config, setConfig] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Get terminal dimensions for full-screen layout
  const terminalWidth = stdout?.columns ?? 80;
  const terminalHeight = stdout?.rows ?? 24;

  // Calculate how many boxes can fit on screen
  const headerHeight = 3; // Header + margin
  const tabBarHeight = 2; // Tab bar + margin
  const searchBarHeight = 2; // Search bar + margin
  const footerHeight = 3; // Footer separator + help text
  const availableHeight = terminalHeight - headerHeight - tabBarHeight - searchBarHeight - footerHeight - 4; // -4 for outer border/padding

  // Estimate box height (title + shortcuts + borders)
  const estimateBoxHeight = (group: ShortcutGroup) => group.shortcuts.length + 3; // +3 for title and borders

  // Calculate boxes per row
  const availableWidth = terminalWidth - 6;
  const boxWidth = Math.min(Math.floor(availableWidth / Math.max(Math.floor(availableWidth / 45), 1)) - 1, 50);
  const boxesPerRow = Math.max(Math.floor(availableWidth / (boxWidth + 1)), 1);

  useEffect(() => {
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
  }, []);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

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

    // Page navigation with j/k or arrow keys
    if (input === "j" || key.downArrow) {
      setCurrentPage((prev) => prev + 1); // Will be clamped later
    } else if (input === "k" || key.upArrow) {
      setCurrentPage((prev) => Math.max(0, prev - 1));
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
      <Box width={terminalWidth} height={terminalHeight}>
        <Background width={terminalWidth} height={terminalHeight} color={theme.background} />
        <Box
          width={terminalWidth}
          height={terminalHeight}
          borderStyle={BLOCK_BORDER}
          borderColor={theme.primary}
          justifyContent="center"
          alignItems="center"
        >
          <Text color={theme.muted}>Loading...</Text>
        </Box>
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

  // Calculate pagination based on box heights
  const paginateBoxes = (boxes: ShortcutGroup[]) => {
    const pages: ShortcutGroup[][] = [];
    let currentPageBoxes: ShortcutGroup[] = [];
    let currentRowHeight = 0;
    let currentRowBoxes = 0;
    let totalHeight = 0;

    for (const box of boxes) {
      const boxHeight = estimateBoxHeight(box);

      // Check if we need a new row
      if (currentRowBoxes >= boxesPerRow) {
        totalHeight += currentRowHeight + 1; // +1 for gap
        currentRowHeight = 0;
        currentRowBoxes = 0;
      }

      // Check if adding this box would exceed available height
      const projectedHeight = totalHeight + Math.max(currentRowHeight, boxHeight);
      if (projectedHeight > availableHeight && currentPageBoxes.length > 0) {
        // Start a new page
        pages.push(currentPageBoxes);
        currentPageBoxes = [];
        currentRowHeight = 0;
        currentRowBoxes = 0;
        totalHeight = 0;
      }

      currentPageBoxes.push(box);
      currentRowHeight = Math.max(currentRowHeight, boxHeight);
      currentRowBoxes++;
    }

    // Add the last page if it has boxes
    if (currentPageBoxes.length > 0) {
      pages.push(currentPageBoxes);
    }

    return pages.length > 0 ? pages : [[]];
  };

  const pages = paginateBoxes(displayedShortcuts);
  const totalPages = pages.length;
  const clampedPage = Math.min(Math.max(0, currentPage), totalPages - 1);

  // Update page if it was clamped
  if (clampedPage !== currentPage) {
    setCurrentPage(clampedPage);
  }

  const visibleBoxes = pages[clampedPage] || [];

  return (
    <Box width={terminalWidth} height={terminalHeight}>
      {/* Solid background layer */}
      <Background width={terminalWidth} height={terminalHeight} color={theme.background} />

      {/* Main content with border */}
      <Box
        width={terminalWidth}
        height={terminalHeight}
        borderStyle={BLOCK_BORDER}
        borderColor={theme.primary}
        flexDirection="column"
        padding={1}
      >
        {/* Header */}
        <Box marginBottom={1}>
          <Text bold color={theme.primary} backgroundColor={theme.background}>
            Shortcuts TUI
          </Text>
          <Text color={theme.muted} backgroundColor={theme.background}> - Press ESC or q to quit</Text>
        </Box>

        {/* Tab Bar */}
        <Box marginBottom={1} gap={1}>
          {config.categories.map((cat, idx) => (
            <Box key={cat.name}>
              <Text
                backgroundColor={idx === activeTab ? theme.highlight : theme.background}
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
          <Text color={searchMode ? theme.primary : theme.muted} backgroundColor={theme.background}>
            {searchMode ? "/ " : "Press / to search: "}
          </Text>
          {searchMode && (
            <Text color={theme.text} backgroundColor={theme.background}>
              {searchQuery}
              <Text color={theme.primary} backgroundColor={theme.background}>_</Text>
            </Text>
          )}
        </Box>

        {/* Bento Grid - Centered */}
        <Box
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="center"
          alignItems="flex-start"
          gap={1}
          flexGrow={1}
        >
          {visibleBoxes.map((group) => (
            <BentoBox
              key={group.name}
              group={group}
              theme={theme}
              boxWidth={boxWidth}
            />
          ))}
        </Box>

        {/* Footer */}
        <Box>
          <Text color={theme.border} backgroundColor={theme.background}>
            {"─".repeat(terminalWidth - 4)}
          </Text>
        </Box>
        <Box justifyContent="space-between" width={terminalWidth - 4}>
          <Text color={theme.muted} backgroundColor={theme.background}>
            {" Tab: Next | Shift+Tab: Prev | 1-9: Jump | j/k: Page | /: Search | ESC/q: Quit"}
          </Text>
          {totalPages > 1 && (
            <Text color={theme.secondary} backgroundColor={theme.background}>
              {`Page ${clampedPage + 1}/${totalPages} `}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
