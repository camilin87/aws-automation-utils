module.exports = (rdsHelper, snoozeFn) => {
    const snoozeDefault = ms => new Promise(resolve => setTimeout(resolve, ms))
    const snooze = snoozeFn || snoozeDefault

    function isAvailable(dbInstanceInfo){
        const currentStatus = dbInstanceInfo.DBInstanceStatus
        return currentStatus === 'available'
    }

    return {
        ensureDoesNotExist: async (instanceIdentifier, maxSecondsToWait) => {
            async function instanceExistsChecker(){
                try {
                    await rdsHelper.readInstanceInfo(instanceIdentifier)
                    return true
                } catch(err){
                    return false
                }
            }

            const instanceExists = await instanceExistsChecker()
            if (instanceExists){
                throw new Error(`Instance ${instanceIdentifier} should not exist. But it does ಠ_ಠ`)
            }
        },
        ensureAvailable: async (instanceIdentifier, maxSecondsToWait) => {
            var iterations = Math.floor(maxSecondsToWait)
            var shouldWait = false
            var dbInstanceInfo = null

            console.log(`Waiting for ${instanceIdentifier} database to come up. timeout: ${maxSecondsToWait}`)

            do {
                if (shouldWait){
                    await snooze(5000)
                    process.stdout.write('.')
                }

                shouldWait = true
                iterations--
                dbInstanceInfo = await rdsHelper.readInstanceInfo(instanceIdentifier)
            } while(!isAvailable(dbInstanceInfo) && iterations > 0)

            const result = isAvailable(dbInstanceInfo)
            console.log('')
            console.log(`Database ${instanceIdentifier} available: ${result}`)

            if (!result){
                throw new Error(`Instance ${instanceIdentifier} must be in an 'available' status. Status: ${dbInstanceInfo.DBInstanceStatus}`)
            }
        }
    }
}