const rfr = require('rfr')
const elasticBeanstalkHelper = rfr('lib/elasticBeanstalk/elasticBeanstalkHelper')
const environmentStatus = rfr('lib/elasticBeanstalk/environmentStatus')

module.exports = {
    updateEnvironment: async (config) => {
        const elasticBeanstalk = elasticBeanstalkHelper(config.region)

        await environmentStatus(elasticBeanstalk).ensureReady(config.environmentName, config.timeout)
        console.log('Updating environment...')
        const updateResult = await elasticBeanstalk.updateEnvironmentSetting(config.environmentName, config.key, config.value)
        // console.log('UPDATE_RESULT', updateResult)
        await environmentStatus(elasticBeanstalk).ensureReady(config.environmentName, config.timeout)

        return true
    }
}