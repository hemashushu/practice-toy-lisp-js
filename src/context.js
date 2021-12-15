import { EvalError } from './evalerror.js';

class ContextError extends EvalError {
}

/**
 * 上下文/环境
 * 用于创建一个作用域
 *
 * All identifier values are immutable,
 * i.e., the value of the identifier is determined
 * at definition time.
 * assignment is not supported.
 */
class Context {
    constructor(parentContext = null) {
        this.records = new Map();
        this.parentContext = parentContext;
    }

    /**
     *
     * @param {*} name 字符串
     * @param {*} value 值的可能值有：
     *     - 字面量，即 i32/i64/f32/f64
     *     - 本地函数，比如 add/sub，是一个 JavaScript `Function` 对象
     *     - 用户函数，是一个 JavaScript Object，结构：{parameters, body, context}
     *       其中 body 是一个 list，而 context 是定义该函数时的上下文/环境。
     * @returns
     */
    define(name, value) {
        // identifiers with the same name within the
        // valid scope are not allowed
        if (this.exist(name)) {
            throw new ContextError(
                'ID_ALREADY_EXIST',
                { name: name },
                `Identifier "${name}" has already exists`);
        }

        this.records.set(name, value);
        return value;
    }

    exist(name) {
        // find the parent scope if the specified identifier
        // is not found in the current scope
        return this.records.has(name) ||
            (this.parentContext !== null && this.parentContext.exist(name));
    }

    get(name) {
        // find the parent scope if the specified identifier
        // is not found in the current scope
        let value = this.records.get(name);
        if (value === undefined) {
            if (this.parentContext !== null) {
                return this.parentContext.get(name);

            } else {
                throw new ContextError(
                    'ID_NOT_FOUND',
                    { name: name },
                    `Identifier "${name}" not found`);
            }

        } else {
            return value;
        }
    }
}

export { ContextError, Context };