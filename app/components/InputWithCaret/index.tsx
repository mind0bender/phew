import type {
  ChangeEvent,
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
  MutableRefObject,
  ReactNode,
} from "react";
import { useState } from "react";

import { useRef } from "react";

interface InputWithCaretProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  propmtElement: ReactNode;
  visible?: boolean;
}

interface Selection {
  start: number;
  end: number;
  isSelected: boolean;
}

function InputWithCaret({
  propmtElement,
  visible = true,
  ...props
}: InputWithCaretProps): JSX.Element {
  const inpRef: MutableRefObject<HTMLInputElement | null> =
    useRef<null | HTMLInputElement>(null);

  const [value, setValue] = useState<string>("");
  const [selection, setSelection] = useState<Selection>({
    start: 0,
    end: 0,
    isSelected: false,
  });

  const onValueChange: ChangeEventHandler<HTMLInputElement> = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setValue(e.target.value);
    console.log(e.target.value);
  };

  function updateCaret(): void {
    const start: number = inpRef.current?.selectionStart || 0;
    let end: number = inpRef.current?.selectionEnd || 0;
    setSelection({
      start,
      end,
      isSelected: start !== end,
    });
  }

  return (
    <div className={`flex w-full`}>
      <input
        onChange={onValueChange}
        value={value}
        ref={inpRef}
        className={`scale-0 absolute`}
        onKeyUp={updateCaret}
        {...props}
      />
      <div className={`flex w-full`}>
        {propmtElement}
        {visible && (
          <span className={`break-all whitespace-pre-wrap`}>
            {value.slice(0, selection.start)}
            {/* this is the "caret" */}
            <span
              className={`border blink ${
                selection.isSelected
                  ? "rounded-sm bg-primary-400"
                  : "bg-secondary-100"
              } text-secondary-950`}>
              {value.slice(
                selection.start,
                selection.isSelected ? selection.end : selection.start + 1
              ) || " "}
            </span>
            {value.slice(
              selection.isSelected ? selection.end : selection.start + 1
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export default InputWithCaret;
