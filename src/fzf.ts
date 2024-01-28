export const EXIT_CODE_SUCCESS = 0;
export const EXIT_CODE_EMPTY = 1;
export const EXIT_CODE_ABORT = 130;

export type FzfOptions = {
  delimiter?: string;
  withNth?: number;
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
  delimiter,
  withNth,
  height,
  bind,
  preview,
  previewWindow,
  header,
  prompt,
  cycle,
  printQuery,
}: FzfOptions, input?: string) => {
  // default options
  const args = ["--ansi", "--reverse", "--border=none"];

  if (delimiter !== undefined) {
    args.push("--delimiter", delimiter);
  }
  if (withNth !== undefined) {
    args.push("--with-nth", `${withNth}`);
  }
  if (height !== undefined) {
    args.push("--height", `${height}`);
  }
  if (bind !== undefined) {
    args.push("--bind", bind);
  }
  if (preview !== undefined) {
    args.push("--preview", preview);
  }
  if (previewWindow !== undefined) {
    args.push("--preview-window", previewWindow);
  }
  if (header !== undefined) {
    args.push("--header", header);
  }
  if (prompt !== undefined) {
    args.push("--prompt", prompt);
  }
  if (cycle !== undefined) {
    args.push("--cycle");
  }
  if (printQuery === true) {
    args.push("--print-query");
  }

  const env = {
    FZF_DEFAULT_OPTS: "",
  };

  const child = new Deno.Command("fzf", {
    args,
    env,
    stdin: "piped",
    stdout: "piped",
  }).spawn();

  const writer = child.stdin.getWriter();
  writer.write(new TextEncoder().encode(input ?? "\n"));
  writer.close();

  const { success, code, stdout } = await child.output();
  const output = new TextDecoder().decode(stdout);

  return { success, code, output };
};
