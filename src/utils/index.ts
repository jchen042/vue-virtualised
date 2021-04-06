const sleep = (time: number): Promise<null> =>
  new Promise((resolve) => setTimeout(() => resolve(null), time));

/**
 * slice a whole iteration task into multiple micro tasks
 * to make each micro task run less than 300ms
 * so the user doesn't feel blocking
 */
export const sliceTask = async (
  i: number,
  chunkSize: number,
  sleepTime: number,
  cbBeforeSleep?: () => void,
  cbAfterSleep?: () => void
): Promise<void> => {
  if (i % chunkSize === 0) {
    cbBeforeSleep && cbBeforeSleep();
    await sleep(sleepTime);
    cbAfterSleep && cbAfterSleep();
  }
};
