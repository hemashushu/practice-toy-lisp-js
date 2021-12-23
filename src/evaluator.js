import { SLex } from './s-lex.js';
import { SParser } from './s-parser.js';

import { EvalError } from './evalerror.js';
import { SyntaxError } from './syntexerror.js';
import { IdentifierError } from './identifiererror.js';

import { UserDefineFunction } from './user-define-function.js';
import { AnonymousFunction } from './anonymous-function.js';
import { RecursionFunction } from './recursion-function.js';

import { Environment } from './environment.js';
import { AbstractContext } from './abstractcontext.js';
import { Namespace } from './namespace.js';
import { Scope } from './scope.js';

class Evaluator {
    constructor() {
        let environment = new Environment();
        Evaluator.addNativeFunctionNamespace(environment);
        Evaluator.addBuiltinFunctionNamespace(environment)

        this.defaultNamespace = Evaluator.addDefaultNamespace(environment);
        this.environment = environment;
    }

    /**
     * 加载一个模块的文本代码
     *
     * - 支持 `use` 语句
     * - 支持相对路径
     *
     * @param {*} text
     */
    loadModuleFromString(moduleName, text) {
        let tokens = SLex.fromString(text);
        let list = SParser.parse(tokens);
        // TODO::
        // 处理 `use` 表达式
    }

    /**
     * 解析一条表达式的文本，并执行，然后返回表达式的值
     *
     * - 不支持 `use` 语句
     * - 不支持相对路径
     *
     * 环境处于默认命名空间 `user` 里。
     *
     * @param {*} singleExpText
     * @returns
     */
    evalFromString(singleExpText) {
        let tokens = SLex.fromString(singleExpText);
        let list = SParser.parse(tokens);
        return this.eval(list, this.defaultNamespace);
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
            return this.getIdentifier(exp, context);
        }

        // 表达式的第一个元素，一般是函数名称或者关键字
        let op = exp[0];

        // 定义常量
        // 返回值：标识符的值
        //
        // 语法：
        // (const identifier-name value)
        //
        // 常量仅可以在 namespace 里定义
        if (op === 'const') {
            Evaluator.assertNumberOfParameters('const', exp.length - 1, 2);

            if (!(context instanceof Namespace)) {
                throw new SyntaxError(
                    'INVALID_CONST_EXPRESSION_PLACE',
                    {},
                    'Const expressions can only be defined in namespaces');
            }

            let [_, name, value] = exp;
            return context.defineIdentifier(
                name,
                this.eval(value, context));
        }

        // 定义局部标识符（局部变量）
        // 返回值：标识符的值
        //
        // 语法：
        // (let identifier-name value)
        //
        // 变量只可以在 scope 里定义
        if (op === 'let') {
            Evaluator.assertNumberOfParameters('let', exp.length - 1, 2);

            if (!(context instanceof Scope)) {
                throw new SyntaxError(
                    'INVALID_LET_EXPRESSION_PLACE',
                    {},
                    'Let expressions can only be defined in scopes');
            }

            let [_, name, value] = exp;
            return context.defineIdentifier(
                name,
                this.eval(value, context));
        }

        if (op === 'set') {
            Evaluator.assertNumberOfParameters('set', exp.length - 1, 2);

            if (!(context instanceof Scope)) {
                throw new SyntaxError(
                    'INVALID_SET_EXPRESSION_PLACE',
                    {},
                    'Set expressions can only be used in scopes');
            }

            let [_, name, value] = exp;
            return context.assignIdentifier(
                name,
                this.eval(value, context));
        }

        // 命名空间表达式
        // 返回值：命名空间的 namespace 对象
        //
        // 语法：
        // (namespace name
        //      (...)
        //      (...)
        // )
        if (op === 'namespace') {
            // 为 namespace 创建一个单独的上下文
            // 如此一来平行的多个命名空间就可以不相互影响
            let [_, namePath, exps] = exp;

            const childContext = this.environment.createNamespace(namePath);
            return this.evalExps(exps, childContext);
        }


