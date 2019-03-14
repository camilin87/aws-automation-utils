const AWS = require('aws-sdk')

module.exports = (region) => {
    function createLambdaClient(){
        AWS.config.update({region: region})
        return new AWS.Lambda()
    }

    return {
        readConfiguration: async (functionName) => {
            const lambda = createLambdaClient()
            const result = await lambda.getFunctionConfiguration({
                FunctionName: functionName
            }).promise()
            return result
        },
        updateEnvironment: async (functionName, environment) => {
            const lambda = createLambdaClient()
            const result = await lambda.updateFunctionConfiguration({
                FunctionName: functionName,
                Environment: environment
            }).promise()
            return result
        },
        removeConcurrencyLimit: async (functionName) => {
            const lambda = createLambdaClient()
            const result = await lambda.deleteFunctionConcurrency({
                FunctionName: functionName
            }).promise()
            return result
        },
        configureConcurrencyLimit: async (functionName, limit) => {
            const lambda = createLambdaClient()
            const result = await lambda.putFunctionConcurrency({
                FunctionName: functionName,
                ReservedConcurrentExecutions: limit
            }).promise()
            return result
        },
        readEventSourceMappings: async (functionName) => {
            const lambda = createLambdaClient()
            const evenSourceListResult = await lambda.listEventSourceMappings({
                FunctionName: functionName,
            }).promise()
            return evenSourceListResult.EventSourceMappings.map(m => m.UUID)
        },
        updateEventSourceMapping: async (functionName, mappingId, enabled) => {
            const lambda = createLambdaClient()
            const result = await lambda.updateEventSourceMapping({
                FunctionName: functionName,
                UUID: mappingId,
                Enabled: enabled
            }).promise()
            return result
        }
    }
}