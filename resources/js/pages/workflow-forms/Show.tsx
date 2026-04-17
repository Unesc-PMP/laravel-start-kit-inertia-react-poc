import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowRightLeft,
    Check,
    Clock,
    FilePenLine,
    GraduationCap,
    ScrollText,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { show as workflowFormShow, submit as workflowFormSubmit } from '@/routes/workflow-forms';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const CHOICE_ICON_MAP: Record<string, LucideIcon> = {
    ScrollText,
    GraduationCap,
    FilePenLine,
    ArrowRightLeft,
};

type ChoiceCardDef = {
    value: string;
    label: string;
    description?: string;
    icon?: string;
};

type FormField = {
    key: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string;
    choices?: ChoiceCardDef[];
};

type Step = {
    title: string;
    description?: string | null;
    submit_label: string;
    fields: FormField[];
};

type ProgressStep = {
    node_id: number;
    label: string;
    node_key: string;
    state: 'completed' | 'current' | 'pending';
    completed_at: string | null;
    summary_lines: string[];
    description?: string | null;
    actor_name?: string | null;
};

type ProgressPayload = {
    workflow_name: string;
    workflow_description?: string | null;
    steps: ProgressStep[];
};

type TimelineHeadingRow = { type: 'heading'; title: string; reactKey: string };
type TimelineStepRow = { type: 'step'; step: ProgressStep; displayIndex: number; reactKey: string };

type Props = {
    token: string;
    step: Step;
    run_id: number;
    prefill: Record<string, unknown>;
    previous_token: string | null;
    progress: ProgressPayload;
};

function normalizeChoices(raw: unknown): ChoiceCardDef[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    const out: ChoiceCardDef[] = [];
    for (const row of raw) {
        if (!row || typeof row !== 'object') {
            continue;
        }
        const r = row as Record<string, unknown>;
        const value = r.value;
        const label = r.label;
        if (typeof value !== 'string' || typeof label !== 'string') {
            continue;
        }
        out.push({
            value,
            label,
            description: typeof r.description === 'string' ? r.description : undefined,
            icon: typeof r.icon === 'string' ? r.icon : undefined,
        });
    }

    return out;
}

function buildInitialData(fields: FormField[]): Record<string, string | boolean | number> {
    const data: Record<string, string | boolean | number> = {};
    for (const f of fields) {
        if (f.type === 'boolean') {
            data[f.key] = false;
        } else if (f.type === 'number') {
            data[f.key] = '';
        } else {
            data[f.key] = '';
        }
    }

    return data;
}

function mergeInitialData(fields: FormField[], prefill: Record<string, unknown>): Record<string, string | boolean | number> {
    const data = buildInitialData(fields);
    for (const f of fields) {
        if (!Object.prototype.hasOwnProperty.call(prefill, f.key)) {
            continue;
        }
        const v = prefill[f.key];
        if (f.type === 'boolean') {
            data[f.key] = v === true || v === 1 || v === '1' || v === 'true';
        } else if (f.type === 'number') {
            if (typeof v === 'number' && !Number.isNaN(v)) {
                data[f.key] = v;
            } else if (typeof v === 'string' && v !== '') {
                data[f.key] = Number(v);
            }
        } else {
            data[f.key] = v == null ? '' : String(v);
        }
    }

    return data;
}

function parseSelectOptions(csv?: string): string[] {
    if (!csv) {
        return [];
    }

    return csv.split(',').map((s) => s.trim()).filter(Boolean);
}

