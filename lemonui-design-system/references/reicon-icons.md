# Exclusive product-icon source: Reicon MCP

User-selected integration: [dqev/reicon — packages/reicon-mcp](https://github.com/dqev/reicon/tree/main/packages/reicon-mcp). Source documentation inspected 2026-10-25. This is an integration policy for this skill, not a statement that Reicon is Lemon's original icon library.

## Runtime contract

Discover the connected Reicon server and its current tool schemas. The upstream documentation lists `search_icons`, `view_icon`, `apply_icon` and `list_categories`; client namespaces may prefix these names. Do not invent arguments, icon identifiers, framework exports or weights from memory.

Search by the intended action or object, inspect the returned icon, then use the MCP-returned SVG or framework snippet. Keep a coherent variant/weight, size, optical alignment, stroke/fill treatment and semantic color role across sibling components. Namespace SVG IDs when repeated inline assets could collide. Preserve the returned geometry; do not manually redraw a near-match or change paths to invent a new icon.

Reicon MCP is the only source for new or replaced product icons, including search, clear, navigation, chevrons, actions, refresh and status glyphs. Reuse existing assets only when their Reicon MCP provenance is verified. Do not fall back to another icon MCP/library, the Reicon CLI, arbitrary internet SVGs, emoji, CSS-drawn substitute icons or image generation. Native control rendering and non-icon content such as charts and supplied brand logos are outside this icon-sourcing rule.

Follow the source's license/attribution requirements. Keep a lightweight record of the returned identifier, variant and asset/component location using the project's existing conventions; record version information when provided. Do not label previously hand-authored icons as Reicon icons.

Use `currentColor` or the project's supported semantic theming mechanism where the returned asset supports it. Mirror only directional assets for RTL when required; do not mirror checks, clocks or other real-world objects. Decorative icons beside an equivalent label are hidden from assistive technology. Icon-only buttons require an accessible name and usable target size.

## Missing dependency

Skill metadata declares the `reicon` MCP dependency; that declaration does not install, start or connect a server. If the tools are absent, explain that Reicon must be connected before icon-dependent work can finish. Continue authorized layout, typography, state and token work independently. Do not silently switch to the CLI or download icons from the repository to bypass the MCP-only requirement.

The upstream README shows a stdio launcher using command `npx` with argument `reicon-mcp`, and an alternative local `node` launcher pointing to a built `bin/run.cjs`. The repository URL is source code, not an HTTP MCP endpoint. Setup must use the target client's supported configuration and a verified package/build. Do not infer that a README launcher proves package availability, and do not change client configuration or run downloaded software merely because this skill names a dependency. Installing/configuring the server is a separate authorized action.
