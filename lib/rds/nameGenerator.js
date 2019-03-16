module.exports = (createDateFn) => {
    const createDateDefault = () => new Date()
    const createDate = createDateFn || createDateDefault

    function todayString() {
        return createDate().toISOString().split('T')[0]
    }

    return {
        create: (prefix) => {
            const hour = createDate().getHours()
            const hourString = hour.toString().padStart(2, '0')

            return `${prefix}-${todayString()}-${hourString}`
        }
    }
}