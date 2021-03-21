import {NodePath} from '@babel/core';
import {TSEnumDeclaration} from '@babel/types';

export const transpileConstEnums = (path: NodePath<TSEnumDeclaration>) => {
  throw path.buildCodeFrameError("'const' enums are not supported.");
}