'use client';

import { useParams } from 'next/navigation';
import ProjectDetailContent from '@/components/ProjectDetailContent';

export default function ProjectDetailClient() {
  const params = useParams();
  const id = Number(params.id);
  if (!id) return null;
  return <ProjectDetailContent projectId={id} />;
}
