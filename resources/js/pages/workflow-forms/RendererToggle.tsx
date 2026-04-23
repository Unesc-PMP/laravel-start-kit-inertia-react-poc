import { LayoutList, MessagesSquare } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { patchJson } from '@/lib/workflow-form-api';
import { cn } from '@/lib/utils';
import { preferences as preferencesRoute } from '@/routes/workflow-forms';

type Renderer = 'wizard' | 'chatbot';

export function RendererToggle({
    value,
    onChange,
    disabled,
}: {
    value: Renderer;
    onChange: (v: Renderer) => void;
    disabled?: boolean;
}) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            disabled={disabled}
            onValueChange={(v) => {
                if (v !== 'wizard' && v !== 'chatbot') {
                    return;
                }
                void (async () => {
                    const res = await patchJson<{ preferences: { workflow_form_renderer: Renderer } }>(
                        preferencesRoute.url(),
                        { workflow_form_renderer: v },
                    );
                    if (res.ok) {
                        onChange(res.data.preferences.workflow_form_renderer);
                    }
                })();
            }}
            variant="outline"
            size="sm"
            className="w-full max-w-xs justify-stretch shadow-none"
            aria-label="Modo de preenchimento do formulário"
        >
            <ToggleGroupItem value="wizard" className="flex-1 gap-1.5 text-xs">
                <LayoutList className="size-3.5 shrink-0" aria-hidden />
                Formulário
            </ToggleGroupItem>
            <ToggleGroupItem value="chatbot" className="flex-1 gap-1.5 text-xs">
                <MessagesSquare className="size-3.5 shrink-0" aria-hidden />
                Chat
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

export function RendererToggleLabel({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                'text-[11px] font-medium tracking-wide text-muted-foreground uppercase',
                className,
            )}
        >
            Modo
        </p>
    );
}
