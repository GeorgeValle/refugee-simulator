import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AGE_BAND } from "@/game/model";
import { FamilyScreen } from "@/screens/FamilyScreen";
import "@/i18n";

afterEach(cleanup);

describe("FamilyScreen", () => {
  it("hides partner and child options for childhood", () => {
    render(<FamilyScreen ageBand={AGE_BAND.CHILDHOOD} initialFamily={[]} onSubmit={vi.fn()} />);
    const firstRelationship = screen.getAllByRole("combobox")[0];
    if (!firstRelationship) throw new Error("Expected a relationship select");
    expect(
      within(firstRelationship).queryByRole("option", { name: "hija" }),
    ).not.toBeInTheDocument();
    expect(
      within(firstRelationship).queryByRole("option", { name: "esposa" }),
    ).not.toBeInTheDocument();
  });

  it("disables a singular relationship after another row uses it", async () => {
    const user = userEvent.setup();
    render(<FamilyScreen ageBand={AGE_BAND.YOUTH} initialFamily={[]} onSubmit={vi.fn()} />);
    const selects = screen.getAllByRole("combobox");
    const first = selects[0];
    const second = selects[1];
    if (!first || !second) throw new Error("Expected relationship selects");
    await user.selectOptions(first, "mother");
    expect(within(second).getByRole("option", { name: "madre" })).toBeDisabled();
    expect(within(second).getByRole("option", { name: "hermana" })).not.toBeDisabled();
  });

  it("offers repeatable nephews and nieces instead of parents in old age", () => {
    render(<FamilyScreen ageBand={AGE_BAND.OLD_AGE} initialFamily={[]} onSubmit={vi.fn()} />);
    const firstRelationship = screen.getAllByRole("combobox")[0];
    if (!firstRelationship) throw new Error("Expected a relationship select");

    expect(within(firstRelationship).getByRole("option", { name: "sobrino" })).toBeVisible();
    expect(within(firstRelationship).getByRole("option", { name: "sobrina" })).toBeVisible();
    expect(
      within(firstRelationship).queryByRole("option", { name: "madre" }),
    ).not.toBeInTheDocument();
  });

  it("hides aunts, uncles, and grandparents for adulthood", () => {
    render(<FamilyScreen ageBand={AGE_BAND.ADULTHOOD} initialFamily={[]} onSubmit={vi.fn()} />);
    const firstRelationship = screen.getAllByRole("combobox")[0];
    if (!firstRelationship) throw new Error("Expected a relationship select");

    expect(
      within(firstRelationship).queryByRole("option", { name: "tío" }),
    ).not.toBeInTheDocument();
    expect(
      within(firstRelationship).queryByRole("option", { name: "abuela" }),
    ).not.toBeInTheDocument();
  });
});
