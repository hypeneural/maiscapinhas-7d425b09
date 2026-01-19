/**
 * Wheel Segment Editor Page
 * 
 * Visual editor for configuring wheel segments.
 * Super Admin only.
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Plus,
    Save,
    GripVertical,
    Trash2,
    Gift,
    AlertCircle,
} from 'lucide-react';
import {
    useWheelCampaign,
    useWheelSegments,
    useWheelPrizes,
    useSyncSegments,
} from '@/hooks/api/use-wheel';
import { useToast } from '@/hooks/use-toast';
import type { SegmentInput, WheelSegment } from '@/types/wheel.types';

const SEGMENT_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#000000', // Black
    '#FFFFFF', // White
];

interface SegmentItemProps {
    segment: SegmentInput & { id?: number };
    index: number;
    totalWeight: number;
    onUpdate: (index: number, data: Partial<SegmentInput>) => void;
    onDelete: (index: number) => void;
    prizes: { id: number; name: string; type: string }[];
}

function SegmentItem({ segment, index, totalWeight, onUpdate, onDelete, prizes }: SegmentItemProps) {
    const percentage = totalWeight > 0 ? ((segment.probability_weight / totalWeight) * 100).toFixed(1) : '0';

    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors">
            <div className="cursor-move text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>

            <div
                className="w-8 h-8 rounded-lg border-2 cursor-pointer"
                style={{ backgroundColor: segment.color }}
                onClick={() => {
                    const currentIndex = SEGMENT_COLORS.indexOf(segment.color);
                    const nextIndex = (currentIndex + 1) % SEGMENT_COLORS.length;
                    onUpdate(index, { color: SEGMENT_COLORS[nextIndex] });
                }}
            />

            <Input
                value={segment.label}
                onChange={(e) => onUpdate(index, { label: e.target.value })}
                className="flex-1"
                placeholder="Texto do segmento"
            />

            <Select
                value={segment.prize_id?.toString() || ''}
                onValueChange={(value) => onUpdate(index, { prize_id: Number(value) })}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione prêmio" />
                </SelectTrigger>
                <SelectContent>
                    {prizes.map((prize) => (
                        <SelectItem key={prize.id} value={prize.id.toString()}>
                            {prize.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2 w-[120px]">
                <Input
                    type="number"
                    min={1}
                    value={segment.probability_weight}
                    onChange={(e) => onUpdate(index, { probability_weight: Number(e.target.value) || 1 })}
                    className="w-16"
                />
                <span className="text-sm text-muted-foreground">
                    {percentage}%
                </span>
            </div>

            <Switch
                checked={segment.active !== false}
                onCheckedChange={(checked) => onUpdate(index, { active: checked })}
            />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(index)}
                className="text-destructive hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

function WheelPreview({ segments }: { segments: SegmentInput[] }) {
    const totalWeight = segments.reduce((sum, s) => sum + (s.active !== false ? s.probability_weight : 0), 0);
    const activeSegments = segments.filter(s => s.active !== false);

    if (activeSegments.length === 0) {
        return (
            <div className="aspect-square flex items-center justify-center bg-muted rounded-full">
                <p className="text-muted-foreground">Sem segmentos</p>
            </div>
        );
    }

    // Calculate angles for each segment
    let currentAngle = 0;
    const segmentAngles = activeSegments.map(segment => {
        const percentage = segment.probability_weight / totalWeight;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        currentAngle += angle;
        return { ...segment, startAngle, angle };
    });

    return (
        <div className="aspect-square relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {segmentAngles.map((segment, index) => {
                    const startRad = (segment.startAngle - 90) * (Math.PI / 180);
                    const endRad = (segment.startAngle + segment.angle - 90) * (Math.PI / 180);

                    const x1 = 50 + 45 * Math.cos(startRad);
                    const y1 = 50 + 45 * Math.sin(startRad);
                    const x2 = 50 + 45 * Math.cos(endRad);
                    const y2 = 50 + 45 * Math.sin(endRad);

                    const largeArcFlag = segment.angle > 180 ? 1 : 0;

                    const d = `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    return (
                        <path
                            key={index}
                            d={d}
                            fill={segment.color}
                            stroke="white"
                            strokeWidth="0.5"
                        />
                    );
                })}
                <circle cx="50" cy="50" r="8" fill="white" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-primary" />
            </div>
        </div>
    );
}

export default function WheelSegmentEditor() {
    const { key } = useParams<{ key: string }>();
    const { toast } = useToast();

    const { data: campaignData, isLoading: campaignLoading } = useWheelCampaign(key || '');
    const { data: segmentsData, isLoading: segmentsLoading } = useWheelSegments(key || '');
    const { data: prizesData } = useWheelPrizes({ active: true });
    const syncSegments = useSyncSegments();

    const [segments, setSegments] = useState<(SegmentInput & { id?: number })[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newSegment, setNewSegment] = useState<SegmentInput>({
        label: '',
        color: SEGMENT_COLORS[0],
        prize_id: 0,
        probability_weight: 10,
        active: true,
    });
    const [hasChanges, setHasChanges] = useState(false);

    const campaign = campaignData?.data;
    const prizes = prizesData?.data || [];

    // Initialize segments from API
    useEffect(() => {
        if (segmentsData?.data) {
            setSegments(segmentsData.data.map((s: WheelSegment) => ({
                id: s.id,
                segment_key: s.segment_key,
                label: s.label,
                color: s.color,
                prize_id: s.prize_id,
                probability_weight: s.probability_weight,
                active: s.active,
            })));
        }
    }, [segmentsData]);

    const totalWeight = segments.reduce((sum, s) => sum + (s.active !== false ? s.probability_weight : 0), 0);

    const handleUpdateSegment = (index: number, data: Partial<SegmentInput>) => {
        setSegments(prev => prev.map((s, i) => i === index ? { ...s, ...data } : s));
        setHasChanges(true);
    };

    const handleDeleteSegment = (index: number) => {
        setSegments(prev => prev.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    const handleAddSegment = () => {
        if (!newSegment.label || !newSegment.prize_id) {
            toast({
                title: 'Erro',
                description: 'Preencha o texto e selecione um prêmio.',
                variant: 'destructive',
            });
            return;
        }

        setSegments(prev => [...prev, { ...newSegment }]);
        setNewSegment({
            label: '',
            color: SEGMENT_COLORS[segments.length % SEGMENT_COLORS.length],
            prize_id: 0,
            probability_weight: 10,
            active: true,
        });
        setAddDialogOpen(false);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!key) return;

        try {
            await syncSegments.mutateAsync({
                campaignKey: key,
                segments: segments.map(s => ({
                    id: s.id,
                    label: s.label,
                    color: s.color,
                    prize_id: s.prize_id,
                    probability_weight: s.probability_weight,
                    active: s.active,
                })),
            });
            setHasChanges(false);
            toast({
                title: 'Salvo',
                description: 'Os segmentos foram salvos com sucesso.',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar os segmentos.',
                variant: 'destructive',
            });
        }
    };

    if (campaignLoading || segmentsLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/wheel/campaigns">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Campanha não encontrada</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/wheel/campaigns/${key}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Configurar Roleta</h1>
                        <p className="text-muted-foreground">{campaign.name}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={!hasChanges || syncSegments.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {syncSegments.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                {/* Segment List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Segmentos da Roleta</CardTitle>
                            <CardDescription>
                                Peso total: {totalWeight} • Arraste para reordenar
                            </CardDescription>
                        </div>
                        <Button onClick={() => setAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {segments.length === 0 ? (
                            <div className="text-center py-12">
                                <Gift className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-lg font-medium">Nenhum segmento</p>
                                <p className="text-muted-foreground">
                                    Adicione segmentos para configurar a roleta.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {segments.map((segment, index) => (
                                    <SegmentItem
                                        key={segment.id || index}
                                        segment={segment}
                                        index={index}
                                        totalWeight={totalWeight}
                                        onUpdate={handleUpdateSegment}
                                        onDelete={handleDeleteSegment}
                                        prizes={prizes}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WheelPreview segments={segments} />
                        </CardContent>
                    </Card>

                    {/* Validation */}
                    {segments.length > 0 && (
                        <Card className={campaign.can_activate ? 'border-green-500/50' : 'border-amber-500/50'}>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {segments.filter(s => s.active !== false).length >= 1 ? (
                                            <Badge className="bg-green-500/10 text-green-600">✓</Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/10 text-amber-600">!</Badge>
                                        )}
                                        <span className="text-sm">Pelo menos 1 segmento ativo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {segments.every(s => s.probability_weight >= 1) ? (
                                            <Badge className="bg-green-500/10 text-green-600">✓</Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/10 text-amber-600">!</Badge>
                                        )}
                                        <span className="text-sm">Todos com peso ≥ 1</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {segments.every(s => s.prize_id > 0) ? (
                                            <Badge className="bg-green-500/10 text-green-600">✓</Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/10 text-amber-600">!</Badge>
                                        )}
                                        <span className="text-sm">Todos com prêmio vinculado</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Add Segment Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Segmento</DialogTitle>
                        <DialogDescription>
                            Configure uma nova fatia da roleta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Texto do Segmento *</Label>
                            <Input
                                placeholder="Ex: Película Grátis"
                                value={newSegment.label}
                                onChange={(e) => setNewSegment({ ...newSegment, label: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Máximo 50 caracteres</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="flex gap-2 flex-wrap">
                                {SEGMENT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className={`w-8 h-8 rounded-lg border-2 ${newSegment.color === color ? 'ring-2 ring-primary ring-offset-2' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewSegment({ ...newSegment, color })}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Prêmio Vinculado *</Label>
                            <Select
                                value={newSegment.prize_id?.toString() || ''}
                                onValueChange={(value) => setNewSegment({ ...newSegment, prize_id: Number(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um prêmio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {prizes.map((prize) => (
                                        <SelectItem key={prize.id} value={prize.id.toString()}>
                                            {prize.icon} {prize.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Peso da Probabilidade *</Label>
                            <Input
                                type="number"
                                min={1}
                                value={newSegment.probability_weight}
                                onChange={(e) => setNewSegment({ ...newSegment, probability_weight: Number(e.target.value) || 1 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Quanto maior o peso, maior a chance de cair nesta fatia
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddSegment}>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unsaved changes warning */}
            {hasChanges && (
                <Card className="border-amber-500/50 bg-amber-500/5 fixed bottom-4 left-1/2 -translate-x-1/2 w-auto">
                    <CardContent className="p-3 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="text-sm font-medium">Alterações não salvas</span>
                        <Button size="sm" onClick={handleSave} disabled={syncSegments.isPending}>
                            Salvar Agora
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
