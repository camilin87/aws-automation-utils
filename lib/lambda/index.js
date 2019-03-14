const lambdaHelper = require('./lambdaHelper')

module.exports = {
    updateEnvironment: async (config) => {
        var result = false
        try{
            const lambda = lambdaHelper(config.region)

            const functionConfiguration = await lambda.readConfiguration(config.functionName)
            functionConfiguration.Environment.Variables[config.key] = config.value

            const updateResult = await lambda.updateEnvironment(config.functionName, functionConfiguration.Environment)
            // console.log('UPDATE_RESULT', updateResult)
            result = true
            return result
        } finally {
            console.log(`Update Environment Completed; functionName: ${config.functionName}; key: ${config.key}; value: ${config.value} result: ${result}`)
        }
    },
    updateStatus: async (config) => {
        var result = false
        try{
            const lambda = lambdaHelper(config.region)

            const mappingIds = await lambda.readEventSourceMappings(config.functionName)
            for (var i = 0; i < mappingIds.length; i++) {
                const uuid = mappingIds[i]

                const updateResult = await lambda.updateEventSourceMapping(config.functionName, uuid, config.enabled)
                // console.log(`Update Completed uuid: ${uuid}; result:`, updateResult)
            }

            result = true
            return result
        } finally {
            console.log(`Update Status Completed; functionName: ${config.functionName}; enabled: ${config.enabled}; result: ${result}`)
        }
    },
    updateConcurrency: async (config) => {
        var result = false
        try{
            const lambda = lambdaHelper(config.region)

            if (config.concurrency){
                const updateConcurrencyResult = await lambda.configureConcurrencyLimit(config.functionName, config.concurrency)
                // console.log('updateConcurrencyResult', updateConcurrencyResult)
            } else {
                const updateConcurrencyResult = await lambda.removeConcurrencyLimit(config.functionName)
                // console.log('updateConcurrencyResult', updateConcurrencyResult)
            }

            result = true
            return result
        } finally {
            console.log(`Update Concurrency Completed; functionName: ${config.functionName}; concurrency: ${config.concurrency}; result: ${result}`)
        }
    }
}