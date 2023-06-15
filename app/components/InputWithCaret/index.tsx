import type {
  ChangeEvent,
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
  MutableRefObject,
  ReactNode,
} from "react";
import { useRef, useState } from "react";

interface InputWithCaretProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  propmtElement: ReactNode;
  visible?: boolean;
  value: string;
  setValue: (value: string) => void;
}

interface Selection {
  start: number;
  end: number;
  isSelected: boolean;
}

function InputWithCaret({
  propmtElement,
  value,
  setValue,
  visible = true,
  ...props
}: InputWithCaretProps): JSX.Element {
  const inpRef: MutableRefObject<HTMLInputElement | null> =
    useRef<null | HTMLInputElement>(null);

  const [selection, setSelection] = useState<Selection>({
    start: 0,
    end: 0,
    isSelected: false,
  });

  const onValueChange: ChangeEventHandler<HTMLInputElement> = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setValue(e.target.value);
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
      <div className={`flex w-full flex-wrap break-all whitespace-pre-wrap`}>
        {propmtElement}
        {visible && (
          <>
            {value
              .slice(0, selection.start)
              .split("")
              .map((char: string, idx: number): ReactNode => {
                return <span key={idx}>{char}</span>;
              })}
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
            {value
              .slice(selection.isSelected ? selection.end : selection.start + 1)
              .split("")
              .map((char: string, idx: number): ReactNode => {
                return <span key={idx}>{char}</span>;
              })}
          </>
        )}
      </div>
    </div>
  );
}

export default InputWithCaret;
