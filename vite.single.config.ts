// Baut eine einzelne, eigenständige wetterinsel.html (JS, CSS und Icons eingebettet).
import { defineConfig, Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";

const dataUri = (file: string, mime: string) => `data:${mime};base64,${readFileSync(file).toString("base64")}`;
const inlineIcons = (): Plugin => ({
  name: "inline-icons",
  transformIndexHtml(html) {
    return html
      .replace(/<link rel="manifest"[^>]*>/, "")
      .replace(/href="icons\/apple-touch-icon\.png"/, `href="${dataUri("public/icons/apple-touch-icon.png", "image/png")}"`)
      .replace(/href="icons\/icon\.svg"/, `href="${dataUri("public/icons/icon.svg", "image/svg+xml")}"`);
  },
});
export default defineConfig({ base: "./", publicDir: false, plugins: [viteSingleFile(), inlineIcons()], build: { outDir: "dist-single", emptyOutDir: true, assetsInlineLimit: 100000000, cssCodeSplit: false } });
