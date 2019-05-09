const babel = require('babel-core')

export function jsAst (code) {
  console.log(babel.transform(code).ast)
  return babel.transform(code).ast
}

export function getAst (code, type) {
  switch (type) {
    case 'js':
      return jsAst(code)
    default:
      return null
  }
}
