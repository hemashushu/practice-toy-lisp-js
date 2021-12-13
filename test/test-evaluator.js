import { strict as assert } from 'assert';

import { Evaluator } from "../index.js";

class TestEvaluator {

    static testSimpleFunction() {
        let e = new Evaluator();

        assert.equal(e.evalFromString(
            '(debug 123)'
        ), 123);

        assert.equal(e.evalFromString(
            '(add 1 2)'
        ), 3);

        assert.equal(e.evalFromString(
            '(mul 2 (add 3 4))'
        ), 14);
    }

    static testVariable() {
        let e = new Evaluator();

        assert.equal(e.evalFromString(
            '(var a 2)'
        ), 2);

        assert.equal(e.evalFromString(
            '(debug a)'
        ), 2)

        assert.equal(e.evalFromString(
            '(var b (add 2 3))'
        ), 5);

        assert.equal(e.evalFromString(
            '(debug b)'
        ), 5);
    }

    static testEvaluator() {
        TestEvaluator.testSimpleFunction();
        TestEvaluator.testVariable();
        console.log('Evaluator passed');
    }
}

export { TestEvaluator };