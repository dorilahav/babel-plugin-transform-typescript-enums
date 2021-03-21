import {NodePath, template, types} from '@babel/core';
import {TSEnumDeclaration} from '@babel/types';
import assert from 'assert';
import {Options} from './types';

export const transpileEnum = (path: NodePath<TSEnumDeclaration>, options: Options) => {
  const {node} = path;
  const fill = enumFill(path, types, node.id, options);

  switch (path.parent.type) {
    case "BlockStatement":
    case "ExportNamedDeclaration":
    case "Program": {
      path.insertAfter(fill);
      if (seen(path.parentPath)) {
        path.remove();
      } else {
        const isGlobal = types.isProgram(path.parent); // && !path.parent.body.some(t.isModuleDeclaration);
        path.scope.registerDeclaration(
          path.replaceWith(makeVar(node.id, types, isGlobal ? "var" : "let"))[0],
        );
      }
      break;
    }

    default:
      throw new Error(`Unexpected enum parent '${path.parent.type}`);
  }

  function seen(parentPath) {
    if (parentPath.isExportDeclaration()) {
      return seen(parentPath.parentPath);
    }

    if (parentPath.getData(node.id.name)) {
      return true;
    } else {
      parentPath.setData(node.id.name, true);
      return false;
    }
  }
}

function makeVar(id, t, kind) {
  return t.variableDeclaration(kind, [t.variableDeclarator(id)]);
}

const buildEnumWrapper = template(`
  (function (ID) {
    ASSIGNMENTS;
  })(ID || (ID = {}));
`);

const buildNoReverseMappedEnumMember = template(`
  ENUM["NAME"] = VALUE;
`);

const buildReverseMappedEnumMember = template(`
  ENUM[ENUM["NAME"] = VALUE] = "NAME";
`);

const buildEnumMember = (options, isString) =>
  (isString ? buildNoReverseMappedEnumMember : buildReverseMappedEnumMember)(options);

/**
 * Generates the statement that fills in the variable declared by the enum.
 * `(function (E) { ... assignments ... })(E || (E = {}));`
 */
function enumFill(path, t, id, {reverseMap}: Options) {
  const x = translateEnumValues(path, t);
  const assignments = x.map(([memberName, memberValue]) => {
    const buildMemberFunction = reverseMap === undefined ?
      buildEnumMember :
      (reverseMap ? buildReverseMappedEnumMember : buildNoReverseMappedEnumMember);

    return buildMemberFunction({
      ENUM: t.cloneNode(id),
      NAME: memberName,
      VALUE: memberValue,
    }, t.isStringLiteral(memberValue));
  });

  return buildEnumWrapper({
    ID: t.cloneNode(id),
    ASSIGNMENTS: assignments,
  });
}

function translateEnumValues(path, t) {
  const seen = Object.create(null);
  // Start at -1 so the first enum member is its increment, 0.
  let prev = -1;
  return path.node.members.map(member => {
    const name = t.isIdentifier(member.id) ? member.id.name : member.id.value;
    const initializer = member.initializer;
    let value;
    if (initializer) {
      const constValue = evaluate(initializer, seen);
      if (constValue !== undefined) {
        seen[name] = constValue;
        if (typeof constValue === "number") {
          value = t.numericLiteral(constValue);
          prev = constValue;
        } else {
          assert(typeof constValue === "string");
          value = t.stringLiteral(constValue);
          prev = undefined;
        }
      } else {
        value = initializer;
        prev = undefined;
      }
    } else {
      if (prev !== undefined) {
        prev++;
        value = t.numericLiteral(prev);
        seen[name] = prev;
      } else {
        throw path.buildCodeFrameError("Enum member must have initializer.");
      }
    }

    return [name, value];
  });
}

// Based on the TypeScript repository's `evalConstant` in `checker.ts`.
function evaluate(
  expr,
  seen,
) {
  return evalConstant(expr);

  function evalConstant(expr) {
    switch (expr.type) {
      case "StringLiteral":
        return expr.value;
      case "UnaryExpression":
        return evalUnaryExpression(expr);
      case "BinaryExpression":
        return evalBinaryExpression(expr);
      case "NumericLiteral":
        return expr.value;
      case "ParenthesizedExpression":
        return evalConstant(expr.expression);
      case "Identifier":
        return seen[expr.name];
      case "TemplateLiteral":
        if (expr.quasis.length === 1) {
          return expr.quasis[0].value.cooked;
        }
      /* falls through */
      default:
        return undefined;
    }
  }

  function evalUnaryExpression({
                                 argument,
                                 operator,
                               }) {
    const value = evalConstant(argument);
    if (value === undefined) {
      return undefined;
    }

    switch (operator) {
      case "+":
        return value;
      case "-":
        return -value;
      case "~":
        return ~value;
      default:
        return undefined;
    }
  }

  function evalBinaryExpression(expr) {
    const left = evalConstant(expr.left);
    if (left === undefined) {
      return undefined;
    }
    const right = evalConstant(expr.right);
    if (right === undefined) {
      return undefined;
    }

    switch (expr.operator) {
      case "|":
        return left | right;
      case "&":
        return left & right;
      case ">>":
        return left >> right;
      case ">>>":
        return left >>> right;
      case "<<":
        return left << right;
      case "^":
        return left ^ right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "%":
        return left % right;
      default:
        return undefined;
    }
  }
}