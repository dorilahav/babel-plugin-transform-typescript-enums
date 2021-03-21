import {declare} from '@babel/helper-plugin-utils';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';

import transpileEnum from './enum-declaration-visitor';

const defaultOptions = {
  reverseMap: undefined
};

export default declare((api, options) => {
    api.assertVersion(7);

    options = {...defaultOptions, ...options};

    return {
      name: 'transform-typescript-enums',
      inherits: syntaxTypeScript,

      visitor: {
        TSEnumDeclaration(path) {
          transpileEnum(path, options);
        },
      }
    }
  },
);