import { strict as assert } from 'assert';

import { Evaluator, EvalError, SyntaxError, ContextError } from "../index.js";

class TestEvaluator {

    static testFunction() {
        let evaluator = new Evaluator();

        assert.equal(evaluator.fromString(
            '(val 123)'
        ), 123);

        assert.equal(evaluator.fromString(
            '(add 1 2)'
        ), 3);

        assert.equal(evaluator.fromString(
            '(mul 2 (add 3 4))'
        ), 14);

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

        assert.equal(evaluator.fromString(
            '(var a 2)'
        ), 2);

        assert.equal(evaluator.fromString(
            '(val a)'
        ), 2)

        assert.equal(evaluator.fromString(
            '(var b (add 2 3))'
        ), 5);

        assert.equal(evaluator.fromString(
            '(val b)'
        ), 5);

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
        let e = new Evaluator();

        // check the `block` function
        assert.equal(e.fromString(
            `(begin
                (var a 1)
                (var b 2)
                (add a b))`
        ), 3);

        // check the return value of block
        assert.equal(e.fromString(
            `(val (begin (val 10)))`
        ), 10);

        // try lookup child block variable
        try {
            e.fromString(
                `(begin
                    (begin
                        (var i 2))
                    (val i))`
            );
        }catch(err) {
            assert(err instanceof ContextError);
            assert.equal(err.code, 'ID_NOT_FOUND');
            assert.deepEqual(err.data, {name: 'i'});
        }

        // lookup parent block variable
        assert.equal(e.fromString(
            `(begin
                (var m 1)
                (begin
                    (var n 2)
                    (add m n)
                    )
                )`
        ), 3);

    }

    static testEvaluator() {
        TestEvaluator.testFunction();
        TestEvaluator.testVariable();
        TestEvaluator.testBlock();
        console.log('Evaluator passed');
    }
}

export { TestEvaluator };