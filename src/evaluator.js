import { SLex } from './s-lex.js';
import { SParser } from './s-parser.js';
import { Context } from './context.js';
import { EvalError } from './evalerror.js';
import { UserDefineFunction } from './user-define-function.js';
import { AnonymousFunction } from './anonymous-function.js';
import { RecursionFunction } from './recursion-function.js';

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
     * 执行一个表达式，返回表达式的值
     *
     * @param {*} exp
     * @param {*} context
     * @returns
     */
    eval(exp, context) {
        // 字面量
        // 只支持 i32/i64/f32/f64
        //
        // 123
        // 3.14
        // 6.626e-34
        if (Evaluator.isNumber(exp)) {
            return exp;
        }

        // 标识符
        // 不包含空格的字符串
        //
        // foo
        // filter
        if (Evaluator.isIdentifier(exp)) {
            return context.get(exp);
        }

        // 表达式的第一个元素，一般是函数名称或者关键字
        let op = exp[0];

        // 求值函数
        // 返回值：标识符或者字面量的值
        //
        // 语法：
        // - (val identifier)
        // - (val literal)
        if (op === 'val') {
            Evaluator.assertNumberOfParameters('val', exp.length - 1, 1);
            return this.eval(exp[1], context);
        }

        // 定义标识符
        // 返回值：标识符的值
        //
        // 语法：
        // (let identifier-name value)
        if (op === 'let') {
            Evaluator.assertNumberOfParameters('let', exp.length - 1, 2);
            let [_, name, value] = exp;
            return context.define(
                name,
                this.eval(value, context));
        }

        // 语句块表达式
        // 返回值：最后一个表达式的值
        //
        // 语法：
        // (do
        //      (...)
        //      (...)
        // )
        if (op === 'do') {
            // 为语句块创建一个单独的作用域，
            // 如此一来平行的多个语句块就可以不相互影响
            const childContext = new Context(context);
            let exps = exp.slice(1);
            return this.evalExps(exps, childContext);
        }

        // 流程控制 ———— 条件表达式
        // 返回值：条件值为 true 时的表达式的值
        //
        // 语法：
        // (if condition value-when-true value-when-false)
        if (op === 'if') {
            Evaluator.assertNumberOfParameters('if', exp.length - 1, 3);
            let [_, condition, trueExp, falseExp] = exp;
            // 约定以整数 -1 作为逻辑 true
            if (this.eval(condition, context) === -1) {
                return this.eval(trueExp, context);
            } else {
                return this.eval(falseExp, context);
            }
        }

        // 循环表达式
        //
        // 语法：
        // (loop (param1 param2 ...) (init_value1 init_value2 ...) (...))
        //
        // loop 后面跟着一个变量列表和一个初始值列表，然后是循环主体。
        // 变量的数量可以是零个。
        //
        // 当循环主体返回的值为：
        // * (1 value1 value2 ...) 时表示使用后面的值更新变量列表，然后再执行一次循环主体
        //   如果循环的变量数为零，则在数字 1 后面不需要其他数值。
        // * (0 value) 时表示退出循环主体，并以后面的值作为循环表达式的返回值
        //   为了确保表达式始终有返回值，数字 0 后面必须有一个数值。
        //
        // 为了明确目的，在语法上规定需要使用 `recur` 和 `break` 两个表达式构建返回值。
        // - (recur value1 value2 ...) `recur` 表达式返回 (1 value1 value2 ...)
        //   recur 表达式需要零个或多个参数
        // - (break value) `break` 表达式返回 (0 value)
        //   break 表达式需要一个参数
        //
        // 注意：
        // * 如果使用 `defnr` 定义函数（相对于 defn），也会隐含一个 loop 结构，即函数本身就是一个 loop 结构；
        // * `break` 和 `recur` 只能存在 `defnr` 和 `loop` 表达式之内的最后一句，在加载源码时会有语法检查。
        // * 如果循环主体里有 `if` 分支表达式，需要确保每一个分支的最后一句
        //   必须是 `recur` 或者 `break`，在加载源码时会有语法检查。；
        //
        // `loop...recur` 语句借鉴了 Clojure loop 语句 (https://clojuredocs.org/clojure.core/loop)
        // 不过因为 Clojure 是用户级语言，它在非循环分支里不需要明写类似 break 的语句。

        if (op === 'loop') {
            Evaluator.assertNumberOfParameters('loop', exp.length - 1, 3);

            let [_, parameters, initialValues, bodyExp] = exp;
            return this.evalLoop(bodyExp, parameters, initialValues, context);
        }

        // 返回第一个元素的值为 0 的列表
        //
        // 语法：
        // (break loop-expression-return-value)
        if (op === 'break') {
            Evaluator.assertNumberOfParameters('break', exp.length - 1, 1)
            let returnValue = this.eval(exp[1], context);
            return [0, returnValue];
        }

        // 返回第一个元素的值为 1 的列表
        //
        // 语法：
        // (recur value1, value2, ...)
        if (op === 'recur') {
            let argExps = exp.slice(1);
            let args = argExps.map(argExp => {
                return this.eval(argExp, context);
            });
            return [1, ...args];
        }

        // 用户自定义函数（也就是一般函数）
        //
        // 语法：
        // (defn name (param1 param2 ...) (...))
        //
        // 注意 `defn` 只能写在 `namespace` 直接的第一层里，这个加载代码是
        // 会进行语法检查。

        if (op === 'defn') {
            Evaluator.assertNumberOfParameters('defn', exp.length - 1, 3);
            let [_, name, parameters, bodyExp] = exp;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文/环境
            let userDefineFunc = new UserDefineFunction(
                name,
                parameters,
                bodyExp,
                context
            );

            return context.define(name, userDefineFunc);
        }

        // 含有递归调用的用户自定义函数
        //
        // 语法:
        // (defnr name (param1 param2 ...) (...))
        //
        // 注意 `defnr` 只能写在 `namespace` 直接的第一层里，这个加载代码是
        // 会进行语法检查。
        //
        // `defnr` 表达式的结构跟 `loop` 一样，即：
        // - 函数的最后一句必须是 `break` 或者 `recur`
        // - 如果函数有多个分支，必须保证每个分支的最后一句必须是 `break` 或者 `recur`，
        //   在加载源码时会有语法检查。
        if (op === 'defnr') {
            Evaluator.assertNumberOfParameters('defnr', exp.length - 1, 3);
            let [_, name, parameters, bodyExp] = exp;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文/环境
            let recursionFunction = new RecursionFunction(
                name,
                parameters,
                bodyExp,
                context
            );

            return context.define(name, recursionFunction);
        }

        // 匿名函数（即所谓 Lambda）
        // 匿名函数在一般函数内部定义，可以作为函数的返回值，或者作为参数传递给另外一个函数。
        //
        // 语法：
        // (fn (param1 param2 ...) (...))
        if (op === 'fn') {
            Evaluator.assertNumberOfParameters('fn', exp.length - 1, 2);
            let [_, parameters, bodyExp] = exp;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文/环境
            let anonymousFunc = new AnonymousFunction(
                parameters,
                bodyExp,
                context
            );

            return anonymousFunc;
        }

        // 函数调用
        if (Array.isArray(exp)) {
            // 列表的第一个元素可能是一个函数名称，也可能是一个子列表，先对第一个元素求值
            let opValue = this.eval(op, context)

            if (typeof opValue === 'function') { // 本地函数
                let args = exp.slice(1);
                Evaluator.assertNumberOfParameters(op, args.length, opValue.length);

                let argValues = args.map(a => {
                    return this.eval(a, context);
                });

                return opValue(...argValues);

            } else if (opValue instanceof UserDefineFunction) { // 用户定义函数
                let args = exp.slice(1);
                let {name, parameters, bodyExp, context: functionContext } = opValue;
                return this.evalFunction(name, bodyExp, parameters, args, functionContext, context);

            }else if (opValue instanceof AnonymousFunction) { // 匿名函数
                let args = exp.slice(1);
                let {parameters, bodyExp, context: functionContext } = opValue;
                return this.evalFunction('lambda', bodyExp, parameters, args, functionContext, context);

            } else if (opValue instanceof RecursionFunction) { // 递归函数
                let args = exp.slice(1);
                let {name, parameters, bodyExp, context: functionContext } = opValue;
                return this.evalRecursionFunction(name, bodyExp, parameters, args, functionContext, context);

            } else {
                throw new EvalError(
                    'NOT_A_FUNCTION',
                    { name: op },
                    `Not a function: "${op}"`);
            }
        }

        // 未知的表达式
        throw new SyntaxError(
            'INVALID_EXPRESSION',
            { exp: exp },
            `Invalid expression`);
    }

    /**
     * 执行多个表达式，返回最后一个表达式的值
     *
     * @param {*} exps
     * @param {*} context
     * @returns
     */
    evalExps(exps, context) {
        let result;
        exps.forEach(exp => {
            result = this.eval(exp, context);
        });
        return result;
    }

    evalLoop(exp, parameters, args, context) {
        while (true) {
            Evaluator.assertNumberOfLoopArgs(parameters.length, args.length);

            // 为循环块创建一个单独的作用域
            const childContext = new Context(context);

            // 添加实参
            parameters.forEach((name, idx) => {
                childContext.define(
                    name,
                    this.eval(args[idx], context));
            });

            let result = this.eval(exp, childContext);

            if (result[0] === 0) {
                // break the loop
                if (result.length !== 2) {
                    throw new SyntaxError('REQUIRE_LOOP_RETURN_ONE_VALUE',
                        { actual: result.length - 1, expect: 1 },
                        `Require loop return one value`);
                }

                // 因为语法规定返回值必须由 `break` 或者 `recur` 语句构建，而这两个
                // 语句已经求值了各个参数，所以这里不需要再次求值。
                return result[1];

                // let returnValue = this.eval(result[1], childContext);
                // return returnValue;

            } else {
                // recur the loop
                // update the args and run the loop body again

                // 因为语法规定返回值必须由 `break` 或者 `recur` 语句构建，而这两个
                // 语句已经求值了各个参数，所以这里不需要再次求值。
                args = result.slice(1);

                // let newArgs = result.slice(1);
                // args = newArgs.map(arg => {
                //     return this.eval(arg, childContext);
                // });
            }
        }
    }

    evalFunction(name, exp, parameters, args, functionContext, context) {
        Evaluator.assertNumberOfParameters(name, args.length, parameters.length);

        // 创建函数自己的上下文/环境
        let activationContext = new Context(
            //context // 动态环境，函数内的外部变量的值会从调用栈开始层层往上查找
            functionContext // 静态环境，函数内的外部变量的值只跟定义该函数时的上下文/环境有关
        )

        // 添加实参
        parameters.forEach((name, idx) => {
            activationContext.define(
                name,
                this.eval(args[idx], context));
        });

        // 函数的 body 有可能是一个普通表达式也可能是一个 `do` 语句块表达式，
        // 为了避免遇到 `do` 语句块表达式又创建一个作用域（虽然也没有错误），
        // 可以在这里提前检测是否为 `do` 表达式，然后直接调用 `evalBlock` 方法。
        return this.eval(exp, activationContext);
    }

    evalRecursionFunction(name, exp, parameters, args, functionContext, context) {
        while (true) {
            let result = this.evalFunction(name, exp, parameters, args, functionContext, context);

            if (result[0] === 0) {
                // break the loop
                if (result.length !== 2) {
                    throw new SyntaxError('REQUIRE_RECURSION_FUNCTION_RETURN_ONE_VALUE',
                        { actual: result.length - 1, expect: 1 },
                        `Require recursion function return one value`);
                }

                // 因为语法规定返回值必须由 `break` 或者 `recur` 语句构建，而这两个
                // 语句已经求值了各个参数，所以这里不需要再次求值。
                return result[1];

            } else {
                // recur the loop
                // update the args and run the loop body again

                // 因为语法规定返回值必须由 `break` 或者 `recur` 语句构建，而这两个
                // 语句已经求值了各个参数，所以这里不需要再次求值。
                args = result.slice(1);
            }
        }
    }

    addNativeFunctions(context) {
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

    static assertNumberOfLoopArgs(numberOfParameters, numberOfArgs) {
        if (numberOfParameters !== numberOfArgs) {
            throw new SyntaxError('INCORRECT_NUMBER_OF_LOOP_ARGS',
                { actual: numberOfArgs, expect: numberOfParameters },
                `Incorrect number of args for loop`);
        }
    }
}

export { SyntaxError, Evaluator };