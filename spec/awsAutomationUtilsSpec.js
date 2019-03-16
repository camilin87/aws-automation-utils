const rfr = require('rfr')
const awsAutomationUtils = rfr('index')

describe('aws-automation-utils', function(){
    it ('exports rds functions', function(){
        var rds = awsAutomationUtils.rds

        expect(rds.restore).not.toBeNull()
        expect(rds.updatePassword).not.toBeNull()
        expect(rds.deleteOlder).not.toBeNull()
    })

    it ('exports elasticBeanstalk functions', function(){
        var elasticBeanstalk = awsAutomationUtils.elasticBeanstalk

        expect(elasticBeanstalk.updateEnvironment).not.toBeNull()
    })

    it ('exports lambda functions', function(){
        var lambda = awsAutomationUtils.lambda

        expect(lambda.updateEnvironment).not.toBeNull()
        expect(lambda.updateStatus).not.toBeNull()
        expect(lambda.updateConcurrency).not.toBeNull()
    })
})