import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Memory } from "@/types/memory";
import { MemoryCard } from "./MemoryCard";

const memory: Memory = {
  id: 42,
  time: "2026-08-18T15:12",
  text: "여름 저녁의 기록",
  images: ["https://storage.googleapis.com/bucket/media/a.jpg"],
  visibility: "PRIVATE",
};

describe("MemoryCard", () => {
  it("shows the text and the formatted time", () => {
    render(<MemoryCard memory={memory} rotate="even" onOpen={vi.fn()} />);
    expect(screen.getByText("여름 저녁의 기록")).toBeInTheDocument();
    expect(screen.getByText("오후 3:12")).toBeInTheDocument();
  });

  it("renders the first image from a bare URL", () => {
    render(<MemoryCard memory={memory} rotate="even" onOpen={vi.fn()} />);
    expect(screen.getByRole("presentation")).toHaveAttribute("src", memory.images[0]);
  });

  it("renders no image element when there are none", () => {
    render(<MemoryCard memory={{ ...memory, images: [] }} rotate="even" onOpen={vi.fn()} />);
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("counts the hidden extras when a memory has several photos", () => {
    render(<MemoryCard memory={{ ...memory, images: [...memory.images, "b.jpg", "c.jpg"] }} rotate="even" onOpen={vi.fn()} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("badges public memories only", () => {
    const { rerender } = render(<MemoryCard memory={memory} rotate="even" onOpen={vi.fn()} />);
    expect(screen.queryByText("공개")).not.toBeInTheDocument();
    rerender(<MemoryCard memory={{ ...memory, visibility: "PUBLIC" }} rotate="even" onOpen={vi.fn()} />);
    expect(screen.getByText("공개")).toBeInTheDocument();
  });

  it("opens on click and on Enter/Space, since the card is a div with role=button", async () => {
    const onOpen = vi.fn();
    render(<MemoryCard memory={memory} rotate="even" onOpen={onOpen} />);
    const card = screen.getByRole("button");

    await userEvent.click(card);
    card.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(onOpen).toHaveBeenCalledTimes(3);
    expect(onOpen).toHaveBeenCalledWith(42);
  });
});
