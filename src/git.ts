export const isInsideRepository = async () => {
  const p = Deno.run({
    cmd: ["git", "rev-parse"],
    stderr: "piped",
  });

  const { success } = await p.status();
  return success;
};

export const isClean = async () => {
  const p = Deno.run({
    cmd: ["git", "diff", "--cached", "--quiet"],
  });

  const { success } = await p.status();
  return success;
};

export const commit = async (message: string, args: string[] = []) => {
  const p = Deno.run({
    cmd: ["git", "commit", "-m", message, ...args],
  });

  const { success } = await p.status();
  return success;
};
