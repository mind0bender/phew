interface PromptProps {
  name: string;
  path: string;
}

function Prompt({ name, path }: PromptProps): JSX.Element {
  return (
    <span>
      <span className={`text-primary-400 font-semibold`}>{name}@phew</span>
      <span className={`pr-2`}>
        :<span className={`text-cyan-400`}>{path}</span>$
      </span>
    </span>
  );
}

export default Prompt;
