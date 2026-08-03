import type { ReactNode } from "react";

type DetailItem = {
  label: string;
  value: ReactNode;
  breakValue?: boolean;
};

const DetailsList = ({ items }: { items: DetailItem[] }) => {
  return (
    <dl className="space-y-2 text-xs">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted">{item.label}</dt>
          <dd className={item.breakValue ? "break-all" : undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default DetailsList;
