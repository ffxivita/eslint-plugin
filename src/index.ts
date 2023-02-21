import { noUselessIndex } from './rules/noUselessIndex';
import { preferTsPathImport } from './rules/preferTsPathImport';

export = {
    rules: {
        'no-useless-index': noUselessIndex,
        'prefer-ts-path-import': preferTsPathImport,
    },
};
