//! Shortcuts TUI plugin for Zellij
//!
//! This plugin displays a shortcuts cheat sheet in a floating Zellij pane.
//! It reads configuration from YAML and provides fuzzy search functionality.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use zellij_tile::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Shortcut {
    keys: String,
    description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ShortcutGroup {
    name: String,
    shortcuts: Vec<Shortcut>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Category {
    name: String,
    icon: Option<String>,
    color: Option<String>,
    groups: Vec<ShortcutGroup>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    categories: Vec<Category>,
}

#[derive(Default)]
struct ShortcutsTui {
    config: Option<Config>,
    active_tab: usize,
    search_query: String,
    search_mode: bool,
}

impl ShortcutsTui {
    fn load_default_config(&mut self) {
        // Default configuration
        self.config = Some(Config {
            categories: vec![
                Category {
                    name: "Git".to_string(),
                    icon: Some("".to_string()),
                    color: Some("#f7768e".to_string()),
                    groups: vec![
                        ShortcutGroup {
                            name: "Basics".to_string(),
                            shortcuts: vec![
                                Shortcut {
                                    keys: "git status".to_string(),
                                    description: "Check repository status".to_string(),
                                },
                                Shortcut {
                                    keys: "git add .".to_string(),
                                    description: "Stage all changes".to_string(),
                                },
                                Shortcut {
                                    keys: "git commit -m".to_string(),
                                    description: "Commit with message".to_string(),
                                },
                            ],
                        },
                    ],
                },
                Category {
                    name: "Zellij".to_string(),
                    icon: Some("".to_string()),
                    color: Some("#7aa2f7".to_string()),
                    groups: vec![
                        ShortcutGroup {
                            name: "Panes".to_string(),
                            shortcuts: vec![
                                Shortcut {
                                    keys: "Ctrl+p n".to_string(),
                                    description: "New pane".to_string(),
                                },
                                Shortcut {
                                    keys: "Ctrl+p d".to_string(),
                                    description: "New pane down".to_string(),
                                },
                                Shortcut {
                                    keys: "Ctrl+p r".to_string(),
                                    description: "New pane right".to_string(),
                                },
                                Shortcut {
                                    keys: "Ctrl+p x".to_string(),
                                    description: "Close pane".to_string(),
                                },
                            ],
                        },
                        ShortcutGroup {
                            name: "Tabs".to_string(),
                            shortcuts: vec![
                                Shortcut {
                                    keys: "Ctrl+t n".to_string(),
                                    description: "New tab".to_string(),
                                },
                                Shortcut {
                                    keys: "Ctrl+t x".to_string(),
                                    description: "Close tab".to_string(),
                                },
                                Shortcut {
                                    keys: "Ctrl+t h/l".to_string(),
                                    description: "Previous/Next tab".to_string(),
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    fn handle_key(&mut self, key: KeyWithModifier) -> bool {
        match key.bare_key {
            BareKey::Esc => {
                if self.search_mode {
                    self.search_mode = false;
                    self.search_query.clear();
                } else {
                    close_focus();
                }
                true
            }
            BareKey::Char('q') if !self.search_mode => {
                close_focus();
                true
            }
            BareKey::Char('/') if !self.search_mode => {
                self.search_mode = true;
                true
            }
            BareKey::Tab => {
                if let Some(config) = &self.config {
                    if key.has_modifiers(&[KeyModifier::Shift]) {
                        self.active_tab = if self.active_tab == 0 {
                            config.categories.len() - 1
                        } else {
                            self.active_tab - 1
                        };
                    } else {
                        self.active_tab = (self.active_tab + 1) % config.categories.len();
                    }
                }
                true
            }
            BareKey::Char(c) if c.is_ascii_digit() && !self.search_mode => {
                let idx = c.to_digit(10).unwrap() as usize;
                if idx >= 1 {
                    if let Some(config) = &self.config {
                        if idx <= config.categories.len() {
                            self.active_tab = idx - 1;
                        }
                    }
                }
                true
            }
            BareKey::Char(c) if self.search_mode => {
                self.search_query.push(c);
                true
            }
            BareKey::Backspace if self.search_mode => {
                self.search_query.pop();
                true
            }
            _ => false,
        }
    }
}

register_plugin!(ShortcutsTui);

impl ZellijPlugin for ShortcutsTui {
    fn load(&mut self, _configuration: BTreeMap<String, String>) {
        subscribe(&[EventType::Key]);
        self.load_default_config();
    }

    fn update(&mut self, event: Event) -> bool {
        match event {
            Event::Key(key) => self.handle_key(key),
            _ => false,
        }
    }

    fn render(&mut self, rows: usize, cols: usize) {
        let Some(config) = &self.config else {
            println!("Loading...");
            return;
        };

        // Header
        println!("━━━ Shortcuts TUI ━━━");
        println!();

        // Tab bar
        let mut tab_line = String::new();
        for (i, cat) in config.categories.iter().enumerate() {
            let marker = if i == self.active_tab { "▸" } else { " " };
            let icon = cat.icon.as_deref().unwrap_or("");
            tab_line.push_str(&format!("{} {}:{} {} ", marker, i + 1, icon, cat.name));
        }
        println!("{}", tab_line);
        println!();

        // Search bar
        if self.search_mode {
            println!("/ {}_", self.search_query);
        } else {
            println!("Press / to search");
        }
        println!();

        // Active category content
        if let Some(category) = config.categories.get(self.active_tab) {
            for group in &category.groups {
                println!("─── {} ───", group.name);
                for shortcut in &group.shortcuts {
                    // Filter by search if active
                    if self.search_mode && !self.search_query.is_empty() {
                        let query = self.search_query.to_lowercase();
                        if !shortcut.keys.to_lowercase().contains(&query)
                            && !shortcut.description.to_lowercase().contains(&query)
                        {
                            continue;
                        }
                    }
                    println!("  {:20} {}", shortcut.keys, shortcut.description);
                }
                println!();
            }
        }

        // Footer
        let footer_row = rows.saturating_sub(2);
        for _ in 0..footer_row.saturating_sub(10) {
            println!();
        }
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!("Tab: Next | Shift+Tab: Prev | 1-9: Jump | /: Search | ESC/q: Quit");
    }
}
