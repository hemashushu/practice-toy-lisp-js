import { strict as assert } from 'assert';

import { JsonLex } from '../index.js';

class TestJsonLex {
    static testString() {
        let o = JsonLex.fromString('{"foo": "bar"}');
        assert.deepEqual(o, ['{', 'foo', ':', 'bar', '}']);
    }

    static testStringWithEscapeQuote() {
        let o = JsonLex.fromString('{"fo\\"o": "ba\\"r"}');
        assert.deepEqual(o, ['{', 'fo\\"o', ':', 'ba\\"r', '}']);
    }

    static testNumber() {
        let n1 = JsonLex.fromString('{"foo": 123}');
        assert.deepEqual(n1, ['{', 'foo', ':', 123, '}']);

        let n2 = JsonLex.fromString('{"foo": -99}');
        assert.deepEqual(n2, ['{', 'foo', ':', -99, '}']);

        let n3 = JsonLex.fromString('{"foo": 3.14}');
        assert.deepEqual(n3, ['{', 'foo', ':', 3.14, '}']);

        let n4 = JsonLex.fromString('{"foo": 2.7e2}');
        assert.deepEqual(n4, ['{', 'foo', ':', 2.7e2, '}']);
    }

    static testBoolean() {
        let b1 = JsonLex.fromString('{"foo": true}');
        assert.deepEqual(b1, ['{', 'foo', ':', true, '}']);

        let b2 = JsonLex.fromString('{"foo": false}');
        assert.deepEqual(b2, ['{', 'foo', ':', false, '}']);
    }

    static testNull() {
        let n = JsonLex.fromString('{"foo": null}');
        assert.deepEqual(n, ['{', 'foo', ':', null, '}']);
    }

    static testArray() {
        let a = JsonLex.fromString('["foo", 123, true, null, {"hello":"world"}]');
        assert.deepEqual(a, [
            '[', 'foo', ',', 123, ',', true, ',', null, ',', '{', 'hello', ':', 'world', '}', ']'
        ]);
    }

    static testJsonLex() {
        TestJsonLex.testString();
        TestJsonLex.testStringWithEscapeQuote();
        TestJsonLex.testNumber();
        TestJsonLex.testBoolean();
        TestJsonLex.testNull();
        TestJsonLex.testArray();

        console.log('JsonLex passed.');
    }
}

export { TestJsonLex };

