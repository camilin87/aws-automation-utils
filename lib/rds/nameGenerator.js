module.exports = () => {
    function todayString() {
        return new Date().toISOString().split('T')[0]
    }

    return {
        create: (prefix) => {
            const hour = new Date().getHours()

            return `${prefix}-${todayString()}-${hour}`
        }
    }
}