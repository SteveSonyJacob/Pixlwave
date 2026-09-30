import { WorkspaceLayout } from "@/components/workspace-layout";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <WorkspaceLayout role="admin">{children}</WorkspaceLayout>; }
