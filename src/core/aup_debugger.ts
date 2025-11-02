export class AUPDebugger {
  private logs: string[] = [];
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  log(message: string) {
    const ts = new Date().toISOString();
    const entry = `[${this.context}] ${ts} → ${message}`;
    console.log(entry);
    this.logs.push(entry);
  }

  error(err: any) {
    const ts = new Date().toISOString();
    const entry = `[${this.context}] ${ts} ❌ ${err}`;
    console.error(entry);
    this.logs.push(entry);
  }

  getHistory() {
    return this.logs.join("\n");
  }
}