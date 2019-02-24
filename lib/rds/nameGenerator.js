module.exports = () => {
    function todayString() {
        return new Date().toISOString().split('T')[0]
    }

    return {
        create: (prefix) => {
            const hour = new Date().getHours()
            const hourString = hour.toString().padStart(2, '0')

            return `${prefix}-${todayString()}-${hourString}`
        }
    }
}