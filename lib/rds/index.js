module.exports = function(rdsHelperFn, instanceStatusFn, nameGeneratorFn){
    if (!rdsHelperFn){
        rdsHelperFn = require('./rdsHelper')
    }

    if (!instanceStatusFn){
        instanceStatusFn = require('./instanceStatus')
    }

    if (!nameGeneratorFn){
        nameGeneratorFn = require('./nameGenerator')
    }

    return {
        restore: async (config) => {
            console.log('Restore Starting...', config)

            if (!config.enabled){
                console.log('Restore Disabled. Finishing early.')
                return false
            }

            const rds = rdsHelperFn(config.region)
            const dbInstanceDataProd = await rds.readInstanceInfo(config.prod.dbIdentifier)
            await instanceStatusFn(rds).ensureAvailable(config.prod.dbIdentifier, config.timeout)
            // console.log('DBInstance Prod:', dbInstanceDataProd)

            const mostRecentSnapshot = await rds.readMostRecentSnapshot(config.prod.dbIdentifier)
            const mostRecentSnapshotId = mostRecentSnapshot.DBSnapshotIdentifier
            console.log('Most Recent Snapshot Id', mostRecentSnapshotId)

            const newInstanceName = nameGeneratorFn()
                .create(config.dev.databasePrefix)
            await instanceStatusFn(rds).ensureDoesNotExist(newInstanceName)
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

            await instanceStatusFn(rds).ensureAvailable(newInstanceName, config.timeout)
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

            const rds = rdsHelperFn(config.region)

            await instanceStatusFn(rds).ensureAvailable(config.dbIdentifier, config.timeout)
            await rds.setMasterPassword(config.dbIdentifier, config.password)
            await instanceStatusFn(rds).ensureAvailable(config.dbIdentifier, config.timeout)

            console.log('Change Master Password Completed')
            return true
        },
        deleteOlder: async (config) => {
            console.log('Delete Older Databases Starting...', config)

            if (!config.enabled){
                console.log('Delete Older Databases. Finishing early.')
                return false
            }

            const rds = rdsHelperFn(config.region)

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
}
