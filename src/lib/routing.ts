import { useCallback } from "react";
import { useLocation, type To } from "react-router";

/** The address of a tab: the tab with id "storycraft" lives at "/storycraft". */
export const tabPath = (tabId: string): string => `/${tabId}`;

/** The address of one section of the Admin tab, such as "/admin/people". */
export const adminSectionPath = (sectionId: string): string => `${tabPath("admin")}/${sectionId}`;

/** The id of the tab named by the address, or "" when it names none: "/storycraft" gives "storycraft". */
export function useOpenTabId(): string {
  return useLocation().pathname.split("/")[1] ?? "";
}

/** The id of the Admin section named by the address, or "" when it names none: "/admin/people" gives "people". */
export function useOpenAdminSectionId(): string {
  const [, tabId, sectionId] = useLocation().pathname.split("/");
  return tabId === "admin" ? (sectionId ?? "") : "";
}

/** Turns a path into a link target that keeps the admin preview ("?client=morocco") in the address. */
export function useLinkTo(): (path: string) => To {
  const { search } = useLocation();
  return useCallback((path) => ({ pathname: path, search }), [search]);
}
