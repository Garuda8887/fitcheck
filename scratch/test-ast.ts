import * as ts from 'typescript';

const source = `
export function add(a: number, b: number): number {
  console.log('adding');
  return a + b;
}

class User {
  constructor(public name: string) {
    this.name = name;
  }
  sayHi() {
    console.log("hi", this.name);
  }
}
`;

const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);

function transform(context: ts.TransformationContext) {
  return (rootNode: ts.Node) => {
    function visit(node: ts.Node): ts.Node {
      if (ts.isFunctionDeclaration(node) && node.body) {
        return ts.factory.updateFunctionDeclaration(
          node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type,
          ts.factory.createBlock([])
        );
      }
      if (ts.isMethodDeclaration(node) && node.body) {
        return ts.factory.updateMethodDeclaration(
          node, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type,
          ts.factory.createBlock([])
        );
      }
      if (ts.isConstructorDeclaration(node) && node.body) {
         return ts.factory.updateConstructorDeclaration(
           node, node.modifiers, node.parameters, ts.factory.createBlock([])
         );
      }
      if (ts.isArrowFunction(node) && ts.isBlock(node.body)) {
          return ts.factory.updateArrowFunction(
            node, node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken,
            ts.factory.createBlock([])
          );
      }
      return ts.visitEachChild(node, visit, context);
    }
    return ts.visitNode(rootNode, visit);
  };
}

const result = ts.transform(sourceFile, [transform]);
const printer = ts.createPrinter();
console.log(printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], sourceFile));
