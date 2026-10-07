/** How long the server may stay silent before its stream is taken for dead. It says it is alive every 5 s. */
const SILENCE = 12_000;

/**
 * Calls `onChange` when the folder changed, and at every connection, the first one included.
 * EventSource reconnects by itself after an error, but not after a refusal, and a proxy can keep a dead
 * stream open with nothing coming: a stream that went silent is closed and opened again.
 * Returns how to stop.
 */
export function watchFolder(onChange: () => void, onLost: () => void): () => void {
  let source: EventSource | undefined;
  let timer: number | undefined;

  const open = (): void => {
    const stream = new EventSource('/api/events');
    source = stream;
    const heard = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        stream.close();
        onLost();
        open();
      }, SILENCE);
    };
    stream.onmessage = () => {
      heard();
      onChange();
    };
    stream.addEventListener('alive', heard);
    stream.onerror = onLost;
    heard();
  };

  open();
  return () => {
    window.clearTimeout(timer);
    source?.close();
  };
}
