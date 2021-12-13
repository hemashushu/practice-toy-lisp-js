import { SLex } from './s-lex.js';
import { SParser } from './s-parser.js';
import { Context } from './context.js';
import { EvalError } from './evalerror.js';

class SyntaxError extends EvalError { };

class Evaluator {
    constructor(context = new Context) {
        this.initialContext = context;
    }

    fromString(exp) {
        let tokens = SLex.fromString(exp);
        let list = SParser.parse(tokens);
        return this.eval(list, this.initialContext);
    }

    eval(list, context) {
        /**
         * 单值
         */

        // 数字字面量
        // 123
        // 3.14
        // 6.626e-34
        if (Evaluator.isNumber(list)) {
            return list;
        }

        // 标识符
        // foo
        // filter
        if (Evaluator.isIdentifier(list)) {
            return context.get(list);
        }

        // 函数名称
        let op = list[0];

        /**
         * 语句块
         */
        if (op === 'begin') {
            const childContext = new Context(context);
            return this.evalBlock(list, childContext);
        }

        /**
         * 基本函数
         *
         * 求值
         * - val 读取字面量或者标识符的值
         *
         * 算术运算
         * - add 加
         * - sub 减
         * - mul 乘
         * - div 除，返回 f64/f32
         * - rem 余
         *
         * 比较运算
         * - eq 等于，返回 0/-1，
         * - gt 大于，返回 0/-1
         * - gte 大于等于，返回 0/-1
         * - lt 小于，返回 0/-1
         * - lte 小于等于，返回 0/-1
         *
         * 逻辑运算
         * 约定 0 为 false，-1 为 true，内部使用位运算实现。
         * - and 逻辑与，返回 0/-1
         * - or 逻辑或，返回 0/-1
         * - not 逻辑非，返回 0/-1
         *
         * 位运算
         * - bit_and 位与
         * - bit_or 位或
         * - bit_xor 位异或
         * - bit_not 位非
         * - lshift 位左移
         * - rshift 位右移
         * - lrshift 逻辑位右移
         */
        if (op === 'val') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'val', actual: list.length, expect: 2 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context);
        }

        if (op === 'add') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'add', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) + this.eval(list[2], context);
        }

        if (op === 'sub') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'sub', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) - this.eval(list[2], context);
        }

        if (op === 'mul') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'mul', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) * this.eval(list[2], context);
        }

        if (op === 'div') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'div', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) / this.eval(list[2], context);
        }

        if (op === 'rem') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'rem', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) % this.eval(list[2], context);
        }

        if (op === 'eq') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'eq', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) === this.eval(list[2], context) ? -1 : 0;
        }

        if (op === 'gt') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'gt', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) > this.eval(list[2], context) ? -1 : 0;
        }

        if (op === 'gte') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'gte', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) >= this.eval(list[2], context) ? -1 : 0;
        }

        if (op === 'lt') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'lt', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) < this.eval(list[2], context) ? -1 : 0;
        }

        if (op === 'lte') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'lte', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) <= this.eval(list[2], context) ? -1 : 0;
        }

        if (op === 'and') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'and', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return (this.eval(list[1], context) & this.eval(list[2], context)) !== 0 ? -1 : 0;
        }

        if (op === 'or') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'or', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return (this.eval(list[1], context) | this.eval(list[2], context)) === 0 ? 0 : -1;
        }

        if (op === 'not') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'not', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) === 0 ? -1 : 0;
        }

        if (op === 'bit_and') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'bit_and', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) & this.eval(list[2], context);
        }

        if (op === 'bit_or') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'bit_or', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) | this.eval(list[2], context);
        }

        if (op === 'bit_xor') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'bit_xor', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) ^ this.eval(list[2], context);
        }

        if (op === 'bit_not') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'bit_not', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return ~this.eval(list[1], context);
        }

        if (op === 'lshift') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'lshift', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) << this.eval(list[2], context);
        }

        if (op === 'rshift') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'rshift', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) >> this.eval(list[2], context);
        }

        if (op === 'lrshift') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'lrshift', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) >>> this.eval(list[2], context);
        }

        /**
         * 标识符的定义
         *
         * (var identifier-name value)
         */
        if (op === 'var') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'var', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }

            return context.define(
                list[1],
                this.eval(list[2], context));
        }

        throw new EvalError(
            'FUNC_NOT_FOUND',
            { name: op },
            `Function not found: "${op}"`);
    }

    evalBlock(list, blockContext) {
        let result;
        list.slice(1).forEach(subList => {
            result = this.eval(subList, blockContext);
        });
        return result;
    }

    static isNumber(element) {
        return typeof element === 'number';
    }

    static isIdentifier(element) {
        return typeof element === 'string';
    }
}

export { SyntaxError, Evaluator };