export interface Shortcut {
  keys: string;
  description: string;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: Shortcut[];
}

export interface Category {
  name: string;
  icon?: string;
  color?: string;
  groups: ShortcutGroup[];
}

export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  highlight: string;
}

export interface Config {
  theme?: Partial<Theme>;
  categories: Category[];
}

export const DEFAULT_THEME: Theme = {
  primary: "#7aa2f7",
  secondary: "#9ece6a",
  background: "#1a1b26",
  text: "#c0caf5",
  muted: "#565f89",
  border: "#3b4261",
  highlight: "#33467c",
};
