let timeout: any = '';
export const delayRunFunc = (params: any, func: Function, time: number) => {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(() => {
    func(params);
  }, time);
  const r = () => {
    clearTimeout(timeout);
  };
  return r;
};

export const cloneObj = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}