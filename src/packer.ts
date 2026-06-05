import * as ts from 'typescript';
import fs from 'fs';
import path from 'path';

export function skeletonizeFile(content: string, filename: string): string {
  const sourceFile = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true);

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
  const printer = ts.createPrinter({ removeComments: true });
  return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], sourceFile);
}

export function packCodebase(files: { absolutePath: string, relativePath: string }[]): string {
  const codeFiles = files.filter(f => /\.(js|ts|jsx|tsx)$/i.test(f.relativePath));
  let output = '# Project Architecture Skeleton\n\nThis is a structural overview of the project. Function bodies and comments have been removed to save token context.\n\n';

  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file.absolutePath, 'utf8');
      const skeleton = skeletonizeFile(content, file.relativePath);
      const ext = path.extname(file.relativePath).substring(1);
      output += `## ${file.relativePath}\n\`\`\`${ext}\n${skeleton}\n\`\`\`\n\n`;
    } catch {
      // ignore unreadable
    }
  }

  return output.trim();
}
