import { TestJsonLex } from './test-json-lex.js';
import { TestJsonParser } from './test-json-parser.js';
import { TestSLex } from './test-s-lex.js';
import { TestSParser } from './test-s-parser.js';

function testAll() {
    // TestJsonLex.testJsonLex();
    // TestJsonParser.testJsonParser();
    TestSLex.testSLex();
    TestSParser.testSParser();

    console.log('All passed.');
}

testAll();