export function toKebabCase (str) {
  let arr = str.split(' ')
  let result = ''
  for(let i = 0; i < arr.length; i++) {
    let word = arr[i].toLowerCase()
    if (i > 0) {
      word = `-${word}`
    }
    result += word
  }
  return result
}
