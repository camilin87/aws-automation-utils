module.exports = function(elasticBeanstalkHelperFn, environmentStatusFn){
    if (!elasticBeanstalkHelperFn){
        elasticBeanstalkHelperFn = require('./elasticBeanstalkHelper')
    }

    if (!environmentStatusFn){
        environmentStatusFn = require('./environmentStatus')
    }

    return {
        updateEnvironment: async (config) => {
            const elasticBeanstalk = elasticBeanstalkHelperFn(config.region)

            await environmentStatusFn(elasticBeanstalk).ensureReady(config.environmentName, config.timeout)
            console.log('Updating environment...')
            const updateResult = await elasticBeanstalk.updateEnvironmentSetting(config.environmentName, config.key, config.value)
            // console.log('UPDATE_RESULT', updateResult)
            await environmentStatusFn(elasticBeanstalk).ensureReady(config.environmentName, config.timeout)

            return true
        }
    }
}