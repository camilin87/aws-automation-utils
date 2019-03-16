const rfr = require('rfr')
const rdsModule = rfr('lib/rds')

describe('rds', function(){
    var rdsHelperMock = null
    var instanceStatusMock = null
    var rds = null

    beforeEach(function(){
        const nameGeneratorFnMock = function () {
            return {
                create: (dbPrefix) => `db-${dbPrefix}`
            }
        }

        rdsHelperMock = {}
        const rdsHelperFnMock = function(region){
            rdsHelperMock.region = region
            return rdsHelperMock
        }

        instanceStatusMock = {}
        const instanceStatusFnMock = function(rdsHelper){
            instanceStatusMock.rdsHelper = rdsHelper
            return instanceStatusMock
        }

        rds = rdsModule(rdsHelperFnMock, instanceStatusFnMock, nameGeneratorFnMock)
    })

    describe('restore', function(){
        var mockInvocations = null

        beforeEach(function(){
            mockInvocations = []

            instanceStatusMock.ensureAvailable = async function(dbIdentifier, timeout){
                mockInvocations.push({
                    id: 'ensureAvailable',
                    dbIdentifier: dbIdentifier,
                    timeout: timeout
                })
                return {}
            }

            instanceStatusMock.ensureDoesNotExist = async function(dbIdentifier) {
                mockInvocations.push({
                    id: 'ensureDoesNotExist',
                    dbIdentifier: dbIdentifier
                })
                return {}
            }

            rdsHelperMock.readInstanceInfo = async function(dbIdentifier){
                mockInvocations.push({
                    id: 'readInstanceInfo',
                    dbIdentifier: dbIdentifier
                })
                return {
                    Engine: 'SQL-Expensive',
                    LicenseModel: 'included',
                    StorageType: 'SSD'
                }
            }
            rdsHelperMock.readMostRecentSnapshot = async function(dbIdentifier){
                mockInvocations.push({
                    id: 'readMostRecentSnapshot',
                    dbIdentifier: dbIdentifier
                })
                return {
                    DBSnapshotIdentifier: `snp-${dbIdentifier}`
                }
            }
            rdsHelperMock.restoreSnapshot = async function(info){
                mockInvocations.push({
                    id: 'restoreSnapshot',
                    info: info
                })
                return {}
            }
        })

        it ('returns false when disabled in config', async function(){
            const result = await rds.restore({
                enabled: false
            })

            expect(result).toBe(false)
        })

        it ('restores the most recent backup', async function(){
            const result = await rds.restore({
                enabled: true,
                timeout: 14,
                prod: {
                    dbIdentifier: 'my-prod-db'
                },
                dev: {
                    databasePrefix: 'dev-db',
                    availabilityZone: 'us-aaa',
                    instanceClass: 'large',
                    multiAZ: false,
                    publiclyAccessible: true,
                    securityGroups: ['sg-123abc', 'sg-gggg'],
                    tags: ['tag1', 'tag2']
                }
            })

            expect(mockInvocations).toEqual([
                { id: 'readInstanceInfo', dbIdentifier: 'my-prod-db' },
                { id: 'ensureAvailable', dbIdentifier: 'my-prod-db', timeout: 14 },
                { id: 'readMostRecentSnapshot', dbIdentifier: 'my-prod-db' },
                { id: 'ensureDoesNotExist', dbIdentifier: 'db-dev-db' },
                { id: 'restoreSnapshot', info: {
                    DBInstanceIdentifier: 'db-dev-db',
                    DBSnapshotIdentifier: 'snp-my-prod-db',
                    AvailabilityZone: 'us-aaa',
                    DBInstanceClass: 'large',
                    Engine: 'SQL-Expensive',
                    LicenseModel: 'included',
                    MultiAZ: false,
                    PubliclyAccessible: true,
                    StorageType: 'SSD',
                    VpcSecurityGroupIds: ['sg-123abc', 'sg-gggg'],
                    Tags: ['tag1', 'tag2']
                }},
                { id: 'ensureAvailable', dbIdentifier: 'db-dev-db', timeout: 14 },
                { id: 'readInstanceInfo', dbIdentifier: 'db-dev-db' }
            ])
        })
    })
})