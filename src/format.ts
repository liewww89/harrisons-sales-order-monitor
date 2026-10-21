const amountFormatter = new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const countFormatter = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
const timeFormatter = new Intl.DateTimeFormat('en-MY', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })

export const formatAmount = (value: number) => amountFormatter.format(value)
export const formatCount = (value: number) => countFormatter.format(value)
export const formatDate = (value: string) => dateFormatter.format(new Date(value))
export const formatTime = (value: Date) => timeFormatter.format(value)
