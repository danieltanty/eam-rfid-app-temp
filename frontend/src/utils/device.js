import { UAParser } from "ua-parser-js";

export function getDeviceName() {
  const parser = new UAParser();
  
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();
  
  return `${device.model ?? "-"}, ${os.name ?? "-"}, ${browser.name ?? "-"}`;
}