import { strict as assert } from 'assert';

import { Evaluator, EvalError, SyntaxError, ContextError } from "../index.js";

class TestEvaluator {

    static testValWithLiteral() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.fromString('(val 123)'), 123);
    }

    static testVariable() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString('(let a 2)'), 2);
        assert.equal(evaluator.fromString('(val a)'), 2)
        assert.equal(evaluator.fromString('(let b (let x 5))'), 5);
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

        // cascaded/combine
        assert.equal(evaluator.fromString('(mul 2 (add 3 4))'), 14);

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

    static testFunctionError() {
        let evaluator = new Evaluator();

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

        // invoke a variable
        try {
            evaluator.fromString(
                `(let foo 2)
                (foo 1 2)`);
        } catch (err) {
            assert(err instanceof EvalError);
            assert.equal(err.code, 'NOT_A_FUNCTION');
            assert.deepEqual(err.data, { name: 'foo' });
        }
    }

    static testDo() {
        let evaluator = new Evaluator();

        // check block return value
        assert.equal(evaluator.fromString(
            `(do 7 8 9)`
        ), 9)

        // check cascaded block return value
        assert.equal(evaluator.fromString(
            `(do (do 8))`
        ), 8)

        assert.equal(evaluator.fromString(
            `(do 1 2 3 (do 4 5 6))`
        ), 6)

        // check multi expressions
        assert.equal(evaluator.fromString(
            `(do
                (let a 1)
                a
             )`
        ), 1);

        assert.equal(evaluator.fromString(
            `(do
                (let a 1)
                (let b 2)
                (add a b)
             )`
        ), 3);

        // lookup parent block variable
        assert.equal(evaluator.fromString(
            `(do
                (let m 1)
                (do
                    (let n 2)
                    (add m n)
                )
             )`
        ), 3);

        // try lookup child block variable
        try {
            evaluator.fromString(
                `(do
                    (do
                        (let i 2)
                    )
                    (val i)
                 )`
            );
        } catch (err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'i' });
        }

        // try lookup another block variable
        try {
            evaluator.fromString(
                `
                (do
                    (let i 2)
                )
                (do
                    (val i)
                )`
            );
        } catch (err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'i' });
        }

    }

    static testConditionControlFlow() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString(
            `(if (gt 2 1) 10 20)`
        ), 10);

        assert.equal(evaluator.fromString(
            `(do
                (let a 61)
                (if (gt a 90)
                    2
                    (if (gt a 60)
                        1
                        0
                    )
                )
             )`
        ), 1)
    }

    static testLoopControlFlow() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString(
            `(do
                (loop (i) (1)
                    (if (lt i 10)
                        (recur (add i 1))
                        (break i)
                    )
                )
             )`
        ), 10);

        assert.equal(evaluator.fromString(
            `(do
                (loop (i accu) (1 0)
                    (if (gt i 100)
                        (break accu)
                        (do
                            (let next (add i 1))
                            (let sum (add accu i))
                            (recur next sum)
                        )
                    )
                )
             )`
        ), 5050);
    }

    static testUserDefineFunction() {
        let evaluator = new Evaluator();

        // test define and invoke
        assert.equal(evaluator.fromString(
            `(do
                (defn five () 5)
                (five)
            )`), 5);

        assert.equal(evaluator.fromString(
            `(do
                (defn five () (val 5))
                (five)
            )`), 5);

        assert.equal(evaluator.fromString(
            `(do
                (defn plusOne (i) (add i 1))
                (plusOne 2)
            )`), 3);

        // test closure
        assert.equal(evaluator.fromString(
            `(do
                (let i 3)
                (defn inc (x) (add i x))
                (inc 2)
                )`
        ), 5);

        assert.equal(evaluator.fromString(
            `(do
                (let i 3)
                (defn inc (x) (add i x))
                (defn incAndDouble (y) (do
                    (let tmp (inc y))
                    (mul tmp y)
                    ))
                (incAndDouble 2)
                )`
        ), 10);

        // test function recursion (i.e. call function itself)
        // 1,2,3,5,8,13,21,34 (result)
        // 1 2 3 4 5 6  7  8  (index)
        assert.equal(evaluator.fromString(
            `(do
                (defn fib (i)
                    (if (eq i 1)
                        (val 1)
                        (if (eq i 2)
                            (val 2)
                            (add (fib (sub i 1)) (fib (sub i 2)))
                        )
                    ))
                (fib 8)
            )`
        ), 34);

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
                `(do
                    (let c 4)
                    (defn inner () (val c))
                    (defn outter () (do
                        (let c 9)
                        (inner)
                        ))
                    (outter)
                    )`
            ); // == 4
        } catch (err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_ALREADY_EXIST');
        }

    }

    static testAnonymousFunction() {
        let evaluator = new Evaluator();

        // test invoke anonymous function directly
        assert.equal(evaluator.fromString(
            `((fn (i) (mul i 3)) 9)`
        ), 27);

        // test assign an anonymous function to a variable
        assert.equal(evaluator.fromString(
            `(do
                (let f (fn (i) (mul i 3)))
                (f 7)
             )`
        ), 21);

        // 在普通函数里定义匿名函数
        assert.equal(evaluator.fromString(
            `(do
                (defn foo (i) (do
                    (let bar (fn () 3))
                    (add i (bar))
                    ))
                (foo 2)
                )`
        ), 5);

        // test anonymous function as return value
        assert.equal(evaluator.fromString(
            `(do
                (defn makeInc
                    (much)
                    (fn (base) (add base much))
                )

                (let incTwo (makeInc 2))
                (incTwo 6)
                )`
        ), 8);

        // test anonymous function as arg
        assert.equal(evaluator.fromString(
            `(do
                (defn execFun
                    (i f)
                    (f i)
                )
                (execFun
                    3
                    (fn (i) (mul i 2))
                )
             )`
        ), 6);

        // test loop by anonymous function recursion
        assert.equal(evaluator.fromString(
            `(do
                (defn accumulate (count) (do
                    (defn internalLoop (i result)
                        (if (eq i 0)
                            (val result)
                            (internalLoop (sub i 1) (add i result))
                        )
                    )
                    (internalLoop count 0))
                )
                (accumulate 100)
            )`
        ), 5050);

    }

    static testRecursionFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString(
            `(do
                (defnr countToTen (i)
                    (if (lt i 10)
                        (recur (add i 1))
                        (break i)
                    )
                )
                (countToTen 1)
             )`
        ), 10);

        assert.equal(evaluator.fromString(
            `(do
                (defnr sumToOneHundred (i accu)
                    (if (gt i 100)
                        (break accu)
                        (do
                            (let next (add i 1))
                            (let sum (add accu i))
                            (recur next sum)
                        )
                    )
                )
                (sumToOneHundred 1 0)
             )`
        ), 5050);
    }

    static testEvaluator() {
        TestEvaluator.testValWithLiteral();
        TestEvaluator.testVariable();
        TestEvaluator.testArithmeticOperatorFunction();
        TestEvaluator.testComparisonOperatorFunction();
        TestEvaluator.testBitwiseOperatorFunction();
        TestEvaluator.testLogicalOperatorFunction();
        TestEvaluator.testMathFunction();
        TestEvaluator.testFunctionError();
        TestEvaluator.testDo();
        TestEvaluator.testConditionControlFlow();
        TestEvaluator.testLoopControlFlow();
        TestEvaluator.testUserDefineFunction();
        TestEvaluator.testAnonymousFunction();
        TestEvaluator.testRecursionFunction();
        console.log('Evaluator passed');
    }
}

export { TestEvaluator };