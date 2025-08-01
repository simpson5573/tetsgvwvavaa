import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // 새로운 상태별 배지 스타일
        draft: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        sent: "border-transparent bg-green-500 text-white hover:bg-green-600",
        confirmed: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        modify: "border-transparent bg-orange-500 text-white hover:bg-orange-600",
        done: "border-transparent bg-gray-400 text-white",
        cancelrequest: "border-transparent bg-orange-600 text-white hover:bg-orange-700",
        cancel: "border-transparent bg-gray-400 text-white hover:bg-gray-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  productName?: string
  unit?: string
}

function Badge({ className, variant, productName, unit, children, ...props }: BadgeProps) {
  // 요소수와 황산암모늄의 경우 mm를 ton으로 변경
  const displayContent = React.Children.map(children, (child) => {
    if (typeof child === "string" && (productName === "urea" || productName === "sammonia")) {
      return child.replace(/mm/g, "ton")
    }
    return child
  })

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {displayContent}
    </div>
  )
}

export { Badge, badgeVariants }
