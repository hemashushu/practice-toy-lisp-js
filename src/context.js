class Context {
    constructor() {
        this.records = new Map();
    }

    set(name, value) {
        if (this.records.has(name)) {
            throw new Error(`Variable "${name}" has already exists`);
        }

        this.records.set(name, value);
        return value;
    }

    get(name) {
        let value = this.records.get(name);
        if (value === undefined) {
            throw new Error(`Variable "${name}" not found`);
        }
        return value;
    }
}

export { Context };