export type BookingDeadlineDatabase = {
  query<T = unknown>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
};

export async function processBookingDeadlines(database: BookingDeadlineDatabase, now = new Date()) {
  const [reminders, expirations] = await Promise.all([
    database.query<{ sent: number }>("select public.send_booking_review_reminders($1,100) as sent", [now]),
    database.query<{ expired: number }>("select public.expire_booking_review_deadlines($1,100) as expired", [now]),
  ]);
  return {
    reminders: Number(reminders.rows[0]?.sent ?? 0),
    expired: Number(expirations.rows[0]?.expired ?? 0),
  };
}
