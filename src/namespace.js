import { IdentifierError } from './identifiererror.js';
import { AbstractContext } from './abstractcontext.js';

/**
 * 命名空间用于存储用户自定义函数、内置函数及常量
 *
 * 命名空间之间没有继承关系，所有命名空间都从属于 Environment.
 *
 */
class Namespace extends AbstractContext {
    constructor() {
        super();
    }

    exist(name) {
        // 命名空间对象之间没有继承关系
        return this.identifiers.has(name);
    }

    getIdentifier(name) {
        let value = this.identifiers.get(name);
        if (value === undefined) {
            throw new IdentifierError(
                'IDENTIFIER_NOT_FOUND',
                { name: name },
                `Identifier "${name}" not found`);

        } else {
            return value;
        }
    }
}

export { Namespace };