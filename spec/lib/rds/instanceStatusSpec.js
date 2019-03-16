const rfr = require('rfr')
const instanceStatusModule = rfr('lib/rds/instanceStatus')

describe('instanceStatus', function(){
    var snoozeInvocations = null
    var snoozeFnMock = null
    var rdsHelperMock = null
    var instanceStatus = null

    beforeEach(function(){
        rdsHelperMock = {}

        snoozeInvocations = []
        snoozeFnMock = async function(ms) {
            snoozeInvocations.push(ms)
        }

        instanceStatus = instanceStatusModule(rdsHelperMock, snoozeFnMock)
    })

    describe('ensureDoesNotExist', function(){
        it('does not fail when instance is does not exist', async function(){
            var readInstanceId = null
            rdsHelperMock.readInstanceInfo = async function(instanceId) {
                readInstanceId = instanceId
                throw new Error('instance not found')
            }

            await instanceStatus.ensureDoesNotExist('prod', 10)

            expect(readInstanceId).toBe('prod')
        })

        it ('fails when instance exists', async function(){
            rdsHelperMock.readInstanceInfo = async function(instanceId) {
                return {
                    DBInstanceStatus: 'pending'
                }
            }

            var thrownException = null
            try{
                await instanceStatus.ensureDoesNotExist('prod', 10)
            } catch (e){
                thrownException = e
            }

            expect(thrownException).toEqual(new Error('Instance prod should not exist. But it does ಠ_ಠ'))
        })
    })

    describe('ensureAvailable', function(){
        it('waits for instance to be available', async function(){
            var readInstanceInfoCallCount = 0
            var readInstanceId
            rdsHelperMock.readInstanceInfo = async function(instanceId) {
                readInstanceId = instanceId
                readInstanceInfoCallCount++
                const result = {
                    DBInstanceStatus: 'creating'
                }

                if (readInstanceInfoCallCount > 5){
                    result.DBInstanceStatus = 'available'
                }

                return result
            }

            await instanceStatus.ensureAvailable('prod', 10)

            expect(readInstanceId).toBe('prod')
            expect(readInstanceInfoCallCount).toBe(6)
            expect(snoozeInvocations).toEqual([5000, 5000, 5000, 5000, 5000])
        })

        it ('fails when instance is not available in the specified time', async function(){
            rdsHelperMock.readInstanceInfo = async function(instanceId) {
                return {
                    DBInstanceStatus: 'creating'
                }
            }

            var thrownException = null
            try{
                await instanceStatus.ensureAvailable('prod', 10)
            } catch (e){
                thrownException = e
            }

            expect(thrownException).toEqual(new Error('Instance prod must be in an \'available\' status. Status: creating'))
        })
    })
})