/**
 * 匿名函数（也叫做 Lambda）
 */
class AnonymousFunction {
    constructor(parameters, bodyExp, context) {
        this.parameters = parameters;
        this.bodyExp = bodyExp;
        this.context = context; // 定义函数时所在的作用域
    }
}

export { AnonymousFunction };