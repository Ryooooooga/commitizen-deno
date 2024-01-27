export const isInsideRepository = async () => {
  const command = new Deno.Command("git", {
    args: ["rev-parse"],
    stderr: "piped",
  });

  const child = command.spawn();

  const { success } = await child.status;
  return success;
};

export const isClean = async () => {
  const command = new Deno.Command("git", {
    args: ["diff", "--cached", "--quiet"],
  });

  const child = command.spawn();

  const { success } = await child.status;
  return success;
};

export const commit = async (message: string, args: string[] = []) => {
  const command = new Deno.Command("git", {
    args: ["commit", "-m", message, ...args],
  });

  const child = command.spawn();

  const { success } = await child.status;
  return success;
};
