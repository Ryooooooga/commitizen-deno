import { blue, green, red } from "std/fmt/colors.ts";
import { EXIT_CODE_ABORT, fzf } from "./fzf.ts";

const fzfHeight = 16;

const displayDescription = (description: string) => {
  console.error(`${green("?")} ${description}`);
};

const displayError = (message: string) => {
  console.error(red(`☓ ${message}`));
};

const displayResult = (message: string) => {
  if (message.length > 0) {
    console.error(blue(message));
  }
};

export type InputOptions = {
  name: string;
  description: string;
  prompt?: string;
  preview?: string;
  previewHeight?: number;
  required: boolean;
};

export const input = async ({
  name,
  description,
  prompt,
  preview,
  previewHeight,
  required,
}: InputOptions): Promise<string | undefined> => {
  displayDescription(description);

  for (let first = true;; first = false) {
    const { code, output } = await fzf({
      height: fzfHeight,
      printQuery: true,
      prompt,
      preview,
      previewWindow: `down,${previewHeight}`,
    });

    if (code === EXIT_CODE_ABORT) {
      return undefined;
    }

    const result = output.split("\n")[0];
    if (result.length > 0 || !required) {
      displayResult(result);
      return result;
    }

    if (first) {
      displayError(`${name} is required`);
    }
  }
};

export type Selection = {
  text: string;
  value: string;
};

export type SelectOptions = {
  name: string;
  description: string;
  prompt?: string;
  preview?: string;
  previewHeight?: number;
  required: boolean;
};

export const select = async (
  selections: Selection[],
  {
    name,
    description,
    prompt,
    preview,
    previewHeight,
    required,
  }: SelectOptions,
): Promise<Selection | undefined> => {
  displayDescription(description);

  const input = selections
    .map(({ value, text }) =>
      `${value.replaceAll("\n", " ")}\0${text.replaceAll("\n", " ")}`
    ).join("\n");

  for (let first = true;; first = false) {
    const { code, output } = await fzf({
      delimiter: "\\0",
      withNth: 2,
      height: fzfHeight,
      cycle: true,
      prompt,
      preview,
      previewWindow: `down,${previewHeight}`,
    }, input);

    if (code === EXIT_CODE_ABORT) {
      return undefined;
    }

    const result = output.split("\0")[0];
    if (result !== undefined || !required) {
      displayResult(result);
      return selections.find((s) => s.value === result);
    }

    if (first) {
      displayError(`${name} is required`);
    }
  }
};
