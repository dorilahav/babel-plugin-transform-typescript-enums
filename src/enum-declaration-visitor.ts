import {NodePath} from '@babel/core';

import {TSEnumDeclaration} from '@babel/types';
import {Options} from './types';

import {transpileConstEnums} from './const-enum-transpiler';
import {transpileEnum} from './enum-transpiler';

export default (path: NodePath<TSEnumDeclaration>, options: Options) => {
  const {node} = path;

  if (node.const) {
    transpileConstEnums(path);

    return;
  }

  if (node.declare) {
    path.remove();

    return;
  }

  transpileEnum(path, options);
}