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
        // 字面量
        // 只支持 i32/i64/f32/f64
        //
        // 123
        // 3.14
        // 6.626e-34
        if (Evaluator.isNumber(list)) {
            return list;
        }

        // 标识符
        //
        // foo
        // filter
        if (Evaluator.isIdentifier(list)) {
            return context.get(list);
        }

        // 函数名称
        let op = list[0];

        // 语句块表达式
        // 返回值：最后一个表达式的值
        //
        // (begin
        //      (...)
        //      (...)
        // )
        if (op === 'begin') {
            const childContext = new Context(context);
            return this.evalBlock(list, childContext);
        }

        // 求值函数
        // 返回值：标识符或者字面量的值
        //
        // (val identifier)
        // (val literal)
        if (op === 'val') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'val', actual: list.length, expect: 2 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context);
        }

        // 标识符的定义
        // 返回值：标识符的值
        //
        // (var identifier-name value)
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

        // 条件流程控制
        // 返回值：条件值为 true 时的表达式的值
        //
        // (if condition value-when-true value-when-false)
        if (op === 'if') {
            if (list.length !== 4) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'if', actual: list.length, expect: 4 },
                    `Incorrect number of parameters for function: "${op}"`);
            }

            // 约定以整数 -1 作为逻辑 true
            if (this.eval(list[1], context) === -1) {
                return this.eval(list[2], context);
            }else {
                return this.eval(list[3], context);
            }
        }

        /**
         * 基本函数
         * 保持与 WASM VM 函数一致
         *
         * 整数算术运算，只实现了 i64（未实现 i32）
         * - add 加，返回 i64
         * - sub 减，返回 i64
         * - mul 乘，返回 i64
         * - div 除，返回 i64
         * - div_u 无符号除，返回 i64（未实现）
         * - rem 余，返回 i64
         * - rem_u 无符号余，返回 i64（未实现）
         *
         * 浮点算术运算（未实现 f64，未实现 f32）
         * - f64.add 加，返回 f64
         * - f64.sub 减，返回 f64
         * - f64.mul 乘，返回 f64
         * - f64.div 除，返回 f64
         *
         * 整数比较运算（未实现 i32）
         * - eq 等于，返回 0/-1，
         * - neq 不等于，返回 0/-1
         * - gt 大于，返回 0/-1
         * - gt_u 无符号大于，返回 0/-1（未实现）
         * - gte 大于等于，返回 0/-1
         * - gte_u 无符号大于等于，返回 0/-1（未实现）
         * - lt 小于，返回 0/-1
         * - lt_u 无符号小于，返回 0/-1（未实现）
         * - lte 小于等于，返回 0/-1
         * - lte_u 无符号小于等于，返回 0/-1（未实现）
         *
         * 浮点数比较运算（未实现 f64，未实现 f32）
         * - f64.eq 等于，返回 0/-1
         * - f64.neq 不等于，返回 0/-1
         * - f64.gt 大于，返回 0/-1
         * - f64.gte 大于等于，返回 0/-1
         * - f64.lt 小于，返回 0/-1
         * - f64.lte 小于等于，返回 0/-1
         *
         * 位运算
         * - bit_and 位与
         * - bit_or 位或
         * - bit_xor 位异或
         * - bit_not 位非
         * - shift_left 位左移
         * - shift_right 位右移
         * - shift_right_u 逻辑位右移
         *
         * 逻辑运算
         * 约定 0 为 false，-1 为 true，内部使用位运算实现。
         * - and 逻辑与，返回 0/-1
         * - or 逻辑或，返回 0/-1
         * - not 逻辑非，返回 0/-1
         *
         */

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

        if (op === 'neq') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'neq', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) !== this.eval(list[2], context) ? -1 : 0;
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

        // 位运算

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

        if (op === 'shift_left') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'shift_left', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) << this.eval(list[2], context);
        }

        if (op === 'shift_right') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'shift_right', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) >> this.eval(list[2], context);
        }

        if (op === 'shift_right_u') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'shift_right_u', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) >>> this.eval(list[2], context);
        }

        // 逻辑运算

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

        /**
         * 浮点数常用数学函数（f32 未实现）
         * 整数无此类运算
         *
         * - abs 绝对值
         * - neg 取反
         * - ceil 向上取整
         * - floor 向下取整
         * - trunc 截断取整
         * - round 就近取整（对应 WASM VM 的 nearest 函数）
         * - sqrt 平方根
         */

        if (op === 'abs') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'abs', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return Math.abs(this.eval(list[1], context));
        }

        if (op === 'neg') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'neg', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return -(this.eval(list[1], context));
        }

        if (op === 'ceil') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'ceil', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return Math.ceil(this.eval(list[1], context));
        }

        if (op === 'floor') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'floor', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return Math.floor(this.eval(list[1], context));
        }

        if (op === 'trunc') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'trunc', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return Math.trunc(this.eval(list[1], context));
        }

        if (op === 'round') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'round', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return Math.round(this.eval(list[1], context));
        }

        if (op === 'sqrt') {
            if (list.length !== 2) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'sqrt', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return Math.sqrt(this.eval(list[1], context));
        }

        /**
         * 整数(i32, i64)之间转换、浮点数（f32, f64）之间转换，
         * 以及整数(i32, i64)与浮点数（f32, f64）之间转换的函数大致有：
         *
         * - 整数截断 conv_wrap
         * - 整数提升 conv_extend
         * - 浮点数精度下降 conv_demote
         * - 浮点数精度提升 conv_promote
         * - 浮点转整数 conv_trunc
         * - 整数转浮点 conv_convert
         *
         * （i32, i64，f32, f64 均未实现）
         */

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