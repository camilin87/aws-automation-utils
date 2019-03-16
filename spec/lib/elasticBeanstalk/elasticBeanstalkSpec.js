const rfr = require('rfr')
const elasticBeanstalkModule = rfr('lib/elasticBeanstalk')

describe('elasticBeanstalk', function(){
    var elasticBeanstalkHelperMock = null
    var environmentStatusMock = null
    var elasticBeanstalk = null

    beforeEach(function(){
        elasticBeanstalkHelperMock = {}
        var elasticBeanstalkHelperFnMock = function(region){
            elasticBeanstalkHelperMock.region = region
            return elasticBeanstalkHelperMock
        }

        environmentStatusMock = {}
        var environmentStatusFnMock = function(environment){
            environmentStatusMock.environment = environment
            return environmentStatusMock
        }

        elasticBeanstalk = elasticBeanstalkModule(elasticBeanstalkHelperFnMock, environmentStatusFnMock)
    })

    describe('updateEnvironment', function(){
        var invocations = null

        beforeEach(function(){
            invocations = []

            elasticBeanstalkHelperMock.updateEnvironmentSetting = async function(environmentName, key, value){
                invocations.push({
                    id: 'updateEnvironmentSetting',
                    environmentName: environmentName,
                    key: key,
                    value: value
                })
                return {}
            }

            environmentStatusMock.ensureReady = async function(environmentName, timeout){
                invocations.push({
                    id: 'ensureReady',
                    environmentName: environmentName,
                    timeout: timeout
                })
                return {}
            }
        })

        it ('updates environment, making sure the environment is ready', async function(){
            const result = await elasticBeanstalk.updateEnvironment({
                region: 'the-far-east',
                environmentName: 'prod',
                timeout: 25000,
                key: 'RUN_FAST',
                value: 'true'
            })

            expect(result).toBe(true)
            expect(elasticBeanstalkHelperMock.region).toBe('the-far-east')
            expect(environmentStatusMock.environment).toBe(elasticBeanstalkHelperMock)
            expect(invocations).toEqual([
                { id: 'ensureReady', environmentName: 'prod', timeout: 25000 },
                { id: 'updateEnvironmentSetting', environmentName: 'prod', key: 'RUN_FAST', value: 'true'},
                { id: 'ensureReady', environmentName: 'prod', timeout: 25000 }
            ])
        })
    })
})