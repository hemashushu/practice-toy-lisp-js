import { strict as assert } from 'assert';

import { JsonLex, JsonParser } from '../index.js';

class TestJsonParser {
    static testObject() {
        let tokens1 = JsonLex.fromString('{"foo": "bar"}');
        let o1 = JsonParser.parse(tokens1);
        assert.deepEqual(o1, { foo: "bar" });

        let tokens2 = JsonLex.fromString('{"string": "foobar", "number": 123, "boolean": true, "null": null}');
        let o2 = JsonParser.parse(tokens2);
        assert.deepEqual(o2, { string: "foobar", number: 123, boolean: true, 'null': null });

        let tokens3 = JsonLex.fromString('{"level": 1, "child": {"level": 2, "child": {"level": 3}}}');
        let o3 = JsonParser.parse(tokens3);
        assert.deepEqual(o3, { level: 1, child: { level: 2, child: { level: 3 } } });
    }

    static testArray() {
        let tokens1 = JsonLex.fromString('["foo"]');
        let a1 = JsonParser.parse(tokens1);
        assert.deepEqual(a1, ['foo']);

        let tokens2 = JsonLex.fromString('["string", 123, true, null]');
        let a2 = JsonParser.parse(tokens2);
        assert.deepEqual(a2, ['string', 123, true, null]);

        let tokens3 = JsonLex.fromString('[1,2,[11,22,[111,222]]]');
        let a3 = JsonParser.parse(tokens3);
        assert.deepEqual(a3, [1, 2, [11, 22, [111, 222]]]);
    }

    static testObjectAndArray() {
        let tokens1 = JsonLex.fromString('{"foo":"bar", "numbers": [1,2,3]}');
        let o1 = JsonParser.parse(tokens1);
        assert.deepEqual(o1, { foo: 'bar', numbers: [1, 2, 3] });

        let tokens2 = JsonLex.fromString('[1,2,{"foo": "bar"}]');
        let a1 = JsonParser.parse(tokens2);
        assert.deepEqual(a1, [1, 2, { foo: 'bar' }]);
    }

    static testJsonParser() {
        TestJsonParser.testObject();
        TestJsonParser.testArray();
        TestJsonParser.testObjectAndArray();

        console.log('JsonParser passed.')
    }
}

export { TestJsonParser };