function formatWhen(iso: string | null): string {
    if (!iso) {
        return '';
    }
    try {
        return new Intl.DateTimeFormat('pt-PT', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function formatTimeOnly(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(iso));
    } catch {
        return '—';
    }
}

function formatShortDate(iso: string | null): string {
    if (!iso) {
        return '';
    }
    try {
        return new Intl.DateTimeFormat('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

/** Cabeçalho de grupo estilo agenda (ex.: seg., 17 de abr.) */
function formatDateGroupHeading(iso: string): string {
    try {
        return new Intl.DateTimeFormat('pt-PT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).format(new Date(iso));
    } catch {
        return formatShortDate(iso);
    }
}

function calendarDayKey(iso: string): string {
    const d = new Date(iso);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function stepSectionKey(s: ProgressStep): string {
    if (s.state === 'pending') {
        return '__pending__';
    }
    if (s.state === 'current') {
        return '__current__';
    }
    if (s.completed_at) {
        return `day:${calendarDayKey(s.completed_at)}`;
    }

    return '__other__';
}

function stepSectionTitle(key: string, sampleIso: string | null): string {
    if (key === '__pending__') {
        return 'Pendentes';
    }
    if (key === '__current__') {
        return 'Em curso';
    }
    if (key === '__other__') {
        return 'Etapas';
    }
    if (key.startsWith('day:') && sampleIso) {
        return formatDateGroupHeading(sampleIso);
    }

    return 'Etapas';
}

function initialsFromLabel(label: string): string {
    const compact = label.replace(/[^\p{L}\d]/gu, '').slice(0, 2);
    if (compact.length >= 2) {
        return compact.toUpperCase();
    }

    return label
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '—';
}

function stateBadge(state: ProgressStep['state']): { label: string; variant: 'default' | 'secondary' | 'outline' } {
    if (state === 'completed') {
        return { label: 'Concluída', variant: 'outline' };
    }
    if (state === 'current') {
        return { label: 'Em curso', variant: 'default' };
    }

    return { label: 'Pendente', variant: 'outline' };
}

function stepStatusDotClass(state: ProgressStep['state']): string {
    if (state === 'completed') {
        return 'bg-emerald-500';
    }
    if (state === 'current') {
        return 'bg-sky-500';
    }

    return 'bg-amber-500';
}

function stepPrimaryDescription(s: ProgressStep): string | null {
    const d = s.description?.trim();
    if (s.state === 'pending') {
        return d || 'Esta etapa será executada depois de concluir as etapas anteriores.';
    }

    return d || null;
}

function stepSecondaryHint(s: ProgressStep): string | null {
    if (s.state === 'current') {
        return 'Preencha o formulário à esquerda e utilize o botão de envio para avançar.';
    }

    return null;
}

function FormStepsSegmentBar({ progress, step }: { progress: ProgressPayload; step: Step }) {
    const formSteps = useMemo(
        () => progress.steps.filter((s) => s.node_key === 'form_step'),
        [progress.steps],
    );
    const currentIdx = formSteps.findIndex((s) => s.state === 'current');
    const total = formSteps.length;

    if (total < 2 || currentIdx < 0) {
        return null;
    }

    const tag = step.title.replace(/\.$/, '').toUpperCase();

    return (
        <div className="space-y-2">
            <div className="flex gap-1" role="presentation">
                {Array.from({ length: total }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1 min-w-0 flex-1 rounded-full transition-colors',
                            i <= currentIdx ? 'bg-foreground' : 'bg-muted',
                        )}
                    />
                ))}
            </div>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider">
                ETAPA {currentIdx + 1} DE {total} · {tag}
            </p>
        </div>
    );
}

function ChoiceCardsField({
    field,
    value,
    onChange,
    error,
}: {
    field: FormField;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    const choices = normalizeChoices(field.choices);

    return (
        <fieldset className="grid gap-3">
            <legend className="sr-only">{field.label}</legend>
            <div className="grid gap-3" role="radiogroup" aria-label={field.label}>
                {choices.map((choice) => {
                    const selected = value === choice.value;
                    const Icon = (choice.icon && CHOICE_ICON_MAP[choice.icon]) || ScrollText;

                    return (
                        <button
                            key={choice.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                                onChange(choice.value);
                            }}
                            className={cn(
                                'border-input flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors',
                                'hover:bg-muted/40 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                                selected ? 'border-foreground bg-muted/20' : 'border-border bg-background',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-12 shrink-0 items-center justify-center rounded-lg',
                                    selected ? 'bg-foreground text-background' : 'bg-muted text-foreground',
                                )}
                            >
                                <Icon className="size-5" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold">{choice.label}</span>
                                {choice.description ? (
                                    <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">
                                        {choice.description}
                                    </span>
                                ) : null}
                            </span>
                            <span className="flex shrink-0 items-center pt-0.5">
                                {selected ? (
                                    <span className="bg-foreground flex size-7 items-center justify-center rounded-full text-background">
                                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                                    </span>
                                ) : (
                                    <span className="border-input size-7 rounded-full border-2 border-dashed opacity-40" />
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
            <InputError message={error} />
        </fieldset>
    );
}

function ProgressPanel({
    progress,
    run_id,
}: {
    progress: ProgressPayload;
    run_id: number;
}) {
    const [scope, setScope] = useState<'all' | 'forms'>('all');

    const formStepCount = useMemo(
        () => progress.steps.filter((s) => s.node_key === 'form_step').length,
        [progress.steps],
    );

    const showStepFilter = useMemo(
        () => formStepCount > 0 && progress.steps.some((s) => s.node_key !== 'form_step'),
        [formStepCount, progress.steps],
    );

    const displayedSteps = useMemo(() => {
        if (scope === 'forms') {
            return progress.steps.filter((s) => s.node_key === 'form_step');
        }

        return progress.steps;
    }, [progress.steps, scope]);

    const timelineRows = useMemo((): (TimelineHeadingRow | TimelineStepRow)[] => {
        const out: (TimelineHeadingRow | TimelineStepRow)[] = [];
        let prevSectionKey: string | null = null;

        displayedSteps.forEach((step, index) => {
            const sectionKey = stepSectionKey(step);
            if (sectionKey !== prevSectionKey) {
                out.push({
                    type: 'heading',
                    title: stepSectionTitle(sectionKey, step.completed_at),
                    reactKey: `heading-${sectionKey}-${index}`,
                });
                prevSectionKey = sectionKey;
            }
            out.push({
                type: 'step',
                step,
                displayIndex: index + 1,
                reactKey: `step-${step.node_id}`,
            });
        });

        return out;
    }, [displayedSteps]);

    const stepOnlyRows = useMemo(
        () => timelineRows.filter((r): r is TimelineStepRow => r.type === 'step'),
        [timelineRows],
    );

    return (
        <aside
            className={cn(
                'border-border bg-background flex min-h-0 w-full shrink-0 flex-col border-t lg:w-[min(28rem,40vw)] lg:max-w-md lg:border-t-0 lg:border-l',
            )}
            aria-labelledby="workflow-progress-heading"
        >
            <div className="scrollbar-discrete flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-5">
                <header className="space-y-1">
                    <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-wide uppercase">
                        Execução #{run_id}
                    </p>
                    <h2 id="workflow-progress-heading" className="text-lg font-semibold tracking-tight">
                        Andamento
                    </h2>
                    <p className="text-muted-foreground text-sm leading-snug">{progress.workflow_name}</p>
                    {progress.workflow_description ? (
                        <p className="text-muted-foreground pt-0.5 text-xs leading-relaxed whitespace-pre-wrap">
                            {progress.workflow_description}
                        </p>
                    ) : null}
                </header>

                {showStepFilter ? (
                    <ToggleGroup
                        type="single"
                        value={scope}
                        onValueChange={(v) => {
                            if (v === 'all' || v === 'forms') {
                                setScope(v);
                            }
                        }}
                        variant="outline"
                        size="sm"
                        className="grid w-full grid-cols-2 gap-0 shadow-none"
                    >
                        <ToggleGroupItem value="all" className="text-xs">
                            Todas as etapas
                        </ToggleGroupItem>
                        <ToggleGroupItem value="forms" className="text-xs">
                            Só formulários
                        </ToggleGroupItem>
                    </ToggleGroup>
                ) : null}

                <Separator />

                <div className="flex flex-col pb-2" role="list">
                    {timelineRows.map((row, rowIdx) => {
                        if (row.type === 'heading') {
                            return (
                                <div
                                    key={row.reactKey}
                                    className={cn(
                                        'text-muted-foreground pb-2 text-xs font-medium tracking-wide',
                                        rowIdx > 0 && 'pt-8',
                                    )}
                                >
                                    {row.title}
                                </div>
                            );
                        }

                        const s = row.step;
                        const b = stateBadge(s.state);
                        const stepNo = String(row.displayIndex).padStart(2, '0');
                        const totalShown = String(displayedSteps.length).padStart(2, '0');
                        const stepIndexAmongSteps = stepOnlyRows.findIndex((r) => r.step.node_id === s.node_id);
                        const isLastStep =
                            stepIndexAmongSteps >= 0 && stepIndexAmongSteps === stepOnlyRows.length - 1;

                        return (
                            <div key={row.reactKey} className="flex items-stretch gap-0" role="listitem">
                                <div className="text-muted-foreground w-[4.5rem] shrink-0 pt-0.5 text-right font-mono tabular-nums">
                                    {s.state === 'completed' && s.completed_at ? (
                                        <>
                                            <p className="text-foreground text-base font-semibold leading-none tracking-tight">
                                                {formatTimeOnly(s.completed_at)}
                                            </p>
                                            <p className="mt-1 text-xs leading-none opacity-80">
                                                {formatShortDate(s.completed_at)}
                                            </p>
                                            <p className="mt-2 flex items-center justify-end gap-1 text-[10px] leading-none opacity-80">
                                                <Clock className="size-3 shrink-0 opacity-70" aria-hidden />
                                                <span>
                                                    Etapa {stepNo}/{totalShown}
                                                </span>
                                            </p>
                                        </>
                                    ) : null}
                                    {s.state === 'current' ? (
                                        <>
                                            <p className="text-foreground text-base font-semibold leading-none">•</p>
                                            <p className="mt-1 text-xs leading-none opacity-80">Agora</p>
                                            <p className="mt-2 flex items-center justify-end gap-1 text-[10px] leading-none opacity-80">
                                                <Clock className="size-3 shrink-0 opacity-70" aria-hidden />
                                                <span>
                                                    Etapa {stepNo}/{totalShown}
                                                </span>
                                            </p>
                                        </>
                                    ) : null}
                                    {s.state === 'pending' ? (
                                        <>
                                            <p className="text-foreground text-base font-semibold leading-none tracking-tight opacity-35">
                                                —
                                            </p>
                                            <p className="mt-1 text-xs leading-none opacity-70">A seguir</p>
                                            <p className="mt-2 flex items-center justify-end gap-1 text-[10px] leading-none opacity-80">
                                                <Clock className="size-3 shrink-0 opacity-70" aria-hidden />
                                                <span>
                                                    Etapa {stepNo}/{totalShown}
                                                </span>
                                            </p>
                                        </>
                                    ) : null}
                                </div>

                                <div className="relative flex w-6 shrink-0 flex-col items-center self-stretch pt-1">
                                    {!isLastStep ? (
                                        <div
                                            className="bg-border absolute top-[13px] bottom-0 left-1/2 w-px -translate-x-1/2"
                                            aria-hidden
                                        />
                                    ) : null}
                                    <span
                                        className={cn(
                                            'border-background relative z-[1] size-2.5 shrink-0 rounded-full border-2',
                                            stepStatusDotClass(s.state),
                                        )}
                                        title={b.label}
                                    />
                                </div>

                                <div className={cn('min-w-0 flex-1 space-y-2', !isLastStep && 'pb-10')}>
                                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                                        <p className="text-foreground font-semibold leading-snug">{s.label}</p>
                                        <Badge
                                            variant={b.variant}
                                            className={cn(
                                                'shrink-0 rounded-full px-2.5 py-0 text-[10px] font-medium uppercase',
                                                s.state === 'completed' &&
                                                    'border-emerald-500/40 bg-emerald-500/12 text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-100',
                                                s.state === 'pending' &&
                                                    'border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100',
                                            )}
                                        >
                                            {b.label}
                                        </Badge>
                                    </div>

                                    {(() => {
                                        const primary = stepPrimaryDescription(s);
                                        const hint = stepSecondaryHint(s);
                                        if (!primary && !hint) {
                                            return null;
                                        }

                                        return (
                                            <div className="text-muted-foreground text-xs leading-relaxed">
                                                <p className="flex items-start gap-1.5">
                                                    <ScrollText
                                                        className="text-muted-foreground/70 mt-0.5 size-3.5 shrink-0"
                                                        aria-hidden
                                                    />
                                                    <span className="min-w-0 space-y-2">
                                                        {primary ? (
                                                            <span className="block whitespace-pre-wrap">{primary}</span>
                                                        ) : null}
                                                        {hint ? (
                                                            <span className="block whitespace-pre-wrap">{hint}</span>
                                                        ) : null}
                                                    </span>
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {s.summary_lines.length > 0 ? (
                                        <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                                            {s.summary_lines.map((line, li) => (
                                                <li key={li}>{line}</li>
                                            ))}
                                        </ul>
                                    ) : null}

                                    <div className="flex min-w-0 items-center gap-2.5 pt-2">
                                        <Avatar className="size-7 shrink-0 border-0 shadow-none">
                                            <AvatarFallback className="bg-muted/50 text-[10px] font-semibold text-muted-foreground">
                                                {initialsFromLabel(s.actor_name?.trim() || s.label)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {s.actor_name?.trim() ? (
                                            <div className="min-w-0 flex-1">
                                                <p className="text-muted-foreground truncate text-[10px] leading-none font-normal">
                                                    {s.actor_name.trim()}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

export default function WorkflowFormShow(props: Props) {
    return <WorkflowFormShowInner key={props.token} {...props} />;
}

function WorkflowFormShowInner({ token, step, run_id, prefill, previous_token, progress }: Props) {
    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Dashboard', href: dashboard() },
            { title: step.title, href: '#' },
        ],
        [step.title],
    );

    const form = useForm(mergeInitialData(step.fields, prefill));
    const hasChoiceCards = step.fields.some((f) => f.type === 'choice_cards');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={step.title} />
            <div className="flex min-h-0 flex-1 flex-col lg:max-h-[calc(100svh-4rem-var(--impersonation-banner-offset,0px))] lg:flex-row">
                <div className="scrollbar-discrete flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto p-4 lg:px-8 lg:py-6">
                    <div className="w-full max-w-none space-y-6">
                        <FormStepsSegmentBar progress={progress} step={step} />
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{step.title}</h1>
                            {step.description ? (
                                <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                                    {String(step.description)}
                                </p>
                            ) : null}
                            <p className="text-muted-foreground mt-1 text-xs">Execução #{run_id}</p>
                        </div>

                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(workflowFormSubmit.url(token));
                            }}
                        >
                            {step.fields.map((field) => (
                                <div key={field.key} className={cn('grid gap-2', field.type === 'choice_cards' && 'gap-3')}>
                                    {field.type === 'choice_cards' ? null : <Label htmlFor={field.key}>{field.label}</Label>}
                                    {field.type === 'choice_cards' ? (
                                        <ChoiceCardsField
                                            field={{ ...field, choices: normalizeChoices(field.choices) }}
                                            value={String(form.data[field.key] ?? '')}
                                            onChange={(v) => form.setData(field.key, v)}
                                            error={form.errors[field.key]}
                                        />
                                    ) : null}
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            id={field.key}
                                            name={field.key}
                                            required={Boolean(field.required)}
                                            placeholder={field.placeholder}
                                            className={cn(
                                                'border-input placeholder:text-muted-foreground flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm',
                                                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                            )}
                                            value={String(form.data[field.key] ?? '')}
                                            onChange={(e) => form.setData(field.key, e.target.value)}
                                        />
                                    ) : null}
                                    {field.type === 'string' || field.type === 'email' ? (
                                        <Input
                                            id={field.key}
                                            name={field.key}
                                            type={field.type === 'email' ? 'email' : 'text'}
                                            required={Boolean(field.required)}
                                            placeholder={field.placeholder}
                                            value={String(form.data[field.key] ?? '')}
                                            onChange={(e) => form.setData(field.key, e.target.value)}
                                        />
                                    ) : null}
                                    {field.type === 'number' ? (
                                        <Input
                                            id={field.key}
                                            name={field.key}
                                            type="number"
                                            required={Boolean(field.required)}
                                            placeholder={field.placeholder}
                                            value={form.data[field.key] === '' ? '' : String(form.data[field.key] ?? '')}
                                            onChange={(e) =>
                                                form.setData(field.key, e.target.value === '' ? '' : Number(e.target.value))
                                            }
                                        />
                                    ) : null}
                                    {field.type === 'boolean' ? (
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={field.key}
                                                checked={Boolean(form.data[field.key])}
                                                onCheckedChange={(v) => form.setData(field.key, v === true)}
                                            />
                                        </div>
                                    ) : null}
                                    {field.type === 'select' ? (
                                        <select
                                            id={field.key}
                                            name={field.key}
                                            required={Boolean(field.required)}
                                            className={cn(
                                                'border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none',
                                                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                            )}
                                            value={String(form.data[field.key] ?? '')}
                                            onChange={(e) => form.setData(field.key, e.target.value)}
                                        >
                                            <option value="">—</option>
                                            {parseSelectOptions(field.options).map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    ) : null}
                                    {field.type === 'choice_cards' ? null : <InputError message={form.errors[field.key]} />}
                                </div>
                            ))}

                            <div
                                className={cn(
                                    'flex flex-wrap items-center gap-3 pt-1',
                                    previous_token ? 'w-full justify-between' : 'w-full justify-end',
                                )}
                            >
                                {previous_token ? (
                                    <Button variant="outline" type="button" asChild>
                                        <Link href={workflowFormShow.url(previous_token)} prefetch={false}>
                                            Voltar
                                        </Link>
                                    </Button>
                                ) : null}
                                <Button type="submit" disabled={form.processing} className="gap-2 min-w-[8rem]">
                                    {form.processing && <Spinner />}
                                    {step.submit_label}
                                    {hasChoiceCards ? <ArrowRight className="size-4" aria-hidden /> : null}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                <ProgressPanel progress={progress} run_id={run_id} />
            </div>
        </AppLayout>
    );
}
