import React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Will be styled with Material principles
import { Badge } from "@/components/ui/badge"
import { AlertDescription, AlertTitle } from "@/components/ui/alert" // AlertTitle renders h5
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Truck,
  Building,
  HistoryIcon,
  ExternalLink,
  Settings,
  Trash2,
  Send,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  CalendarDays,
  Users,
  Lightbulb,
  ChevronRight,
  FileText,
  MousePointerClick,
  Zap,
  CheckSquare,
  Eye,
  LinkIcon,
  Smartphone,
  BarChart3,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// 머티리얼 디자인 카드 스타일을 적용한 컴포넌트
const MaterialCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/70 backdrop-blur-md rounded-xl border border-gray-200/50 p-6 transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-lg shadow-sm ${className}`}
  >
    {children}
  </div>
)

const ManualSection = ({
  icon,
  title,
  value,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode
  title: string
  value: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => (
  <AccordionItem
    value={value}
    className="mb-8 bg-white/70 backdrop-blur-md rounded-xl border border-gray-200/50 overflow-hidden transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-lg shadow-sm"
  >
    <AccordionTrigger className="hover:bg-white/50 px-8 py-6 text-2xl font-semibold text-slate-800 data-[state=open]:bg-white/60 transition-colors">
      <div className="flex items-center w-full">
        {icon}
        <span className="ml-4 flex-1 text-left">{title}</span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="p-8 bg-white/30 backdrop-blur-sm text-slate-700 text-base md:text-lg leading-relaxed">
      {children}
    </AccordionContent>
  </AccordionItem>
)

const ImageCard = ({
  src,
  alt,
  caption,
  width = 640,
  height = 360,
  className = "",
}: {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
  className?: string
}) => (
  <figure className={`my-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-md ${className}`}>
    <Image
      src={src || `/placeholder.svg?width=${width}&height=${height}&query=${encodeURIComponent(alt)}`}
      alt={alt}
      width={width}
      height={height}
      className="object-contain w-full rounded-t-md"
      priority={src.startsWith("/manual/")}
    />
    {caption && (
      <figcaption className="p-4 text-center text-sm text-slate-600 bg-slate-100 border-t border-slate-200">
        {caption}
      </figcaption>
    )}
  </figure>
)

const StepCard = ({
  title,
  children,
  className,
  icon,
}: {
  title: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}) => (
  <div
    className={`mt-6 bg-white/60 backdrop-blur-md rounded-lg border border-gray-200/50 p-6 shadow-sm hover:bg-white/70 transition-all duration-300 ${className}`}
  >
    <h4 className="font-semibold text-xl text-sky-700 mb-3 flex items-center">
      {icon || <MousePointerClick className="w-5 h-5 mr-2 text-sky-600" />}
      {title}
    </h4>
    <div className="space-y-3 text-base text-slate-600">{children}</div>
  </div>
)

const Highlight = ({
  children,
  type = "default",
}: { children: React.ReactNode; type?: "default" | "action" | "status" | "navigation" }) => {
  let className = "bg-yellow-100 text-yellow-800"
  if (type === "action") className = "bg-blue-100 text-blue-800"
  if (type === "status") className = "bg-green-100 text-green-800"
  if (type === "navigation") className = "bg-purple-100 text-purple-800"
  return <span className={`px-1.5 py-1 rounded-md font-medium text-sm ${className}`}>{children}</span>
}

const StatusBadge = ({ status }: { status: string }) => {
  let className = "text-xs px-2.5 py-1 rounded-full font-semibold"
  switch (status.toLowerCase()) {
    case "전송":
      className += " bg-green-500 text-white"
      break
    case "확정":
      className += " bg-blue-500 text-white"
      break
    case "수정":
      className += " bg-orange-500 text-white"
      break
    case "완료":
      className += " bg-slate-400 text-white"
      break
    case "취소":
      className += " bg-red-500 text-white"
      break
    case "취소 요청":
      className += " bg-amber-500 text-white"
      break
    case "draft":
      className += " bg-purple-500 text-white"
      break
    default:
      className += " bg-slate-200 text-slate-700"
  }
  return <Badge className={className}>{status}</Badge>
}

const Tip = ({ children, title = "알아두면 좋은 팁!" }: { children: React.ReactNode; title?: string }) => (
  <div className="mt-6 bg-teal-50/70 backdrop-blur-md rounded-lg border border-teal-200/50 p-6 shadow-sm">
    <AlertTitle className="font-semibold text-teal-700 text-lg mb-2 flex items-center">
      <Lightbulb className="h-5 w-5 mr-2 text-teal-600" />
      {title}
    </AlertTitle>
    <AlertDescription className="text-base text-teal-600">{children}</AlertDescription>
  </div>
)

const ServiceLinkCard = ({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) => (
  <Link href={href} target="_blank" rel="noopener noreferrer" className="block group">
    <div className="h-full bg-white/60 backdrop-blur-md rounded-lg border border-gray-200/50 p-6 shadow-sm hover:bg-white/80 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 mb-3 rounded-full bg-sky-100/70 text-sky-600 group-hover:bg-sky-200/70 transition-colors backdrop-blur-sm">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 group-hover:text-sky-700 transition-colors">{description}</p>
      </div>
    </div>
  </Link>
)

// FAQ Data with structured answers
const faqData = [
  {
    value: "faq-1",
    question: "Q. Draft 페이지에서 작성한 내용이 사라졌어요.",
    answer: [
      "A. Draft 페이지의 내용은 임시 저장 상태로, 브라우저를 새로고침하거나 장시간 자리를 비우면 내용이 초기화될 수 있습니다. 중요한 배차 계획은 작성 후 바로 ",
      <Highlight key="faq1-h1" type="action">
        확정
      </Highlight>,
      "하여 Final 페이지로 넘기는 것이 안전합니다.",
    ],
  },
  {
    value: "faq-2",
    question: "Q. Final 페이지에서 배차 계획을 수정하고 싶은데, 일부 항목만 수정돼요.",
    answer: [
      "A. Final 페이지의 계획은 이미 납품업체에 공유된 내용이므로, 임의로 큰 변경을 할 수 없도록 제한되어 있습니다. ",
      <Highlight key="faq2-h1" type="action">
        입고 시간
      </Highlight>,
      "이나 ",
      <Highlight key="faq2-h2" type="action">
        입고 대수(2대 이상일 경우 1대씩 줄이기)
      </Highlight>,
      " 등 일부 항목만 수정 가능하며, 이 경우에도 ",
      <Highlight key="faq2-h3" type="action">
        변경 사유
      </Highlight>,
      "를 필수로 입력해야 합니다. 전면적인 수정이 필요하다면, 해당 계획을 취소 요청하고 Draft 페이지에서 새로 계획을 수립하는 것을 권장합니다.",
    ],
  },
  {
    value: "faq-3",
    question: "Q. '취소 요청'한 배차를 다시 되돌리고 싶어요.",
    answer: [
      "A. Final 페이지에서 '취소 요청' 상태가 된 배차는 '관리' 열의 ",
      <RotateCcw key="faq3-icon" className="inline h-4 w-4 text-blue-500" />,
      " (되돌리기) 아이콘을 클릭하여 다시 ",
      <Highlight key="faq3-h1" type="status">
        전송
      </Highlight>,
      " 상태로 변경할 수 있습니다. 단, 납품업체가 이미 취소 요청을 확인하고 배차를 중단했을 수 있으니, 되돌리기 후에는 반드시 업체와 소통하여 혼선이 없도록 해야 합니다.",
    ],
  },
]

export default function ManualPage() {
  const lastUpdated = "2025년 06월 17일"

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-6xl">
        <header className="mb-8 text-center">
          <div className="mt-8 space-y-2 text-sm text-slate-500">
            <p>
              <FileText className="inline w-4 h-4 mr-1" />
              최종 업데이트: {lastUpdated}
            </p>

            <Link
              href="https://www.notion.so/160f800bd1c180619a6ed3a5292311ef?pvs=21"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600/90 backdrop-blur-md text-white font-semibold rounded-lg hover:bg-blue-700/90 transition-all duration-300 shadow-sm hover:shadow-lg text-lg border border-blue-500/20"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              시스템 개선 아이디어 및 피드백 제공하기
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </header>

        <Accordion type="single" collapsible className="w-full">
          {/* --- Section 1: 시작하기 --- */}
          <ManualSection
            value="announcements"
            icon={<Zap className="h-8 w-8 text-blue-600" />}
            title="1. 시작하기: 시스템 접속 및 주요 안내"
          >
            <p className="mb-8 text-lg">
              Biomass 약품 배차 시스템에 오신 것을 환영합니다! 이 시스템은 약품 배차 과정을 더 효율적이고 체계적으로
              관리할 수 있도록 설계되었습니다. 아래 바로가기 링크를 통해 주요 서비스에 접속하고, 향후 개발 계획도
              확인해보세요.
            </p>
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">🌐 서비스 바로가기</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <ServiceLinkCard
                href="https://v0-5u-nine.vercel.app/"
                icon={<LinkIcon className="w-8 h-8" />}
                title="메인 시스템"
                description="배차 계획 및 관리 시스템 접속"
              />
              <ServiceLinkCard
                href="https://center-pf.kakao.com/_xixjaJn/chats"
                icon={<Smartphone className="w-8 h-8" />}
                title="Bio #1 카카오톡 채널"
                description="1호기 납품업체 소통 채널"
              />
              <ServiceLinkCard
                href="https://center-pf.kakao.com/_MxmPrn/chats"
                icon={<Smartphone className="w-8 h-8" />}
                title="Bio #2 카카오톡 채널"
                description="2호기 납품업체 소통 채널"
              />
            </div>

            <MaterialCard className="border-green-200">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-green-700 text-xl">🚀 향후 개발 계획</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-slate-700 text-base">
                <p className="flex items-center">
                  <ChevronRight className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" /> 계근대 DB 연동형 입고 이력 화면
                  ( ~6월 예정)
                </p>
                <p className="flex items-center">
                  <ChevronRight className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" /> HR정보 연동형 통합 로그인 기능
                  ( ~7월 예정)
                </p>
                <p className="flex items-center">
                  <ChevronRight className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" /> 배차 계획 상태 변경 시 알림톡
                  기능 ( ~7월 예정)
                </p>
              </CardContent>
            </MaterialCard>
            <Tip title="매뉴얼 활용법">
              이 매뉴얼은 각 섹션별로 아코디언 형태로 구성되어 있습니다. 궁금한 섹션의 제목을 클릭하면 상세 내용을
              펼쳐볼 수 있습니다. 각 설명에는 <Highlight type="action">버튼명</Highlight>,{" "}
              <Highlight type="navigation">메뉴명</Highlight>, <Highlight type="status">상태</Highlight> 등이 강조
              표시되어 있으니 참고하세요.
            </Tip>
          </ManualSection>

          {/* --- Section 2: 대시보드 --- */}
          <ManualSection
            value="dashboard"
            icon={<LayoutDashboard className="h-8 w-8 text-purple-600" />}
            title="2. 메인 화면 (대시보드) 한눈에 보기"
            defaultOpen={true}
          >
            <p className="text-lg mb-4">
              시스템에 접속하면 가장 먼저 <Highlight type="navigation">대시보드</Highlight>가 나타납니다. 여기서는 전체
              배차 현황을 달력 형태로 확인하고, 필요한 기능으로 빠르게 이동할 수 있습니다.
            </p>
            <ImageCard
              src="/manual/screenshot-dashboard-overview.png"
              alt="메인 대시보드 전체 모습"
              caption="메인 대시보드: ① 주요 메뉴 ② 카카오톡 채널 바로가기 버튼"
            />
            <StepCard title="① 주요 메뉴 네비게이션" icon={<Eye className="w-6 h-6 mr-2 text-sky-600" />}>
              <p>
                화면 상단에는 <Highlight type="navigation">Bio #1</Highlight>,{" "}
                <Highlight type="navigation">Bio #2</Highlight> (각 호기별 배차 관리),{" "}
                <Highlight type="navigation">업체</Highlight> (납품 업체 정보),{" "}
                <Highlight type="navigation">이력</Highlight> (과거 배차/입고 내역),{" "}
                <Highlight type="navigation">설정</Highlight> (시스템 관련 설정) 메뉴가 있어, 클릭 한 번으로 원하는
                기능으로 바로 이동할 수 있습니다.
              </p>
            </StepCard>
            <StepCard
              title="② 카카오톡 채널 바로가기"
              icon={<Image src="/kakao-talk-icon.svg" alt="카카오톡" width={24} height={24} className="mr-2" />}
            >
              <p>
                화면 우측 상단의 <Highlight type="action">Bio #1</Highlight>,{" "}
                <Highlight type="action">Bio #2</Highlight> 버튼을 클릭하면 각 호기별 카카오톡 채널의 관리자 페이지로
                바로 연결됩니다. 이를 통해 납품업체와 실시간으로 소통하며 배차 관련 협의를 진행할 수 있습니다.
              </p>
              <ul className="list-disc list-inside pl-5 mt-3 space-y-1 text-sm text-slate-500">
                <li>CCR B/E 자리에 납품업체 소통용 전용 휴대폰이 비치될 예정입니다.</li>
                <li>
                  PC(크롬 브라우저)에서 카카오톡 채널 관리자 기능을 사용하려면 담당자(심재혁 매니저)에게 계정 권한
                  등록을 요청해주세요.
                </li>
              </ul>
              <ImageCard
                src="/manual/screenshot-kakaotalk-chat-admin.png"
                alt="카카오톡 채널 관리자 페이지"
                caption="카카오톡 채널 관리자 페이지 예시: 업체와의 원활한 소통 창구"
                height={300}
              />
            </StepCard>
            <Tip title="대시보드 활용 팁">
              대시보드의 달력에서 특정 날짜를 클릭하면 해당 날짜의 배차 계획만 필터링하여 보여주는 기능이 추가될
              예정입니다. 이를 통해 특정일의 배차 집중도를 쉽게 파악할 수 있습니다.
            </Tip>
          </ManualSection>

          {/* --- Section 3: 배차 현황 요약 --- */}
          <ManualSection
            value="dispatch-summary"
            icon={<CalendarDays className="h-8 w-8 text-indigo-600" />}
            title="3. 배차 현황 요약 보기: 한눈에 파악하기"
          >
            <p className="text-lg mb-4">
              각 호기별 배차 관리 화면(<Highlight type="navigation">Bio #1</Highlight> 또는{" "}
              <Highlight type="navigation">Bio #2</Highlight> 메뉴 선택 시)에 처음 진입하면{" "}
              <Highlight type="navigation">요약</Highlight> 탭이 기본으로 보입니다. 여기서는 여러 약품의 배차 계획을
              종합적으로 보여주거나, 특정 약품을 선택하여 해당 약품의 배차 현황만 자세히 확인할 수 있습니다.
            </p>
            <ImageCard
              src="/manual/screenshot-summary-page-navigation.png"
              alt="배차 요약 페이지 및 약품 선택 탭"
              caption="① 특정 약품의 상세 배차 현황을 보려면, 상단 탭에서 해당 약품 이름을 클릭하세요."
            />
            <StepCard
              title="요약 정보에서 무엇을 알 수 있나요?"
              icon={<CheckSquare className="w-6 h-6 mr-2 text-sky-600" />}
            >
              <p>
                요약 페이지에는 각 배차 계획의 <Highlight>날짜, 입고대수, 입고량, 입고시간, 차량정보</Highlight> 등 핵심
                정보가 간략하게 표시됩니다. 이를 통해 전체적인 배차 흐름을 빠르게 파악할 수 있습니다.
              </p>
              <ul className="list-disc list-inside pl-5 mt-3 space-y-1 text-base">
                <li>
                  표시되는 배차 계획의 상태: <StatusBadge status="전송" />, <StatusBadge status="확정" />,{" "}
                  <StatusBadge status="수정" />, <StatusBadge status="완료" /> (
                  <StatusBadge status="취소" /> 상태의 계획은 요약 페이지에 나타나지 않습니다.)
                </li>
                <li>
                  <Highlight>차량정보</Highlight>는 납품업체가 자율적으로 입력하는 항목입니다. 필요시 해당 업체에 입력을
                  요청하여 배차 관리에 활용할 수 있습니다.
                </li>
              </ul>
            </StepCard>
            <Tip title="요약 페이지의 중요성">
              요약 페이지는 매일 아침 배차 현황을 점검하거나, 특정 약품의 입고 예정일을 빠르게 확인할 때 매우
              유용합니다. 여러 약품을 한눈에 비교하며 볼 수 있다는 장점이 있습니다.
            </Tip>
          </ManualSection>

          {/* --- Section 4: Draft 페이지 --- */}
          <ManualSection
            value="dispatch-draft"
            icon={<Truck className="h-8 w-8 text-red-600" />}
            title="4. 배차 계획 세우고 관리하기 (Draft 페이지)"
          >
            <p className="text-lg mb-4">
              <Highlight type="navigation">Draft 페이지</Highlight>는 실제 배차 계획을 세우고 검토하는 여러분의 작업
              공간입니다. 여기서 입력한 내용은 납품업체에게 보이지 않으므로, 자유롭게 다양한 시나리오를 시험해보고
              최적의 배차 계획을 수립할 수 있습니다.
            </p>
            <MaterialCard className="mb-6 border-red-200 bg-red-50">
              <AlertTitle className="font-semibold text-red-700 text-lg mb-2 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                중요: 임시 저장 공간입니다!
              </AlertTitle>
              <AlertDescription className="text-base text-red-600">
                Draft 페이지의 내용은 브라우저를 새로고침하거나 장시간 자리를 비우면 초기화될 수 있습니다. 중요한 배차
                계획은 검토 후 바로 <Highlight type="action">확정</Highlight>하여 Final 페이지로 넘기는 것이 안전합니다.
              </AlertDescription>
            </MaterialCard>

            <Accordion type="single" collapsible className="w-full space-y-6">
              <AccordionItem value="draft-initial" className="border-0 rounded-lg overflow-hidden shadow-md bg-white">
                <AccordionTrigger className="px-6 py-4 text-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors data-[state=open]:bg-slate-100">
                  4.1 배차 계획 새로 만들기: 어떻게 시작하나요?
                </AccordionTrigger>
                <AccordionContent className="p-6 border-t border-slate-200">
                  <ImageCard
                    src="/manual/screenshot-draft-initial-empty.png"
                    alt="Draft 페이지 초기 화면"
                    caption="① Draft/Final 탭 전환 ② 배차 계획 설정을 위한 '설정' 버튼"
                  />
                  <StepCard
                    title="배차 계획 생성, 이렇게 따라하세요!"
                    icon={<Settings className="w-6 h-6 mr-2 text-sky-600" />}
                  >
                    <p className="mb-3">
                      1. 먼저, 화면 우측 상단에 있는{" "}
                      <Button variant="outline" size="sm" className="shadow-sm">
                        <Settings className="mr-1.5 h-4 w-4" />
                        설정
                      </Button>{" "}
                      버튼을 클릭하세요. 이 버튼이 배차 계획 자동 생성의 시작점입니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-draft-settings-modal.png"
                      alt="배차 설정 모달창"
                      caption="배차 설정 상세 항목: ① 재고 ② 기간/업체 ③ 사용량 ④ 저장 및 생성 버튼"
                    />
                    {/* MODIFIED: Changed <p> to <div> here to fix nesting issue */}
                    <div className="mt-4">
                      2. <Highlight type="action">배차 설정</Highlight> 창이 나타나면, 다음 항목들을 꼼꼼히 입력하거나
                      선택해주세요. 이 설정값들이 자동 배차 계획의 기준이 됩니다.
                      <ul className="list-decimal list-inside pl-5 mt-3 space-y-3 text-base text-slate-600">
                        <li>
                          <strong>재고 설정:</strong> 현재 우리 발전소의 <Highlight>실제 재고량</Highlight>, 유지해야 할{" "}
                          <Highlight>최소/최대 재고 수준</Highlight>, 차량 한 대당 <Highlight>입고량</Highlight> 등을
                          정확히 입력합니다. 이 값을 기준으로 시스템이 자동으로 필요한 배차 대수를 계산해줍니다.
                          <Tip title="왜 '06:00 재고량'을 기준으로 할까요?">
                            오전 일찍(주로 07:00~09:00 사이) 입고되는 차량이 많습니다. 따라서, 당일 배차 계획을 정확하게
                            수립하기 위해서는 너무 늦은 시간의 재고량보다는 이른 아침인{" "}
                            <Highlight>06:00 시점의 재고량</Highlight>을 기준으로 삼는 것이 실제 운영에 더 적합합니다.
                          </Tip>
                        </li>
                        <li>
                          <strong>기간 및 업체:</strong> 배차 계획을 생성할 <Highlight>기간(시작일, 종료일)</Highlight>
                          을 설정하고, 계획을 적용할 <Highlight>납품업체</Highlight>를 선택합니다.
                        </li>
                        <li>
                          <strong>일별 사용량 설정:</strong> 해당 기간 동안 예상되는 약품의{" "}
                          <Highlight>하루 사용량</Highlight>을 입력합니다. 전체 기간 동일하게 설정하거나, 요일별로
                          다르게 설정할 수도 있습니다.
                        </li>
                        <li>
                          <strong>저장 및 생성:</strong> 모든 설정값을 다시 한번 확인한 후, 이 버튼을 클릭하세요.
                          시스템이 입력된 정보를 바탕으로 최적의 배차 계획 초안을 자동으로 생성하여 화면에 보여줍니다.
                        </li>
                      </ul>
                    </div>
                  </StepCard>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="draft-after-creation"
                className="border-0 rounded-lg overflow-hidden shadow-md bg-white"
              >
                <AccordionTrigger className="px-6 py-4 text-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors data-[state=open]:bg-slate-100">
                  4.2 생성된 계획 검토 및 수정하기
                </AccordionTrigger>
                <AccordionContent className="p-6 border-t border-slate-200">
                  <ImageCard
                    src="/manual/screenshot-draft-after-creation-edit.png"
                    alt="생성된 Draft 계획 및 수정 가능 항목"
                    caption="① 입고대수/시간 직접 수정 ② 주요 액션 버튼"
                  />
                  <StepCard title="입고 대수 및 시간 직접 조절">
                    <p>
                      자동 생성된 계획에서 <Highlight>입고대수</Highlight>나 <Highlight>입고시간</Highlight>을 직접
                      클릭하여 수정할 수 있습니다. 수정하면 우측의 예상 재고량(`재고(06:00)`, `입고 전/후 재고`,
                      `재고(20:00)`)이 실시간으로 변경되어 재고 변화를 예측할 수 있습니다.
                    </p>
                  </StepCard>
                  <StepCard title="재고 변화 트렌드 확인">
                    <p>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="mr-1 h-4 w-4" />
                        트렌드
                      </Button>
                      버튼을 클릭하면 시간대별 예상 재고량 변화를 그래프로 확인할 수 있어, 재고 부족이나 과잉을 미리
                      파악하는 데 도움이 됩니다. 다시 한번 클릭하면 원래 표 보기로 돌아갑니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-draft-trend-chart.png"
                      alt="재고 변화 트렌드 그래프"
                      caption="시간대별 재고량 변화 추이 그래프"
                    />
                  </StepCard>
                  <StepCard title="불필요한 계획 삭제하기">
                    <p>
                      삭제하고 싶은 배차 계획 항목 앞의 체크박스를 선택한 후,{" "}
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                        <Trash2 className="mr-1 h-4 w-4" />
                        삭제
                      </Button>{" "}
                      버튼을 누릅니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-draft-delete-modal.png"
                      alt="배차 계획 삭제 확인 창"
                      caption="삭제 확인 창: 삭제할 경우 되돌릴 수 없으니 신중히 결정하세요."
                    />
                    <p className="mt-1 text-sm text-red-600">
                      <AlertTriangle className="inline h-4 w-4 mr-1" />
                      삭제된 계획은 복구할 수 없으니 주의하세요.
                    </p>
                  </StepCard>
                  <StepCard title="계획 확정하고 업체에 보내기">
                    <p>
                      검토가 끝난 배차 계획들을 체크박스로 선택한 후,{" "}
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                        <Send className="mr-1 h-4 w-4" />
                        확정
                      </Button>{" "}
                      버튼을 누릅니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-draft-confirm-plans.png"
                      alt="배차 계획 확정"
                      caption="선택된 계획들이 '전송' 상태로 변경되며 Final 페이지로 이동합니다."
                    />
                    <p className="mt-1">
                      확정된 계획은 상태가 <StatusBadge status="전송" />
                      으로 변경되며, <Highlight type="navigation">Final 페이지</Highlight>로 이동합니다. 이 시점부터
                      납품업체가 해당 계획을 확인할 수 있게 됩니다.
                    </p>
                  </StepCard>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ManualSection>

          {/* --- Section 5: Final 페이지 --- */}
          <ManualSection
            value="dispatch-final"
            icon={<Send className="h-8 w-8 text-green-600" />}
            title="5. 확정된 배차 계획 관리하기 (Final 페이지)"
          >
            <p className="text-lg mb-4">
              <Highlight type="navigation">Final 페이지</Highlight>에서는 발전팀 내부 검토를 거쳐 납품업체에{" "}
              <Highlight type="status">전송</Highlight>된 배차 계획들을 관리합니다. 여기서는 계획을 함부로 수정할 수
              없으며, 몇 가지 제한적인 관리 기능만 제공됩니다.
            </p>
            <ImageCard
              src="/manual/screenshot-final-page-overview.png"
              alt="Final 페이지 전체 모습"
              caption="Final 페이지: ① Draft/Final 탭 ② 재고 보정 설정 ③ 확정된 계획 관리 영역"
            />
            <Accordion type="single" collapsible className="w-full space-y-6 mt-6">
              <AccordionItem
                value="final-stock-adjust"
                className="border-0 rounded-lg overflow-hidden shadow-md bg-white"
              >
                <AccordionTrigger className="px-6 py-4 text-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors data-[state=open]:bg-slate-100">
                  5.1 실시간 재고량 보정하기 (Calibration)
                </AccordionTrigger>
                <AccordionContent className="p-6 border-t border-slate-200">
                  <StepCard title="재고량 보정 방법">
                    <p>
                      실제 약품 사용량이 계획과 달라져 예상 재고량에 오차가 발생했을 때 사용합니다.
                      <br />
                      1. 우측 상단의{" "}
                      <Button variant="outline" size="sm">
                        <Settings className="mr-1 h-4 w-4" />
                        설정
                      </Button>{" "}
                      버튼을 클릭합니다.
                      <br />
                      2. <Highlight type="action">재고량 설정</Highlight> 창이 나타나면, DCS 등에서 확인한{" "}
                      <Highlight>오늘의 06:00 실제 재고량</Highlight>을 입력하고 저장합니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-stock-settings-modal.png"
                      alt="Final 페이지 재고량 설정(보정) 창"
                      caption="실제 06:00 재고량을 입력하여 전체 계획의 예상 재고를 업데이트합니다."
                    />
                    <p className="mt-1">
                      이렇게 하면 입력한 실제 재고를 기준으로 이후 모든 배차 계획의 `재고(06:00)`, `입고 전/후 재고`,
                      `재고(20:00)` 값이 자동으로 다시 계산되어 정확한 재고 관리가 가능해집니다.
                    </p>
                  </StepCard>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="final-edit-time" className="border-0 rounded-lg overflow-hidden shadow-md bg-white">
                <AccordionTrigger className="px-6 py-4 text-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors data-[state=open]:bg-slate-100">
                  5.2 확정된 계획의 입고 시간/대수 변경하기
                </AccordionTrigger>
                <AccordionContent className="p-6 border-t border-slate-200">
                  <StepCard title="입고 시간/대수 변경 방법">
                    <p>
                      부득이하게 확정된 계획의 입고 시간이나 대수를 변경해야 할 경우 사용합니다.
                      <ul className="list-disc pl-5 mt-1 space-y-2 text-base text-slate-600">
                        <li>
                          <strong>입고 대수 변경:</strong> 입고 대수가 2대 이상인 경우, 해당 계획의{" "}
                          <Button variant="outline" size="xs">
                            취소
                          </Button>{" "}
                          버튼을 눌러 1대씩 줄일 수 있습니다. (1대인 경우에는 아래 '배차 취소 요청' 기능을 사용해야
                          합니다.)
                        </li>
                        <li>
                          <strong>입고 시간 변경:</strong> 변경하려는 회차의 <Highlight>입고 시간</Highlight>을 클릭하여
                          수정합니다.
                        </li>
                        <li>
                          변경 시에는 반드시 <Highlight>변경 사유</Highlight>를 입력해야{" "}
                          <Button variant="default" size="xs">
                            수정
                          </Button>{" "}
                          버튼이 활성화됩니다.
                        </li>
                      </ul>
                    </p>
                    <ImageCard
                      src="/manual/screenshot-edit-time-modal.png"
                      alt="확정된 계획의 입고 시간 수정 창"
                      caption="입고 시간 변경 및 변경 사유 입력"
                    />
                  </StepCard>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="final-cancel-request"
                className="border-0 rounded-lg overflow-hidden shadow-md bg-white"
              >
                <AccordionTrigger className="px-6 py-4 text-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors data-[state=open]:bg-slate-100">
                  5.3 배차 취소 요청하기 (긴급 상황 시)
                </AccordionTrigger>
                <AccordionContent className="p-6 border-t border-slate-200">
                  <StepCard title="배차 취소 요청 절차">
                    <p>
                      이미 확정되어 업체에 전달된 배차를 긴급하게 취소해야 할 때 사용합니다.
                      <br />
                      1. 취소하려는 계획의 '관리' 열에 있는{" "}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                      </Button>{" "}
                      (휴지통) 아이콘을 클릭합니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-confirmed-state.png"
                      alt="취소 요청 전 '확정' 상태의 배차 계획"
                      caption="취소 요청 전: 배차 상태는 '확정'입니다."
                    />
                    <p className="mt-2">
                      2. <Highlight type="action">취소 요청 확인</Highlight> 창이 나타나면 내용을 확인하고{" "}
                      <Button variant="destructive" size="sm">
                        취소 요청
                      </Button>{" "}
                      버튼을 클릭합니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-cancel-request-modal.png"
                      alt="배차 취소 요청 확인 창"
                      caption="취소 요청 ���인: 내용을 다시 한번 확인하세요."
                    />
                    <p className="mt-2">
                      3. 요청이 완료되면 배차 상태가 <StatusBadge status="취소 요청" />
                      으로 변경되며, 이 정보가 납품업체에 즉시 전송됩니다.
                    </p>
                    <ImageCard
                      src="/manual/screenshot-cancel-requested-state.png"
                      alt="'취소 요청' 상태로 변경된 배차 계획"
                      caption="취소 요청 후: 배차 상태가 '취소요청'으로 변경됩니다."
                    />
                    <p className="mt-2">
                      4. (선택) 만약 실수로 취소 요청을 했다면, '관리' 열의{" "}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-100">
                        <RotateCcw className="h-4 w-4" />
                      </Button>{" "}
                      (되돌리기) 아이콘을 클릭하여 다시 <StatusBadge status="전송" /> 상태로 되돌릴 수 있습니다. (업체가
                      이미 확인했거나 조치한 경우 주의 필요)
                    </p>
                    <ImageCard
                      src="/manual/screenshot-sent-state.png"
                      alt="취소 요청을 되돌려 '전송' 상태가 된 배차 계획"
                      caption="되돌리기 후: 배차 상태가 다시 '전송'으로 변경됩니다."
                    />
                  </StepCard>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ManualSection>

          {/* --- Section 6: 업체 정보 --- */}
          <ManualSection
            value="company-info"
            icon={<Building className="h-8 w-8 text-teal-600" />}
            title="6. 납품 업체 정보 관리하기"
          >
            <p className="text-lg mb-4">
              <Highlight type="navigation">업체</Highlight> 메뉴에서는 각 약품별 납품업체의 기본 정보(담당자, 연락처,
              계약 단가 등)를 확인하고 관리할 수 있습니다. 이 정보는 배차 계획 시 업체 선택 및 연락에 활용됩니다.
            </p>
            <ImageCard
              src="/manual/screenshot-company-info.png"
              alt="업체 정보 화면"
              caption="업체 정보 화면: 약품별 업체 목록 및 상세 정보 관리"
            />
            <StepCard title="주요 기능">
              <ul className="list-disc pl-5 space-y-2 text-base text-slate-600">
                <li>새로운 업체 정보를 추가할 수 있습니다.</li>
                <li>기존 업체 정보를 수정하거나 삭제할 수 있습니다.</li>
                <li>약품별로 기본 납품 업체를 설정하여 배차 계획 시 편의성을 높일 수 있습니다.</li>
              </ul>
            </StepCard>
          </ManualSection>

          {/* --- Section 7: 이력 조회 --- */}
          <ManualSection
            value="history-log"
            icon={<HistoryIcon className="h-8 w-8 text-amber-600" />}
            title="7. 배차 및 입고 이력 조회하기"
          >
            <p className="text-lg mb-4">
              <Highlight type="navigation">이력</Highlight> 메뉴에서는 과거의 모든 배차 계획 및 실제 입고 내역을 조회할
              수 있습니다. 다양한 조건으로 필터링하여 원하는 정보를 쉽게 찾아보고, 과거 데이터를 분석하는 데 활용할 수
              있습니다.
            </p>
            <ImageCard
              src="/manual/screenshot-history.png"
              alt="이력 조회 화면"
              caption="이력 조회 화면: 기간, 업체, 상태 등 다양한 조건으로 검색 가능"
            />
            <StepCard title="활용 방법">
              <ul className="list-disc pl-5 space-y-2 text-base text-slate-600">
                <li>특정 기간 동안의 입고 현황을 분석하여 약품 사용 패턴을 파악할 수 있습니다.</li>
                <li>
                  필요시 과거 배차 계획에 첨부된 계근표나 시험성적서 등의 자료를 확인할 수 있습니다. (자료 클릭 시 확인
                  가능, 향후 지원 예정)
                </li>
                <li>업체별, 약품별 입고 통계를 파악하여 계약 조건 검토 등에 활용할 수 있습니다.</li>
              </ul>
            </StepCard>
          </ManualSection>

          {/* --- Section 8: FAQ --- */}
          <ManualSection
            value="faq"
            icon={<HelpCircle className="h-8 w-8 text-slate-600" />}
            title="8. 자주 묻는 질문 (FAQ) 및 문제 해결"
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqData.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="border-0 rounded-lg overflow-hidden shadow-sm bg-white/60 backdrop-blur-md border border-gray-200/50 hover:bg-white/70 transition-all duration-300"
                >
                  <AccordionTrigger className="px-6 py-4 text-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left data-[state=open]:bg-slate-100">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="p-6 border-t border-slate-200 text-base text-slate-600">
                    {item.answer.map((segment, index) => (
                      <React.Fragment key={index}>{segment}</React.Fragment>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ManualSection>

          {/* --- Section 9: 문의처 --- */}
          <ManualSection
            value="contact-support"
            icon={<Users className="h-8 w-8 text-cyan-600" />}
            title="9. 도움이 더 필요하신가요? (문의처)"
          >
            <MaterialCard className="border-cyan-200 bg-cyan-50">
              <AlertTitle className="font-semibold text-cyan-800 text-xl mb-3 flex items-center">
                <Lightbulb className="h-6 w-6 mr-2 text-cyan-700" />
                시스템 관련 문의
              </AlertTitle>
              <AlertDescription className="text-base text-cyan-700">
                매뉴얼을 보셔도 해결되지 않는 문제나 시스템 개선/요청 사항이 있다면 아래 담당자에게 연락주시기 바랍니다.
                <ul className="list-disc pl-6 mt-3 space-y-1">
                  <li>Biomass 발전부문 심재혁 매니저</li>
                  <li>Biomass 발전팀 노준혁 매니저</li>
                </ul>
              </AlertDescription>
            </MaterialCard>
          </ManualSection>
        </Accordion>

        <footer className="text-center mt-20 py-10 border-t border-slate-300">
          <p className="text-slate-600">&copy; {new Date().getFullYear()} GS EPS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
