import { useRef, useState } from 'react';

interface WorkflowInputProps {
  onAnalyze: (yaml: string) => void;
  loading: boolean;
}

const PLACEHOLDER = `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test`;

export function WorkflowInput({ onAnalyze, loading }: WorkflowInputProps) {
  const [yaml, setYaml] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (yaml.trim()) {
      onAnalyze(yaml);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setYaml(text);
    };
    reader.readAsText(file);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={16}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 p-4 font-mono text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !yaml.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Check Compatibility'}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
        >
          Upload .yml file
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".yml,.yaml"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </form>
  );
}
