import { strict as assert } from 'assert';

import { Evaluator, EvalError, SyntaxError, ContextError } from "../index.js";

class TestEvaluator {

    static testValFunction() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(val 123)'), 123);
    }

    static testArithmeticOperatorFunction() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(add 1 2)'), 3);
        assert.equal(evaluator.fromString('(sub 1 2)'), -1);
        assert.equal(evaluator.fromString('(sub 3 1)'), 2);
        assert.equal(evaluator.fromString('(mul 2 3)'), 6);
        assert.equal(evaluator.fromString('(div 6 2)'), 3);
        assert.equal(evaluator.fromString('(div 1 2)'), 0.5);
        assert.equal(evaluator.fromString('(div -6 2)'), -3);
        assert.equal(evaluator.fromString('(rem 10 4)'), 2);
        assert.equal(evaluator.fromString('(rem -10 4)'), -2);
    }

    static testComparisonOperatorFunction() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(eq 2 3)'), 0);
        assert.equal(evaluator.fromString('(eq 2 2)'), -1);
        assert.equal(evaluator.fromString('(gt 2 3)'), 0);
        assert.equal(evaluator.fromString('(gt 3 2)'), -1);
        assert.equal(evaluator.fromString('(gte 2 3)'), 0);
        assert.equal(evaluator.fromString('(gte 2 2)'), -1);
        assert.equal(evaluator.fromString('(gte 2 1)'), -1);
        assert.equal(evaluator.fromString('(lt 3 2)'), 0);
        assert.equal(evaluator.fromString('(lt 2 3)'), -1);
        assert.equal(evaluator.fromString('(lte 2 1)'), 0);
        assert.equal(evaluator.fromString('(lte 2 2)'), -1);
        assert.equal(evaluator.fromString('(lte 2 3)'), -1);
    }

    static testBitwiseOperatorFunction() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(bit_and 3 5)'), 3 & 5);
        assert.equal(evaluator.fromString('(bit_and -7 9)'), -7 & 9);

        assert.equal(evaluator.fromString('(bit_or 3 5)'), 3 | 5);
        assert.equal(evaluator.fromString('(bit_or -7 9)'), -7 | 9);

        assert.equal(evaluator.fromString('(bit_xor 3 5)'), 3 ^ 5);
        assert.equal(evaluator.fromString('(bit_xor -7 9)'), -7 ^ 9);

        assert.equal(evaluator.fromString('(bit_not 3)'), ~3);
        assert.equal(evaluator.fromString('(bit_not -7)'), ~(-7));

        assert.equal(evaluator.fromString('(shift_left 3 5)'), 3 << 5);
        assert.equal(evaluator.fromString('(shift_left -3 5)'), -3 << 5);

        assert.equal(evaluator.fromString('(shift_right 3 5)'), 3 >> 5);
        assert.equal(evaluator.fromString('(shift_right -3 5)'), -3 >> 5);

        assert.equal(evaluator.fromString('(shift_right_u 3 5)'), 3 >>> 5);
        assert.equal(evaluator.fromString('(shift_right_u -3 5)'), -3 >>> 5);
    }

    static testLogicalOperatorFunction() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(and 0 0)'), 0);
        assert.equal(evaluator.fromString('(and 0 -1)'), 0);
        assert.equal(evaluator.fromString('(and -1 -1)'), -1);

        assert.equal(evaluator.fromString('(or 0 0)'), 0);
        assert.equal(evaluator.fromString('(or 0 -1)'), -1);
        assert.equal(evaluator.fromString('(or -1 -1)'), -1);

        assert.equal(evaluator.fromString('(not 0)'), -1);
        assert.equal(evaluator.fromString('(not -1)'), 0);
    }

    static testMathFunction() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(abs 2.7)'), 2.7);
        assert.equal(evaluator.fromString('(abs -2.7)'), 2.7);
        assert.equal(evaluator.fromString('(neg 2.7)'), -2.7);
        assert.equal(evaluator.fromString('(neg -2.7)'), 2.7);
        assert.equal(evaluator.fromString('(ceil 2.7)'), 3);
        assert.equal(evaluator.fromString('(ceil -2.7)'), -2);
        assert.equal(evaluator.fromString('(floor 2.7)'), 2);
        assert.equal(evaluator.fromString('(floor -2.7)'), -3);
        assert.equal(evaluator.fromString('(trunc 2.7)'), 2);
        assert.equal(evaluator.fromString('(trunc -2.7)'), -2);
        assert.equal(evaluator.fromString('(round 2.7)'), 3);
        assert.equal(evaluator.fromString('(round -2.7)'), -3);
        assert.equal(evaluator.fromString('(sqrt 9.0)'), 3.0);
    }

    static testVariable() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString('(let a 2)'), 2);
        assert.equal(evaluator.fromString('(val a)'), 2)
        assert.equal(evaluator.fromString('(let b (add 2 3))'), 5);
        assert.equal(evaluator.fromString('(val b)'), 5);

        try {
            evaluator.fromString('(let b 1)');
        } catch (err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_ALREADY_EXIST');
            assert.deepEqual(err.data, { name: 'b' });
        }

        try {
            evaluator.fromString('(val c)');
        } catch (err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'c' });
        }
    }

    static testNativeFunction() {
        let evaluator = new Evaluator();

        // cascaded function
        assert.equal(evaluator.fromString('(mul 2 (add 3 4))'), 14);

        // incorrent number of parameters
        try {
            evaluator.fromString('(add 1)');
        } catch (err) {
            assert(err instanceof SyntaxError);
            assert.equal(err.code, 'INCORRECT_NUMBER_OF_PARAMETERS');
            assert.deepEqual(err.data, { name: 'add', actual: 1, expect: 2 });
        }

        // call non-exist function
        try {
            evaluator.fromString('(noThisFunction)');
        } catch (err) {
            assert(err instanceof EvalError);
            assert.equal(err.code, 'ID_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'noThisFunction' });
        }

        // call a variable
        try {
            evaluator.fromString(`(begin
                (let foo 2)
                (foo 1 2))`);
        } catch (err) {
            assert(err instanceof EvalError);
            assert.equal(err.code, 'NOT_A_FUNCTION');
            assert.deepEqual(err.data, { name: 'foo' });
        }
    }

    static testBlock() {
        let evaluator = new Evaluator();

        // check the `block` function
        assert.equal(evaluator.fromString(
            `(begin
                (let a 1)
                (let b 2)
                (add a b))`
        ), 3);

        // check the return value of block
        assert.equal(evaluator.fromString(
            `(val (begin (val 10)))`
        ), 10);

        // try lookup child block variable
        try {
            evaluator.fromString(
                `(begin
                    (begin
                        (let i 2))
                    (val i))`
            );
        } catch (err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'i' });
        }

        // lookup parent block variable
        assert.equal(evaluator.fromString(
            `(begin
                (let m 1)
                (begin
                    (let n 2)
                    (add m n)
                    )
                )`
        ), 3);

    }

    static testConditionControlFlow() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString(
            `(if (gt 2 1) (val 10) (val 20))`
        ), 10);

        assert.equal(evaluator.fromString(
            `(begin
                (let a 61)
                (if (gt a 90)
                    (val 2)
                    (if (gt a 60)
                        (val 1)
                        (val 0)
                    )
                )
             )`
        ), 1)
    }

    static testDefineFunction() {
        let evaluator = new Evaluator();

        // test define and invoke
        assert.equal(evaluator.fromString(
            `(begin
                (def five () (val 5))
                (five)
            )`), 5);

        assert.equal(evaluator.fromString(
            `(begin
                (def plusOne (i) (add i 1))
                (plusOne 2)
            )`), 3);

        // test closure
        assert.equal(evaluator.fromString(
            `(begin
                (let i 3)
                (def inc (x) (add i x))
                (inc 2)
                )`
        ), 5);

        // test cascaded closure
        assert.equal(evaluator.fromString(
            `(begin
                (let i 3)
                (def inc (x) (add i x))
                (def incAndDouble (y) (begin
                    (let tmp (inc y))
                    (mul tmp y)
                    ))
                (incAndDouble 2)
                )`
        ), 10);

        // test function in function
        assert.equal(evaluator.fromString(
            `(begin
                (def foo (i) (begin
                    (def bar () (val 3))
                    (let j (bar))
                    (add i j)
                    ))
                (foo 2)
                )`
        ), 5);

        // test function as return value
        assert.equal(evaluator.fromString(
            `(begin
                (def makeInc (much) (begin
                    (def inc (base) (add base much))
                    (val inc)
                    ))

                (let incTwo (makeInc 2))
                (incTwo 6)
                )`
        ), 8);

        // test static function context/environment
        // 运行环境具有继承关系，但
        // `inner` 里面的 `c` 应该指向 最外面的 `c`，
        // 而不是 `outter` 里面定义的 `c`，
        // 所以程序的结果应该是 4 而不是 9。
        // 这种特性称为函数的静态上下文/环境。
        //
        // 注：
        // 因为当前规范约定不允许同范围内的同名标识符，所以这个程序
        // 实际上会引起运行时异常。

        try {
            evaluator.fromString(
                `(begin
                    (let c 4)
                    (def inner () (val c))
                    (def outter () (begin
                        (let c 9)
                        (inner)
                        ))
                    (outter)
                    )`
            ); // == 4
        }catch(err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_ALREADY_EXIST');
        }

    }

    static testEvaluator() {
        TestEvaluator.testValFunction();
        TestEvaluator.testArithmeticOperatorFunction();
        TestEvaluator.testComparisonOperatorFunction();
        TestEvaluator.testBitwiseOperatorFunction();
        TestEvaluator.testLogicalOperatorFunction();
        TestEvaluator.testMathFunction();
        TestEvaluator.testNativeFunction();
        TestEvaluator.testVariable();
        TestEvaluator.testBlock();
        TestEvaluator.testConditionControlFlow();
        TestEvaluator.testDefineFunction();
        console.log('Evaluator passed');
    }
}

export { TestEvaluator };