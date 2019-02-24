const rfr = require('rfr')
const rdsHelper = rfr('lib/rds/rdsHelper')
const instanceStatus = rfr('lib/rds/instanceStatus')
const nameGenerator = rfr('lib/rds/nameGenerator')

module.exports = {
    restore: async (config) => {
        console.log('Restore Starting...', config)

        if (!config.enabled){
            console.log('Restore Disabled. Finishing early.')
            return false
        }

        const rds = rdsHelper(config.region)
        const dbInstanceDataProd = await rds.readInstanceInfo(config.prod.dbIdentifier)
        await instanceStatus(rds).ensureAvailable(config.prod.dbIdentifier, config.timeout)
        // console.log('DBInstance Prod:', dbInstanceDataProd)

        const mostRecentSnapshot = await rds.readMostRecentSnapshot(config.prod.dbIdentifier)
        const mostRecentSnapshotId = mostRecentSnapshot.DBSnapshotIdentifier
        console.log('Most Recent Snapshot Id', mostRecentSnapshotId)

        const newInstanceName = nameGenerator()
            .create(config.dev.databasePrefix)
        await instanceStatus(rds).ensureDoesNotExist(newInstanceName)
        console.log('Creating Instance:', newInstanceName)

        const restoreResult = await rds.restoreSnapshot({
            DBInstanceIdentifier: newInstanceName,
            DBSnapshotIdentifier: mostRecentSnapshotId,
            AvailabilityZone: config.dev.availabilityZone,
            DBInstanceClass: config.dev.instanceClass,
            Engine: dbInstanceDataProd.Engine,
            LicenseModel: dbInstanceDataProd.LicenseModel,
            MultiAZ: config.dev.multiAZ,
            PubliclyAccessible: config.dev.publiclyAccessible,
            StorageType: dbInstanceDataProd.StorageType,
            VpcSecurityGroupIds: config.dev.securityGroups,
            Tags: config.dev.tags
        })
        // console.log('Restore Result:', restoreResult)

        await instanceStatus(rds).ensureAvailable(newInstanceName, config.timeout)
        const dbInstanceDataDev = await rds.readInstanceInfo(newInstanceName)
        // console.log('DBInstance Dev:', dbInstanceDataDev)

        console.log('Restore Completed')
        return newInstanceName
    },
    updatePassword: async (config) => {
        console.log('Change Master Password Starting...', config)

        if (!config.enabled){
            console.log('Change Master Password Disabled. Finishing early.')
            return false
        }

        const rds = rdsHelper(config.region)

        await instanceStatus(rds).ensureAvailable(config.dbIdentifier, config.timeout)
        await rds.setMasterPassword(config.dbIdentifier, config.password)
        await instanceStatus(rds).ensureAvailable(config.dbIdentifier, config.timeout)

        console.log('Change Master Password Completed')
        return true
    },
    deleteOlder: async (config) => {
        console.log('Delete Older Databases Starting...', config)

        if (!config.enabled){
            console.log('Delete Older Databases. Finishing early.')
            return false
        }

        const rds = rdsHelper(config.region)

        console.log(`Reading instance list with prefix ${config.databasePrefix}`)
        const devInstanceIds = await rds.readAllInstanceIdentifiers(config.databasePrefix)
        console.log('Dev Instance Ids:', devInstanceIds)
        const oldInstanceIds = devInstanceIds.sort().slice(0, devInstanceIds.length - 1)
        console.log('Old Instance Ids:', oldInstanceIds)

        for (var i = oldInstanceIds.length - 1; i >= 0; i--) {
            const instanceIdentifier = oldInstanceIds[i]
            console.log(`Delete ${instanceIdentifier} starting ...`)
            await rds.deleteInstance(instanceIdentifier)
            console.log(`Delete ${instanceIdentifier} Completed`)
        }

        console.log('Delete Older Databases Completed')
        return true
    }
}