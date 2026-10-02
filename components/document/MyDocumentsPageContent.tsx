'use client';

import { FolderOpen } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import PageHeader from '@/components/ui/PageHeader';
import DocumentListContent from './DocumentListContent';

/** The signed-in Student/Parent's own documents — upload, edit and track verification. */
export default function MyDocumentsPageContent() {
  return (
    <div className="space-y-4">
      <SetPageTitle title="My Documents" />
      <PageHeader
        icon={FolderOpen}
        title="My Documents"
        description="Upload your documents and track whether the school has verified them."
      />
      <DocumentListContent mode="my" />
    </div>
  );
}
