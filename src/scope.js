import { IdentifierError } from './identifiererror.js';
import { AbstractContext } from './abstractcontext.js';

/**
 * 表达式块，或者匿名函数的上下文
 *
 * 用于创建一个作用域，维护作用域内的局部变量
 * Scope 仅可以在函数内定义
 */
class Scope extends AbstractContext {
    /**
     *
     * @param {*} parentContext 父上下文
     *     - 对于表达式块，父上下文就是其所在的函数的命名空间，或者父表达式块的上下文
     *     - 对于匿名函数，父上下文就是其所在的函数的命名空间，或者父匿名函数的上下文
     */
    constructor(parentContext = null) {
        super();
        this.parentContext = parentContext;
    }

    /**
     * 更新局部变量的值
     * 注意 Scope 一路从用户自定义函数的 Namespace 继承下来，但只有 Scope 里面
     * 的标识符才是局部变量。
     *
     * 返回值本身。
     * @param {*} name
     * @param {*} value
     */
    assignIdentifier(name, value) {
        if (this.identifiers.has(name)) {
            return this.identifiers.set(name, value);

        }else if (this.parentContext !== null &&
            this.parentContext instanceof Scope) {
            return this.parentContext.setValue(name, value);

        }else {
            throw new IdentifierError(
                'IDENTIFIER_NOT_FOUND',
                { name: name },
                `Local identifier "${name}" not found`);
        }
    }

    exist(name) {
        // 上下文具有继承关系
        return this.identifiers.has(name) ||
            (this.parentContext !== null && this.parentContext.exist(name));
    }

    getIdentifier(name) {
        // 上下文具有继承关系
        let value = this.identifiers.get(name);
        if (value === undefined) {
            if (this.parentContext !== null) {
                return this.parentContext.getIdentifier(name);

            } else {
                throw new IdentifierError(
                    'IDENTIFIER_NOT_FOUND',
                    { name: name },
                    `Identifier "${name}" not found`);
            }

        } else {
            return value;
        }
    }
}

export { Scope };