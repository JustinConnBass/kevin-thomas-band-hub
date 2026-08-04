import { describe, expect, it } from "vitest";
import { canEdit, canSeeFinance } from "../lib";

describe("role permissions", () => {
  it("limits finance to administrators", () => {
    expect(canSeeFinance("Administrator")).toBe(true);
    expect(canSeeFinance("Bandleader")).toBe(false);
    expect(canSeeFinance("Band member")).toBe(false);
  });

  it("limits setlist and calendar management", () => {
    expect(canEdit("Administrator")).toBe(true);
    expect(canEdit("Bandleader")).toBe(true);
    expect(canEdit("Band member")).toBe(false);
    expect(canEdit("Production crew")).toBe(false);
    expect(canEdit("Substitute musician")).toBe(false);
  });
});
