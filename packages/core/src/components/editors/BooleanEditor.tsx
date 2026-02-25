import { memo } from 'react'
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
  return (
    <input
      className={styles.checkbox}
      type="checkbox"
      checked={value}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.checked)}
    />
  )
})
