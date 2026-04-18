'use client'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    onChange(raw)
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-foreground w-36 shrink-0">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleHexChange}
        placeholder="#000000"
        maxLength={7}
        className="h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <input
        type="color"
        value={value.startsWith('#') && value.length === 7 ? value : '#000000'}
        onChange={handleColorChange}
        className="h-9 w-10 cursor-pointer rounded-md border border-input p-0.5 shadow-sm"
        title={label}
      />
    </div>
  )
}
