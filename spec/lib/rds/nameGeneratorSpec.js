const rfr = require('rfr')
const nameGeneratorModule = rfr('lib/rds/nameGenerator')

describe('nameGenerator', function(){
    var seededDate = new Date('04 Dec 1995 03:12:00')
    var nameGenerator = null

    beforeEach(function(){
        const createDate = () => seededDate
        nameGenerator = nameGeneratorModule(createDate)
    })

    it('returns a name with the prefix and the date', function(){
        const result = nameGenerator.create('test-db')

        expect(result).toBe('test-db-1995-12-04-03')
    })
})