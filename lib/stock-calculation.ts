// 재고 계산 관련 유틸리티 함수들

export interface DayStockParams {
  morningStock: number
  deliveryTimes: string[]
  deliveryCount: number
  deliveryAmount: number
  dailyUsage: number
  conversionRate: number
}

export interface DayStockResult {
  preDeliveryStocks: number[]
  postDeliveryStocks: number[]
  eveningStock: number
  nightDeliveries: number
}

// 시간을 분으로 변환하는 함수
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

// 야간 사용량 계산 (20:00~06:00, 10시간)
export function calculateNightUsage(dailyUsage: number, conversionRate: number): number {
  const hourlyUsage = (dailyUsage * conversionRate) / 24 // factor 적용
  return 10 * hourlyUsage // 20:00~06:00 = 10시간
}

// 다음날 아침 재고 계산
export function calculateNextMorningStock(
  previousEveningStock: number,
  nightDeliveries: number,
  dailyUsage: number,
  conversionRate: number,
): number {
  const nightUsage = calculateNightUsage(dailyUsage, conversionRate) // factor가 적용된 야간 사용량
  return Math.max(0, previousEveningStock - nightUsage + nightDeliveries)
}

// 하루 재고 계산 (Draft 페이지와 동일한 로직)
export function calculateDayStocks(params: DayStockParams): DayStockResult {
  const { morningStock, deliveryTimes, deliveryCount, deliveryAmount, dailyUsage, conversionRate } = params

  // 시간당 사용량 계산 - factor 적용
  const hourlyUsage = (dailyUsage * conversionRate) / 24

  // 입고량에 factor 적용
  const convertedDeliveryAmount = deliveryAmount * conversionRate

  console.log(
    `재고 계산 - 입고량: ${deliveryAmount}, factor: ${conversionRate}, 변환된 입고량: ${convertedDeliveryAmount}, 일일사용량: ${dailyUsage}, 변환된 시간당사용량: ${hourlyUsage}`,
  )

  // 입고 시간별로 정렬
  const sortedTimes = [...deliveryTimes].sort((a, b) => timeToMinutes(a) - timeToMinutes(b))

  const preDeliveryStocks: number[] = []
  const postDeliveryStocks: number[] = []
  let nightDeliveries = 0

  // 시간 기준점
  const morningTime = 6 * 60 // 06:00을 분으로 변환
  const eveningTime = 20 * 60 // 20:00을 분으로 변환

  // 새벽 입고량 계산 및 06:00 시작 재고 계산
  let dawnDeliveries = 0
  let morningStartStock = morningStock

  for (let i = 0; i < deliveryCount; i++) {
    const deliveryTime = timeToMinutes(sortedTimes[i] || "08:00")
    if (deliveryTime < morningTime) {
      // 새벽 입고: 입고 후부터 06:00까지의 사용량 계산
      const hoursUntilMorning = (morningTime - deliveryTime) / 60
      const usageUntilMorning = hoursUntilMorning * hourlyUsage

      // 입고 전 재고에서 입고량을 더하고 06:00까지 사용량을 뺀 값이 06:00 재고
      const stockAfterDelivery = morningStartStock + convertedDeliveryAmount
      morningStartStock = Math.max(0, stockAfterDelivery - usageUntilMorning)
      dawnDeliveries += convertedDeliveryAmount
    }
  }

  // 06:00 시작 재고 (새벽 입고 및 사용량 반영)
  let currentStock = morningStartStock

  // 06:00 이후 입고들만 처리
  const dayDeliveries = sortedTimes.filter((time) => timeToMinutes(time) >= morningTime)

  for (let i = 0; i < deliveryCount; i++) {
    const deliveryTime = timeToMinutes(sortedTimes[i] || "08:00")

    // 06:00 이전 입고는 이미 처리했으므로 스킵하되, 배열 인덱스는 유지
    if (deliveryTime < morningTime) {
      // 새벽 입고: 입고 전 재고는 원래 아침 재고, 입고 후 재고는 06:00 시작 재고
      preDeliveryStocks.push(morningStock)
      postDeliveryStocks.push(morningStock + convertedDeliveryAmount)
      continue
    }

    // 이전 시점부터 현재 입고 시간까지의 사용량 계산
    let usageHours: number
    let prevTime: number

    // 이전 06:00 이후 입고 시간 찾기
    let prevDayDeliveryIndex = -1
    for (let j = i - 1; j >= 0; j--) {
      if (timeToMinutes(sortedTimes[j]) >= morningTime) {
        prevDayDeliveryIndex = j
        break
      }
    }

    if (prevDayDeliveryIndex === -1) {
      // 첫 번째 주간 입고: 06:00부터 입고 시간까지
      prevTime = morningTime
      usageHours = Math.max(0, (deliveryTime - morningTime) / 60)
    } else {
      // 이후 입고: 이전 주간 입고 시간부터 현재 입고 시간까지
      prevTime = timeToMinutes(sortedTimes[prevDayDeliveryIndex])
      usageHours = Math.max(0, (deliveryTime - prevTime) / 60)
    }

    // 입고 전 재고 계산
    const usage = usageHours * hourlyUsage
    const preDeliveryStock = Math.max(0, currentStock - usage)
    preDeliveryStocks.push(preDeliveryStock)

    // 20:00 이후 입고인지 확인
    if (deliveryTime >= eveningTime) {
      // 20:00 이후 입고는 야간 입고로 분류
      nightDeliveries += convertedDeliveryAmount
      // 야간 입고도 입고 후 재고에는 반영 (표시용)
      const postDeliveryStock = preDeliveryStock + convertedDeliveryAmount
      postDeliveryStocks.push(postDeliveryStock)
      // currentStock은 야간 입고 전 상태로 유지 (20:00 재고 계산용)
      currentStock = preDeliveryStock
    } else {
      // 20:00 이전 입고는 즉시 재고에 반영
      const postDeliveryStock = preDeliveryStock + convertedDeliveryAmount
      postDeliveryStocks.push(postDeliveryStock)
      currentStock = postDeliveryStock
    }
  }

  // 저녁 재고 계산 (20:00 시점) - 야간 입고는 제외하고 계산
  let eveningStock: number

  if (deliveryCount > 0) {
    // 20:00 이전 마지막 입고 시간과 재고 찾기
    let lastDayDeliveryTime = morningTime // 기본값은 06:00
    let stockAfterLastDayDelivery = currentStock

    // 새벽 입고가 반영된 06:00 시작 재고부터 시작
    stockAfterLastDayDelivery = morningStock + dawnDeliveries

    for (let i = 0; i < deliveryCount; i++) {
      const deliveryTime = timeToMinutes(sortedTimes[i] || "08:00")

      if (deliveryTime >= morningTime && deliveryTime < eveningTime) {
        // 06:00 이후, 20:00 이전 입고인 경우
        lastDayDeliveryTime = deliveryTime
        stockAfterLastDayDelivery = postDeliveryStocks[i]
      }
    }

    // 마지막 주간 입고 시간부터 20:00까지의 사용량 계산
    const remainingHours = Math.max(0, (eveningTime - lastDayDeliveryTime) / 60)
    const remainingUsage = remainingHours * hourlyUsage
    eveningStock = Math.max(0, stockAfterLastDayDelivery - remainingUsage)
  } else {
    // 입고가 없는 경우: 06:00부터 20:00까지 14시간 사용량 차감
    const dayUsage = 14 * hourlyUsage
    eveningStock = Math.max(0, morningStock - dayUsage)
  }

  return {
    preDeliveryStocks,
    postDeliveryStocks,
    eveningStock,
    nightDeliveries,
  }
}
