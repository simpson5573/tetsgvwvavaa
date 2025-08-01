"use client"

import type React from "react"

import { useMemo, useRef, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StockLogEntry, DispatchSettings } from "@/components/draft-system"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

interface StockChartProps {
  stockLog: StockLogEntry[]
  settings: DispatchSettings
}

export default function StockChart({ stockLog, settings }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: any; index: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    setMounted(true)
    // 애니메이션 시작
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 1000, 1) // 1초 애니메이션
      setAnimationProgress(progress)
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [])

  const chartData = useMemo(() => {
    try {
      if (!stockLog || stockLog.length === 0) {
        return []
      }

      const data = stockLog.map((entry) => {
        const timestamp = entry.timestamp
        const parsedDate = parseISO(timestamp)

        return {
          timestamp: timestamp,
          stock: Number(entry.stock) || 0,
          formattedTime: format(parsedDate, "MM/dd HH:mm"),
          date: parsedDate,
        }
      })

      return data
    } catch (error) {
      console.error("차트 데이터 생성 중 오류:", error)
      return []
    }
  }, [stockLog])

  useEffect(() => {
    if (!mounted || !canvasRef.current || chartData.length === 0 || !settings) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Canvas 크기 설정
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height
    const padding = 70

    // 배경 클리어
    ctx.clearRect(0, 0, width, height)

    // 데이터 범위 계산
    const maxStock = Math.max(...chartData.map((d) => d.stock), settings.maxLevel || 0)
    const minStock = Math.min(...chartData.map((d) => d.stock), settings.minLevel || 0)
    const stockRange = Math.max(maxStock - minStock, 10)
    const yPadding = stockRange * 0.1
    const yMin = minStock - yPadding
    const yMax = maxStock + yPadding

    // 좌표 변환 함수
    const getX = (index: number) => padding + (index / (chartData.length - 1)) * (width - 2 * padding)
    const getY = (stock: number) => height - padding - ((stock - yMin) / (yMax - yMin)) * (height - 2 * padding)

    // 부드러운 격자 그리기
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1

    // 가로 격자 (더 세련되게)
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // 세로 격자 (날짜별)
    let currentDate = ""
    let dateCount = 0
    chartData.forEach((data, index) => {
      const date = format(data.date, "MM/dd")
      if (date !== currentDate && index > 0) {
        currentDate = date
        dateCount++
        const x = getX(index)

        ctx.strokeStyle = "#e2e8f0"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()

        // 날짜 라벨 (더 깔끔하게)
        ctx.fillStyle = "#64748b"
        ctx.font = "13px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(date, x, height - 15)
      }
    })

    // Y축 라벨
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * (height - 2 * padding)
      const value = yMax - (i / 4) * (yMax - yMin)

      ctx.fillStyle = "#64748b"
      ctx.font = "12px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(0), padding - 15, y + 4)
    }

    // 기준선 그리기 (더 세련되게)
    if (settings.minLevel && settings.minLevel >= yMin && settings.minLevel <= yMax) {
      const minY = getY(settings.minLevel)

      // 그라데이션 배경
      const gradient = ctx.createLinearGradient(0, minY - 10, 0, minY + 10)
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.1)")
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(padding, minY - 10, width - 2 * padding, 20)

      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(padding, minY)
      ctx.lineTo(width - padding, minY)
      ctx.stroke()

      ctx.fillStyle = "#ef4444"
      ctx.font = "12px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(`최소 기준 ${settings.minLevel}${settings.unit}`, padding + 10, minY - 5)
    }

    if (settings.maxLevel && settings.maxLevel >= yMin && settings.maxLevel <= yMax) {
      const maxY = getY(settings.maxLevel)

      // 그라데이션 배경
      const gradient = ctx.createLinearGradient(0, maxY - 10, 0, maxY + 10)
      gradient.addColorStop(0, "rgba(234, 179, 8, 0.1)")
      gradient.addColorStop(1, "rgba(234, 179, 8, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(padding, maxY - 10, width - 2 * padding, 20)

      ctx.strokeStyle = "#eab308"
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(padding, maxY)
      ctx.lineTo(width - padding, maxY)
      ctx.stroke()

      ctx.fillStyle = "#eab308"
      ctx.font = "12px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(`최대 기준 ${settings.maxLevel}${settings.unit}`, padding + 10, maxY - 5)
    }

    ctx.setLineDash([])

    // 영역 채우기 (그라데이션)
    const areaGradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    areaGradient.addColorStop(0, "rgba(59, 130, 246, 0.3)")
    areaGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.1)")
    areaGradient.addColorStop(1, "rgba(59, 130, 246, 0.05)")

    ctx.fillStyle = areaGradient
    ctx.beginPath()

    const animatedLength = Math.floor(chartData.length * animationProgress)

    if (animatedLength > 0) {
      ctx.moveTo(getX(0), height - padding)

      for (let i = 0; i < animatedLength; i++) {
        const x = getX(i)
        const y = getY(chartData[i].stock)
        ctx.lineTo(x, y)
      }

      ctx.lineTo(getX(animatedLength - 1), height - padding)
      ctx.closePath()
      ctx.fill()
    }

    // 메인 라인 그리기 (더 부드럽고 세련되게)
    const lineGradient = ctx.createLinearGradient(padding, 0, width - padding, 0)
    lineGradient.addColorStop(0, "#3b82f6")
    lineGradient.addColorStop(0.5, "#1d4ed8")
    lineGradient.addColorStop(1, "#1e40af")

    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // 그림자 효과
    ctx.shadowColor = "rgba(59, 130, 246, 0.3)"
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 2

    ctx.beginPath()

    for (let i = 0; i < animatedLength; i++) {
      const x = getX(i)
      const y = getY(chartData[i].stock)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        // 부드러운 곡선을 위한 베지어 곡선
        const prevX = getX(i - 1)
        const prevY = getY(chartData[i - 1].stock)
        const cpX = (prevX + x) / 2

        ctx.quadraticCurveTo(cpX, prevY, x, y)
      }
    }

    ctx.stroke()
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // 호버 포인트 표시
    if (hoveredPoint && hoveredPoint.index < animatedLength) {
      const x = getX(hoveredPoint.index)
      const y = getY(chartData[hoveredPoint.index].stock)

      // 호버 포인트 원
      ctx.fillStyle = "#ffffff"
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // 내부 점
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()

      // 세로 가이드 라인
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Y축 단위 표시
    ctx.fillStyle = "#64748b"
    ctx.font = "13px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.save()
    ctx.translate(20, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(settings.unit || "ton", 0, 0)
    ctx.restore()
  }, [chartData, settings, mounted, animationProgress, hoveredPoint])

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || chartData.length === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const padding = 70
    const width = rect.width

    // 가장 가까운 데이터 포인트 찾기
    const dataIndex = Math.round(((x - padding) / (width - 2 * padding)) * (chartData.length - 1))
    const clampedIndex = Math.max(0, Math.min(dataIndex, chartData.length - 1))

    if (clampedIndex >= 0 && clampedIndex < chartData.length) {
      const data = chartData[clampedIndex]
      setHoveredPoint({
        x: event.clientX,
        y: event.clientY - 10,
        data: data,
        index: clampedIndex,
      })
    } else {
      setHoveredPoint(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  // 데이터 유효성 검사
  if (!stockLog || stockLog.length === 0) {
    return (
      <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-800">시간별 재고 변화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 rounded border-dashed"></div>
              </div>
              <p className="text-slate-500 font-medium">재고 데이터가 없습니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-800">시간별 재고 변화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <p className="text-slate-500 font-medium">설정 데이터가 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!mounted) {
    return (
      <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-800">시간별 재고 변화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">차트를 로딩중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          시간별 재고 변화
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[400px] cursor-crosshair rounded-lg"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* 모던한 툴팁 */}
          {hoveredPoint && (
            <div
              className="absolute bg-white/95 backdrop-blur-sm p-4 border border-gray-200/50 rounded-xl shadow-xl pointer-events-none z-10 min-w-[200px]"
              style={{
                left: Math.min(hoveredPoint.x + 15, window.innerWidth - 220),
                top: hoveredPoint.y - 80,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <p className="font-semibold text-slate-800 text-sm">
                  {format(hoveredPoint.data.date, "MM월 dd일 HH시", { locale: ko })}
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {hoveredPoint.data.stock.toFixed(1)}
                <span className="text-sm font-medium text-slate-600 ml-1">{settings.unit || "ton"}</span>
              </p>
            </div>
          )}
        </div>

        {/* 모던한 범례 */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"></div>
            <span className="font-medium text-slate-700">재고량</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-1 border-2 border-dashed border-red-400 rounded-full"></div>
            <span className="font-medium text-slate-700">최소 기준</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-1 border-2 border-dashed border-yellow-400 rounded-full"></div>
            <span className="font-medium text-slate-700">최대 기준</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
