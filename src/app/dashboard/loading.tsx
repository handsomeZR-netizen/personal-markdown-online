import { CreativeLoader } from '@/components/ui/creative-loader';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-4 max-w-7xl min-h-screen flex items-center justify-center">
      <CreativeLoader variant="orbit" size="lg" message="加载仪表盘..." />
    </div>
  );
}
