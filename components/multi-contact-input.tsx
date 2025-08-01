"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { formatPhoneNumber, formatPhoneNumberInput } from "@/lib/phone-formatter"

interface MultiContactInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  isPhone?: boolean
}

export default function MultiContactInput({
  label,
  values,
  onChange,
  placeholder,
  isPhone = false,
}: MultiContactInputProps) {
  const addField = () => {
    onChange([...values, ""])
  }

  const removeField = (index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues.length > 0 ? newValues : [""])
  }

  const updateField = (index: number, value: string) => {
    const newValues = [...values]

    if (isPhone) {
      // 전화번호인 경우 실시간 포맷팅 적용
      const formattedValue = formatPhoneNumberInput(value)
      newValues[index] = formattedValue
    } else {
      newValues[index] = value
    }

    onChange(newValues)
  }

  const handleBlur = (index: number, value: string) => {
    if (isPhone && value) {
      // 포커스를 잃을 때 최종 포맷팅 적용
      const newValues = [...values]
      newValues[index] = formatPhoneNumber(value)
      onChange(newValues)
    }
  }

  // 최소 하나의 필드는 항상 보여주기
  const displayValues = values.length > 0 ? values : [""]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {displayValues.map((value, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            value={value}
            onChange={(e) => updateField(index, e.target.value)}
            onBlur={(e) => handleBlur(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {displayValues.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeField(index)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addField}
        className="text-blue-600 hover:text-blue-800"
      >
        <Plus className="h-4 w-4 mr-1" />
        {label} 추가
      </Button>
    </div>
  )
}
