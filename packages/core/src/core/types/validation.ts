// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export type ValidationResult = {
  readonly level: 'error' | 'warn'
  readonly message: string
}

export type CellValidationError = {
  readonly rowIndex: number
  readonly columnKey: string
  readonly result: ValidationResult
}
