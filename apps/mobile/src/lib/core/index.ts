/**
 * The app's entry point to @memento/core. Screens import from here, never from
 * "@memento/core" directly, because the package throws until configureCore() has run
 * and this barrel is what guarantees it did. Same rule as apps/web — see CLAUDE.md.
 */
import "./configure";

export * from "@memento/core";
