export type NavItem = {
  href: string;
  label: string;
  soon?: boolean;
  highlight?: boolean;
  admin?: boolean;
};

export type NavGroup = {
  label: string;
  highlight?: boolean;
  items: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}
