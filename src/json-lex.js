/* JSON 文本示例:
{
    "null": null,
    "number": 123,
    "float": 3.14,
    "boolean": true,
    "string": "foo",
    "list": [1,2,3],
    "object": {"id": 456, "name": "bar"}
}
*/

// 实现参考自：
// https://notes.eatonphil.com/writing-a-simple-json-parser.html

const JSON_COMMA = ',';
const JSON_COLON = ':';
const JSON_LEFT_BRACKET = '[';   // 中括号, Square brackets, brackets
const JSON_RIGHT_BRACKET = ']';
const JSON_LEFT_BRACE = '{';     // 大括号/花括号, Curly brackets, braces
const JSON_RIGHT_BRACE = '}';
const JSON_QUOTE = '"';

// JSON 不使用的符号:
//
// * 圆括号（Round brackets, paren/parentheses）
// * 尖括号（Angle brackets, chevrons ）

const JSON_KEYWORDS = [
    JSON_COMMA,
    JSON_COLON,
    JSON_LEFT_BRACKET,
    JSON_RIGHT_BRACKET,
    JSON_LEFT_BRACE,
    JSON_RIGHT_BRACE
];

const JSON_WHITESPACE = [' ', '\t', '\n', '\r'];

const JSON_FALSE = 'false';
const JSON_TRUE = 'true';
const JSON_NULL = 'null';

// JavaScript 的转义字符：
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences

const JSON_ESCAPE_SEQUENCES = {
    '0': '\0',
    '\'': '\'',
    '"': '"',
    '\\': '\\',
    'n': '\n',
    'r': '\r',
    'v': '\v',
    't': '\t',
    'b': '\b',
    'f': '\f',
};

// 其他转义字符：
//
// \uXXXX: XXXX = 0000..FFFF
// \u{X} ... \u{XXXXXX}: XXXXXX = 0..10FFFF
// \xXX: XX = 00..FF

const JSON_NUMBER = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'e'];

class JsonLex {
    static fromString(str) {
        let tokens = [];
        while (str.length > 0) {
            // lex json string
            let { jsonString, restString: restAfterString } = JsonLex.lexString(str);
            if (jsonString !== undefined) {
                tokens.push(jsonString);
                str = restAfterString;
                continue;
            }

            // lex json number
            let { jsonNumber, restString: restAfterNumber } = JsonLex.lexNumber(str);
            if (jsonNumber !== undefined) {
                tokens.push(jsonNumber);
                str = restAfterNumber;
                continue;
            }

            // lex json boolean
            let { jsonBoolean, restString: restAfterBoolean } = JsonLex.lexBoolean(str);
            if (jsonBoolean !== undefined) {
                tokens.push(jsonBoolean);
                str = restAfterBoolean;
                continue;
            }

            // lex json null
            let { jsonNull, restString: restAfterNull } = JsonLex.lexNull(str);
            if (jsonNull !== undefined) {
                tokens.push(jsonNull);
                str = restAfterNull;
                continue;
            }

            // lex json whitespace, keywords
            if (JsonLex.oneOf(str[0], JSON_WHITESPACE)) {
                str = str.slice(1);
            } else if (JsonLex.oneOf(str[0], JSON_KEYWORDS)) {
                tokens.push(str[0])
                str = str.slice(1);
            } else {
                throw new Error(`Invalid char ${str[0]}`);
            }
        }

        return tokens;
    }

    static lexString(str) {
        if (str[0] === JSON_QUOTE) {
            for (let idx = 1; idx < str.length; idx++) {
                let nextChar = str[idx];
                if (nextChar === JSON_QUOTE && str[idx - 1] !== '\\') {
                    let jsonString = str.substring(1, idx);
                    let restString = str.substring(idx + 1);
                    jsonString = JsonLex.unescapeJsonString(jsonString);
                    return { jsonString, restString };
                }
            }
        }
        return { jsonString: undefined, restString: str };
    }

    static lexNumber(str) {
        let idx = 0
        for (; idx < str.length; idx++) {
            let char = str[idx];
            if (!JsonLex.oneOf(char, JSON_NUMBER)) {
                break;
            }
        }

        if (idx > 0) {
            let numberString = str.substring(0, idx);
            let num = Number(numberString);
            if (!Number.isNaN(num)) {
                let jsonNumber = num;
                let restString = str.substring(idx);
                return { jsonNumber, restString };
            }
        }

        return { jsonNumber: undefined, restString: str };
    }

    static lexBoolean(str) {
        if (str.length >= JSON_TRUE.length &&
            str.substring(0, JSON_TRUE.length) === JSON_TRUE) {
            let jsonBoolean = true;
            let restString = str.substring(JSON_TRUE.length);
            return { jsonBoolean, restString };
        } else if (str.length >= JSON_FALSE.length &&
            str.substring(0, JSON_FALSE.length) === JSON_FALSE) {
            let jsonBoolean = false;
            let restString = str.substring(JSON_FALSE.length);
            return { jsonBoolean, restString };
        }
        return { jsonBoolean: undefined, restString: str };
    }

    static lexNull(str) {
        if (str.length >= JSON_NULL.length &&
            str.substring(0, JSON_NULL.length) === JSON_NULL) {
            let jsonNull = null;
            let restString = str.substring(JSON_NULL.length);
            return { jsonNull, restString };
        }
        return { jsonNull: undefined, restString: str };
    }

    static oneOf(char, array) {
        return array.includes(char);
    }

    static unescapeJsonString(jsonString) {
        // TODO:: unescape the escaped chars
        return jsonString;
    }
}

export { JsonLex };