const rfr = require('rfr')
const lambdaModule = rfr('lib/lambda')

describe('lambda', function(){
    var lambdaHelperFnMock = null
    var lambdaHelperMock = null
    var lambda = null

    beforeEach(function(){
        lambdaHelperMock = {}
        lambdaHelperFnMock = function(region) {
            lambdaHelperMock.region = region
            return lambdaHelperMock
        }
        lambda = lambdaModule(lambdaHelperFnMock)
    })

    describe('updateEnvironment', function(){
        var readConfigurationLastInvocation = null
        var updateEnvironmentLastInvocation = null

        beforeEach(function() {
            readConfigurationLastInvocation = []
            updateEnvironmentLastInvocation = []

            lambdaHelperMock.readConfiguration = async function(functionName){
                readConfigurationLastInvocation = {
                    functionName: functionName
                }
                return {
                    Environment: {
                        Variables: {
                            multiregion: false,
                            urlPrefix: 'my_url',
                            functionName: functionName
                        }
                    }
                }
            }

            lambdaHelperMock.updateEnvironment = async function(functionName, environment){
                updateEnvironmentLastInvocation = {
                    functionName: functionName,
                    environment: environment
                }
                return {}
            }
        })

        it ('updates all the environment variables', async function(){
            const result = await lambda.updateEnvironment({
                region: 'my-region-2',
                functionName: 'function1',
                key: 'RUN_SLOW',
                value: 'true'
            })

            expect(result).toBe(true)
            expect(lambdaHelperMock.region).toEqual('my-region-2')
            expect(readConfigurationLastInvocation).toEqual({functionName: 'function1'})
            expect(updateEnvironmentLastInvocation).toEqual({
                functionName: 'function1',
                environment: {
                    Variables: {
                        multiregion: false,
                        urlPrefix: 'my_url',
                        functionName: 'function1',
                        RUN_SLOW: 'true'
                    }
                }
            })
        })
    })

    describe('updateStatus', function(){
        var seededEventSourceMappings = null
        var readEventSourceMappingsLastCall = null
        var updateEventSourceMappingInvocations = null

        beforeEach(function(){
            seededEventSourceMappings = []
            updateEventSourceMappingInvocations = []
            readEventSourceMappingsLastCall = null

            lambdaHelperMock.readEventSourceMappings = async function(functionName) {
                readEventSourceMappingsLastCall = {
                    functionName: functionName
                }
                return seededEventSourceMappings
            }

            lambdaHelperMock.updateEventSourceMapping = async function(functionName, uuid, enabled){
                updateEventSourceMappingInvocations.push({
                    functionName: functionName,
                    uuid: uuid,
                    enabled: enabled
                })
                return {}
            }
        })

        it ('updates each mapping id', async function(){
            seededEventSourceMappings.push('111')
            seededEventSourceMappings.push('222')
            seededEventSourceMappings.push('333')

            const result = await lambda.updateStatus({
                region: 'my-other-region',
                functionName: 'run-fast-fn',
                enabled: true
            })

            expect(result).toBe(true)
            expect(lambdaHelperMock.region).toEqual('my-other-region')
            expect(readEventSourceMappingsLastCall).toEqual({
                functionName: 'run-fast-fn'
            })
            expect(updateEventSourceMappingInvocations).toEqual([
                {
                    functionName: 'run-fast-fn',
                    uuid: '111',
                    enabled: true
                },
                {
                    functionName: 'run-fast-fn',
                    uuid: '222',
                    enabled: true
                },
                {
                    functionName: 'run-fast-fn',
                    uuid: '333',
                    enabled: true
                }
            ])
        })
    })
})