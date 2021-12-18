/**
 * 含尾部调用的用户自定义函数
 *
 * - 函数的最后一句必须是 `break` 或者 `recur`
 * - 如果函数有多个分支，必须保证每个分支的最后一句必须是 `break` 或者 `recur`，
 *   在加载源码时会有语法检查。
 */
class RecursionFunction {
    constructor(name, parameters, bodyExp, context) {
        this.name = name;
        this.parameters = parameters;
        this.bodyExp = bodyExp;
        this.context = context;
    }
}

export { RecursionFunction };