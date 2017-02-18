class LogBuffer {
    constructor() {
        this.buffer = '';
    }

    appendLine(msg) {
        this.buffer += msg + '\n';
    }

    toString() {
        return this.buffer;
    }
}

class ParserLogger {
    constructor(buffer = new LogBuffer()) {
        this.buffer = buffer;
        this.level = 0;
    }

    writeLine(message) {
        let levelAppend = '';
        for (let i = 0; i < this.level; i++) {
            levelAppend += '\t';
        }
        this.buffer.appendLine(levelAppend + message);
    }

    nextLevel() {
        this.level++;
    }

    previousLevel() {
        this.level--;
    }

    toString() {
        return this.buffer.toString();
    }
}

module.exports = ParserLogger;