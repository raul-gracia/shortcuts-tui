import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import React from "react";
import stringWidth from "string-width";
import { cleanup, render } from "ink-testing-library";

// DC-184: the panel viewport (a BentoBox of shortcuts) did not scroll
// vertically, so on a short terminal a group with many shortcuts rendered
// its full, un-windowed list and the bottom items were never reachable.
//
// `loadConfig()` reads its config file from a path derived from `homedir()`
// at *module import time*. Bun's `os.homedir()` does not honor a runtime
// `process.env.HOME` override, so to feed the app a deterministic config
// (without touching the real developer machine's ~/.config), we mock the
// `os` module's `homedir()` to point at a scratch directory before
// dynamically importing the App module (dynamic import defers evaluation to
// this point; a static import would be hoisted above the mock). The mock is
// restored to the real `os` module in `afterAll` so it can't leak into any
// other test file that happens to run in the same `bun test` process.

const BIG_GROUP_COUNT = 40;
const LAST_BIG_KEY = "cmd-39";
const FIRST_BIG_KEY = "cmd-0 ";
const SHORT_TERMINAL_ROWS = 15;

// Second category used to prove that paging past a scrollable panel still
// reaches the next page (see the "pagination stays reachable" test below).
const GROUP_A_COUNT = 40; // tall enough to need scrolling on its own
const GROUP_B_COUNT = 5; // small enough to land alone on the next page
const GROUP_A_LAST_KEY = "wide-39";
const GROUP_B_FIRST_KEY = "narrow-0 ";

function buildConfigYaml(): string {
  const lines = [
    "categories:",
    "  - name: Test",
    "    groups:",
    "      - name: BigGroup",
    "        shortcuts:",
  ];
  for (let i = 0; i < BIG_GROUP_COUNT; i++) {
    lines.push(`          - keys: "cmd-${i}"`);
    lines.push(`            description: "Shortcut number ${i}"`);
  }
  lines.push(
    "  - name: Paging",
    "    groups:",
    "      - name: GroupA",
    "        shortcuts:"
  );
  for (let i = 0; i < GROUP_A_COUNT; i++) {
    lines.push(`          - keys: "wide-${i}"`);
    lines.push(`            description: "Wide shortcut ${i}"`);
  }
  lines.push("      - name: GroupB", "        shortcuts:");
  for (let i = 0; i < GROUP_B_COUNT; i++) {
    lines.push(`          - keys: "narrow-${i}"`);
    lines.push(`            description: "Narrow shortcut ${i}"`);
  }
  return lines.join("\n") + "\n";
}

async function flush(ms = 20): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

type Instance = ReturnType<typeof render>;

// Resizes the fake terminal and emits a real 'resize' event, exercising the
// app's own `stdout.on('resize', ...)` listener (rather than forcing a
// re-render directly), so the test actually proves that mechanism works.
async function resizeTo(instance: Instance, rows: number): Promise<void> {
  Object.defineProperty(instance.stdout, "rows", {
    value: rows,
    configurable: true,
    writable: true,
  });
  instance.stdout.emit("resize");
  await flush();
}

