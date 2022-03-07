import { TestSLex } from './test-s-lex.js';
import { TestSParser } from './test-s-parser.js';
import { TestEvaluator } from './test-evaluator.js';

function testAll() {
    TestSLex.testSLex();
    TestSParser.testSParser();
    TestEvaluator.testEvaluator();
    console.log('All passed.');
}

testAll();