export function hexToRgb(hex: string) {
  // By Tim Down - http://stackoverflow.com/a/5624139/3493650
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b
  })
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

export function clamp(number: number, min: number, max: number) {
  return Math.min(Math.max(number, min), max)
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
export function* range(start = 0, end = 100, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i
  }
}
