import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AGE_BAND } from "@/game/model";
import { FamilyScreen } from "@/screens/FamilyScreen";
import "@/i18n";

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
});
