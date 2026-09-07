export function Swatch({ value }: { value: string }) {
  return <div className="swatch" style={{ background: value }} title={value} />;
}
