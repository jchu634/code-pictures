import type { Plugin } from "prettier";

function parserFor(language: string): string | null {
  switch (language) {
    case "typescript":
    case "tsx":
      return "typescript";
    case "javascript":
      return "babel";
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
      return "css";
    default:
      return null;
  }
}

export function canFormat(language: string): boolean {
  return parserFor(language) !== null;
}

export async function formatCode(
  contents: string,
  language: string,
): Promise<string> {
  const parser = parserFor(language);
  if (!parser)
    throw new Error("Formatting is not available for this language.");
  const prettier = await import("prettier/standalone");
  let plugins: Plugin[];
  switch (parser) {
    case "typescript":
      plugins = await Promise.all([
        import("prettier/plugins/typescript"),
        import("prettier/plugins/estree"),
      ]);
      break;
    case "babel":
    case "json":
      plugins = await Promise.all([
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
      ]);
      break;
    case "html":
      plugins = [await import("prettier/plugins/html")];
      break;
    default:
      plugins = [await import("prettier/plugins/postcss")];
  }
  return prettier.format(contents, {
    parser,
    plugins,
    tabWidth: 2,
    printWidth: 80,
    embeddedLanguageFormatting: "off",
  });
}
