const babel = require('babel-core')

export function jsAst (code) {
  let ast = babel.transform(code).ast
  return ast
}

export function getAst (code, type) {
  switch (type) {
    case 'js':
      return jsAst(code)
    default:
      return null
  }
}
