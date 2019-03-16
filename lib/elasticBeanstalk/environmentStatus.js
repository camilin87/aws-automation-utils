module.exports = (elasticBeanstalkHelper, snoozeFn) => {
    function isReady(environmentInfo){
        return environmentInfo.Status === 'Ready'
    }

    const snoozeDefault = ms => new Promise(resolve => setTimeout(resolve, ms))
    var snooze = snoozeFn || snoozeDefault

    return {
        ensureReady: async (environmentName, maxSecondsToWait) => {
            var iterations = Math.floor(maxSecondsToWait)
            var shouldWait = false
            var environmentInfo = null

            console.log(`Waiting for ${environmentName} environment to be ready. timeout: ${maxSecondsToWait}`)

            do {
                if (shouldWait){
                    await snooze(5000)
                    process.stdout.write('.')
                }

                shouldWait = true
                iterations--
                environmentInfo = await elasticBeanstalkHelper.readEnvironmentInfo(environmentName)
            } while(!isReady(environmentInfo) && iterations > 0)

            const result = isReady(environmentInfo)
            console.log('')
            console.log(`Environment ${environmentName} ready: ${result}`)

            if (!result){
                throw new Error(`Environment ${environmentName} must be in a 'Ready' status. Status: ${environmentInfo.Status}`)
            }
        }
    }
}