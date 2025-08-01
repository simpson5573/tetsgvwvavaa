// 전화번호 포맷팅 함수
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, "")

  // 빈 문자열이면 그대로 반환
  if (!numbers) return phone

  // 010으로 시작하는 11자리 휴대폰 번호
  if (numbers.length === 11 && numbers.startsWith("010")) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  // 02로 시작하는 서울 지역번호 (9-10자리)
  if (numbers.startsWith("02")) {
    if (numbers.length === 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    } else if (numbers.length === 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }
  }

  // 기타 지역번호 (10-11자리)
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  } else if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  // 포맷팅할 수 없는 경우 원본 반환
  return phone
}

// 전화번호 입력 시 실시간 포맷팅 (입력 중에는 부분적으로 포맷팅)
export function formatPhoneNumberInput(phone: string): string {
  const numbers = phone.replace(/\D/g, "")

  if (!numbers) return ""

  // 010으로 시작하는 경우
  if (numbers.startsWith("010")) {
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }
  }

  // 02로 시작하는 경우
  if (numbers.startsWith("02")) {
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }
  }

  // 기타 지역번호
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  return phone
}
