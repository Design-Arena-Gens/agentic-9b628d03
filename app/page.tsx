"use client";
import React, { useCallback, useMemo, useState } from 'react';
import { deepSearch, type DeepSearchResult } from '../lib/search';
import { buildPdf } from '../lib/pdf';
import { Progress, type Step } from '../components/Progress';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { id: 'wiki', label: 'Fetch encyclopedic overview', status: 'idle' },
    { id: 'arxiv', label: 'Find scholarly papers (arXiv)', status: 'idle' },
    { id: 'crossref', label: 'Collect works metadata (Crossref)', status: 'idle' },
    { id: 'pdf', label: 'Generate PDF', status: 'idle' },
  ]);
  const [result, setResult] = useState<DeepSearchResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  const updateStep = useCallback((id: string, status: Step['status'], detail?: string) => {
    setSteps(s => s.map(x => x.id === id ? { ...x, status, detail } : x));
  }, []);

  const canRun = useMemo(() => query.trim().length > 2 && !downloading, [query, downloading]);

  const onRun = useCallback(async () => {
    setResult(null);
    setSteps(s => s.map((x) => ({ ...x, status: 'idle', detail: undefined })));
    updateStep('wiki', 'running');
    updateStep('arxiv', 'running');
    updateStep('crossref', 'running');

    // Run all in parallel but update each step individually
    try {
      const res = await deepSearch(query);
      setResult(res);
      updateStep('wiki', res.wiki ? 'done' : 'error', res.wiki ? res.wiki.title : 'No result');
      updateStep('arxiv', res.arxiv.length ? 'done' : 'error', `${res.arxiv.length} entries`);
      updateStep('crossref', res.crossref.length ? 'done' : 'error', `${res.crossref.length} entries`);

      updateStep('pdf', 'running');
      setDownloading(true);
      const bytes = await buildPdf(res);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${query.replace(/\s+/g, '_')}_deep_research.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      updateStep('pdf', 'done');
    } catch (e: any) {
      updateStep('pdf', 'error', e?.message || 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  }, [query, updateStep]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl font-semibold">Deep Search PDF Generator</h1>
        <p className="text-gray-600">Free, citation-friendly research summaries from reputable sources.</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium mb-2">Topic or niche</label>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. Diffusion models in medical imaging"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onRun}
            disabled={!canRun}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {downloading ? 'Working?' : 'Deep Search & Generate PDF'}
          </button>
          <span className="text-xs text-gray-500">No login. Uses public APIs; includes source attributions.</span>
        </div>
      </div>

      <div className="mt-8 bg-white shadow-sm rounded-lg p-4 border border-gray-200">
        <h2 className="text-lg font-medium mb-3">Progress</h2>
        <Progress steps={steps} />
      </div>

      {!!result && (
        <div className="mt-8 bg-white shadow-sm rounded-lg p-4 border border-gray-200">
          <h2 className="text-lg font-medium mb-3">Preview</h2>
          {result.wiki && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Wikipedia summary</div>
              <div className="font-semibold">{result.wiki.title}</div>
              <p className="text-gray-700 mt-1 text-sm">{result.wiki.extract}</p>
              <a className="text-blue-600 text-sm" href={result.wiki.url} target="_blank" rel="noreferrer">{result.wiki.url}</a>
            </div>
          )}
          {!!result.arxiv.length && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">arXiv papers</div>
              <ul className="list-disc ml-5 text-sm">
                {result.arxiv.map((e, i) => (
                  <li key={i}>
                    <span className="font-medium">{e.title}</span>{' '}?{' '}
                    <span className="text-gray-600">{e.authors.join(', ')} ? {e.published.slice(0,10)}</span>{' '}
                    <a className="text-blue-600" href={e.url} target="_blank" rel="noreferrer">link</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!result.crossref.length && (
            <div>
              <div className="text-sm text-gray-500">Crossref works</div>
              <ul className="list-disc ml-5 text-sm">
                {result.crossref.map((w, i) => (
                  <li key={i}>
                    <span className="font-medium">{w.title}</span>{w.year ? ` (${w.year})` : ''}{w.authors?.length ? ` ? ${w.authors.join(', ')}` : ''} {w.url && (<a className="text-blue-600" href={w.url} target="_blank" rel="noreferrer">link</a>)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-gray-500">
        Wikipedia content is licensed under CC BY-SA 4.0 and may require attribution in derivatives. This tool includes source URLs for proper attribution.
      </footer>
    </main>
  );
}
