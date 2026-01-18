"use client";

import { useState } from "react";

type GenerateResponse = {
  runId: string;
  outputPath: string;
  countsByFile: Record<string, number>;
  truthCount: number;
};

const packOptions = [
  "vendor_master_pack",
  "procurement_pack",
  "pr_controls_pack",
  "po_controls_pack",
  "grn_controls_pack",
  "invoice_pack",
  "payment_pack",
  "fraud_sod_pack",
  "p2p_core_pack"
];

export default function Home() {
  const [rows, setRows] = useState(1000);
  const [vendors, setVendors] = useState(200);
  const [seed, setSeed] = useState(42);
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [pack, setPack] = useState("p2p_core_pack");
  const [anomaliesJson, setAnomaliesJson] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    let anomalies: Record<string, number> | undefined;
    if (anomaliesJson.trim()) {
      try {
        anomalies = JSON.parse(anomaliesJson) as Record<string, number>;
      } catch (err) {
        setLoading(false);
        setError("Invalid anomalies JSON.");
        return;
      }
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rows,
          vendors,
          seed,
          startDate,
          endDate,
          pack,
          anomalies
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Generation failed");
      }

      const data = (await response.json()) as GenerateResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="card">
        <div className="grid">
          <label>
            Rows
            <input
              type="number"
              max={200000}
              min={1}
              value={rows}
              onChange={(event) => setRows(Number(event.target.value))}
            />
          </label>
          <label>
            Vendors
            <input
              type="number"
              min={1}
              value={vendors}
              onChange={(event) => setVendors(Number(event.target.value))}
            />
          </label>
          <label>
            Seed
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
            />
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <label>
            Pack
            <select value={pack} onChange={(event) => setPack(event.target.value)}>
              {packOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <details>
          <summary>Advanced</summary>
          <label>
            Anomalies JSON (optional override)
            <textarea
              rows={6}
              value={anomaliesJson}
              onChange={(event) => setAnomaliesJson(event.target.value)}
              placeholder='{"vendor_missing_tax": 0.05, "payment_duplicate": 0.02}'
            />
          </label>
        </details>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="card">
          <h2>Results</h2>
          <p>
            <strong>Run ID:</strong> {result.runId}
          </p>
          <p>
            <strong>Output:</strong> {result.outputPath}
          </p>
          <p>
            <strong>Truth Count:</strong> {result.truthCount}
          </p>
          <h3>File Counts</h3>
          <ul>
            {Object.entries(result.countsByFile).map(([file, count]) => (
              <li key={file}>
                {file}: {count}
              </li>
            ))}
          </ul>
          <a className="button" href={`/api/download?runId=${result.runId}`}>
            Download ZIP
          </a>
        </section>
      )}
    </main>
  );
}
