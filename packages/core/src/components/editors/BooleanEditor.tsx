import { memo, useCallback } from 'react'
import styles from '../../styles/editor.module.css'

type BooleanEditorProps = {
  readonly value: boolean
  readonly onChange: (value: boolean) => void
  readonly readOnly?: boolean
}

export const BooleanEditor = memo(function BooleanEditor({
  value,
  onChange,
  readOnly,
}: BooleanEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked),
    [onChange],
  )

  return (
    <input
      className={styles.checkbox}
      type="checkbox"
      checked={value}
      disabled={readOnly}
      onChange={handleChange}
    />
  )
})
