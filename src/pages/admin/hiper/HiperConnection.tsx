import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plug, AlertTriangle, Unplug, ListTree, FlaskConical } from 'lucide-react';
import HiperConnectionsTab from './HiperConnectionsTab';
import HiperEndpointsTab from './HiperEndpointsTab';
import HiperPlayground from './HiperPlayground';

// ============================================================
// Main Hiper ERP Page — Tabbed Layout
// ============================================================

const HiperConnection: React.FC = () => {
    const [activeTab, setActiveTab] = useState('conexoes');
    const [activeConnectionId, setActiveConnectionId] = useState<number | null>(null);

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30">
                        <Plug className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Conexão ERP Hiper
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Gerencie conexões, endpoints e execute requests no Hiper Gestão Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="conexoes" className="gap-1.5">
                        <Unplug className="h-4 w-4" />
                        <span className="hidden sm:inline">Conexões</span>
                    </TabsTrigger>
                    <TabsTrigger value="endpoints" className="gap-1.5">
                        <ListTree className="h-4 w-4" />
                        <span className="hidden sm:inline">Endpoints</span>
                    </TabsTrigger>
                    <TabsTrigger value="playground" className="gap-1.5">
                        <FlaskConical className="h-4 w-4" />
                        <span className="hidden sm:inline">Playground</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Conexões */}
                <TabsContent value="conexoes" className="mt-6">
                    <HiperConnectionsTab
                        activeConnectionId={activeConnectionId}
                        onConnectionChange={setActiveConnectionId}
                    />
                </TabsContent>

                {/* Tab 2: Endpoints */}
                <TabsContent value="endpoints" className="mt-6">
                    <HiperEndpointsTab />
                </TabsContent>

                {/* Tab 3: Playground */}
                <TabsContent value="playground" className="mt-6">
                    <HiperPlayground />
                </TabsContent>
            </Tabs>

            {/* Cookie Expiry Warning */}
            <Alert className="border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertTitle className="text-amber-400 text-sm">Lembrete sobre cookies</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                    Os cookies do Hiper Gestão expiram periodicamente. Se os requests começarem a retornar
                    erro 401/403, reimporte os cookies na aba Conexões.
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default HiperConnection;
