import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryForm, type MemoryFormValue } from "./MemoryForm";
import { ToastProvider } from "@/components/toast/ToastProvider";

const emptyValue: MemoryFormValue = { text: "", images: [], time: "2026-08-18T15:12", visibility: "PRIVATE" };

function imageFile(name: string, type = "image/jpeg", size = 1024): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function renderForm(value: MemoryFormValue = emptyValue, maxImages = 5) {
  const onChange = vi.fn();
  render(
    <ToastProvider>
      <MemoryForm
        title="새 기록"
        value={value}
        onChange={onChange}
        onBack={vi.fn()}
        onSave={vi.fn()}
        maxImages={maxImages}
      />
    </ToastProvider>,
  );
  return { onChange, input: document.querySelector('input[type="file"]') as HTMLInputElement };
}

beforeEach(() => {
  // jsdom implements neither, and the component leans on both for previews.
  let n = 0;
  vi.stubGlobal("URL", Object.assign(URL, {
    createObjectURL: vi.fn(() => `blob:preview-${n++}`),
    revokeObjectURL: vi.fn(),
  }));
});

describe("MemoryForm image picking", () => {
  it("only offers the types the validator accepts", () => {
    const { input } = renderForm();
    expect(input.accept).toBe("image/jpeg,image/png,image/webp,image/gif");
  });

  it("adds a valid image as a new slot", async () => {
    const { onChange, input } = renderForm();
    await userEvent.upload(input, imageFile("a.jpg"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ images: [expect.objectContaining({ kind: "new" })] }),
    );
  });

  it("drops an oversized image and says so", async () => {
    const { onChange, input } = renderForm();
    // Passes `accept` (it really is a JPEG) but fails the size check — exactly the case
    // the picker cannot catch on its own.
    await userEvent.upload(input, imageFile("huge.jpg", "image/jpeg", 20 * 1024 * 1024));
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/형식\/용량 제한으로 제외/)).toBeInTheDocument();
  });

  it("drops a wrong-typed file that bypassed the picker, e.g. via drag and drop", async () => {
    const { onChange, input } = renderForm();
    await userEvent.setup({ applyAccept: false }).upload(input, imageFile("notes.txt", "text/plain"));
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/형식\/용량 제한으로 제외/)).toBeInTheDocument();
  });

  // Regression: the over-limit slice used to be silent.
  it("explains the cap instead of silently discarding extras", async () => {
    const { onChange, input } = renderForm(emptyValue, 2);
    await userEvent.upload(input, [imageFile("a.jpg"), imageFile("b.jpg"), imageFile("c.jpg")]);

    expect(await screen.findByText("사진은 최대 2장까지 첨부할 수 있어요.")).toBeInTheDocument();
    expect(onChange.mock.calls[0][0].images).toHaveLength(2);
  });

  it("hides the add button once the cap is reached", () => {
    const full: MemoryFormValue = {
      ...emptyValue,
      images: [{ kind: "existing", url: "https://storage.googleapis.com/bucket/media/a.jpg" }],
    };
    renderForm(full, 1);
    expect(screen.queryByRole("button", { name: "사진 추가" })).not.toBeInTheDocument();
  });

  // Every unrevoked object URL pins its Blob for the life of the document.
  it("revokes a preview URL when its photo is removed", async () => {
    const { onChange, input } = renderForm();
    await userEvent.upload(input, imageFile("a.jpg"));

    const added = onChange.mock.calls[0][0] as MemoryFormValue;
    renderForm(added);
    await userEvent.click(screen.getAllByRole("button", { name: "사진 삭제" })[0]);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-0");
  });
});

describe("MemoryForm date stamp", () => {
  it("stamps the paper with the record date", () => {
    renderForm();
    expect(screen.getByText("2026. 08. 18")).toBeInTheDocument();
  });

  // Regression: this rendered "NaN. undefined. undefined".
  it("stamps nothing when the datetime field has been cleared", () => {
    renderForm({ ...emptyValue, time: "" });
    expect(screen.queryByText(/NaN|undefined/)).not.toBeInTheDocument();
  });
});
