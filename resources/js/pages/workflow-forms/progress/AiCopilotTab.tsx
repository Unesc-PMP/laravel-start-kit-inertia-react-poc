import { Bot, SendHorizonal, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { postJson } from '@/lib/workflow-form-api';
import { cn } from '@/lib/utils';
import { aiCopilot as aiCopilotRoute } from '@/routes/workflow-forms';

type Row = { role: 'user' | 'assistant'; content: string };

export function AiCopilotTab({
    token,
    available,
}: {
    token: string;
    available: boolean;
}) {
    const [rows, setRows] = useState<Row[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const send = useCallback(async () => {
        const msg = input.trim();
        if (!msg) {
            return;
        }
        setError(null);
        setBusy(true);
        setInput('');
        setRows((r) => [...r, { role: 'user', content: msg }]);
        const res = await postJson<{ reply: string }>(aiCopilotRoute.url(token), {
            message: msg,
        });
        setBusy(false);
        if (!res.ok) {
            const body = res.data as { message?: string };
            setError(body.message ?? 'Pedido falhou.');
            setRows((r) => r.slice(0, -1));

            return;
        }
        setRows((r) => [...r, { role: 'assistant', content: res.data.reply }]);
    }, [input, token]);

    if (!available) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 py-12 text-center text-muted-foreground">
                <p className="text-sm leading-relaxed">
                    Assistente IA indisponível. Define{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        OPENAI_API_KEY
                    </code>{' '}
                    no ambiente para activar o copiloto.
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
                Pergunta sobre o estado deste processo. As respostas são geradas
                por IA com base no contexto da execução — não substituem o
                preenchimento do formulário.
            </p>
            <div
                className="scrollbar-discrete flex min-h-[160px] flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-muted/15 p-2"
                role="log"
            >
                {rows.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Escreve uma pergunta para começar.
                    </p>
                ) : null}
                {rows.map((m, i) => (
                    <div
                        key={`${i}-${m.role}`}
                        className={cn(
                            'flex gap-2',
                            m.role === 'user' ? 'justify-end' : 'justify-start',
                        )}
                    >
                        {m.role === 'assistant' ? (
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-100">
                                <Bot className="size-3.5" aria-hidden />
                            </span>
                        ) : null}
                        <div
                            className={cn(
                                'max-w-[90%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed',
                                m.role === 'assistant'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'bg-foreground text-background',
                            )}
                        >
                            <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        {m.role === 'user' ? (
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <User className="size-3.5" aria-hidden />
                            </span>
                        ) : null}
                    </div>
                ))}
            </div>
            {error ? (
                <p className="text-xs text-destructive">{error}</p>
            ) : null}
            <div className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunta sobre o processo…"
                    disabled={busy}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            void send();
                        }
                    }}
                />
                <Button
                    type="button"
                    size="icon"
                    disabled={busy || !input.trim()}
                    onClick={() => void send()}
                    aria-label="Enviar pergunta"
                >
                    {busy ? <Spinner /> : <SendHorizonal className="size-4" />}
                </Button>
            </div>
        </div>
    );
}
