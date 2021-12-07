const JSON_COMMA = ',';
const JSON_COLON = ':';
const JSON_LEFT_BRACKET = '[';   // 中括号, Square brackets, brackets
const JSON_RIGHT_BRACKET = ']';
const JSON_LEFT_BRACE = '{';     // 大括号/花括号, Curly brackets, braces
const JSON_RIGHT_BRACE = '}';
const JSON_QUOTE = '"';

// JSON 不使用:
//
// * 圆括号（Round brackets, paren/parentheses）
// * 尖括号（Angle brackets, chevrons ）

class JsonParser {
    static parseObject(tokens) {
        let jsonObject = {};

        if (tokens[0] === JSON_RIGHT_BRACE) {
            return { value: jsonObject, restTokens: tokens.slice(1) };
        }

        while (true) {
            let key = tokens[0];
            if (typeof key !== 'string') {
                throw new Error(`Invalid object key: ${key}`);
            }

            if (tokens[1] !== JSON_COLON) {
                throw new Error(`Expect colon after key: ${key}`);
            }

            let { value, restTokens } = JsonParser.parseValue(tokens.slice(2));

            jsonObject[key] = value;

            if (restTokens[0] === JSON_RIGHT_BRACE) {
                return { value: jsonObject, restTokens: restTokens.slice(1) };
            }

            if (restTokens[0] !== JSON_COMMA) {
                throw new Error(`Except comma after key-value pair: ${key}`);
            }

            tokens = restTokens.slice(1);
        }
    }

    static parseArray(tokens) {
        let jsonArray = [];

        if (tokens[0] === JSON_RIGHT_BRACKET) {
            return { value: jsonArray, restTokens: tokens.slice(1) };
        }

        while (true) {
            let { value, restTokens } = JsonParser.parseValue(tokens);

            jsonArray.push(value);

            if (restTokens[0] === JSON_RIGHT_BRACKET) {
                return { value: jsonArray, restTokens: restTokens.slice(1) };
            }

            if (restTokens[0] !== JSON_COMMA) {
                throw new Error(`Except comma after array element: ${value}`);
            }

            tokens = restTokens.slice(1);
        }
    }

    static parseValue(tokens) {
        if (tokens[0] === JSON_LEFT_BRACE) {
            return JsonParser.parseObject(tokens.slice(1));
        } else if (tokens[0] === JSON_LEFT_BRACKET) {
            return JsonParser.parseArray(tokens.slice(1));
        } else {
            return { value: tokens[0], restTokens: tokens.slice(1) };
        }
    }

    static parse(tokens) {
        let { value, restTokens } = JsonParser.parseValue(tokens);
        return value;
    }
}

export { JsonParser };