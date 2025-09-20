import ora from 'ora';

export class Progress {
  private spinner = ora();

  start(text: string): void {
    this.spinner.start(text);
  }

  succeed(text?: string): void {
    this.spinner.succeed(text);
  }

  fail(text?: string): void {
    this.spinner.fail(text);
  }

  info(text: string): void {
    this.spinner.info(text);
  }

  text(text: string): void {
    this.spinner.text = text;
  }
}

