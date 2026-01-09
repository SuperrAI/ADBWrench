'use client';

import { createContext, useContext, PropsWithChildren, useState, useRef, RefObject } from 'react';

type CardStyle = 'transparent' | 'default' | 'edge-to-edge';
type ScrollBehavior = 'all' | 'left-only' | 'right-only' | 'none';
type LayoutType = '3-col' | '4-col' | '2-col' | '1-col';

interface HeaderProps {
  title?: string;
  showDropdown?: boolean;
  backgroundColor?: string;
  width?: string | number;
  height?: string | number;
  centerContent?: React.ReactNode;
}

interface LayoutContextType {
  cardStyle: CardStyle;
  setCardStyle: (style: CardStyle) => void;
  cardScrollBehavior: ScrollBehavior;
  setCardScrollBehavior: (behavior: ScrollBehavior) => void;
  showFilterModal: boolean;
  toggleFilterModal: () => void;
  filterButtonRef: RefObject<HTMLDivElement>;
  showHeader: boolean;
  setShowHeader: (show: boolean) => void;
  layoutType: LayoutType;
  setLayoutType: (type: LayoutType) => void;
  headerProps: HeaderProps;
  setHeaderProps: (props: HeaderProps) => void;
  isSideNavHovered: boolean;
  setIsSideNavHovered: (hovered: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  cardStyle: 'default',
  setCardStyle: () => {},
  cardScrollBehavior: 'all',
  setCardScrollBehavior: () => {},
  showFilterModal: false,
  toggleFilterModal: () => {},
  filterButtonRef: { current: null },
  showHeader: true,
  setShowHeader: () => {},
  layoutType: '3-col',
  setLayoutType: () => {},
  headerProps: {},
  setHeaderProps: () => {},
  isSideNavHovered: false,
  setIsSideNavHovered: () => {},
});

export function LayoutProvider({ children }: PropsWithChildren) {
  const [cardStyle, setCardStyle] = useState<CardStyle>('default');
  const [cardScrollBehavior, setCardScrollBehavior] = useState<ScrollBehavior>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [layoutType, setLayoutType] = useState<LayoutType>('3-col');
  const [headerProps, setHeaderProps] = useState<HeaderProps>({});
  const [isSideNavHovered, setIsSideNavHovered] = useState(false);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  const toggleFilterModal = () => {
    setShowFilterModal((prev) => !prev);
  };

  return (
    <LayoutContext.Provider
      value={{
        cardStyle,
        setCardStyle,
        cardScrollBehavior,
        setCardScrollBehavior,
        showFilterModal,
        toggleFilterModal,
        filterButtonRef,
        showHeader,
        setShowHeader,
        layoutType,
        setLayoutType,
        headerProps,
        setHeaderProps,
        isSideNavHovered,
        setIsSideNavHovered,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
