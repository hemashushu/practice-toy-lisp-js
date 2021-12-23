/* S 表达式文本示例：
(add 1 2)
(add 1 (div 4 2))
(if -1
    (print 33)
    (print 34)
    )
*/

const S_LEFT_PAREN = '(';
const S_RIGHT_PAREN = ')';

const S_KEYWORDS = [
    S_LEFT_PAREN,
    S_RIGHT_PAREN,
];

const S_WHITESPACE = [' ', '\t', '\n', '\r'];

// const S_NUMBER = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'e'];

class SLex {
    static fromString(str) {
        let tokens = [];
        while (str.length > 0) {
            if (SLex.oneOf(str[0], S_WHITESPACE)) {
                str = str.slice(1);
                continue;
            }

            if (SLex.oneOf(str[0], S_KEYWORDS)) {
                tokens.push(str[0]);
                str = str.slice(1);
                continue;
            }

            // s symbol
            let { sSymbol, restString: restAfterSymbol } = SLex.lexSymbol(str);
            if (sSymbol !== undefined) {
                tokens.push(sSymbol);
                str = restAfterSymbol;
                continue;
            }

            throw new Error(`Invalid char ${str[0]}`);
        }

        return tokens;
    }

    static lexSymbol(str) {
        for (let idx = 0; idx < str.length; idx++) {
            let nextChar = str[idx];
            if (SLex.oneOf(nextChar, S_WHITESPACE) ||
                nextChar === S_RIGHT_PAREN) {
                let sSymbol = str.substring(0, idx);
                let restString = str.substring(idx);
                return { sSymbol, restString };
            }
        }

        return { sSymbol: str, restString: '' };
    }

    static oneOf(char, array) {
        return array.includes(char);
    }
}

export { SLex };