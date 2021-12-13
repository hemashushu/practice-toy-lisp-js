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
        assert.equal(evaluator.fromString('(rem 10 4)'), 2);
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

        assert.equal(evaluator.fromString('(lshift 3 5)'), 3 << 5);
        assert.equal(evaluator.fromString('(lshift -3 5)'), -3 << 5);

        assert.equal(evaluator.fromString('(rshift 3 5)'), 3 >> 5);
        assert.equal(evaluator.fromString('(rshift -3 5)'), -3 >> 5);

        assert.equal(evaluator.fromString('(lrshift 3 5)'), 3 >>> 5);
        assert.equal(evaluator.fromString('(lrshift -3 5)'), -3 >>> 5);
    }

    static testFunction() {
        let evaluator = new Evaluator();

        // cascaded function
        assert.equal(evaluator.fromString('(mul 2 (add 3 4))'), 14);

        // incorrent number of parameters
        try {
            evaluator.fromString('(add 1)');
        } catch (err) {
            assert(err instanceof SyntaxError);
            assert.equal(err.code, 'INCORRECT_NUMBER_OF_PARAMETERS');
            assert.deepEqual(err.data, { name: 'add', actual: 2, expect: 3 });
        }

        // call non-exist function
        try {
            evaluator.fromString('(noThisFunction)');
        } catch (err) {
            assert(err instanceof EvalError);
            assert.equal(err.code, 'FUNC_NOT_FOUND');
            assert.deepEqual(err.data, { name: 'noThisFunction' });
        }

    }

    static testVariable() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString('(var a 2)'), 2);
        assert.equal(evaluator.fromString('(val a)'), 2)
        assert.equal(evaluator.fromString('(var b (add 2 3))'), 5);
        assert.equal(evaluator.fromString('(val b)'), 5);

        try {
            evaluator.fromString('(var b 1)');
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

    static testBlock() {
        let evaluator = new Evaluator();

        // check the `block` function
        assert.equal(evaluator.fromString(
            `(begin
                (var a 1)
                (var b 2)
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
                        (var i 2))
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
                (var m 1)
                (begin
                    (var n 2)
                    (add m n)
                    )
                )`
        ), 3);

    }

    static testConditionControlFlow() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString(
            `(if (gt 2 1) (val 100) (val 200))`
        ), 100);

    }

    static testEvaluator() {
        TestEvaluator.testValFunction();
        TestEvaluator.testArithmeticOperatorFunction();
        TestEvaluator.testComparisonOperatorFunction();
        TestEvaluator.testLogicalOperatorFunction();
        TestEvaluator.testBitwiseOperatorFunction();
        TestEvaluator.testFunction();
        TestEvaluator.testVariable();
        TestEvaluator.testBlock();
        // TestEvaluator.testConditionControlFlow();
        console.log('Evaluator passed');
    }
}

export { TestEvaluator };