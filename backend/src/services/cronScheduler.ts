import { ScheduleType } from "../types/ScheduleType.types";
import * as cron from "node-cron";



interface ScheduleTask {
  name: string;
  type: ScheduleType;
  task: (name: string) => Promise<void>;
  timezone?: string;
}

class CronScheduler {
  private jobs = new Map<string, cron.ScheduledTask>();

  private readonly scheduleMap: Record<ScheduleType, string> = {
    // ===== Minutes =====
    [ScheduleType.EVERY_MINUTE]: "* * * * *",
    [ScheduleType.EVERY_5_MINUTES]: "*/5 * * * *",
    [ScheduleType.EVERY_10_MINUTES]: "*/10 * * * *",
    [ScheduleType.EVERY_15_MINUTES]: "*/15 * * * *",
    [ScheduleType.EVERY_30_MINUTES]: "*/30 * * * *",

    // ===== Hourly =====
    [ScheduleType.EVERY_HOUR]: "0 * * * *",
    [ScheduleType.EVERY_2_HOURS]: "0 */2 * * *",
    [ScheduleType.EVERY_3_HOURS]: "0 */3 * * *",
    [ScheduleType.EVERY_6_HOURS]: "0 */6 * * *",
    [ScheduleType.EVERY_12_HOURS]: "0 */12 * * *",

    // ===== Daily (Every Hour of Day) =====
    [ScheduleType.DAILY_12_AM]: "0 0 * * *",
    [ScheduleType.DAILY_1_AM]: "0 1 * * *",
    [ScheduleType.DAILY_2_AM]: "0 2 * * *",
    [ScheduleType.DAILY_3_AM]: "0 3 * * *",
    [ScheduleType.DAILY_4_AM]: "0 4 * * *",
    [ScheduleType.DAILY_5_AM]: "0 5 * * *",
    [ScheduleType.DAILY_6_AM]: "0 6 * * *",
    [ScheduleType.DAILY_7_AM]: "0 7 * * *",
    [ScheduleType.DAILY_8_AM]: "0 8 * * *",
    [ScheduleType.DAILY_9_AM]: "0 9 * * *",
    [ScheduleType.DAILY_10_AM]: "0 10 * * *",
    [ScheduleType.DAILY_11_AM]: "0 11 * * *",
    [ScheduleType.DAILY_12_PM]: "0 12 * * *",
    [ScheduleType.DAILY_1_PM]: "0 13 * * *",
    [ScheduleType.DAILY_2_PM]: "0 14 * * *",
    [ScheduleType.DAILY_3_PM]: "0 15 * * *",
    [ScheduleType.DAILY_4_PM]: "0 16 * * *",
    [ScheduleType.DAILY_5_PM]: "0 17 * * *",
    [ScheduleType.DAILY_6_PM]: "0 18 * * *",
    [ScheduleType.DAILY_7_PM]: "0 19 * * *",
    [ScheduleType.DAILY_8_PM]: "0 20 * * *",
    [ScheduleType.DAILY_9_PM]: "0 21 * * *",
    [ScheduleType.DAILY_10_PM]: "0 22 * * *",
    [ScheduleType.DAILY_11_PM]: "0 23 * * *",

    // ===== Weekly =====
    [ScheduleType.WEEKLY_SUNDAY_9_AM]: "0 9 * * 0",
    [ScheduleType.WEEKLY_MONDAY_9_AM]: "0 9 * * 1",
    [ScheduleType.WEEKLY_TUESDAY_9_AM]: "0 9 * * 2",
    [ScheduleType.WEEKLY_WEDNESDAY_9_AM]: "0 9 * * 3",
    [ScheduleType.WEEKLY_THURSDAY_9_AM]: "0 9 * * 4",
    [ScheduleType.WEEKLY_FRIDAY_9_AM]: "0 9 * * 5",
    [ScheduleType.WEEKLY_SATURDAY_9_AM]: "0 9 * * 6",

    // ===== Monthly =====
    [ScheduleType.MONTHLY_FIRST_DAY_9_AM]: "0 9 1 * *",
    [ScheduleType.MONTHLY_LAST_DAY_9_AM]: "0 9 28-31 * *",

    // ===== Yearly =====
    [ScheduleType.YEARLY_JAN_1_9_AM]: "0 9 1 1 *",
  };

  schedule({
    name,
    type,
    task,
    timezone = "America/New_York",
  }: ScheduleTask): void {
    if (this.jobs.has(name)) {
      console.warn(`⚠️ Job "${name}" already exists.`);
      return;
    }

    const cronExpression = this.scheduleMap[type];

    if (!cronExpression) {
      throw new Error(`Invalid schedule type: ${type}. No cron expression found.`);
    }

    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log(`⏰ Running "${name}" at ${new Date().toISOString()}`);
        try {
          await task(name);
        } catch (error) {
          console.error(
            `❌ Error in job "${name}":`,
            error instanceof Error ? error.message : error
          );
        }
      },
      { timezone }
    );

    this.jobs.set(name, job);

    console.log(
      `✅ Job "${name}" registered | Type: ${type} | TZ: ${timezone}`
    );
  }

  stop(name: string): void {
    const job = this.jobs.get(name);
    if (!job) return;
    job.stop();
    this.jobs.delete(name);
  }

  stopAll(): void {
    for (const job of this.jobs.values()) job.stop();
    this.jobs.clear();
  }

  list(): string[] {
    return [...this.jobs.keys()];
  }
}

export default new CronScheduler();
