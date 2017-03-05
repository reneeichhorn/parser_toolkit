class Workflows {
    constructor() {
        this.workflows = {};
    }

    createWorkflow(workflowName) {
        this.workflows[workflowName] = {
            name: workflowName,
            flow: [],
        };

        return {
            single(name, params, returns) {
                this.workflows[name].flow.push({
                    name,
                    params,
                    returns,
                    type: 'single',
                });
            },

            looped(name, params, returns) {
                this.workflows[name].flow.push({
                    name,
                    params,
                    returns,
                    type: 'looped',
                });
            },
        }
    }
}

module.exports = Workflows;