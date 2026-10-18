export type EngineId = "json" | "prettier" | "terser" | "csso";
export type EngineAction = "format" | "minify" | "validate";
export type OptionValue = string | number | boolean;
export type EngineOptions = Record<string, OptionValue>;

export type EngineRequest = {
  engine: EngineId;
  action: EngineAction;
  input: string;
  options: EngineOptions;
};

export type EngineError = {
  message: string;
  /** 1-based line and column when the engine reports a location. */
  line?: number;
  column?: number;
};

export type EngineResult =
  | {
      ok: true;
      /** null means "leave the output pane unchanged" (e.g. validate). */
      output: string | null;
      message: string;
      /** Non-fatal problems found in the input (e.g. broken HTML tags). */
      warnings?: EngineError[];
      /** Automatic repairs applied to the input before processing. */
      fixes?: EngineError[];
    }
  | { ok: false; error: EngineError };
