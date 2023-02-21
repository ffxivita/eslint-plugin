import path from 'path';
import micromatch from 'micromatch';
import { loadConfig } from 'tsconfig-paths';
import { ESLintUtils } from '@typescript-eslint/utils';

export function loadAbsoluteTSPaths(cwd: string) {
    const tsConf = loadConfig(cwd);
    if (tsConf.resultType === 'failed') {
        throw new Error('Failed to load tsconfig.json');
    }

    // Convert all TS paths to absolute paths.
    return Object.fromEntries(
        Object.entries(tsConf.paths)
            .map(([tsPath, resolve]) => [
                tsPath.replace('/*', ''),
                path.join(tsConf.absoluteBaseUrl, resolve[0].replace('/*', '')),
            ]),
    );
}

export const preferTsPathImport = ESLintUtils.RuleCreator.withoutDocs({
    defaultOptions: [],
    meta: {
        type: 'problem',
        hasSuggestions: true,
        fixable: 'code',
        docs: {
            description: 'Enforces absolute TS path imports instead of relative imports with directory traversal',
            recommended: 'error',
        },
        messages: {
            relativeTsPathImport: '\'{{ importPath }}\' is importable with \'{{ tsPath }}\'',
        },
        schema: [],
    },
    create: (context) => {
        const absoluteTsPaths = loadAbsoluteTSPaths(path.dirname(context.getFilename()));

        return {
            ImportDeclaration: (node) => {
                const importPath = node.source.value?.toString() ?? '';
                const absoluteImportPath = path.resolve(path.dirname(context.getFilename()), importPath);

                if (importPath.includes('../')) {
                    // Check if our import path matches any of the absolute TS paths.
                    for (const [tsPath, absPath] of Object.entries(absoluteTsPaths)) {
                        if (micromatch.isMatch(absoluteImportPath.replace(/\\/g, '/'), path.join(absPath, '**').replace(/\\/g, '/'))) {
                            // Offer a fix if there is a fitting path for us to use.
                            context.report({
                                loc: node.source.loc,
                                messageId: 'relativeTsPathImport',
                                data: { importPath, tsPath },
                                fix: (fixer) => fixer.replaceTextRange(
                                    [node.source.range[0] + 1, node.source.range[1] - 1],
                                    absoluteImportPath.replace(absPath, tsPath).replace(/\\/g, '/'),
                                ),
                            });
                            return;
                        }
                    }
                }
            },
        };
    },
});
