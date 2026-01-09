'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ClassHeaderProps {
  className?: string;
  title: string;
}

export function ClassHeader({ className = '', title }: ClassHeaderProps) {
  const pathname = usePathname();
  const classId = pathname.split('/')[2];
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const tabs = [
    { name: 'Home', href: `/class/${classId}/home` },
    { name: 'People', href: `/class/${classId}/people` },
    { name: 'Files', href: `/class/${classId}/files` },
    { name: 'Homework', href: `/class/${classId}/homework` },
    { name: 'Timetable', href: `/class/${classId}/timetable` },
  ];

  useEffect(() => {
    const activeTab = tabsRef.current[tabs.findIndex((tab) => tab.href === pathname)];
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [pathname]);

  return (
    <div className={`px-4 mb-8 pb-2 ${className}`}>
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-primary mb-5">{title}</h1>
      <div className="relative flex items-center gap-5">
        <div
          className="absolute h-[2px] bg-primary transition-all duration-300 ease-in-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            bottom: -8,
          }}
        />
        {tabs.map((tab, index) => (
          <Link
            key={tab.name}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            href={tab.href}
            className={`relative font-medium text-base hover:text-primary transition-colors ${
              pathname === tab.href ? 'text-primary' : 'text-neutral-500'
            }`}
          >
            <span className="truncate leading-normal">{tab.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