describe("App panel scrolling (DC-184)", () => {
  let tmpHome: string;
  let App: typeof import("./App").App;

  beforeAll(async () => {
    tmpHome = mkdtempSync(join(tmpdir(), "shortcuts-tui-test-"));
    const configDir = join(tmpHome, ".config", "shortcuts-tui");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, "shortcuts.yaml"), buildConfigYaml());

    const realOs = await import("os");
    mock.module("os", () => ({ ...realOs, homedir: () => tmpHome }));

    // Dynamic import so configLoader's module-level CONFIG_PATHS (built from
    // `homedir()`) is evaluated *after* the mock above is installed (static
    // imports are hoisted and would evaluate before this code runs).
    ({ App } = await import("./App"));
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(async () => {
    // Undo the module mock so a later test file in the same process gets
    // the real `os` module back, rather than this file's deleted tmp home.
    const realOs = await import("os");
    mock.module("os", () => realOs);
    rmSync(tmpHome, { recursive: true, force: true });
  });

  test("a panel taller than a short terminal is windowed, and scrolling reaches the last item", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    const initialFrame = instance.lastFrame() ?? "";
    // The fix must window the panel's content to what fits on screen: the
    // first item is visible, but the last of 40 items must NOT already be
    // in the rendered output (otherwise nothing was actually clipped/
    // reachable-by-scroll — this is what "not renderable/reachable" means
    // for an un-windowed panel dumped into a short terminal).
    expect(initialFrame).toContain(FIRST_BIG_KEY);
    expect(initialFrame).not.toContain(LAST_BIG_KEY);

    // Scroll to the bottom of the panel with "G".
    instance.stdin.write("G");
    await flush();
    const scrolledFrame = instance.lastFrame() ?? "";
    expect(scrolledFrame).toContain(LAST_BIG_KEY);

    // Scrolling back to the top with "g" returns to the first item.
    instance.stdin.write("g");
    await flush();
    const backAtTopFrame = instance.lastFrame() ?? "";
    expect(backAtTopFrame).toContain(FIRST_BIG_KEY);
    expect(backAtTopFrame).not.toContain(LAST_BIG_KEY);

    instance.unmount();
  });

  test("repeated 'j' presses scroll one row at a time down to the last item", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    expect(instance.lastFrame() ?? "").not.toContain(LAST_BIG_KEY);

    for (let i = 0; i < BIG_GROUP_COUNT; i++) {
      instance.stdin.write("j");
    }
    await flush();

    expect(instance.lastFrame() ?? "").toContain(LAST_BIG_KEY);

    instance.unmount();
  });

  test("a page is still reachable after scrolling a panel all the way down (regression: j/k must not get stuck scrolling forever)", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    // Switch to the "Paging" category (tab 2), which is laid out as
    // page 1 = GroupA (40 items, needs scrolling on this short terminal)
    // and page 2 = GroupB (5 items), each alone on its page.
    instance.stdin.write("2");
    await flush();

    let frame = instance.lastFrame() ?? "";
    expect(frame).toContain("Page 1/2");
    expect(frame).not.toContain(GROUP_A_LAST_KEY);

    // Scroll GroupA exactly to its bottom, then one more: before the fix,
    // once a panel is scrollable, j/k/PgUp/PgDn/g/G are permanently
    // consumed by scrolling and there is no way left to reach page 2 —
    // this is exactly what should no longer happen. GroupA's scrollable
    // range is `GROUP_A_COUNT - 1` rows (one row visible per panel on this
    // terminal height), so exactly `GROUP_A_COUNT` presses exhausts the
    // scroll and lands on page 2 at GroupB's top (GroupB is smaller, but
    // still scrollable at this height, so we stop exactly here rather
    // than continuing to press and scrolling into GroupB too).
    for (let i = 0; i < GROUP_A_COUNT; i++) {
      instance.stdin.write("j");
    }
    await flush();

    frame = instance.lastFrame() ?? "";
    expect(frame).toContain("Page 2/2");
    expect(frame).toContain(GROUP_B_FIRST_KEY);

    // And "k" from here should be able to walk back to page 1.
    for (let i = 0; i < 3; i++) {
      instance.stdin.write("k");
    }
    await flush();
    frame = instance.lastFrame() ?? "";
    expect(frame).toContain("Page 1/2");

    instance.unmount();
  });

  test("switching tabs and immediately scrolling in the same input burst lands at the new tab's top, not a leftover offset (regression: tab-switch reset must be synchronous, not effect-deferred)", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    // Switch to "Paging" and scroll GroupA all the way to its bottom.
    instance.stdin.write("2");
    await flush();
    for (let i = 0; i < GROUP_A_COUNT - 1; i++) {
      instance.stdin.write("j");
    }
    await flush();
    expect(instance.lastFrame() ?? "").toContain(GROUP_A_LAST_KEY);

    // Now, in one synchronous burst with no `await` in between — exactly
    // the kind of burst Ink can deliver from its own stdin read loop —
    // switch back to "Test" (a different, single-page 40-item group) and
    // scroll twice. If the tab-switch reset were only effect-deferred, the
    // two "j" presses could fold against Paging's still-current
    // `{page: 1, scroll: 39}` state before the reset ever ran, landing on
    // the wrong page/offset of the new tab instead of at its top.
    instance.stdin.write("1");
    instance.stdin.write("j");
    instance.stdin.write("j");
    await flush();

    const frame = instance.lastFrame() ?? "";
    expect(frame).not.toContain("wide-"); // must not still be showing Paging/GroupA content
    expect(frame).not.toContain(GROUP_A_LAST_KEY);
    expect(frame).toContain("cmd-2"); // BigGroup, scrolled down exactly 2 from a reset top

    instance.unmount();
  });

  test("resizing to a short terminal windows a panel that used to fit (exercises the live resize listener)", async () => {
    const instance = render(React.createElement(App));
    await flush();
    // Start tall enough that the whole 40-item group fits on screen.
    await resizeTo(instance, 60);
    expect(instance.lastFrame() ?? "").toContain(LAST_BIG_KEY);

    // Resize down without remounting — this exercises the app's own
    // `stdout.on('resize', ...)` listener rather than a manual re-render.
    await resizeTo(instance, SHORT_TERMINAL_ROWS);
    const frame = instance.lastFrame() ?? "";
    expect(frame).toContain(FIRST_BIG_KEY);
    expect(frame).not.toContain(LAST_BIG_KEY);

    instance.unmount();
  });

  test("resizing back to a tall terminal resets scroll instead of leaving a stale offset on the reflowed grid", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    // Scroll to the bottom of the panel.
    instance.stdin.write("G");
    await flush();
    expect(instance.lastFrame() ?? "").toContain(LAST_BIG_KEY);

    // Grow the terminal so the panel no longer needs to scroll. A stale
    // scroll offset must not linger and hide the top of the (now fully
    // visible) group.
    await resizeTo(instance, 60);
    const frame = instance.lastFrame() ?? "";
    expect(frame).toContain(FIRST_BIG_KEY);
    expect(frame).toContain(LAST_BIG_KEY);

    instance.unmount();
  });

  test("resizing to a terminal that's still short (panel still needs scrolling) resets to the top, not just clamps near the bottom", async () => {
    // This specifically distinguishes the resize handler's explicit
    // full reset from the generic per-render clamp that runs regardless
    // of *why* state changed: growing from 15 to 20 rows still leaves the
    // panel scrollable (scrollableMax shrinks from 39 to 37, it doesn't
    // hit 0), so a bare clamp alone would only trim 39 -> 37 and leave the
    // view sitting near the bottom. The explicit reset should instead
    // land at the top (scroll 0), same as any other resize.
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    instance.stdin.write("G");
    await flush();
    expect(instance.lastFrame() ?? "").toContain(LAST_BIG_KEY);

    await resizeTo(instance, 20);
    const frame = instance.lastFrame() ?? "";
    expect(frame).toContain(FIRST_BIG_KEY);
    expect(frame).not.toContain(LAST_BIG_KEY);
    expect(frame).toContain("j/k/↑↓/PgUp/PgDn: Scroll"); // still scrollable at 20 rows

    instance.unmount();
  });

  test("on a tall terminal the panel fits and j/k still page as before", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, 60);

    // With 60 rows the whole 40-item group fits in one panel already.
    const frame = instance.lastFrame() ?? "";
    expect(frame).toContain(FIRST_BIG_KEY);
    expect(frame).toContain(LAST_BIG_KEY);
    // No scroll indicator/help text should be shown when nothing overflows.
    expect(frame).toContain("j/k: Page");

    instance.unmount();
  });

  test("ESC exits search mode instead of quitting the whole app (regression: ESC used to fire the global quit handler unconditionally)", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    instance.stdin.write("/");
    await flush();
    instance.stdin.write("z");
    await flush();
    expect(instance.lastFrame() ?? "").toContain("/ z");

    // ESC while searching must clear search mode, not quit.
    instance.stdin.write("\x1b");
    await flush();
    const frame = instance.lastFrame() ?? "";
    expect(frame).not.toContain("/ z");
    expect(frame).toContain("Press / to search");

    // Confirm the app is genuinely still running (not unmounted): a
    // scroll key should still have an effect.
    instance.stdin.write("G");
    await flush();
    expect(instance.lastFrame() ?? "").toContain(LAST_BIG_KEY);

    instance.unmount();
  });

  test("a genuinely mid-scroll frame renders a properly closed panel (regression: the scroll-both-ways indicator must stay one display column per character)", async () => {
    const instance = render(React.createElement(App));
    await flush();
    await resizeTo(instance, SHORT_TERMINAL_ROWS);

    // Scroll to a position that is neither the very top nor the very
    // bottom, so the indicator shows the "scrollable both ways" glyph
    // rather than "▼"/"▲" alone.
    for (let i = 0; i < 20; i++) {
      instance.stdin.write("j");
    }
    await flush();

    const frame = instance.lastFrame() ?? "";
    const lines = frame.split("\n").filter((line) => line.length > 0);
    const indicatorLine = lines.find((line) => line.includes("▲▼"));
    expect(indicatorLine).toBeDefined();
    // The bottom border must still close...
    expect(indicatorLine).toContain("╯");
    // ...and every rendered line must be the same display width. This
    // whole hand-rolled border is laid out by JS character count, not
    // rendered display width, so any glyph here that isn't exactly one
    // display column wide (the original "↕" was two) throws off that
    // line, and everything laid out relative to it, by the difference.
    const widths = new Set(lines.map((line) => stringWidth(line)));
    expect(widths.size).toBe(1);

    instance.unmount();
  });
});
