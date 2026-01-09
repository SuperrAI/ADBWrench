'use client';

import { BookOpen, Calendar, FolderOpen, Home, Users } from 'lucide-react';
import { ClassData, ClassSidebar } from '@/components/class/class-sidebar';

interface ClassFeaturesProps {
  classData: ClassData;
}

export function ClassFeatures({ classData }: ClassFeaturesProps) {
  const classFeatures = [
    { title: 'Home', url: `/class/${classData.id}/home`, icon: Home },
    { title: 'People', url: `/class/${classData.id}/people`, icon: Users },
    { title: 'Time Table', url: `/class/${classData.id}/timetable`, icon: Calendar },
    { title: 'Files', url: `/class/${classData.id}/files`, icon: FolderOpen },
    { title: 'Homework', url: `/class/${classData.id}/homework`, icon: BookOpen },
  ];

  return <ClassSidebar features={classFeatures} classData={classData} />;
}
