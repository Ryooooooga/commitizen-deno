export const isInsideRepository = async () => {
  const command = new Deno.Command("git", {
    args: ["rev-parse"],
    stderr: "piped",
  });

  const { success } = await command.output();
  return success;
};

export const isClean = async () => {
  const command = new Deno.Command("git", {
    args: ["diff", "--cached", "--quiet"],
  });

  const { success } = await command.output();
  return success;
};

export const commit = async (message: string, args: string[] = []) => {
  const command = new Deno.Command("git", {
    args: ["commit", "-m", message, ...args],
  });

  const { success } = await command.output();
  return success;
};
