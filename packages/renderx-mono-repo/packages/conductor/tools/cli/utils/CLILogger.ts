/**
 * CLILogger - Colored console logging for the Knowledge CLI
 * Provides structured logging with colors and emojis for better UX
 */

export class CLILogger {
  private colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  };

  private enableColors: boolean;

  constructor(enableColors: boolean = true) {
    this.enableColors = enableColors && process.stdout.isTTY;
  }

  private colorize(text: string, color: keyof typeof this.colors): string {
    if (!this.enableColors) {
      return text;
    }
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.colorize(message, "cyan"), ...args);
  }

  success(message: string, ...args: any[]): void {
    console.log(this.colorize(message, "green"), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.colorize(message, "yellow"), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(this.colorize(message, "red"), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG) {
      console.log(this.colorize(`[DEBUG] ${message}`, "dim"), ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  table(data: any[]): void {
    console.table(data);
  }

  group(label: string): void {
    console.group(this.colorize(label, "bright"));
  }

  groupEnd(): void {
    console.groupEnd();
  }

  separator(): void {
    console.log(this.colorize("─".repeat(50), "dim"));
  }

  header(title: string): void {
    console.log("");
    console.log(this.colorize(`🎼 ${title}`, "bright"));
    console.log(this.colorize("═".repeat(title.length + 3), "dim"));
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar =
      "█".repeat(Math.floor(percentage / 5)) +
      "░".repeat(20 - Math.floor(percentage / 5));
    const progressText = `[${progressBar}] ${percentage}% (${current}/${total})`;

    if (message) {
      process.stdout.write(
        `\r${this.colorize(progressText, "cyan")} ${message}`
      );
    } else {
      process.stdout.write(`\r${this.colorize(progressText, "cyan")}`);
    }

    if (current === total) {
      console.log(""); // New line when complete
    }
  }
}
