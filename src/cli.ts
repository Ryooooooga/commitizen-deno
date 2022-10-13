import { Command } from "cliffy/command/mod.ts";
import * as dejs from "dejs/mod.ts";
import { cyan, stripColor, underline } from "std/fmt/colors.ts";
import shellEscape from "shell_escape/single-argument.ts";
import { FormItem, loadConfig, SelectOption } from "./config.ts";
import * as git from "./git.ts";
import { input, select, Selection } from "./input.ts";

const buildSelections = (options: SelectOption[]): Selection[] => {
  const nameWidth = options
    .reduce((w, x) => Math.max(w, stripColor(x.name).length), 0);

  return options.map((x) => ({
    text: `${x.name.padEnd(nameWidth)} ${cyan(x.description)}`,
    value: x.name,
  }));
};

const buildPreviewCommand = async (
  template: string,
  inProgressResults: { [K in string]: string },
  formItems: FormItem[],
  currentFormItem: FormItem,
  placeholder: string,
) => {
  const dummyParams = formItems.reduce(
    (params, item) => ({ ...params, [item.name]: "" }),
    {},
  );

  const params = {
    ...dummyParams,
    ...inProgressResults,
    [currentFormItem.name]: "\0",
  };

  const previewText = await dejs.renderToString(template, params);
  const previewHeight = (previewText.match(/\n/g)?.length ?? 0) + 1;

  const placeholderPattern =
    /\{([+sfn]*(-?\d+(\.\.-?\d+)?(,-?\d+(\.\.-?\d+)?)*)?|q)\}/g;
  const escapedPreviewText = shellEscape(previewText)
    .replace(placeholderPattern, "\\{$1}")
    .replace("\0", underline(`'${placeholder}'`));

  const preview = `command printf '%s' ${escapedPreviewText}`;

  return { preview, previewHeight };
};

type Options = {
  print?: boolean;
  check?: boolean;
};

const execute = async (options: Options, args: string[]) => {
  if (!await git.isInsideRepository()) {
    throw new Error("not a git repository (or any of the parent directories)");
  }

  const allowEmpty = args.includes("--allow-empty");
  const amendCommit = args.includes("--amend");

  if (options.check && !allowEmpty && !amendCommit && await git.isClean()) {
    throw new Error('nothing added to commit (use "git add")');
  }

  const config = await loadConfig();

  const results: { [K in string]: string } = {};
  for (const item of config.message.items) {
    let value: string | undefined;

    switch (item.form) {
      case "input": {
        const { preview, previewHeight } = await buildPreviewCommand(
          config.message.template,
          results,
          config.message.items,
          item,
          "{q}",
        );

        value = await input({
          name: item.name,
          description: item.description,
          prompt: item.prompt,
          preview,
          previewHeight,
          required: item.required ?? false,
        });
        break;
      }
      case "select": {
        const { preview, previewHeight } = await buildPreviewCommand(
          config.message.template,
          results,
          config.message.items,
          item,
          "{+1}",
        );

        const result = await select(
          buildSelections(item.options),
          {
            name: item.name,
            description: item.description,
            prompt: item.prompt,
            preview,
            previewHeight,
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

  if (options.print === undefined) {
    await git.commit(message, [...args]);
  } else {
    console.log(message);
  }
};

export const run = async () => {
  try {
    const { options, args, literal } = await new Command()
      .name("commitizen-deno")
      .usage("[--] [args...]")
      .description("Commitizen client")
      .option("-p, --print", "Display commit message")
      .option("--no-check", "Skip Git status checking")
      .arguments("[args...]")
      .parse(Deno.args);

    await execute(options as Options, [...args.flat(), ...literal]);
  } catch (err) {
    console.error(err.message);
    Deno.exit(1);
  }
};
