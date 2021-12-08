const S_LEFT_PAREN = '(';
const S_RIGHT_PAREN = ')';

class SParser {
    static parseList(tokens) {
        let elements = [];

        if (tokens[0] === S_RIGHT_PAREN) {
            return { value: elements, restTokens: tokens.slice(1) };
        }

        while (true) {
            let { value, restTokens } = SParser.parseValue(tokens);

            elements.push(value);

            if (restTokens[0] === S_RIGHT_PAREN) {
                return { value: elements, restTokens: restTokens.slice(1) };
            }

            tokens = restTokens;
        }
    }

    static parseValue(tokens) {
        if (tokens[0] === S_LEFT_PAREN) {
            return SParser.parseList(tokens.slice(1));
        } else {
            let currentToken = tokens[0];
            let num = Number(currentToken);
            if (Number.isNaN(num)) {
                return { value: currentToken, restTokens: tokens.slice(1) };
            } else {
                return { value: num, restTokens: tokens.slice(1) };
            }
        }
    }

    static parse(tokens) {
        let {value, restTokens} = SParser.parseValue(tokens);
        return value;
    }
}

export { SParser };