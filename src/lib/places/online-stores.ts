import { isGrocerySearchTerm } from "@/lib/places/search-terms";

export type OnlineStoreLink = {
  id: string;
  label: string;
  href: string;
  detail: string;
};

/** External search links only — no prices or delivery claims. */
export function buildOnlineStoreLinks(term: string): OnlineStoreLink[] {
  const q = term.trim() || "household";
  const encoded = encodeURIComponent(q);
  const links: OnlineStoreLink[] = [
    {
      id: "daraz",
      label: "Daraz",
      href: `https://www.daraz.pk/catalog/?q=${encoded}`,
      detail: "Open Daraz search in a new tab",
    },
    {
      id: "google-shopping-pk",
      label: "Google Shopping (Pakistan)",
      href: `https://www.google.com/search?tbm=shop&gl=pk&hl=en&q=${encoded}`,
      detail: "Open Google Shopping Pakistan in a new tab",
    },
  ];

  if (isGrocerySearchTerm(q)) {
    links.push({
      id: "foodpanda",
      label: "foodpanda / pandamart",
      href: `https://www.foodpanda.pk/`,
      detail: "Open foodpanda (search grocery terms on the site)",
    });
  }

  return links;
}
