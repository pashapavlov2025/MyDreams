'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProjectDetailContent from '@/components/ProjectDetailContent';
import LoadingScreen from '@/components/LoadingScreen';

function ProjectDetailInner() {
  const id = Number(useSearchParams().get('id'));
  if (!id) return null;
  return <ProjectDetailContent projectId={id} />;
}

export default function ProjectDetailClient() {
  // useSearchParams требует Suspense: страница пререндерится без параметров,
  // они приезжают только на клиенте
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProjectDetailInner />
    </Suspense>
  );
}
