import { strict as assert } from 'assert';

import { SLex } from '../index.js';

class TestSLex {
    static testLiteral() {
        let s1 = SLex.fromString('123');
        assert.deepEqual(s1, ['123']);

        let s2 = SLex.fromString('foo');
        assert.deepEqual(s2, ['foo']);
    }

    static testList() {
        let s1 = SLex.fromString('(foo)');
        assert.deepEqual(s1, ['(', 'foo', ')']);

        let s2 = SLex.fromString('(add 123 456)');
        assert.deepEqual(s2, ['(', 'add', '123', '456', ')']);
    }

    static testCascadedList() {
        let s1 = SLex.fromString(
            '(add (mul 1 2) 3)');
        assert.deepEqual(s1, ['(',
            'add',
            '(', 'mul', '1', '2', ')',
            '3', ')']);

        let s2 = SLex.fromString(
            '(let ((a 1) (b 2)) (add a b))');
        assert.deepEqual(s2, ['(',
            'let',
            '(', '(', 'a', '1', ')',
            '(', 'b', '2', ')', ')',
            '(', 'add', 'a', 'b', ')',
            ')']);
    }

    static testSLex() {
        TestSLex.testLiteral();
        // TestSLex.testList();
        // TestSLex.testCascadedList();
        console.log('SLex passed.')
    }
}

export { TestSLex };