import {
  green,
  red,
  stripColor,
} from "https://deno.land/std@0.121.0/fmt/colors.ts";
import { EXIT_CODE_ABORT, fzf } from "./fzf.ts";

const displayDescription = (description: string) => {
  console.log(`${green("?")} ${description}`);
};

const displayError = (message: string) => {
  console.log(red(`☓ ${message}`));
};

const displayResult = (message: string) => {
  if (message.length > 0) {
    console.log(message);
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
      height: 25,
      printQuery: true,
      prompt,
      preview,
      previewWindow: `up,${previewHeight}`,
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
    .map((s) => s.text).join("\n");

  for (let first = true;; first = false) {
    const { code, output } = await fzf({
      height: 25,
      cycle: true,
      prompt,
      preview,
      previewWindow: `up,${previewHeight}`,
    }, input);

    if (code === EXIT_CODE_ABORT) {
      return undefined;
    }

    const result = output.trimEnd();
    if (result.length > 0 || !required) {
      displayResult(result);
      return selections.find((s) => stripColor(s.text).trimEnd() === result);
    }

    if (first) {
      displayError(`${name} is required`);
    }
  }
};
