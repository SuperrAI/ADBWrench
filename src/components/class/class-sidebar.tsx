'use client';

import { ArrowLeft, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface ClassFeature {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface ClassData {
  id: number;
  name: string;
  teacher: string;
}

export function ClassSidebar({
  features,
  classData,
}: {
  features: ClassFeature[];
  classData: ClassData;
}) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex flex-col items-start gap-2 px-4 pb-2">
          <Button variant="link" size="default" className="px-0" asChild>
            <Link href="/home">
              <ArrowLeft className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1">
            <h2 className="text-sm font-semibold truncate">{classData.name}</h2>
            <p className="text-sm text-neutral-500 truncate">{classData.teacher}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {features.map((feature) => (
              <SidebarMenuItem key={feature.title}>
                <SidebarMenuButton asChild isActive={pathname === feature.url}>
                  <Link href={feature.url}>
                    <feature.icon className="h-4 w-4 shrink-0" />
                    <span>{feature.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
