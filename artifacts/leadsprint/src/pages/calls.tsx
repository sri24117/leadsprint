import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, PhoneCall, RefreshCw, Search, X } from "lucide-react";
import {
  getGetCallQueryKey,
  getGetCallsQueryKey,
  useGetCall,
  useGetCalls,
  useRetryCall,
} from "@workspace/api-client-react";
import {
  Button, EmptyState, ErrorState, PageHeader, Select, Skeleton,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  formatDate, statusTone,
} from "@/components/common";

export default function CallsPage() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const calls = useGetCalls(status === "all" ? undefined : { status: status as any });
  const call = useGetCall(selected || "", {
    query: { enabled: !!selected, queryKey: getGetCallQueryKey(selected || "") },
  });
  const retryCall = useRetryCall();
  const queryClient = useQueryClient();

  if (calls.isLoading) {
    return <div className="space-y-3">
      <PageHeader eyebrow="Console" title="Call History" />
      {[1, 2, 3].map((n) => <Skeleton key={n} className="h-10 w-full" />)}
    </div>;
  }
  if (calls.isError) {
    return <div className="space-y-5">
      <PageHeader eyebrow="Console" title="Call History" />
      <ErrorState retry={() => calls.refetch()} />
    </div>;
  }

  const filteredCalls = (calls.data || []).filter((item) =>
    [item.lead_name, item.phone, item.outcome, item.summary]
      .some((value) => value?.toLowerCase().includes(search.toLowerCase())),
  );

  return <div className="animate-rise-in space-y-6">
    <PageHeader eyebrow="Console" title="Call History"
      description="Actual call status, provider outcome, and follow-up details." />
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative max-w-md flex-1">
        <span className="sr-only">Search calls</span>
        <Search size={16} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
        <input value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Search lead, phone, or outcome"
          className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] py-2.5 pl-10 pr-3 text-sm"
          data-testid="input-search-calls" />
      </label>
      <Select value={status} onChange={(event) => setStatus(event.target.value)}
        data-testid="select-call-status">
        <option value="all">All call states</option>
        <option value="completed">Completed</option>
        <option value="in_progress">In progress</option>
        <option value="queued">Queued</option>
        <option value="failed">Failed</option>
        <option value="uncertain">Uncertain</option>
        <option value="policy_blocked">Policy blocked</option>
      </Select>
    </div>
    {!filteredCalls.length ? (
      <EmptyState icon={PhoneCall} title="No calls found"
        description="Calls from consented leads will appear here when they are recorded." />
    ) : (
      <Table>
        <TableHeader><TableRow>
          <TableHead>Lead &amp; contact</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead />
        </TableRow></TableHeader>
        <TableBody>{filteredCalls.map((item) => <TableRow key={item.id} data-testid={`row-call-${item.id}`}>
          <TableCell>
            <button onClick={() => setSelected(item.id)}
              className="font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
              data-testid={`button-open-call-${item.id}`}>{item.lead_name}</button>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.phone} · {formatDate(item.started_at)}</p>
          </TableCell>
          <TableCell>{item.provider || "—"}</TableCell>
          <TableCell><span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone(item.status)}`}>
            {item.status.replaceAll("_", " ")}
          </span></TableCell>
          <TableCell>{item.duration_seconds == null ? "—" : `${item.duration_seconds}s`}</TableCell>
          <TableCell>{item.outcome || item.summary || "Awaiting provider update"}</TableCell>
          <TableCell><button onClick={() => setSelected(item.id)}
            className="inline-flex items-center gap-1 text-sm text-[hsl(var(--primary))]"
            data-testid={`button-view-call-${item.id}`}>
            <FileText size={14} /> Details
          </button></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    )}
    {selected && <div role="presentation"
      className="fixed inset-0 z-50 flex justify-end bg-[hsl(var(--foreground))/0.25]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
      onKeyDown={(event) => { if (event.key === "Escape") setSelected(null); }}>
      <section role="dialog" aria-modal="true" aria-label="Call details"
        className="h-full w-full max-w-[560px] overflow-y-auto border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex justify-between gap-4">
          <div><h2 className="text-xl font-bold">{call.data?.lead_name || "Call details"}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">ID: {selected}</p></div>
          <button onClick={() => setSelected(null)} aria-label="Close call details"
            data-testid="button-close-call"><X size={20} /></button>
        </div>
        {call.isLoading ? <Skeleton className="mt-6 h-32 w-full" /> :
          call.isError || !call.data ? <div className="mt-6"><ErrorState retry={() => call.refetch()} /></div> :
          <div className="mt-6 space-y-5 text-sm">
            <dl className="grid grid-cols-2 gap-4 rounded-lg border border-[hsl(var(--border))] p-4">
              <div><dt className="text-[hsl(var(--muted-foreground))]">Status</dt><dd className="font-semibold">{call.data.status.replaceAll("_", " ")}</dd></div>
              <div><dt className="text-[hsl(var(--muted-foreground))]">Provider</dt><dd>{call.data.provider || "—"}</dd></div>
              <div><dt className="text-[hsl(var(--muted-foreground))]">Started</dt><dd>{formatDate(call.data.started_at)}</dd></div>
              <div><dt className="text-[hsl(var(--muted-foreground))]">Duration</dt><dd>{call.data.duration_seconds == null ? "—" : `${call.data.duration_seconds}s`}</dd></div>
              <div><dt className="text-[hsl(var(--muted-foreground))]">Appointment</dt><dd>{call.data.booked ? "Booked" : "Not booked"}</dd></div>
              <div><dt className="text-[hsl(var(--muted-foreground))]">Transfer</dt><dd>{call.data.transferred ? "Reported" : "Not reported"}</dd></div>
            </dl>
            <div><h3 className="font-semibold">Outcome</h3><p className="mt-1 whitespace-pre-wrap">{call.data.outcome || "Awaiting provider update"}</p></div>
            <div><h3 className="font-semibold">Summary</h3><p className="mt-1 whitespace-pre-wrap">{call.data.summary || "No summary received yet."}</p></div>
            {call.data.error_state && <p className="text-[hsl(var(--destructive))]">{call.data.error_state}</p>}
            <p className="rounded-md bg-[hsl(var(--muted))] p-3 text-xs text-[hsl(var(--muted-foreground))]">
              Recording and transcript are unavailable in this workspace. Contact the operator for provider records.
            </p>
            {call.data.status === "uncertain" && <p className="rounded-md border border-[hsl(var(--border))] p-3">
              Retell may have accepted this request. Check the provider call log and reconcile the outcome before another call.
            </p>}
            {(call.data.status === "failed" || (call.data.status === "policy_blocked" && call.data.error_state === "quiet_hours")) && <Button
              variant="primary" disabled={retryCall.isPending}
              onClick={() => retryCall.mutate({ id: call.data!.id }, { onSettled: () => {
                queryClient.invalidateQueries({ queryKey: getGetCallsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetCallQueryKey(call.data!.id) });
              } })}>
              {retryCall.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Retry call
            </Button>}
            {retryCall.isError && <p role="alert" className="text-[hsl(var(--destructive))]">
              Retry could not be started. Review the call state and provider before trying again.
            </p>}
          </div>}
      </section>
    </div>}
  </div>;
}