        // 表达式块
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
            const childContext = new Scope(context);
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
            // 约定以整数 1 作为逻辑 true
            if (this.eval(condition, context) === 1) {
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
        // * 循环表达式隐含地创建了一个自己的作用域
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
        // * 用户自定义函数只能在 namespace 里定义
        // * 用户自定义函数隐含地创建了自己的作用域

        if (op === 'defn') {
            Evaluator.assertNumberOfParameters('defn', exp.length - 1, 3);

            if (!(context instanceof Namespace)) {
                throw new SyntaxError(
                    'INVALID_DEFN_EXPRESSION_PLACE',
                    {},
                    'Defn expressions can only be defined in namespaces');
            }

            let [_, name, parameters, bodyExp] = exp;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文
            let userDefineFunc = new UserDefineFunction(
                name,
                parameters,
                bodyExp,
                context
            );

            return context.defineIdentifier(name, userDefineFunc);
        }

        // 含有递归调用的用户自定义函数
        //
        // 语法:
        // (defnr name (param1 param2 ...) (...))
        //
        // `defnr` 表达式的结构跟 `loop` 一样，即：
        // - 函数的最后一句必须是 `break` 或者 `recur`
        // - 如果函数有多个分支，必须保证每个分支的最后一句必须是 `break` 或者 `recur`，
        //   在加载源码时会有语法检查。
        //
        // * 用户自定义函数只能在 namespace 里定义
        // * 用户自定义函数隐含地创建了自己的作用域

        if (op === 'defnr') {
            Evaluator.assertNumberOfParameters('defnr', exp.length - 1, 3);

            if (!(context instanceof Namespace)) {
                throw new SyntaxError(
                    'INVALID_DEFN_EXPRESSION_PLACE',
                    {},
                    'Defnr expressions can only be defined in namespaces');
            }

            let [_, name, parameters, bodyExp] = exp;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文
            let recursionFunction = new RecursionFunction(
                name,
                parameters,
                bodyExp,
                context
            );

            return context.defineIdentifier(name, recursionFunction);
        }

        // 匿名函数（即所谓 Lambda）
        // 匿名函数在一般函数内部定义，可以作为函数的返回值，或者作为参数传递给另外一个函数。
        //
        // 语法：
        // (fn (param1 param2 ...) (...))
        //
        // * 匿名函数隐含地创建了自己的作用域
        if (op === 'fn') {
            Evaluator.assertNumberOfParameters('fn', exp.length - 1, 2);
            let [_, parameters, bodyExp] = exp;

            // 因为闭包（closure）的需要，函数对象需要包含当前的上下文
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
                let { name, parameters, bodyExp, context: functionContext } = opValue;
                return this.evalFunction(name, bodyExp, parameters, args, functionContext, context);

            } else if (opValue instanceof AnonymousFunction) { // 匿名函数
                let args = exp.slice(1);
                let { parameters, bodyExp, context: functionContext } = opValue;
                return this.evalFunction('lambda', bodyExp, parameters, args, functionContext, context);

            } else if (opValue instanceof RecursionFunction) { // 递归函数
                let args = exp.slice(1);
                let { name, parameters, bodyExp, context: functionContext } = opValue;
                return this.evalRecursionFunction(name, bodyExp, parameters, args, functionContext, context);

            } else {
                throw new EvalError(
                    'IDENTIFIER_NOT_A_FUNCTION',
                    { name: op },
                    `The specified identifier is not a function: "${op}"`);
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

            // 循环表达式隐含地创建了一个自己的作用域
            const childContext = new Scope(context);

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

            } else {
                // recur the loop
                // update the args and run the loop body again

                // 因为语法规定返回值必须由 `break` 或者 `recur` 语句构建，而这两个
                // 语句已经求值了各个参数，所以这里不需要再次求值。
                args = result.slice(1);
            }
        }
    }

    evalFunction(name, exp, parameters, args, functionContext, context) {
        Evaluator.assertNumberOfParameters(name, args.length, parameters.length);

        // 函数隐含地创建了一个自己的作用域
        let activationContext = new Scope(
            //context // 动态环境，函数内的外部变量的值会从调用栈开始层层往上查找
            functionContext // 静态环境，函数内的外部变量的值只跟定义该函数时的上下文有关
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

    /**
     * 创建 `native` 命名空间，并加入虚拟机直接支持的指令
     * 函数名称保持与 WASM VM 指令名称一致
     *
     * 对于 i64/i32/f32/f64 各个数据类型都有它们对应的子命名空间：
     *
     * - native.i64.add 是 i64 加法
     * - native.i32.add 是 i32 加法
     * - native.f32.add 是 f32 加法
     * - native.f64.add 是 f64 加法
     *
     */
    static addNativeFunctionNamespace(environment) {

        /**
         * i64 算术运算
         *
         * - add 加
         * - sub 减
         * - mul 乘
         * - div_s 除
         * - div_u 无符号除
         * - rem_s 余
         * - rem_u 无符号余
         *
         * i64 位运算
         *
         * - and 位与
         * - or 位或
         * - xor 位异或
         * - shl 位左移
         * - shr_s 位右移
         * - shr_u 逻辑位右移
         *
         * i64 比较运算，条件成立返回 1，不成立返回 0
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt_s 小于，返回 0/1
         * - lt_u 无符号小于，返回 0/1
         * - gt_s 大于，返回 0/1
         * - gt_u 无符号大于，返回 0/1
         * - le_s 小于等于，返回 0/1
         * - le_u 无符号小于等于，返回 0/1
         * - ge_s 大于等于，返回 0/1
         * - ge_u 无符号大于等于，返回 0/1
         *
         */

        let nsi64 = environment.createNamespace('native.i64');

        // 算术运算

        nsi64.defineIdentifier('add', (lh, rh) => {
            return lh + rh;
        });

        nsi64.defineIdentifier('sub', (lh, rh) => {
            return lh - rh;
        });

        nsi64.defineIdentifier('mul', (lh, rh) => {
            return lh * rh;
        });

        nsi64.defineIdentifier('div_s', (lh, rh) => {
            return lh / rh;
        });

        nsi64.defineIdentifier('div_u', (lh, rh) => {
            // not implement yet
            throw new EvalError('NOT_IMPLEMENT');
        });

        nsi64.defineIdentifier('rem_s', (lh, rh) => {
            return lh % rh;
        });

        nsi64.defineIdentifier('rem_u', (lh, rh) => {
            // not implement yet
            throw new EvalError('NOT_IMPLEMENT');
        });

        // 位运算

        nsi64.defineIdentifier('and', (lh, rh) => {
            return lh & rh;
        });

        nsi64.defineIdentifier('or', (lh, rh) => {
            return lh | rh;
        });

        nsi64.defineIdentifier('xor', (lh, rh) => {
            return lh ^ rh;
        });

        nsi64.defineIdentifier('shl', (lh, rh) => {
            return lh << rh;
        });

        nsi64.defineIdentifier('shr_s', (lh, rh) => {
            return lh >> rh;
        });

        nsi64.defineIdentifier('shr_u', (lh, rh) => {
            return lh >>> rh;
        });

        // 比较运算

        nsi64.defineIdentifier('eq', (lh, rh) => {
            return lh === rh ? 1 : 0;
        });

        nsi64.defineIdentifier('ne', (lh, rh) => {
            return lh !== rh ? 1 : 0;
        });

        nsi64.defineIdentifier('lt_s', (lh, rh) => {
            return lh < rh ? 1 : 0;
        });

        nsi64.defineIdentifier('lt_u', (lh, rh) => {
            // not implement yet
            throw new EvalError('NOT_IMPLEMENT');
        });

        nsi64.defineIdentifier('gt_s', (lh, rh) => {
            return lh > rh ? 1 : 0;
        });

        nsi64.defineIdentifier('gt_u', (lh, rh) => {
            // not implement yet
            throw new EvalError('NOT_IMPLEMENT');
        });

        nsi64.defineIdentifier('le_s', (lh, rh) => {
            return lh <= rh ? 1 : 0;
        });

        nsi64.defineIdentifier('le_u', (lh, rh) => {
            // not implement yet
            throw new EvalError('NOT_IMPLEMENT');
        });

        nsi64.defineIdentifier('ge_s', (lh, rh) => {
            return lh >= rh ? 1 : 0;
        });

        nsi64.defineIdentifier('ge_u', (lh, rh) => {
            // not implement yet
            throw new EvalError('NOT_IMPLEMENT');
        });

        /**
         * i32 算术运算
         *
         * - add 加
         * - sub 减
         * - mul 乘
         * - div_s 除
         * - div_u 无符号除
         * - rem_s 余
         * - rem_u 无符号余
         *
         * i32 位运算
         *
         * - and 位与
         * - or 位或
         * - xor 位异或
         * - shl 位左移
         * - shr_s 位右移
         * - shr_u 逻辑位右移
         *
         * i32 比较运算，条件成立返回 1，不成立返回 0
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt_s 小于，返回 0/1
         * - lt_u 无符号小于，返回 0/1
         * - gt_s 大于，返回 0/1
         * - gt_u 无符号大于，返回 0/1
         * - le_s 小于等于，返回 0/1
         * - le_u 无符号小于等于，返回 0/1
         * - ge_s 大于等于，返回 0/1
         * - ge_u 无符号大于等于，返回 0/1
         *
         */

        let nsi32 = environment.createNamespace('native.i32');
        // TODO:: nsi32 全部都未实现

        /**
         * f64 算术运算
         * - add 加
         * - sub 减
         * - mul 乘
         * - div 除
         *
         * f64 比较运算
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt 小于，返回 0/1
         * - gt 大于，返回 0/1
         * - le 小于等于，返回 0/1
         * - ge 大于等于，返回 0/1
         *
         * f64 数学函数
         * - abs 绝对值
         * - neg 取反
         * - ceil 向上取整
         * - floor 向下取整
         * - trunc 截断取整
         * - nearest 就近取整（对应一般数学函数 round）
         * - sqrt 平方根
         */

        let nsf64 = environment.createNamespace('native.f64');

        // 算术运算

        nsf64.defineIdentifier('add', (lh, rh) => {
            return lh + rh;
        });

        nsf64.defineIdentifier('sub', (lh, rh) => {
            return lh - rh;
        });

        nsf64.defineIdentifier('mul', (lh, rh) => {
            return lh * rh;
        });

        nsf64.defineIdentifier('div', (lh, rh) => {
            return lh / rh;
        });

        // 比较运算

        nsf64.defineIdentifier('eq', (lh, rh) => {
            return lh === rh ? 1 : 0;
        });

        nsf64.defineIdentifier('ne', (lh, rh) => {
            return lh !== rh ? 1 : 0;
        });

        nsf64.defineIdentifier('lt', (lh, rh) => {
            return lh < rh ? 1 : 0;
        });

        nsf64.defineIdentifier('gt', (lh, rh) => {
            return lh > rh ? 1 : 0;
        });

        nsf64.defineIdentifier('le', (lh, rh) => {
            return lh <= rh ? 1 : 0;
        });

        nsf64.defineIdentifier('ge', (lh, rh) => {
            return lh >= rh ? 1 : 0;
        });

        // 数学函数

        nsi64.defineIdentifier('abs', (val) => {
            return Math.abs(val);
        });

        nsi64.defineIdentifier('neg', (val) => {
            return -val;
        });

        nsi64.defineIdentifier('ceil', (val) => {
            return Math.ceil(val);
        });

        nsi64.defineIdentifier('floor', (val) => {
            return Math.floor(val);
        });

        nsi64.defineIdentifier('trunc', (val) => {
            return Math.trunc(val);
        });

        nsi64.defineIdentifier('nearest', (val) => {
            return Math.round(val);
        });

        nsi64.defineIdentifier('sqrt', (val) => {
            return Math.sqrt(val);
        });

        /**
         * f32 算术运算
         * - add 加
         * - sub 减
         * - mul 乘
         * - div 除
         *
         * f32 比较运算
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt 小于，返回 0/1
         * - gt 大于，返回 0/1
         * - le 小于等于，返回 0/1
         * - ge 大于等于，返回 0/1
         *
         * f32 数学函数
         * - abs 绝对值
         * - neg 取反
         * - ceil 向上取整
         * - floor 向下取整
         * - trunc 截断取整
         * - nearest 就近取整（对应一般数学函数 round）
         * - sqrt 平方根
         */

        let nsf32 = environment.createNamespace('native.f32');
        // TODO:: nsf32 全部都未实现

        /**
         * - 整数(i32, i64)之间转换
         * - 浮点数（f32, f64）之间转换
         * - 整数(i32, i64)与浮点数（f32, f64）之间转换
         *
         * 部分函数
         *
         * - 整数提升
         *   + i64.extend_i32_s(i32) -> i64
         *   + i64.extend_i32_u(i32) -> i64
         * - 整数截断
         *   + i32.wrap(i64) -> i32
         *
         * - 浮点数精度提升
         *   + f64.promote(f32) -> f32
         *
         * - 浮点数精度下降
         *   + f32.demote(f64) -> f32
         *
         * - 浮点转整数
         *   + i32.trunc_f32_s (f32) -> i32
         *   + i32.trunc_f32_u (f32) -> i32
         *   + i64.trunc_f32_s (f32) -> i64
         *   + i64.trunc_f32_u (f32) -> i64
         *
         *   + i32.trunc_f64_s (f64) -> i32
         *   + i32.trunc_f64_u (f64) -> i32
         *   + i64.trunc_f64_s (f64) -> i64
         *   + i64.trunc_f64_u (f64) -> i64
         *
         * - 整数转浮点
         *   + f32.convert_i32_s (i32) -> f32
         *   + f32.convert_i32_u (i32) -> f32
         *   + f64.convert_i32_s (i32) -> f64
         *   + f64.convert_i32_u (i32) -> f64
         *
         *   + f32.convert_i64_s (i64) -> f32
         *   + f32.convert_i64_u (i64) -> f32
         *   + f64.convert_i64_s (i64) -> f64
         *   + f64.convert_i64_u (i64) -> f64
         *
         */
        // TODO:: 全部都未实现
    }

    /**
     * 创建 `builtin` 命名空间，并加入内置函数
     *
     * @param {*} environment
     */
    static addBuiltinFunctionNamespace(environment) {

        let nsbuiltin = environment.createNamespace('builtin');

        // 求值函数
        // 返回值：标识符或者字面量的值
        //
        // 语法：
        // - (val identifier)
        // - (val literal)
        nsbuiltin.defineIdentifier('val', (val) => {
            return val;
        });

        /**
        * 逻辑运算
        * 约定 0 为 false，1 为 true，内部使用位运算实现。
        * - and 逻辑与，返回 0/1
        * - or 逻辑或，返回 0/1
        * - not 逻辑非，返回 0/1
        *  */

        // 逻辑运算

        nsbuiltin.defineIdentifier('and', (lh, rh) => {
            return (lh & rh) !== 0 ? 1 : 0;
        });

        nsbuiltin.defineIdentifier('or', (lh, rh) => {
            return (lh | rh) === 0 ? 0 : 1;
        });

        nsbuiltin.defineIdentifier('not', (val) => {
            return val === 0 ? 1 : 0;
        });
    }

    static addDefaultNamespace(environment) {
        let namespace = environment.createNamespace('user');
        return namespace;
    }

    getIdentifier(identifierNameOrFullName, context) {
        if (identifierNameOrFullName.indexOf('.') > 0) {
            return this.environment.getIdentifierByFullName(identifierNameOrFullName);
        } else {
            return context.getIdentifier(identifierNameOrFullName);
        }
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

export { Evaluator };