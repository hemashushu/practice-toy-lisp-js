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
         * - val 读取字面量或者标识符的值
         * - add 加
         * - mul 减
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

        if (op === 'mul') {
            if (list.length !== 3) {
                throw new SyntaxError('INCORRECT_NUMBER_OF_PARAMETERS',
                    { name: 'mul', actual: list.length, expect: 3 },
                    `Incorrect number of parameters for function: "${op}"`);
            }
            return this.eval(list[1], context) * this.eval(list[2], context);
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