import { computeClientBotMove } from "./clientGameEngine";

let cachedBlobUrl: string | null = null;

async function getStockfishBlobUrl(): Promise<string> {
  if (cachedBlobUrl) {
    return cachedBlobUrl;
  }

  const response = await fetch("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");
  if (!response.ok) {
    throw new Error(`Failed to fetch stockfish.js: ${response.statusText}`);
  }
  const scriptContent = await response.text();
  const blob = new Blob([scriptContent], { type: "application/javascript" });
  cachedBlobUrl = URL.createObjectURL(blob);
  return cachedBlobUrl;
}

/**
 * Calculates the best chess move using Stockfish in a Web Worker.
 * If the CDN load fails or the worker throws an error, it gracefully
 * falls back to our local custom minimax engine to ensure game continuity.
 */
export async function computeStockfishMove(
  fen: string,
  difficulty: string = "medium"
): Promise<string> {
  // Map app difficulty levels to Stockfish Skill Level & Depth configurations
  let skillLevel = 6;
  let depth = 5;

  if (difficulty === "easy") {
    skillLevel = 0;
    depth = 2;
  } else if (difficulty === "hard") {
    skillLevel = 15;
    depth = 8;
  }

  try {
    const blobUrl = await getStockfishBlobUrl();
    
    return await new Promise<string>((resolve, reject) => {
      const worker = new Worker(blobUrl);
      let isTerminated = false;

      // Timeout fallback (max 12 seconds) to prevent frozen workers
      const timeout = setTimeout(() => {
        if (!isTerminated) {
          worker.terminate();
          isTerminated = true;
          reject(new Error("Stockfish calculation timed out"));
        }
      }, 12000);

      worker.onmessage = (e: MessageEvent) => {
        const line = e.data;
        if (typeof line === "string") {
          console.log("[Stockfish Worker]", line);
          
          if (line.startsWith("bestmove")) {
            clearTimeout(timeout);
            const parts = line.split(" ");
            const move = parts[1]; // e.g. "e2e4"
            if (!isTerminated) {
              worker.terminate();
              isTerminated = true;
            }
            resolve(move);
          }
        }
      };

      // Configure and execute UCI engine calculations
      worker.postMessage("uci");
      worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
      worker.postMessage("isready");
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  } catch (error) {
    console.warn("Stockfish calculation failed, falling back to local minimax:", error);
    
    // Graceful fallback to offline-safe minimax
    const fallbackMove = computeClientBotMove(fen, difficulty);
    if (fallbackMove) {
      return fallbackMove;
    }
    throw error;
  }
}
