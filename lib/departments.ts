import type { Department } from "./types";

export const DEPARTMENT_COLOURS: Record<Department, string> = {
  Product: "#4aa392",
  Engineering: "#6b8fd4",
  Sales: "#d4895a",
  "Customer Success": "#c4a35a",
  Marketing: "#c47ba0",
  Finance: "#7a9e7e",
  People: "#9b8ec4",
  Legal: "#8a9aa3",
  Leadership: "#e8e4d9",
  Other: "#7d8a84",
};

export const DEPARTMENT_ORDER: Department[] = [
  "Leadership",
  "Product",
  "Engineering",
  "Sales",
  "Customer Success",
  "Marketing",
  "Finance",
  "People",
  "Legal",
  "Other",
];
