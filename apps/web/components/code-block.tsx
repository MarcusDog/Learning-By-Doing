type CodeBlockProps = {
  label: string;
  code: string;
};

export function CodeBlock({ label, code }: CodeBlockProps) {
  return (
    <div className="code-card">
      <div className="code-title">{label}</div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
