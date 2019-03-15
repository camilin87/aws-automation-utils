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
})