import ts from "typescript";
import { readdir, readFile } from "node:fs/promises";
import { posix } from "node:path";

export interface ArchitectureResult {
  files: number;
  edges: { from: string; to: string; implicit: boolean }[];
  violations: string[];
  cycles: string[][];
}

export function analyzeSources(
  sources: Record<string, string>,
): ArchitectureResult {
  const result: ArchitectureResult = {
    files: Object.keys(sources).length,
    edges: [],
    violations: [],
    cycles: [],
  };
  const parsed = new Map<string, ts.SourceFile>();
  const registries = {
    app: new Map<string, string>(),
    server: new Map<string, string>(),
  };
  const components = new Map<string, string>();
  for (const [name, source] of Object.entries(sources)) {
    const script = name.endsWith(".vue")
      ? (source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? "")
      : source;
    const ast = ts.createSourceFile(
      name,
      script,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    parsed.set(name, ast);
    const registry = /^app\/(composables|utils|stores)\/[^/]+\.ts$/.test(name)
      ? registries.app
      : /^server\/utils\/[^/]+\.ts$/.test(name)
        ? registries.server
        : null;
    if (registry) {
      for (const node of ast.statements) {
        if (
          ts.isExportDeclaration(node) &&
          node.exportClause &&
          ts.isNamedExports(node.exportClause) &&
          !node.isTypeOnly
        ) {
          for (const element of node.exportClause.elements)
            if (!element.isTypeOnly) registry.set(element.name.text, name);
        }
        if (
          ts.canHaveModifiers(node) &&
          ts
            .getModifiers(node)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          if (ts.isFunctionDeclaration(node) && node.name)
            registry.set(node.name.text, name);
          if (ts.isVariableStatement(node))
            for (const declaration of node.declarationList.declarations)
              if (ts.isIdentifier(declaration.name))
                registry.set(declaration.name.text, name);
        }
      }
    }
    if (
      name.endsWith(".vue") &&
      (name.startsWith("app/components/") ||
        /^app\/features\/[^/]+\/components\//.test(name))
    )
      components.set(posix.basename(name, ".vue"), name);
  }
  function resolve(from: string, specifier: string) {
    const path = specifier.startsWith("#shared/")
      ? "shared/" + specifier.slice(8)
      : specifier.startsWith("~/") || specifier.startsWith("@/")
        ? "app/" + specifier.slice(2)
        : specifier.startsWith("~~/")
          ? specifier.slice(3)
          : specifier.startsWith(".")
            ? posix.normalize(posix.join(posix.dirname(from), specifier))
            : null;
    if (!path) return null;
    return (
      [path, path + ".ts", path + ".vue", path + "/index.ts"].find(
        (candidate) => candidate in sources,
      ) ?? null
    );
  }
  function edge(from: string, to: string, implicit = false) {
    if (
      from === to ||
      result.edges.some((entry) => entry.from === from && entry.to === to)
    )
      return;
    result.edges.push({ from, to, implicit });
  }
  for (const [name, ast] of parsed) {
    const bound = new Set<string>();
    const specs: string[] = [];
    function bindings(node: ts.Node) {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        specs.push(node.moduleSpecifier.text);
        const clause = node.importClause;
        if (clause?.name) bound.add(clause.name.text);
        if (clause?.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings))
            bound.add(clause.namedBindings.name.text);
          else
            for (const element of clause.namedBindings.elements)
              bound.add(element.name.text);
        }
      }
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        specs.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        specs.push(node.arguments[0].text);
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isVariableDeclaration(node) ||
          ts.isParameter(node)) &&
        node.name &&
        ts.isIdentifier(node.name)
      )
        bound.add(node.name.text);
      ts.forEachChild(node, bindings);
    }
    bindings(ast);
    for (const spec of specs) {
      const target = resolve(name, spec);
      if (target) edge(name, target);
      if (
        name.startsWith("shared/") &&
        !target?.startsWith("shared/") &&
        spec !== "zod"
      )
        result.violations.push(`${name}: shared imports ${spec}`);
      if (
        name.startsWith("app/") &&
        (target?.startsWith("server/") || /^(pg|h3|nitropack|node:)/.test(spec))
      )
        result.violations.push(`${name}: app imports server code ${spec}`);
      if (name.startsWith("server/") && target?.startsWith("app/"))
        result.violations.push(`${name}: server imports app ${spec}`);
      if (
        name.startsWith("server/api/") &&
        target &&
        /server\/(repositories\/|utils\/database)/.test(target)
      )
        result.violations.push(`${name}: HTTP handler bypasses service`);
      if (
        name.startsWith("server/repositories/") &&
        target &&
        /^server\/(api|services)\//.test(target)
      )
        result.violations.push(`${name}: repository imports upper layer`);
      if (
        name.endsWith(".vue") &&
        target &&
        /^app\/features\/[^/]+\/api\.ts$/.test(target)
      )
        result.violations.push(`${name}: UI imports data access`);
      if (
        /^app\/features\/[^/]+\/api\.ts$/.test(name) &&
        (spec === "vue" || spec === "#app" || target?.includes("/composables/"))
      )
        result.violations.push(`${name}: data access imports orchestration`);
      if (
        name.startsWith("app/features/notifications/") &&
        target?.startsWith("app/features/") &&
        !target.startsWith("app/features/notifications/")
      )
        result.violations.push(
          `${name}: notification depends on business domain`,
        );
      if (
        /^app\/features\/[^/]+\/composables\//.test(name) &&
        target?.startsWith("app/composables/") &&
        ![
          "app/composables/useApi.ts",
          "app/composables/useDebounce.ts",
        ].includes(target)
      )
        result.violations.push(
          `${name}: feature imports compatibility facade ${target}`,
        );
    }
    const registry = name.startsWith("server/")
      ? registries.server
      : registries.app;
    function calls(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const called = node.expression.text;
        if (!bound.has(called) && registry.has(called))
          edge(name, registry.get(called)!, true);
        if (
          name.endsWith(".vue") &&
          ["$fetch", "useFetch", "useAsyncData"].includes(called)
        )
          result.violations.push(`${name}: UI performs data fetching`);
      }
      ts.forEachChild(node, calls);
    }
    calls(ast);
    if (name.endsWith(".vue")) {
      for (const match of sources[name]!.matchAll(/<([A-Z][A-Za-z0-9]+)\b/g)) {
        const component = match[1]!.replace(/^Lazy/, "");
        if (components.has(component))
          edge(name, components.get(component)!, true);
      }
    }
  }
  const graph = new Map<string, string[]>();
  for (const { from, to } of result.edges)
    graph.set(from, [...(graph.get(from) ?? []), to]);
  const seen = new Set<string>(),
    active = new Set<string>();
  const trail: string[] = [];
  function visit(name: string) {
    if (active.has(name)) {
      result.cycles.push([...trail.slice(trail.indexOf(name)), name]);
      return;
    }
    if (seen.has(name)) return;
    seen.add(name);
    active.add(name);
    trail.push(name);
    for (const child of graph.get(name) ?? []) visit(child);
    trail.pop();
    active.delete(name);
  }
  for (const name of parsed.keys()) visit(name);
  return result;
}

export async function analyzeProject(root: string) {
  const sources: Record<string, string> = {};
  async function scan(directory: string) {
    for (const entry of await readdir(root + "/" + directory, {
      withFileTypes: true,
    })) {
      const name = directory + "/" + entry.name;
      if (entry.isDirectory()) await scan(name);
      else if (/\.(ts|vue)$/.test(name))
        sources[name] = await readFile(root + "/" + name, "utf8");
    }
  }
  await Promise.all([scan("app"), scan("server"), scan("shared")]);
  return analyzeSources(sources);
}
