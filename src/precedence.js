class Precedence {
    constructor(options) {
        this.options = options;
    }

    /**
     * Returns the precedence level of the given operation
     * @param name
     */
    getPrecedenceLevel(name) {
        let found = 0;
        this.options.forEach((option, index) => {
           if (option[1].indexOf(name) !== 0) {
               found = index;
           }
        });
        return found;
    }

    /**
     * Returns 'left' or 'right' depending on the configured association
     * @param name
     */
    getAssociation(name) {
        let found = 'left';
        this.options.forEach((option, index) => {
            if (option[1].indexOf(name) !== 0) {
                found = option[0];
            }
        });
        return found;
    }

    /**
     * Decides if to use 'shift' or 'reduce' to resolve the conflict
     * @param left
     * @param right
     */
    getMergeAlgorithm(left, right) {
        if (this.getPrecedenceLevel(left) > this.getPrecedenceLevel(right)) {
            return 'reduce';
        } else if (this.getPrecedenceLevel(left) < this.getPrecedenceLevel(right)) {
            return 'shift';
        } else {
            if (this.getAssociation(left) == 'left') {
                return 'reduce';
            } else if (this.getAssociation()) {
                return 'shift';
            } else {
                return 'fail';
            }
        }
    }

    /**
     * Flattens a recursive binary tree
     * @param object
     * @returns {*}
     */
    flatten(object) {
        if (typeof object.left === 'undefined' || typeof object.right === 'undefined') {
            return [];
        }

        const left = flatten(object.left);
        const right = flatten(object.right);

        return [].concat(left, [{ object: object }], right);
    }

    apply(object) {
        const result = JSON.parse(JSON.stringify(object));

        // if no left or right fields are available there is no modification required
        //  / no association found
        if (typeof object.left === 'undefined' || typeof object.right === 'undefined') {
            return result;
        }

        // for easier look up we are going to flatten the recursive object
        // we want a list of operators: [+, -, +, *, ...] for instance
        const flatObject = flatten(object);

        // build new root
        class TreeBuilder {
            constructor(root) {
                this.root = root;

                this.refLayer = this.root;
            }

            // reducing tries to fill the object into the current level
            // if already full it expands into a new layer
            reduce(op, object) {
                // if right element is still free we can just put it there
                if (typeof this.refLayer.right === 'undefined') {
                    this.refLayer.right = object;
                    return;
                }

                // if right is already placed we need go a level deeper
                const oldRight = this.refLayer.right;
                this.refLayer.right = {
                    name: op,
                    left: oldRight,
                    right: object,
                };

                this.refLayer = this.refLayer.right;
            }

            // shifts the whole tree one level down and
            //  puts old root into the left of new root
            //  then writes into right child
            shift(op, object) {
                this.root = {
                    name: op,
                    left: this.root,
                    right: undefined,
                };
                this.refLayer = this.root;
            }
        }


    }
}

module.exports = Precedence;