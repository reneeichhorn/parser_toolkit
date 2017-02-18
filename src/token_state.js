class TokenStateManager {
    constructor() {
        this.states = {};
    }

    getState(tokenIndex, targetGrammar) {
        if (typeof this.states[targetGrammar] === 'undefined') {
            this.states[targetGrammar] = {};
        }
        if (typeof this.states[targetGrammar][tokenIndex] === 'undefined') {
            this.states[targetGrammar][tokenIndex] = 'good';
        }

        return {
            isBlocked: () => {
                return this.states[targetGrammar][tokenIndex] == 'blocked';
            },

            isProcessing: () => {
                return this.states[targetGrammar][tokenIndex] == 'processing';
            },

            isGood: () => {
                return this.states[targetGrammar][tokenIndex] == 'good';
            },

            setProcessing: () => {
                this.states[targetGrammar][tokenIndex] = 'processing';
            },

            setBlocked: () => {
                this.states[targetGrammar][tokenIndex] = 'blocked';
            },

            reset: () => {
                this.states[targetGrammar][tokenIndex] = 'good';
            }
        }
    }
}

module.exports = TokenStateManager;