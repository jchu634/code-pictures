import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";

export function NumberInput({
  onWheelValue,
  ...props
}: Omit<ComponentProps<"input">, "type" | "onWheel" | "ref"> & {
  onWheelValue: (value: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const element = input.current;
    if (!element) return;
    function adjust(event: WheelEvent) {
      if (
        !element ||
        event.ctrlKey ||
        !event.deltaY ||
        element.disabled ||
        element.readOnly
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (event.deltaY < 0) element.stepUp();
      else element.stepDown();
      if (Number.isFinite(element.valueAsNumber))
        onWheelValue(element.valueAsNumber);
    }
    // React's wheel listeners are passive, so use a native listener to keep
    // the page still while adjusting the field.
    element.addEventListener("wheel", adjust, { passive: false });
    return () => element.removeEventListener("wheel", adjust);
  }, [onWheelValue]);
  return <input {...props} type="number" ref={input} />;
}
