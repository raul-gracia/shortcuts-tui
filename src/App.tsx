import { useEffect, useReducer, useState } from "react";
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

// Bento box component for each shortcut group with custom solid borders.
// When the group has more shortcuts than fit in `maxVisibleRows`, only a
// window of `maxVisibleRows` items (starting at `scrollOffset`) is shown,
// and the bottom border doubles as a scroll-position indicator.
function BentoBox({
  group,
  theme,
  boxWidth,
  scrollOffset,
  maxVisibleRows,
}: {
  group: ShortcutGroup;
  theme: Theme;
  boxWidth: number;
  scrollOffset: number;
  maxVisibleRows: number;
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

  const total = group.shortcuts.length;
  const needsScroll = total > maxVisibleRows && maxVisibleRows > 0;
  const maxStart = Math.max(0, total - maxVisibleRows);
  const start = needsScroll ? Math.min(Math.max(0, scrollOffset), maxStart) : 0;
  const visibleShortcuts = needsScroll
    ? group.shortcuts.slice(start, start + maxVisibleRows)
    : group.shortcuts;

  // Embed a scroll-position indicator in the bottom border when the panel
  // is scrollable, e.g. "╰ 6-20/40 ▼ ──────╯".
  let bottomBorder = "╰" + "─".repeat(innerWidth) + "╯";
  if (needsScroll) {
    const end = start + visibleShortcuts.length;
    const atTop = start === 0;
    const atBottom = end >= total;
    const arrow = atBottom ? (atTop ? "" : "▲") : atTop ? "▼" : "↕";
    const label = ` ${start + 1}-${end}/${total}${arrow ? " " + arrow : ""} `;
    const fittedLabel = label.length <= innerWidth ? label : label.slice(0, innerWidth);
    const remaining = Math.max(0, innerWidth - fittedLabel.length);
    bottomBorder = "╰" + fittedLabel + "─".repeat(remaining) + "╯";
  }

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

      {/* Shortcuts (windowed to the visible scroll range) */}
      {visibleShortcuts.map((shortcut, idx) => {
        const keyText = fitText(" " + shortcut.keys, keyColWidth);
        const descText = fitText(shortcut.description, descColWidth);

        return (
          <Text key={start + idx} backgroundColor={theme.background}>
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

      {/* Bottom border (or scroll indicator) */}
      <Text color={theme.border} backgroundColor={theme.background}>
        {bottomBorder}
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
  // Bumped on terminal resize to force a re-render, since terminal
  // dimensions are read directly from `stdout` rather than tracked in state.
  const [, forceUpdate] = useReducer((tick: number) => tick + 1, 0);

  // Get terminal dimensions for full-screen layout
  const terminalWidth = stdout?.columns ?? 80;
  const terminalHeight = stdout?.rows ?? 24;

  // Calculate how many boxes can fit on screen
  const headerHeight = 3; // Header + margin
  const tabBarHeight = 2; // Tab bar + margin
  const searchBarHeight = 2; // Search bar + margin
  const footerHeight = 3; // Footer separator + help text
  const availableHeight = terminalHeight - headerHeight - tabBarHeight - searchBarHeight - footerHeight - 4; // -4 for outer border/padding

  // Rows available for shortcuts inside a single panel (title + top/bottom border overhead).
  const maxVisibleRowsPerBox = Math.max(1, availableHeight - 3);
  // Estimate box height (title + shortcuts + borders), capped to what a
  // panel actually renders once it's scrollable: a panel never grows
  // taller than `maxVisibleRowsPerBox` regardless of its item count, so
  // pagination must size it that way too — otherwise a tall-but-scrollable
  // group's *uncapped* item count still forces smaller sibling groups onto
  // their own page, even though on screen there was room for both
  // (the entire point of making panels scrollable was to avoid that).
  const estimateBoxHeight = (group: ShortcutGroup) =>
    Math.min(group.shortcuts.length, maxVisibleRowsPerBox) + 3;

  // Calculate boxes per row
  const availableWidth = terminalWidth - 6;
  const boxWidth = Math.min(Math.floor(availableWidth / Math.max(Math.floor(availableWidth / 45), 1)) - 1, 50);
  const boxesPerRow = Math.max(Math.floor(availableWidth / (boxWidth + 1)), 1);

  useEffect(() => {
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
  }, []);

  // Recompute layout on terminal resize. Ink repaints its own Yoga-based
  // layout on resize automatically, but the dimensions used here are read
  // directly from `stdout` in plain JS, so we need an explicit listener to
  // trigger a React re-render when the terminal is resized.
  useEffect(() => {
    if (!stdout || typeof stdout.on !== "function") return;
    const handleResize = () => {
      forceUpdate();
      // Full reset (page AND scroll), synchronous with the resize itself
      // (see the tab-switch comment below for why a deferred effect isn't
      // safe here). Page has to be reset too, not just scroll: a
      // width-driven repagination can change *which groups* land on a
      // given page index without changing the *number* of pages, so
      // merely clamping the existing index (which the per-render clamp
      // below already does) isn't enough — it can silently swap the
      // content shown at the currently-selected page. Resetting to page 0
      // makes the outcome predictable instead of dependent on exactly how
      // the reflow happened to land.
      dispatchNav({ type: "setPage", page: 0 });
    };
    stdout.on("resize", handleResize);
    return () => {
      stdout.off?.("resize", handleResize);
    };
  }, [stdout]);

  const theme: Theme = {
    ...DEFAULT_THEME,
    ...(config?.theme || {}),
  };

  // Derive the groups shown on the current page/search so both rendering
  // and the input handler below agree on what's scrollable. Computed
  // unconditionally (with null-safe fallbacks) because `useInput`'s closure
  // captures these values before we know whether `config` has loaded yet.
  const activeCategory = config?.categories?.[activeTab];
  let displayedShortcuts: ShortcutGroup[] = activeCategory?.groups || [];

  if (searchQuery && searchMode && config) {
    const allShortcuts = getAllShortcuts(config);
    const fzf = new Fzf(allShortcuts, {
      selector: (item) => `${item.keys} ${item.description}`,
    });
    const results = fzf.find(searchQuery);

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

  const scrollableMaxForPage = (page: number): number => {
    const boxes = pages[page] ?? [];
    const tallest = boxes.reduce((max, group) => Math.max(max, group.shortcuts.length), 0);
    return Math.max(0, tallest - maxVisibleRowsPerBox);
  };
  const clampPageIndex = (page: number) => Math.min(Math.max(0, page), Math.max(0, totalPages - 1));

  // Page and scroll live in one reducer (rather than two separate
  // `useState`s) because deciding "scroll further" vs. "advance to the
  // next page" has to read both together, and it must always read the
  // *latest* values — not whatever a stale closure captured. Ink can
  // deliver several keypresses to this component before React gets a
  // chance to run effects in between (its stdin handler drains `read()`
  // in a loop), so branching on closure-captured values here would let a
  // burst of "j" presses scroll correctly but never actually cross into
  // the next page. `useReducer` guarantees the reducer always sees the
  // fully-applied prior state, however many actions were queued in one
  // tick. The reducer closes over `pages`/`maxVisibleRowsPerBox`, which
  // are safe to read fresh each render since they don't change from a
  // scroll/page action itself.
  type NavAction =
    | { type: "down"; step: number }
    | { type: "up"; step: number }
    | { type: "panelTop" }
    | { type: "panelBottom" }
    | { type: "setPage"; page: number }
    | { type: "clamp"; page: number; scroll: number };

  function navReducer(state: { page: number; scroll: number }, action: NavAction) {
    switch (action.type) {
      case "down": {
        const page = clampPageIndex(state.page);
        const max = scrollableMaxForPage(page);
        if (max > 0 && state.scroll < max) {
          return { page, scroll: Math.min(max, state.scroll + action.step) };
        }
        if (page + 1 < totalPages) {
          return { page: page + 1, scroll: 0 };
        }
        // Already at the bottom of the last page: stay put rather than
        // "advancing" past the end, which would otherwise get clamped back
        // to this same page but with scroll wiped to 0 — silently undoing
        // the scroll position instead of just doing nothing.
        return { page, scroll: max };
      }
      case "up": {
        const page = clampPageIndex(state.page);
        if (state.scroll > 0) {
          return { page, scroll: Math.max(0, state.scroll - action.step) };
        }
        if (page - 1 >= 0) {
          return { page: page - 1, scroll: 0 };
        }
        return { page, scroll: 0 };
      }
      case "panelTop":
        return { ...state, scroll: 0 };
      case "panelBottom": {
        const page = clampPageIndex(state.page);
        return { page, scroll: scrollableMaxForPage(page) };
      }
      case "setPage":
        return { page: action.page, scroll: 0 };
      case "clamp":
        return { page: action.page, scroll: action.scroll };
      default:
        return state;
    }
  }

  const [navState, dispatchNav] = useReducer(navReducer, { page: 0, scroll: 0 });

  // Every trigger that should reset the page/scroll (tab switch, entering
  // or exiting search mode, each search keystroke, terminal resize) does
  // so with a synchronous `dispatchNav` call right at the point of change,
  // rather than a `useEffect` watching for that value to change. This is
  // deliberate, not just a style choice: a `useEffect`-based reset is
  // deferred, and Ink can process several keypresses before React gets a
  // chance to run effects in between (see the `navReducer` comment
  // above). A first version of this fix used such an effect as a
  // "harmless backstop" — it wasn't harmless: dispatched with a delay, it
  // fired *after* a legitimate scroll the user made right after the
  // triggering change, silently reverting that scroll back to 0. Doing
  // the reset synchronously, atomically with the change that necessitates
  // it, removes the gap where that could happen instead of just
  // narrowing it.

  const clampedPage = clampPageIndex(navState.page);
  const visibleBoxes = pages[clampedPage] || [];
  const scrollableMax = scrollableMaxForPage(clampedPage);
  const canScroll = scrollableMax > 0;
  const clampedScroll = Math.min(Math.max(0, navState.scroll), scrollableMax);

  // Correct stored state if pagination/content shrank out from under it.
  if (clampedPage !== navState.page || clampedScroll !== navState.scroll) {
    dispatchNav({ type: "clamp", page: clampedPage, scroll: clampedScroll });
  }

  useInput((input, key) => {
    // Exit on ESC or q (when not in search mode)
    if (key.escape || (input === "q" && !searchMode)) {
      exit();
      return;
    }

    // Toggle search mode. Resetting here is a no-op today (an empty query
    // shows the same content as browsing), but keeps this trigger
    // consistent with every other one below rather than relying on it
    // happening to already be at page 0.
    if (input === "/" && !searchMode) {
      setSearchMode(true);
      dispatchNav({ type: "setPage", page: 0 });
      return;
    }

    // Exit search mode. Full reset (page AND scroll): returning to the
    // active category's own pagination is a different `pages` array from
    // whatever search-results pagination was showing, so the previous
    // page index has no defined meaning here — see the resize handler
    // above for why "just clamp the index" isn't enough on its own.
    if (key.escape && searchMode) {
      setSearchMode(false);
      setSearchQuery("");
      dispatchNav({ type: "setPage", page: 0 });
      return;
    }

    // Handle search input. Each keystroke re-filters into a *new* set of
    // result-groups with its own pagination (grouped by category/group,
    // built fresh from `getAllShortcuts` — see `displayedShortcuts`
    // above), so both page and scroll reset on every change via
    // "setPage": the old page index doesn't refer to anything meaningful
    // in the new results (same reason the resize and tab-switch resets
    // above use "setPage" rather than a scroll-only reset).
    if (searchMode) {
      if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
        dispatchNav({ type: "setPage", page: 0 });
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQuery((prev) => prev + input);
        dispatchNav({ type: "setPage", page: 0 });
      }
      return;
    }

    // Tab navigation. The page/scroll reset is dispatched synchronously
    // here, in the same event as the tab switch, rather than left to the
    // `[activeTab]` effect below: `setActiveTab` uses a functional updater
    // (safe against a stale closure deciding *which* tab to move to), but
    // if the reset were only effect-driven, a scroll key pressed
    // immediately after a tab switch — in the same input burst, before
    // the effect gets a chance to run — would fold against the *previous*
    // tab's pagination and land the new tab scrolled to a leftover
    // position instead of the top. Making the reset part of the same
    // synchronous update as the switch removes that window entirely.
    if (key.tab && !key.shift) {
      setActiveTab((prev) =>
        config ? (prev + 1) % config.categories.length : 0
      );
      dispatchNav({ type: "setPage", page: 0 });
    } else if (key.tab && key.shift) {
      setActiveTab((prev) =>
        config
          ? (prev - 1 + config.categories.length) % config.categories.length
          : 0
      );
      dispatchNav({ type: "setPage", page: 0 });
    }

    // When the current panel overflows the viewport, j/k, arrows and
    // PgUp/PgDn scroll it first; once scrolled all the way to the bottom
    // (or top), the same keys fall through to their original meaning of
    // moving between pages, so a page is never left unreachable just
    // because a panel on it needed scrolling. g/G jump to the top/bottom
    // of the current panel only. This all goes through `dispatchNav` so
    // the decision is always made against the latest state (see the
    // `navReducer` comment above for why that matters).
    if (input === "j" || key.downArrow || key.pageDown) {
      dispatchNav({ type: "down", step: key.pageDown ? maxVisibleRowsPerBox : 1 });
    } else if (input === "k" || key.upArrow || key.pageUp) {
      dispatchNav({ type: "up", step: key.pageUp ? maxVisibleRowsPerBox : 1 });
    } else if (input === "g") {
      dispatchNav({ type: "panelTop" });
    } else if (input === "G") {
      dispatchNav({ type: "panelBottom" });
    }

    // Number keys for quick tab switch (same synchronous-reset reasoning
    // as Tab/Shift+Tab above).
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= 9 && config) {
      const idx = num - 1;
      if (idx < config.categories.length) {
        setActiveTab(idx);
        dispatchNav({ type: "setPage", page: 0 });
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
              scrollOffset={clampedScroll}
              maxVisibleRows={maxVisibleRowsPerBox}
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
            {canScroll
              ? " Tab: Next | Shift+Tab: Prev | 1-9: Jump | /: Search | ESC/q: Quit"
              : " Tab: Next | Shift+Tab: Prev | 1-9: Jump | j/k: Page | /: Search | ESC/q: Quit"}
          </Text>
          {totalPages > 1 && (
            <Text color={theme.secondary} backgroundColor={theme.background}>
              {`Page ${clampedPage + 1}/${totalPages} `}
            </Text>
          )}
        </Box>
        {canScroll && (
          <Box width={terminalWidth - 4}>
            <Text color={theme.secondary} backgroundColor={theme.background}>
              {" j/k/↑↓/PgUp/PgDn: Scroll (then page) | g/G: Panel top/bottom"}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
