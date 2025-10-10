import moment from 'moment'
import 'moment/locale/vi' // Import Vietnamese locale

// Thiết lập locale mặc định
moment.locale('vi')

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return ''
  return moment(date).format(format)
}

export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return ''
  return moment(date).format(format)
}

export const formatTime = (date, format = 'HH:mm') => {
  if (!date) return ''
  return moment(date).format(format)
}

export const timeFromNow = (date) => {
  if (!date) return ''
  return moment(date).fromNow()
}

export const timeAgo = (date) => {
  if (!date) return ''
  return moment(date).locale('vi').fromNow()
}

export const isToday = (date) => {
  if (!date) return false
  return moment(date).isSame(moment(), 'day')
}

export const isYesterday = (date) => {
  if (!date) return false
  return moment(date).isSame(moment().subtract(1, 'day'), 'day')
}

export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false
  return moment(date1).isSame(moment(date2), 'day')
}

export const addDays = (date, days) => {
  if (!date) return null
  return moment(date).add(days, 'days').toDate()
}

export const subtractDays = (date, days) => {
  if (!date) return null
  return moment(date).subtract(days, 'days').toDate()
}

export const startOfDay = (date) => {
  if (!date) return null
  return moment(date).startOf('day').toDate()
}

export const endOfDay = (date) => {
  if (!date) return null
  return moment(date).endOf('day').toDate()
}