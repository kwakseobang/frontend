import type { Memory } from "@/lib/core";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MemoryDetail } from "./MemoryDetail";
import { ToastProvider } from "@/components/toast/ToastProvider";

const memory: Memory = {
  id: 42,
  time: "2026-08-18T15:12",
  text: "여름 저녁의 기록",
  images: ["https://storage.googleapis.com/bucket/media/a.jpg"],
  visibility: "PUBLIC",
};

type Props = React.ComponentProps<typeof MemoryDetail>;

function renderDetail(overrides: Partial<Props> = {}) {
  const props: Props = {
    memory,
    isOwner: true,
    backLabel: "목록으로",
    onBack: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<ToastProvider><MemoryDetail {...props} /></ToastProvider>) };
}

describe("MemoryDetail", () => {
  it("shows the body text and the full timestamp", () => {
    renderDetail();
    expect(screen.getByText("여름 저녁의 기록")).toBeInTheDocument();
    expect(screen.getByText("2026년 8월 18일 오후 3:12")).toBeInTheDocument();
  });

  it("marks a public memory as 공개", () => {
    renderDetail();
    expect(screen.getByText("공개")).toBeInTheDocument();
  });

  describe("the ⋯ menu", () => {
    it("stays closed until opened", () => {
      renderDetail();
      expect(screen.queryByRole("button", { name: "수정" })).not.toBeInTheDocument();
    });

    it("reveals 링크 복사 / 수정 / 삭제", async () => {
      renderDetail();
      await userEvent.click(screen.getByRole("button", { name: "더보기" }));
      expect(screen.getByRole("button", { name: "링크 복사" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
    });

    it("closes on Escape", async () => {
      renderDetail();
      await userEvent.click(screen.getByRole("button", { name: "더보기" }));
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("button", { name: "수정" })).not.toBeInTheDocument();
    });

    it("closes on a click outside", async () => {
      renderDetail();
      await userEvent.click(screen.getByRole("button", { name: "더보기" }));
      await userEvent.click(document.body);
      expect(screen.queryByRole("button", { name: "수정" })).not.toBeInTheDocument();
    });

    it("runs the action and closes", async () => {
      const { props } = renderDetail();
      await userEvent.click(screen.getByRole("button", { name: "더보기" }));
      await userEvent.click(screen.getByRole("button", { name: "수정" }));
      expect(props.onEdit).toHaveBeenCalledOnce();
      expect(screen.queryByRole("button", { name: "수정" })).not.toBeInTheDocument();
    });

    // A draft 404s for everyone but its owner, so a copied link would be dead.
    it("hides 링크 복사 for a draft", async () => {
      renderDetail({ isDraft: true });
      await userEvent.click(screen.getByRole("button", { name: "더보기" }));
      expect(screen.queryByRole("button", { name: "링크 복사" })).not.toBeInTheDocument();
    });

    it("hides 링크 복사 for a private memory", async () => {
      renderDetail({ memory: { ...memory, visibility: "PRIVATE" } });
      await userEvent.click(screen.getByRole("button", { name: "더보기" }));
      expect(screen.queryByRole("button", { name: "링크 복사" })).not.toBeInTheDocument();
    });
  });

  describe("owner-only controls", () => {
    it("hides editing entirely from a non-owner", () => {
      renderDetail({ isOwner: false, onEdit: undefined, onDelete: undefined });
      expect(screen.queryByRole("button", { name: /즐겨찾기/ })).not.toBeInTheDocument();
    });

    it("exposes favorite state through aria-pressed", () => {
      const { rerender } = renderDetail({ isFavorite: false, onToggleFavorite: vi.fn() });
      expect(screen.getByRole("button", { name: "즐겨찾기 추가" })).toHaveAttribute("aria-pressed", "false");

      rerender(
        <ToastProvider>
          <MemoryDetail
            memory={memory}
            isOwner
            backLabel="목록으로"
            onBack={vi.fn()}
            isFavorite
            onToggleFavorite={vi.fn()}
          />
        </ToastProvider>,
      );
      expect(screen.getByRole("button", { name: "즐겨찾기 해제" })).toHaveAttribute("aria-pressed", "true");
    });

    it("offers 발행하기 only for a draft", () => {
      const { rerender } = renderDetail({ isDraft: true, onPublish: vi.fn() });
      expect(screen.getByRole("button", { name: "발행하기" })).toBeInTheDocument();
      expect(screen.getByText(/발행하기 전까지는 나만 볼 수 있어요/)).toBeInTheDocument();

      rerender(
        <ToastProvider>
          <MemoryDetail memory={memory} isOwner backLabel="목록으로" onBack={vi.fn()} onPublish={vi.fn()} />
        </ToastProvider>,
      );
      expect(screen.queryByRole("button", { name: "발행하기" })).not.toBeInTheDocument();
    });
  });

  it("goes back when the back link is used", async () => {
    const { props } = renderDetail();
    await userEvent.click(screen.getByRole("button", { name: /목록으로/ }));
    expect(props.onBack).toHaveBeenCalledOnce();
  });
});
