export type View = "overview" | "orders";

export const currentView = (): View =>
  window.location.hash.split("?")[0] === "#orders" ? "orders" : "overview";
