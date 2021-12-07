import { TestJsonLex } from './test-json-lex.js';
import { TestJsonParser } from './test-json-parser.js';

function testAll() {
    TestJsonLex.testJsonLex();
    TestJsonParser.testJsonParser();

    console.log('All passed.');
}

testAll();