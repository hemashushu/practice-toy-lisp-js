/**
 * 用户自定义函数，即一般函数
 */
class UserDefineFunction {
    constructor(name, parameters, bodyExp, context) {
        this.name = name;
        this.parameters = parameters;
        this.bodyExp = bodyExp;
        this.context = context;
    }
}

export { UserDefineFunction };