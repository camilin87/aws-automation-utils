const rfr = require('rfr')
const rdsModule = rfr('lib/rds')

describe('rds', function(){
    var rdsHelperMock = null
    var instanceStatusMock = null
    var rds = null
    var mockInvocations = null

    beforeEach(function(){
        mockInvocations = []

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

        instanceStatusMock = {
            ensureAvailable: async function(dbIdentifier, timeout){
                mockInvocations.push({
                    id: 'ensureAvailable',
                    dbIdentifier: dbIdentifier,
                    timeout: timeout
                })
                return {}
            },
            ensureDoesNotExist: async function(dbIdentifier) {
                mockInvocations.push({
                    id: 'ensureDoesNotExist',
                    dbIdentifier: dbIdentifier
                })
                return {}
            }
        }

        const instanceStatusFnMock = function(rdsHelper){
            instanceStatusMock.rdsHelper = rdsHelper
            return instanceStatusMock
        }

        rds = rdsModule(rdsHelperFnMock, instanceStatusFnMock, nameGeneratorFnMock)
    })

    describe('restore', function(){
        beforeEach(function(){
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
                region: 'indonesia',
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

            expect(result).toBe('db-dev-db')
            expect(rdsHelperMock.region).toBe('indonesia')
            expect(instanceStatusMock.rdsHelper).toBe(rdsHelperMock)
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

    describe('updatePassword', function(){
        beforeEach(function(){
            rdsHelperMock.setMasterPassword = async function(dbIdentifier, password){
                mockInvocations.push({
                    id: 'setMasterPassword',
                    dbIdentifier: dbIdentifier,
                    password: password
                })
                return {}
            }
        })

        it ('returns false when disabled in config', async function(){
            const result = await rds.updatePassword({enabled: false})
            expect(result).toBe(false)
        })

        it ('updates the password', async function (){
            const result = await rds.updatePassword({
                enabled: true,
                region: 'malasya',
                dbIdentifier: 'my-super-db',
                timeout: 25,
                password: 'secret1'
            })

            expect(result).toBe(true)
            expect(rdsHelperMock.region).toBe('malasya')
            expect(instanceStatusMock.rdsHelper).toBe(rdsHelperMock)
            expect(mockInvocations).toEqual([
                { id: 'ensureAvailable', dbIdentifier: 'my-super-db', timeout: 25 },
                { id: 'setMasterPassword', dbIdentifier: 'my-super-db', password: 'secret1' },
                { id: 'ensureAvailable', dbIdentifier: 'my-super-db', timeout: 25 }
            ])
        })
    })

    describe('deleteOlder', function(){
        beforeEach(function(){
            rdsHelperMock.readAllInstanceIdentifiers = async function(databasePrefix) {
                mockInvocations.push({
                    id: 'readAllInstanceIdentifiers',
                    databasePrefix: databasePrefix
                })

                return [
                    `${databasePrefix}-1`,
                    `${databasePrefix}-2`,
                    `${databasePrefix}-3`,
                    `${databasePrefix}-4`
                ]
            }

            rdsHelperMock.deleteInstance = async function(dbIdentifier) {
                mockInvocations.push({
                    id: 'deleteInstance',
                    dbIdentifier: dbIdentifier
                })
                return {}
            }
        })

        it ('returns false when disabled in config', async function(){
            const result = await rds.deleteOlder({enabled: false})
            expect(result).toBe(false)
        })

        it ('deletes the older instances', async function(){
            const result = await rds.deleteOlder({
                enabled: true,
                region: 'japan-1',
                databasePrefix: 'dev'
            })

            expect(result).toBe(true)
            expect(rdsHelperMock.region).toBe('japan-1')
            expect(mockInvocations).toEqual([
                { id: 'readAllInstanceIdentifiers', databasePrefix: 'dev' },
                { id: 'deleteInstance', dbIdentifier: 'dev-3' },
                { id: 'deleteInstance', dbIdentifier: 'dev-2' },
                { id: 'deleteInstance', dbIdentifier: 'dev-1' }
            ])
        })
    })
})