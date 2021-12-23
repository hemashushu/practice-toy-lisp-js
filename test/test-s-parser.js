import { strict as assert } from 'assert';

import { SLex, SParser } from '../index.js';

class TestSParser {
    static testLiteral() {
        let token1 = SLex.fromString('123');
        let a1 = SParser.parse(token1);
        assert.deepEqual(a1, 123);

        let token2 = SLex.fromString('foo');
        let a2 = SParser.parse(token2);
        assert.deepEqual(a2, 'foo');
    }

    static testSimpleList() {
        let token1 = SLex.fromString('(foo)');
        let a1 = SParser.parse(token1);
        assert.deepEqual(a1, ['foo']);

        let token2 = SLex.fromString('(add 123 456)');
        let a2 = SParser.parse(token2);
        assert.deepEqual(a2, ['add', 123, 456]);
    }

    static testCascadedList() {
        let token1 = SLex.fromString(
            '(add (mul 1 2) 3)');
        let a1 = SParser.parse(token1);

        assert.deepEqual(a1, ['add', ['mul', 1, 2], 3]);

        let token2 = SLex.fromString(
            '(let ((a 1) (b 2)) (add a b))');
        let a2 = SParser.parse(token2);

        assert.deepEqual(a2, ['let',
            [['a', 1], ['b', 2]],
            ['add', 'a', 'b']
        ]);

    }

    static testSParser() {
        TestSParser.testLiteral();
        TestSParser.testSimpleList();
        TestSParser.testCascadedList();

        console.log('SParser passed.')
    }
}

export { TestSParser };

