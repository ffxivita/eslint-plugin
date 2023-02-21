import { ESLintUtils } from '@typescript-eslint/utils';

export const noUselessIndex = ESLintUtils.RuleCreator.withoutDocs({
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
            uselessIndex: 'Imports ending with \'/index\' can be simplified',
        },
        schema: [],
    },
    create: (context) => ({
        ImportDeclaration: (node) => {
            const importPath = node.source.value?.toString() ?? '';
            if (importPath.endsWith('/index')) {
                context.report({
                    loc: node.source.loc,
                    messageId: 'uselessIndex',
                    fix: (fixer) => fixer.replaceTextRange(
                        [node.source.range[0] + 1, node.source.range[1] - 1],
                        importPath.replace(/\/index$/g, ''),
                    ),
                });
            }
        },
    }),
});
