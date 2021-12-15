import { SLex } from './s-lex.js';
import { SParser } from './s-parser.js';
import { Context } from './context.js';
import { EvalError } from './evalerror.js';

class SyntaxError extends EvalError { };

class Evaluator {
    constructor() {
        let context = new Context();
        this.addNativeFunctions(context);

        this.globalContext = context;
    }

    fromString(exp) {
        let tokens = SLex.fromString(exp);
        let list = SParser.parse(tokens);
        return this.eval(list, this.globalContext);
    }

    /**
     * 执行一句表达式，返回表达式的值
     *
     * @param {*} list
     * @param {*} context
     * @returns
     */
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
            // 为语句块创建一个单独的作用域，
            // 如此一来平行的多个语句块就可以不相互影响
            const childContext = new Context(context);
            return this.evalBlock(list, childContext);
        }

        // 标识符的定义
        // 返回值：标识符的值
        //
        // (let identifier-name value)
        if (op === 'let') {
            Evaluator.assertNumberOfParameters('let', list.length - 1, 2);
            let [_, name, value] = list;
            return context.define(
                name,
                this.eval(value, context));
        }

        // 条件流程控制
        // 返回值：条件值为 true 时的表达式的值
        //
        // (if condition value-when-true value-when-false)
        if (op === 'if') {
            Evaluator.assertNumberOfParameters('if', list.length - 1, 3);
            let [_, condition, trueExp, falseExp] = list;
            // 约定以整数 -1 作为逻辑 true
            if (this.eval(condition, context) === -1) {
                return this.eval(trueExp, context);
            } else {
                return this.eval(falseExp, context);
            }
        }

        // 定义函数
        //
        // (def name (param1 param2 ...) (...))
        if (op === 'def') {
            Evaluator.assertNumberOfParameters('def', list.length - 1, 3);
            let [_, name, parameters, body] = list;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文/环境
            let fn = {
                parameters,
                body,
                context
            };

            return context.define(name, fn);
        }

        // 函数调用
        if (Evaluator.isIdentifier(op)) {
            let opValue = this.eval(op, context)
            if (typeof opValue === 'function') { // 本地函数
                let args = list.slice(1);
                Evaluator.assertNumberOfParameters(op, args.length, opValue.length);

                let argValues = args.map(a => {
                    return this.eval(a, context);
                });

                return opValue(...argValues);

            } else if (typeof opValue === 'object') { // 用户函数
                let args = list.slice(1);
                let {parameters, body, context: funcOwnContext} = opValue;
                Evaluator.assertNumberOfParameters(op, args.length, parameters.length);

                // 定义函数自己的上下文/环境
                let activationContext = new Context(
                    //context // 动态环境，函数内的外部变量的值会从调用栈开始层层往上查找
                    funcOwnContext // 静态环境，函数内的外部变量的值只跟定义该函数时的上下文/环境有关
                )

                // 添加参数的实参到活动上下文/环境
                parameters.forEach((name, idx) => {
                    activationContext.define(
                        name,
                        this.eval(args[idx], context));
                });

                // 函数的 body 有可能是一个普通表达式也可能是一个 `begin` 语句块表达式，
                // 为了避免遇到 `begin` 语句块表达式又创建一个作用域（虽然也没有错误），
                // 可以在这里提前检测是否为 `begin` 表达式，然后直接调用 `evalBlock` 方法。
                return this.eval(body, activationContext);

            } else {
                throw new EvalError(
                    'NOT_A_FUNCTION',
                    { name: op },
                    `Not a function: "${op}"`);
            }
        }

        throw new SyntaxError(
            'INVALID_EXPRESSION',
            {},
            `Invalid expression`);
    }

    /**
     * 执行多句表达式，返回最后一个表达式的值
     *
     * @param {*} list
     * @param {*} blockContext
     * @returns
     */
    evalBlock(list, blockContext) {
        let result;
        list.slice(1).forEach(subList => {
            result = this.eval(subList, blockContext);
        });
        return result;
    }



    addNativeFunctions(context) {
        // 求值函数
        // 返回值：标识符或者字面量的值
        //
        // (val identifier)
        // (val literal)
        context.define('val', (val) => {
            // Evaluator.assertNumberOfParameters('val', list.length - 1, 1);
            // return this.eval(list[1], context);
            return val;
        });

        /**
         * 内置函数
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

        context.define('add', (lh, rh) => {
            return lh + rh;
        });

        context.define('sub', (lh, rh) => {
            return lh - rh;
        });

        context.define('mul', (lh, rh) => {
            return lh * rh;
        });

        context.define('div', (lh, rh) => {
            return lh / rh;
        });

        context.define('rem', (lh, rh) => {
            return lh % rh;
        });

        context.define('eq', (lh, rh) => {
            return lh === rh ? -1 : 0;
        });

        context.define('neq', (lh, rh) => {
            return lh !== rh ? -1 : 0;
        });

        context.define('gt', (lh, rh) => {
            return lh > rh ? -1 : 0;
        });

        context.define('gte', (lh, rh) => {
            return lh >= rh ? -1 : 0;
        });

        context.define('lt', (lh, rh) => {
            return lh < rh ? -1 : 0;
        });

        context.define('lte', (lh, rh) => {
            return lh <= rh ? -1 : 0;
        });

        // 位运算

        context.define('bit_and', (lh, rh) => {
            return lh & rh;
        });

        context.define('bit_or', (lh, rh) => {
            return lh | rh;
        });

        context.define('bit_xor', (lh, rh) => {
            return lh ^ rh;
        });

        context.define('bit_not', (val) => {
            return ~val;
        });

        context.define('shift_left', (lh, rh) => {
            return lh << rh;
        });

        context.define('shift_right', (lh, rh) => {
            return lh >> rh;
        });

        context.define('shift_right_u', (lh, rh) => {
            return lh >>> rh;
        });

        // 逻辑运算

        context.define('and', (lh, rh) => {
            return (lh & rh) !== 0 ? -1 : 0;
        });

        context.define('or', (lh, rh) => {
            return (lh | rh) === 0 ? 0 : -1;
        });

        context.define('not', (val) => {
            return val === 0 ? -1 : 0;
        });

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

        context.define('abs', (val) => {
            return Math.abs(val);
        });

        context.define('neg', (val) => {
            return -val;
        });

        context.define('ceil', (val) => {
            return Math.ceil(val);
        });

        context.define('floor', (val) => {
            return Math.floor(val);
        });

        context.define('trunc', (val) => {
            return Math.trunc(val);
        });

        context.define('round', (val) => {
            return Math.round(val);
        });

        context.define('sqrt', (val) => {
            return Math.sqrt(val);
        });

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
    }

    static isNumber(element) {
        return typeof element === 'number';
    }

    static isIdentifier(element) {
        return typeof element === 'string';
    }

    static assertNumberOfParameters(name, actual, expect) {
        if (actual !== expect) {
            throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                { name: name, actual: actual, expect: expect },
                `Incorrect number of parameters for function: "${name}"`);
        }
    }
}

export { SyntaxError, Evaluator };