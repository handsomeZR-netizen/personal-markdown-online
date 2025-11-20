import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AISearchBarLazy, AIQAInterfaceLazy } from '@/components/ai-components-lazy';
import { Sparkles, Search, MessageCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AIPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t('ai.aiFeatures')}</h1>
        </div>
        <p className="text-muted-foreground">
          使用 AI 功能增强您的笔记管理体验
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="min-h-[44px]">
            <Search className="h-4 w-4 mr-2" />
            {t('ai.semanticSearch')}
          </TabsTrigger>
          <TabsTrigger value="qa" className="min-h-[44px]">
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('ai.naturalLanguageQuery')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <AISearchBarLazy />
        </TabsContent>

        <TabsContent value="qa" className="mt-6">
          <AIQAInterfaceLazy />
        </TabsContent>
      </Tabs>
    </div>
  );
}
