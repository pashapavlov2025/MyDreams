import ProjectDetailClient from './client';

export async function generateStaticParams() {
  return [{ id: '0' }];
}

export default function ProjectPage() {
  return <ProjectDetailClient />;
}
