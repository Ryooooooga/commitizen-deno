import { Command } from "https://deno.land/x/cliffy@v0.20.1/command/mod.ts";
import * as dejs from "https://deno.land/x/dejs@0.10.2/mod.ts";
import { loadConfig, SelectOption } from "./config.ts";
import * as git from "./git.ts";
import { input, select, Selection } from "./input.ts";

const formSelections = (options: SelectOption[]): Selection[] => {
  const nameWidth = options
    .reduce((w, x) => Math.max(w, x.name.length), 0);

  return options.map((x) => ({
    text: `${x.name.padEnd(nameWidth)} ${x.description}`,
    value: x.name,
  }));
};

type Options = Record<never, never>;

const execute = async (_options: Options, args: string[]) => {
  if (!await git.isInsideRepository()) {
    throw new Error("not a git repository (or any of the parent directories)");
  }

  if (await git.isClean() && !args.includes("--allow-empty")) {
    throw new Error('nothing added to commit (use "git add")');
  }

  const config = await loadConfig();

  const results: { [K in string]: string } = {};
  for (const item of config.message.items) {
    let value: string | undefined;

    switch (item.form) {
      case "input": {
        value = await input({
          name: item.name,
          description: item.description,
          required: item.required ?? false,
        });
        break;
      }
      case "select": {
        const result = await select(
          formSelections(item.options),
          {
            name: item.name,
            description: item.description,
            required: item.required ?? false,
          },
        );
        value = result?.value;
        break;
      }
      default: {
        const { form, name } = item as Record<string, unknown>;
        throw new Error(`unknown form ${form} at item ${name}`);
      }
    }

    if (value === undefined) {
      Deno.exit(1);
    }

    results[item.name] = value;
  }

  const message = await dejs.renderToString(config.message.template, results);
  await git.commit(message, [...args]);
};

export const run = async () => {
  try {
    const { options, args, literal } = await new Command()
      .name("commitizen-deno")
      .usage("[--] [args...]")
      .description("Commitizen client")
      .arguments("[args...]")
      .parse(Deno.args);

    await execute(options as Options, [...args.flat(), ...literal]);
  } catch (err) {
    console.error(err.message);
    Deno.exit(1);
  }
};
