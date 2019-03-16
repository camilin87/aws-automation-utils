module.exports = {
    rds: require('./lib/rds')(),
    elasticBeanstalk: require('./lib/elasticBeanstalk')(),
    lambda: require('./lib/lambda')()
}