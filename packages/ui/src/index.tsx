export type ButtonProps = {
  label: string;
  href?: string;
};

export function Button({ label, href }: ButtonProps) {
  const className =
    "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/18";
  if (href) {
    return (
      <a className={className} href={href}>
        {label}
      </a>
    );
  }
  return <button className={className}>{label}</button>;
}

