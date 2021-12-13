class EvalError extends Error {
    constructor(code, data, message) {
        super(message);
        this.code = code;
        this.data = data;
    }
}

export { EvalError };