import { SLex } from './s-lex.js';
import { SParser } from './s-parser.js';
import { Context } from './context.js';

class Evaluator {
    constructor(context = new Context) {
        this.initialContext = context;
    }

    evalFromString(exp, context = this.initialContext) {
        let tokens = SLex.fromString(exp);
        let list = SParser.parse(tokens);
        return this.eval(list, context);
    }

    eval(list, context = this.initialContext) {
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

        /**
         * 基本函数
         *
         * - debug 读取字面量或者标识符的值
         * - add 加
         * - mul 减
         */
        let op = list[0];

        if (op === 'debug') {
            return this.eval(list[1]);
        }

        if (op === 'add') {
            return this.eval(list[1]) + this.eval(list[2]);
        }

        if (op === 'mul') {
            return this.eval(list[1]) * this.eval(list[2]);
        }

        /**
         * 标识符的定义
         *
         * (var identifier-name value)
         */
        if (op === 'var') {
            return context.set(
                list[1],
                this.eval(list[2]));
        }

        throw new Error(`Not implement: "${op}"`);
    }

    static isNumber(element) {
        return typeof element === 'number';
    }

    static isIdentifier(element) {
        return typeof element === 'string';
    }
}

export { Evaluator };