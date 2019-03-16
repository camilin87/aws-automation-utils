const rfr = require('rfr')
const environmentStatusModule = rfr('lib/elasticBeanstalk/environmentStatus')

describe('environmentStatus', function(){
    var snoozeInvocations = null
    var snoozeFnMock = null
    var elasticBeanstalkHelperMock = null
    var environmentStatus = null

    beforeEach(function(){
        elasticBeanstalkHelperMock = {}

        snoozeInvocations = []
        snoozeFnMock = async function(ms) {
            snoozeInvocations.push(ms)
        }

        environmentStatus = environmentStatusModule(elasticBeanstalkHelperMock, snoozeFnMock)
    })

    describe('ensureReady', function(){
        it('waits for environment to be ready', async function(){
            var readEnvironmentInfoCallCount = 0
            elasticBeanstalkHelperMock.readEnvironmentInfo = async function(environmentName) {
                readEnvironmentInfoCallCount++
                const result = {
                    Status: 'Waiting'
                }

                if (readEnvironmentInfoCallCount > 5){
                    result.Status = 'Ready'
                }

                return result
            }

            await environmentStatus.ensureReady('prod', 10)

            expect(readEnvironmentInfoCallCount).toBe(6)
            expect(snoozeInvocations).toEqual([5000, 5000, 5000, 5000, 5000])
        })

        it('fails when environmet is not ready in the specified time', async function(){
            elasticBeanstalkHelperMock.readEnvironmentInfo = async function(environmentName) {
                return {
                    Status: 'Waiting'
                }
            }

            var thrownError = null
            try{
                await environmentStatus.ensureReady('prod', 10)
            } catch (e){
                thrownError = e
            }

            expect(snoozeInvocations).toEqual([5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000])
            expect(thrownError).toEqual(new Error("Environment prod must be in a 'Ready' status. Status: Waiting"))
        })
    })
})
