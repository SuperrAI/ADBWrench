import clsx from 'clsx';

interface GridLayoutProps {
  columnLayout: number[];
  totalColumns?: number;
  children: React.ReactNode;
}

const mapGridColsToClassName = (totalColumns: number) => {
  return {
    '1': 'grid-cols-1',
    '2': 'grid-cols-2',
    '3': 'grid-cols-3',
    '4': 'grid-cols-4',
    '5': 'grid-cols-5',
    '6': 'grid-cols-6',
    '7': 'grid-cols-7',
    '8': 'grid-cols-8',
  }[totalColumns];
};

const mapColSpanToClassName = (colSpan: number) => {
  return {
    '1': 'col-span-1',
    '2': 'col-span-2',
    '3': 'col-span-3',
    '4': 'col-span-4',
    '5': 'col-span-5',
    '6': 'col-span-6',
    '7': 'col-span-7',
    '8': 'col-span-8',
  }[colSpan];
};

const GridLayout: React.FC<GridLayoutProps> = ({ columnLayout, totalColumns = 4, children }) => {
  return (
    <div className={clsx('grid gap-5 p-5 h-full', mapGridColsToClassName(totalColumns))}>
      {columnLayout.map((span, index) => (
        <div key={index} className={clsx('h-full', mapColSpanToClassName(span))}>
          {Array.isArray(children) ? children[index] : children}
        </div>
      ))}
    </div>
  );
};

export default GridLayout;
