import * as React from "react"
import { Slider } from "radix-ui"

import { cn } from "@/lib/utils"

function SliderPrimitive({
  className,
  ...props
}: React.ComponentProps<typeof Slider.Root>) {
  return (
    <Slider.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200">
        <Slider.Range className="absolute h-full bg-primary" />
      </Slider.Track>
      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <Slider.Thumb
          key={i}
          className="block h-4 w-4 rounded-full border-2 border-primary bg-white shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing"
        />
      ))}
    </Slider.Root>
  )
}

export { SliderPrimitive as Slider }
