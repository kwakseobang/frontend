/**
 * The web's entry point to @memento/core. App code imports from here, never from
 * "@memento/core" directly, because the package refuses to work until configureCore()
 * has run and this barrel is what guarantees it did.
 *
 * Importing the package directly would compile fine and then fail at runtime in exactly
 * one place: a server component. Client code is covered by AuthProvider's module graph,
 * but the RSC pass never evaluates a client module, so generateMetadata() in
 * app/entry/[id]/page.tsx would call an unconfigured core, throw, and silently fall back
 * to the generic Open Graph card — the one thing that route exists to get right.
 */
import "./configure";

export * from "@memento/core";
