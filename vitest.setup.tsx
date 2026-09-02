import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// next/image renders a plain <img> under test — the optimizer needs a running server.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    priority,
    sizes,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  } & Record<string, unknown>) => {
    void fill;
    void priority;
    void sizes;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...rest} />;
  },
}));
