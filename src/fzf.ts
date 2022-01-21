export const EXIT_CODE_SUCCESS = 0;
export const EXIT_CODE_EMPTY = 1;
export const EXIT_CODE_ABORT = 130;

export type FzfOptions = {
  height?: number;
  bind?: string;
  preview?: string;
  previewWindow?: string;
  header?: string;
  prompt?: string;
  cycle?: boolean;
  printQuery?: boolean;
};

export const fzf = async ({
  height,
  bind,
  preview,
  previewWindow,
  header,
  prompt,
  cycle,
  printQuery,
}: FzfOptions, input?: string) => {
  const cmd = ["fzf"];

  // default options
  cmd.push("--ansi");
  cmd.push("--reverse");
  cmd.push("--border=none");

  if (height !== undefined) {
    cmd.push("--height", `${height}`);
  }
  if (bind !== undefined) {
    cmd.push("--bind", bind);
  }
  if (preview !== undefined) {
    cmd.push("--preview", preview);
  }
  if (previewWindow !== undefined) {
    cmd.push("--preview-window", previewWindow);
  }
  if (header !== undefined) {
    cmd.push("--header", header);
  }
  if (prompt !== undefined) {
    cmd.push("--prompt", prompt);
  }
  if (cycle !== undefined) {
    cmd.push("--cycle");
  }
  if (printQuery === true) {
    cmd.push("--print-query");
  }

  const env = {
    FZF_DEFAULT_OPTS: "",
  };

  const p = Deno.run({
    cmd,
    env,
    stdin: "piped",
    stdout: "piped",
  });

  p.stdin?.write(new TextEncoder().encode(input ?? "\n"));
  p.stdin?.close();

  const output = new TextDecoder().decode(await p.output());
  const { success, code } = await p.status();

  return { success, code, output };
};
