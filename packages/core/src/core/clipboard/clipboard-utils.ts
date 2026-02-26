export function serializeToTsv(data: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          if (Array.isArray(cell)) {
            const str = cell.join(', ')
            if (str.includes('\t') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          }
          const str = cell === null || cell === undefined ? '' : String(cell)
          if (str.includes('\t') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join('\t'),
    )
    .join('\n')
}

export function deserializeTsv(tsv: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false
  let i = 0

  while (i < tsv.length) {
    const char = tsv[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < tsv.length && tsv[i + 1] === '"') {
          currentCell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      currentCell += char
      i++
      continue
    }

    if (char === '"' && currentCell === '') {
      inQuotes = true
      i++
      continue
    }

    if (char === '\t') {
      currentRow.push(currentCell)
      currentCell = ''
      i++
      continue
    }

    if (char === '\n') {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      i++
      // Handle \r\n
      if (i < tsv.length && tsv[i] === '\r') {
        i++
      }
      continue
    }

    if (char === '\r') {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      i++
      // Handle \r\n
      if (i < tsv.length && tsv[i] === '\n') {
        i++
      }
      continue
    }

    currentCell += char
    i++
  }

  // Push remaining
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows
}
