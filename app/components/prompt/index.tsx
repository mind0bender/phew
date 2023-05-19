interface PromptProps {
  name: string;
}

function Prompt({ name }: PromptProps): JSX.Element {
  return (
    <span>
      <span className={`text-primary-400 font-semibold`}>{name}@phew</span>
      <span className={`pr-2`}>:/$</span>
    </span>
  );
}

export default Prompt;
