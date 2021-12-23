import { IdentifierError } from './identifiererror.js';

/**
 * 标识符容器有两种：
 * - namespace
 *   标识符就是用户自定义函数的名称，对于一些解析器，常量
 *   也会作为标识符挂靠在命名空间里，而对于编译成字节码或者本地代码的编译器，
 *   常量会在编译的预处理阶段处理，并不会挂靠在命名空间里。
 * - 表达式块，或者匿名函数的上下文
 *   标识符就是局部变量。
 */
class AbstractContext {
    constructor() {
        this.identifiers = new Map();
    }

    /**
     *
     * @param {*} name 标识符的名称
     * @param {*} value 值的可能值有：
     *     - 字面量，即 i32/i64/f32/f64
     *     - 本地函数，比如 add/sub，是一个 JavaScript `Function` 对象
     *     - 用户函数，是一个 JavaScript Object，结构：{parameters, bodyExp, context}
     *       其中 context 是定义该函数时的上下文（对于用户自定义函数来说，上下文就是其所在的 namespace）。
     * @returns
     */
    defineIdentifier(name, value) {
        // 在同一个命名空间之内不允许重名的标识符
        if (this.exist(name)) {
            throw new IdentifierError(
                'IDENTIFIER_ALREADY_EXIST',
                { name: name },
                `Identifier "${name}" has already exists`);
        }

        this.identifiers.set(name, value);
        return value;
    }

    exist(name) {
        //
    }

    getIdentifier(name) {
        //
    }
}

export { AbstractContext };