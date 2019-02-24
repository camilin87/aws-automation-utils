const AWS = require('aws-sdk')

module.exports = (region) => {
    function sortRdsSnapshot(a, b) {
        return a.SnapshotCreateTime > b.SnapshotCreateTime ? -1 : 1
    }

    function createRdsClient(){
        AWS.config.update({region: region})
        return new AWS.RDS()
    }

    return {
        readInstanceInfo: async (instanceIdentifier) => {
            const rds = createRdsClient()

            var dbInstances = await rds.describeDBInstances({
                DBInstanceIdentifier: instanceIdentifier
            }).promise()

            return dbInstances.DBInstances[0]
        },
        readMostRecentSnapshot: async (instanceIdentifier) => {
            const rds = createRdsClient()

            const dbSnapshots = await rds.describeDBSnapshots({
                DBInstanceIdentifier: instanceIdentifier
            }).promise()

            if (dbSnapshots.DBSnapshots.length === 0){
                throw new Error('No snapshots found')
            }

            return dbSnapshots.DBSnapshots.sort(sortRdsSnapshot)[0]
        },
        restoreSnapshot: async (requestInfo) => {
            const rds = createRdsClient()
            const result = await rds.restoreDBInstanceFromDBSnapshot(requestInfo)
                .promise()
            return result
        },
        setMasterPassword: async (instanceIdentifier, password) => {
            const rds = createRdsClient()
            const result = await rds.modifyDBInstance({
                DBInstanceIdentifier: instanceIdentifier,
                MasterUserPassword: password,
                ApplyImmediately: true
            }).promise()
            return result
        },
        readAllInstanceIdentifiers: async (prefix) => {
            const rds = createRdsClient()

            const allInstancesData = await rds.describeDBInstances({}).promise()
            const allInstanceIds = allInstancesData.DBInstances.map(i => i.DBInstanceIdentifier)

            if (prefix){
                return allInstanceIds.filter(id => id.startsWith(prefix))
            }

            return allInstanceIds
        },
        deleteInstance: async (instanceIdentifier) => {
            const rds = createRdsClient()

            return await rds.deleteDBInstance({
                DBInstanceIdentifier: instanceIdentifier,
                DeleteAutomatedBackups: true,
                SkipFinalSnapshot: true
            }).promise()
        }
    }
}