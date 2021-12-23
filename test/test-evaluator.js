import { strict as assert } from 'assert';

import {
    Evaluator,
    EvalError,
    SyntaxError,
    IdentifierError
} from "../index.js";

/**
 * Evaluator 实例创建后，默认在 `user` namespace 之中，
 * 测试环境里支持在 `namespace` 里直接调用函数以及执行 `do`，`if`，`loop` 等基本表达式。
 */
class TestEvaluator {

    static testValWithLiteral() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(builtin.val 123)'), 123);
    }

    static testArithmeticOperatorFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(native.i64.add 1 2)'), 3);
        assert.equal(evaluator.evalFromString('(native.i64.sub 1 2)'), -1);
        assert.equal(evaluator.evalFromString('(native.i64.sub 3 1)'), 2);
        assert.equal(evaluator.evalFromString('(native.i64.mul 2 3)'), 6);
        assert.equal(evaluator.evalFromString('(native.i64.div_s 6 2)'), 3);
        assert.equal(evaluator.evalFromString('(native.i64.div_s 1 2)'), 0.5);
        assert.equal(evaluator.evalFromString('(native.i64.div_s -6 2)'), -3);
        assert.equal(evaluator.evalFromString('(native.i64.rem_s 10 4)'), 2);
        assert.equal(evaluator.evalFromString('(native.i64.rem_s -10 4)'), -2);
    }

    static testBitwiseOperatorFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(native.i64.and 3 5)'), 3 & 5);
        assert.equal(evaluator.evalFromString('(native.i64.and -7 9)'), -7 & 9);

        assert.equal(evaluator.evalFromString('(native.i64.or 3 5)'), 3 | 5);
        assert.equal(evaluator.evalFromString('(native.i64.or -7 9)'), -7 | 9);

        assert.equal(evaluator.evalFromString('(native.i64.xor 3 5)'), 3 ^ 5);
        assert.equal(evaluator.evalFromString('(native.i64.xor -7 9)'), -7 ^ 9);

        assert.equal(evaluator.evalFromString('(native.i64.shl 3 5)'), 3 << 5);
        assert.equal(evaluator.evalFromString('(native.i64.shl -3 5)'), -3 << 5);

        assert.equal(evaluator.evalFromString('(native.i64.shr_s 3 5)'), 3 >> 5);
        assert.equal(evaluator.evalFromString('(native.i64.shr_s -3 5)'), -3 >> 5);

        assert.equal(evaluator.evalFromString('(native.i64.shr_u 3 5)'), 3 >>> 5);
        assert.equal(evaluator.evalFromString('(native.i64.shr_u -3 5)'), -3 >>> 5);
    }

    static testComparisonOperatorFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(native.i64.eq 2 3)'), 0);
        assert.equal(evaluator.evalFromString('(native.i64.eq 2 2)'), 1);

        assert.equal(evaluator.evalFromString('(native.i64.ne 2 3)'), 1);
        assert.equal(evaluator.evalFromString('(native.i64.ne 2 2)'), 0);

        assert.equal(evaluator.evalFromString('(native.i64.lt_s 3 2)'), 0);
        assert.equal(evaluator.evalFromString('(native.i64.lt_s 2 3)'), 1);

        assert.equal(evaluator.evalFromString('(native.i64.gt_s 2 3)'), 0);
        assert.equal(evaluator.evalFromString('(native.i64.gt_s 3 2)'), 1);

        assert.equal(evaluator.evalFromString('(native.i64.le_s 2 1)'), 0);
        assert.equal(evaluator.evalFromString('(native.i64.le_s 2 2)'), 1);
        assert.equal(evaluator.evalFromString('(native.i64.le_s 2 3)'), 1);

        assert.equal(evaluator.evalFromString('(native.i64.ge_s 2 3)'), 0);
        assert.equal(evaluator.evalFromString('(native.i64.ge_s 2 2)'), 1);
        assert.equal(evaluator.evalFromString('(native.i64.ge_s 2 1)'), 1);
    }

    static testMathFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(native.f64.abs 2.7)'), 2.7);
        assert.equal(evaluator.evalFromString('(native.f64.abs -2.7)'), 2.7);
        assert.equal(evaluator.evalFromString('(native.f64.neg 2.7)'), -2.7);
        assert.equal(evaluator.evalFromString('(native.f64.neg -2.7)'), 2.7);
        assert.equal(evaluator.evalFromString('(native.f64.ceil 2.7)'), 3);
        assert.equal(evaluator.evalFromString('(native.f64.ceil -2.7)'), -2);
        assert.equal(evaluator.evalFromString('(native.f64.floor 2.7)'), 2);
        assert.equal(evaluator.evalFromString('(native.f64.floor -2.7)'), -3);
        assert.equal(evaluator.evalFromString('(native.f64.trunc 2.7)'), 2);
        assert.equal(evaluator.evalFromString('(native.f64.trunc -2.7)'), -2);
        assert.equal(evaluator.evalFromString('(native.f64.nearest 2.7)'), 3);
        assert.equal(evaluator.evalFromString('(native.f64.nearest -2.7)'), -3);
        assert.equal(evaluator.evalFromString('(native.f64.sqrt 9.0)'), 3.0);
    }

    static testBuiltinFunctionsLogicalOperator() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(builtin.and 0 0)'), 0);
        assert.equal(evaluator.evalFromString('(builtin.and 0 1)'), 0);
        assert.equal(evaluator.evalFromString('(builtin.and 1 1)'), 1);

        assert.equal(evaluator.evalFromString('(builtin.or 0 0)'), 0);
        assert.equal(evaluator.evalFromString('(builtin.or 0 1)'), 1);
        assert.equal(evaluator.evalFromString('(builtin.or 1 1)'), 1);

        assert.equal(evaluator.evalFromString('(builtin.not 0)'), 1);
        assert.equal(evaluator.evalFromString('(builtin.not 1)'), 0);
    }

    static testConstant() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString('(const a 2)'), 2);
        assert.equal(evaluator.evalFromString('(builtin.val a)'), 2)
        assert.equal(evaluator.evalFromString('(const b 5))'), 5);
        assert.equal(evaluator.evalFromString('(builtin.val user.b)'), 5); // 默认命名空间是 `user`

        try {
            evaluator.evalFromString('(const b 1)');
        } catch (err) {
            assert(err instanceof IdentifierError);
            assert.equal(err.code, 'IDENTIFIER_ALREADY_EXIST');
            assert.deepEqual(err.data, { name: 'b' });
        }

        try {
            evaluator.evalFromString('(builtin.val c)');
        } catch (err) {
            assert(err instanceof IdentifierError);
            assert.equal(err.code, 'IDENTIFIER_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'c' });
        }

    }

    static testNamespace() {
        let evaluator = new Evaluator();

        evaluator.evalFromString('(const a 1)'); // 默认命名空间是 `user`
        evaluator.evalFromString('(namespace foo (const a 10))');
        evaluator.evalFromString('(namespace foo.bar (const a 100))');

        assert.equal(evaluator.evalFromString('(builtin.val a)'), 1)
        assert.equal(evaluator.evalFromString('(builtin.val user.a)'), 1)
        assert.equal(evaluator.evalFromString('(builtin.val foo.a)'), 10)
        assert.equal(evaluator.evalFromString('(builtin.val foo.bar.a)'), 100)
    }

    static testDo() {
        let evaluator = new Evaluator();

        // check block return value
        assert.equal(evaluator.evalFromString(
            `(do 7 8 9)`
        ), 9)

        // check cascaded block return value
        assert.equal(evaluator.evalFromString(
            `(do (do 8))`
        ), 8)

        assert.equal(evaluator.evalFromString(
            `(do 1 2 3 (do 4 5 6))`
        ), 6)

        // check multi expressions
        assert.equal(evaluator.evalFromString(
            `(do
                (let a 1)
                a
             )`
        ), 1);

        assert.equal(evaluator.evalFromString(
            `(do
                (let a 1)
                (let b 2)
                (native.i64.add a b)
             )`
        ), 3);

        // lookup parent block variable
        assert.equal(evaluator.evalFromString(
            `(do
                (let m 1)
                (do
                    (let n 2)
                    (native.i64.add m n)
                )
             )`
        ), 3);

        // try lookup child block variable
        try {
            evaluator.evalFromString(
                `(do
                    (do
                        (let i 2)
                    )
                    (builtin.val i)
                 )`
            );
        } catch (err) {
            assert(err instanceof IdentifierError);
            assert.equal(err.code, 'IDENTIFIER_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'i' });
        }

        // try lookup another block variable
        try {
            evaluator.evalFromString(
                `
                (do
                    (let i 2)
                )
                (do
                    (builtin.val i)
                )`
            );
        } catch (err) {
            assert(err instanceof IdentifierError);
            assert.equal(err.code, 'IDENTIFIER_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'i' });
        }

    }

    static testVariable() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString(
            `(do
                (let a 2)
                (set a 3)
             )`
        ), 3);

        assert.equal(evaluator.evalFromString(
            `(do
                (let a 2)
                (set a 3)
                (builtin.val a)
             )`
        ), 3);

        // 设置父有效域的变量的值
        assert.equal(evaluator.evalFromString(
            `(do
                (let a 2)
                (do
                    (set a 3)
                )
                (builtin.val a)
             )`
        ), 3);

        try {
            evaluator.evalFromString(
                `(do
                    (let a 2)
                    (set c 3)
                 )`
            );
        } catch (err) {
            assert(err instanceof IdentifierError);
            assert.equal(err.code, 'IDENTIFIER_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'c' });
        }

        try {
            evaluator.evalFromString(
                `(do
                    (let a 2)
                    (do
                        (let b 3)
                    )
                    (set b 3)
                 )`
            );
        } catch (err) {
            assert(err instanceof IdentifierError);
            assert.equal(err.code, 'IDENTIFIER_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'b' });
        }
    }

    static testConditionControlFlow() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString(
            `(if (native.i64.gt_s 2 1) 10 20)`
        ), 10);

        assert.equal(evaluator.evalFromString(
            `(do
                (let a 61)
                (if (native.i64.gt_s a 90)
                    2
                    (if (native.i64.gt_s a 60)
                        1
                        0
                    )
                )
             )`
        ), 1)
    }

    static testLoopControlFlow() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromString(
            `(do
                (loop (i) (1)
                    (if (native.i64.lt_s i 10)
                        (recur (native.i64.add i 1))
                        (break i)
                    )
                )
             )`
        ), 10);

        assert.equal(evaluator.evalFromString(
            `(do
                (loop (i accu) (1 0)
                    (if (native.i64.gt_s i 100)
                        (break accu)
                        (do
                            (let next (native.i64.add i 1))
                            (let sum (native.i64.add accu i))
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
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn five1 () 5)
            (five1)`
        ), 5);

        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn five2 () (builtin.val 5))
            (five2)`
        ), 5);

        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn plusOne (i) (native.i64.add i 1))
            (plusOne 2)`
        ), 3);

        // test lookup constant
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (const THREE 3)
            (defn inc (x) (native.i64.add THREE x))
            (inc 2)`
        ), 5);

        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn incAndDouble (y) (do
                (let tmp (inc y))
                (native.i64.mul tmp y)
                )
            )
            (incAndDouble 2)`
        ), 10);

        // test function recursion (i.e. call function itself)
        // 1,2,3,5,8,13,21,34 (result)
        // 1 2 3 4 5 6  7  8  (index)
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn fib (i)
                (if (native.i64.eq i 1)
                    (builtin.val 1)
                    (if (native.i64.eq i 2)
                        (builtin.val 2)
                        (native.i64.add (fib (native.i64.sub i 1)) (fib (native.i64.sub i 2)))
                    )
                )
            )
            (fib 8)`
        ), 34);
    }

    static testAnonymousFunction() {
        let evaluator = new Evaluator();

        // test invoke anonymous function directly
        assert.equal(evaluator.evalFromString(
            `((fn (i) (native.i64.mul i 3)) 9)`
        ), 27);

        // test assign an anonymous function to a variable
        assert.equal(evaluator.evalFromString(
            `
            (do
                (let f (fn (i) (native.i64.mul i 3)))
                (f 7)
            )`
        ), 21);

        // 在普通函数里定义匿名函数
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn foo (i)
                (do
                    (let bar (fn () 3))
                    (native.i64.add i (bar))
                )
            )
            (foo 2)`
        ), 5);

        // test anonymous function as return value
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn makeInc
                (much)
                (fn (base) (native.i64.add base much))
            )

            (do
                (let incTwo (makeInc 2))
                (incTwo 6)
            )`
        ), 8);

        // test anonymous function as arg
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn execFun
                (i f)
                (f i)
            )
            (execFun
                3
                (fn (i) (native.i64.mul i 2))
            )`
        ), 6);

        // test loop by anonymous function recursion
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn accumulate (count)
                (do
                    (let internalLoop
                        (fn (i result)
                            (if (native.i64.eq i 0)
                                (builtin.val result)
                                (internalLoop (native.i64.sub i 1) (native.i64.add i result))
                            )
                        )
                    )
                    (internalLoop count 0)
                )
            )
            (accumulate 100)
            `
        ), 5050);

    }

    static testRecursionFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defnr countToTen (i)
                (if (native.i64.lt_s i 10)
                    (recur (native.i64.add i 1))
                    (break i)
                )
            )
            (countToTen 1)`
        ), 10);

        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defnr sumToOneHundred (i accu)
                (if (native.i64.gt_s i 100)
                    (break accu)
                    (do
                        (let next (native.i64.add i 1))
                        (let sum (native.i64.add accu i))
                        (recur next sum)
                    )
                )
            )
            (sumToOneHundred 1 0)`
        ), 5050);
    }

    static testFunctionError() {
        let evaluator = new Evaluator();

        // incorrent number of parameters
        try {
            evaluator.evalFromString('(native.i64.add 1)');
        } catch (err) {
            assert(err instanceof SyntaxError);
            assert.equal(err.code, 'INCORRECT_NUMBER_OF_PARAMETERS');
            assert.deepEqual(err.data, { name: 'native.i64.add', actual: 1, expect: 2 });
        }

        // call non-exist function
        try {
            evaluator.evalFromString('(noThisFunction)');
        } catch (err) {
            assert(err instanceof EvalError);
            assert.equal(err.code, 'IDENTIFIER_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'noThisFunction' });
        }

        // invoke a variable
        evaluator.evalFromString(`(const foo 2)`);

        try {
            evaluator.evalFromString(`(foo 1 2)`);
        } catch (err) {
            assert(err instanceof EvalError);
            assert.equal(err.code, 'IDENTIFIER_NOT_A_FUNCTION');
            assert.deepEqual(err.data, { name: 'foo' });
        }
    }

    static testEvaluator() {
        TestEvaluator.testValWithLiteral();

        TestEvaluator.testArithmeticOperatorFunction();
        TestEvaluator.testBitwiseOperatorFunction();
        TestEvaluator.testComparisonOperatorFunction();
        TestEvaluator.testMathFunction();
        TestEvaluator.testBuiltinFunctionsLogicalOperator();

        TestEvaluator.testConstant();
        TestEvaluator.testNamespace();
        TestEvaluator.testDo();
        TestEvaluator.testVariable();

        TestEvaluator.testConditionControlFlow();
        TestEvaluator.testLoopControlFlow();

        TestEvaluator.testUserDefineFunction();
        TestEvaluator.testAnonymousFunction();
        TestEvaluator.testRecursionFunction();
        TestEvaluator.testFunctionError();

        console.log('Evaluator passed');
    }
}

export { TestEvaluator };