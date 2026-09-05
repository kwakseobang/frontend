import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

function setup(overrides: Partial<React.ComponentProps<typeof DeleteConfirmModal>> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  const utils = render(<DeleteConfirmModal open onCancel={onCancel} onConfirm={onConfirm} {...overrides} />);
  return { onCancel, onConfirm, ...utils };
}

describe("DeleteConfirmModal", () => {
  it("renders nothing while closed", () => {
    render(<DeleteConfirmModal open={false} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses 취소 on open, so the destructive button is never the default", async () => {
    setup();
    expect(await screen.findByRole("button", { name: "취소" })).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const { onCancel } = setup();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("closes when the backdrop is clicked", async () => {
    const { onCancel, container } = setup();
    await userEvent.click(container.querySelector("div")!);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("stays open when the dialog body is clicked", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByText("이 기록을 삭제할까요?"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("locks page scroll while open and restores it on close", () => {
    const { unmount } = setup();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps Tab inside the dialog", async () => {
    setup();
    const cancel = screen.getByRole("button", { name: "취소" });
    const confirm = screen.getByRole("button", { name: "삭제" });

    await userEvent.tab();
    expect(confirm).toHaveFocus();
    await userEvent.tab();
    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it("confirms when 삭제 is pressed", async () => {
    const { onConfirm } = setup();
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
