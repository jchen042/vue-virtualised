export const sleep = (time) =>
  new Promise((resolve) => setTimeout(() => resolve(), time));

/**
 * slice a whole iteration task into multiple micro tasks
 * to make each micro task run less than 300ms
 * so the user doesn't feel blocking
 */
export const sliceTask = async (
  i,
  chunkSize,
  sleepTime,
  cbBeforeSleep = () => {},
  cbAfterSleep = () => {}
) => {
  if (i % chunkSize === 0) {
    cbBeforeSleep();
    await sleep(sleepTime);
    cbAfterSleep();
  }
};
